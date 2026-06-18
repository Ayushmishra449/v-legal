import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { hearingSchema } from "@/lib/validations";
import { canEdit, isAdmin } from "@/lib/rbac";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const matterId = searchParams.get("matterId") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      search ? {
        OR: [
          { hearingId: { contains: search, mode: "insensitive" as const } },
          { outcome: { contains: search, mode: "insensitive" as const } },
          { matter: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      } : {},
      status ? { status: status as any } : {},
      matterId ? { matter: { id: matterId } } : {},
    ],
  };

  const [hearings, total] = await Promise.all([
    prisma.hearing.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: { matter: { select: { id: true, matterId: true, name: true, court: true } } },
    }),
    prisma.hearing.count({ where }),
  ]);

  return NextResponse.json({ hearings, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = hearingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const count = await prisma.hearing.count();
  const year = new Date().getFullYear();
  const hearingId = `HR-${year}-${String(count + 1).padStart(3, "0")}`;

  // Find matter by id or matterId field
  const matter = await prisma.matter.findFirst({
    where: { OR: [{ id: data.matterId }, { matterId: data.matterId }] },
  });
  if (!matter) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

  const hearing = await prisma.hearing.create({
    data: {
      hearingId,
      matterId: matter.id,
      date: new Date(data.date),
      type: data.type,
      status: data.status,
      outcome: data.outcome,
      nextDate: data.nextDate ? new Date(data.nextDate) : null,
      docLink: data.docLink || null,
      updatedBy: data.updatedBy,
      createdById: session.user.id,
    },
    include: { matter: { select: { id: true, matterId: true, name: true } } },
  });

  // Auto-update matter's nextHearing if provided
  if (data.nextDate) {
    await prisma.matter.update({ where: { id: matter.id }, data: { nextHearing: new Date(data.nextDate) } });
  }

  await createAuditLog({ action: "CREATE", table: "hearings", recordId: hearing.id, userId: session.user.id, newData: hearing });
  return NextResponse.json(hearing, { status: 201 });
}
