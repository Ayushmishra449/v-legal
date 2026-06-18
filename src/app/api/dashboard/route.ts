import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const in7Days = addDays(now, 7);
  const in3Days = addDays(now, 3);
  const ytdStart = new Date(now.getFullYear(), 0, 1);

  const [
    totalMatters,
    activeMatters,
    hearingsThisWeek,
    ytdSpend,
    pendingInvoices,
    pendingNotices,
    upcomingHearings,
    mattersByStatus,
    mattersByType,
    invoicesByType,
    monthlySpend,
    noticesByStatus,
    topMattersSpend,
  ] = await Promise.all([
    prisma.matter.count(),
    prisma.matter.count({ where: { status: "ONGOING" } }),
    prisma.hearing.count({ where: { date: { gte: now, lte: in7Days } } }),
    prisma.invoice.aggregate({ _sum: { amount: true }, where: { date: { gte: ytdStart } } }),
    prisma.invoice.aggregate({ _sum: { amount: true }, _count: true, where: { paymentStatus: "PENDING" } }),
    prisma.notice.count({ where: { status: "PENDING_REPLY" } }),
    // Upcoming hearings in next 14 days
    prisma.hearing.findMany({
      where: { date: { gte: now, lte: addDays(now, 14) } },
      orderBy: { date: "asc" },
      take: 8,
      include: { matter: { select: { name: true, court: true, matterId: true } } },
    }),
    // Matters by status
    prisma.matter.groupBy({ by: ["status"], _count: true }),
    // Matters by type
    prisma.matter.groupBy({ by: ["type"], _count: true, where: { status: "ONGOING" } }),
    // Invoices by type
    prisma.invoice.groupBy({ by: ["type"], _sum: { amount: true } }),
    // Monthly spend for last 6 months
    Promise.all(
      Array.from({ length: 6 }).map(async (_, i) => {
        const d = subMonths(now, 5 - i);
        const start = startOfMonth(d);
        const end = endOfMonth(d);
        const res = await prisma.invoice.aggregate({ _sum: { amount: true }, where: { date: { gte: start, lte: end } } });
        return { month: format(d, "MMM"), amount: Number(res._sum.amount ?? 0) };
      })
    ),
    // Notices by status
    prisma.notice.groupBy({ by: ["status"], _count: true }),
    // Top 5 matters by spend
    prisma.invoice.groupBy({
      by: ["matterId"],
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
      where: { matterId: { not: null } },
    }),
  ]);

  // Enrich top matters spend
  const topMatterIds = topMattersSpend.map((m) => m.matterId).filter(Boolean) as string[];
  const topMatterNames = await prisma.matter.findMany({
    where: { id: { in: topMatterIds } },
    select: { id: true, matterId: true, name: true },
  });

  const topMattersEnriched = topMattersSpend.map((m) => {
    const matter = topMatterNames.find((t) => t.id === m.matterId);
    return { name: matter?.name ?? m.matterId ?? "Unknown", matterId: matter?.matterId, amount: Number(m._sum.amount ?? 0) };
  });

  // Urgent alerts
  const urgentHearings = await prisma.hearing.findMany({
    where: { date: { gte: now, lte: in3Days } },
    include: { matter: { select: { matterId: true, name: true } } },
  });

  return NextResponse.json({
    kpis: {
      totalMatters,
      activeMatters,
      hearingsThisWeek,
      ytdSpend: Number(ytdSpend._sum.amount ?? 0),
      pendingInvoicesCount: pendingInvoices._count,
      pendingInvoicesAmount: Number(pendingInvoices._sum.amount ?? 0),
      pendingNotices,
    },
    upcomingHearings,
    urgentHearings,
    charts: {
      mattersByStatus,
      mattersByType,
      invoicesByType,
      monthlySpend,
      noticesByStatus,
      topMattersSpend: topMattersEnriched,
    },
  });
}
