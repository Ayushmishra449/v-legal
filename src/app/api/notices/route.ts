import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { noticeSchema } from "@/lib/validations";
import { canEdit, isAdmin } from "@/lib/rbac";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const direction = searchParams.get("direction") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      search ? {
        OR: [
          { subject: { contains: search, mode: "insensitive" as const } },
          { counterparty: { contains: search, mode: "insensitive" as const } },
          { noticeId: { contains: search, mode: "insensitive" as const } },
        ],
      } : {},
      status ? { status: status as any } : {},
      direction ? { direction: direction as any } : {},
    ],
  };

  const [notices, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: { matter: { select: { id: true, matterId: true, name: true } } },
    }),
    prisma.notice.count({ where }),
  ]);

  return NextResponse.json({ notices, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = noticeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const count = await prisma.notice.count();
  const year = new Date().getFullYear();
  const noticeId = `NTC-${year}-${String(count + 1).padStart(3, "0")}`;

  let matterId: string | null = null;
  if (data.matterId) {
    const matter = await prisma.matter.findFirst({ where: { OR: [{ id: data.matterId }, { matterId: data.matterId }] } });
    matterId = matter?.id ?? null;
  }

  const notice = await prisma.notice.create({
    data: {
      noticeId,
      direction: data.direction,
      counterparty: data.counterparty,
      date: new Date(data.date),
      replyDue: data.replyDue ? new Date(data.replyDue) : null,
      matterId,
      status: data.status,
      subject: data.subject,
      noticeLink: data.noticeLink || null,
      replyLink: data.replyLink || null,
      createdById: session.user.id,
    },
    include: { matter: { select: { id: true, matterId: true, name: true } } },
  });

  await createAuditLog({ action: "CREATE", table: "notices", recordId: notice.id, userId: session.user.id, newData: notice });
  return NextResponse.json(notice, { status: 201 });
}
