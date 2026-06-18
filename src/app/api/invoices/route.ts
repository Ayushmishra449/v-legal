import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { invoiceSchema } from "@/lib/validations";
import { canViewFinance, isAdmin } from "@/lib/rbac";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canViewFinance(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const type = searchParams.get("type") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      search ? {
        OR: [
          { vendor: { contains: search, mode: "insensitive" as const } },
          { billNo: { contains: search, mode: "insensitive" as const } },
          { invoiceId: { contains: search, mode: "insensitive" as const } },
        ],
      } : {},
      status ? { paymentStatus: status as any } : {},
      type ? { type: type as any } : {},
    ],
  };

  const [invoices, total, aggregate] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: { matter: { select: { id: true, matterId: true, name: true } } },
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({ _sum: { amount: true }, where }),
  ]);

  return NextResponse.json({ invoices, total, page, limit, pages: Math.ceil(total / limit), totalAmount: aggregate._sum.amount });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canViewFinance(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const count = await prisma.invoice.count();
  const year = new Date().getFullYear();
  const invoiceId = `INV-${year}-${String(count + 1).padStart(3, "0")}`;

  let matterId: string | null = null;
  if (data.matterId) {
    const matter = await prisma.matter.findFirst({ where: { OR: [{ id: data.matterId }, { matterId: data.matterId }] } });
    matterId = matter?.id ?? null;
  }

  const invoice = await prisma.invoice.create({
    data: {
      invoiceId,
      vendor: data.vendor,
      billNo: data.billNo,
      date: new Date(data.date),
      amount: parseFloat(data.amount),
      matterId,
      type: data.type,
      paymentStatus: data.paymentStatus,
      pendingAt: data.paymentStatus !== "PAID" ? (data.pendingAt ?? null) : null,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
      remarks: data.remarks,
      createdById: session.user.id,
    },
    include: { matter: { select: { id: true, matterId: true, name: true } } },
  });

  await createAuditLog({ action: "CREATE", table: "invoices", recordId: invoice.id, userId: session.user.id, newData: invoice });
  return NextResponse.json(invoice, { status: 201 });
}
