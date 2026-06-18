import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { hearingSchema } from "@/lib/validations";
import { canEdit, isAdmin } from "@/lib/rbac";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await request.json();
  const parsed = hearingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const old = await prisma.hearing.findUnique({ where: { id } });

  const matter = await prisma.matter.findFirst({
    where: { OR: [{ id: data.matterId }, { matterId: data.matterId }] },
  });
  if (!matter) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

  const hearing = await prisma.hearing.update({
    where: { id },
    data: {
      matterId: matter.id,
      date: new Date(data.date),
      type: data.type,
      status: data.status,
      outcome: data.outcome,
      nextDate: data.nextDate ? new Date(data.nextDate) : null,
      docLink: data.docLink || null,
      updatedBy: data.updatedBy,
    },
    include: { matter: { select: { id: true, matterId: true, name: true } } },
  });

  await createAuditLog({ action: "UPDATE", table: "hearings", recordId: id, userId: session.user.id, oldData: old, newData: hearing });
  return NextResponse.json(hearing);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const old = await prisma.hearing.findUnique({ where: { id } });
  await prisma.hearing.delete({ where: { id } });
  await createAuditLog({ action: "DELETE", table: "hearings", recordId: id, userId: session.user.id, oldData: old });
  return NextResponse.json({ success: true });
}
