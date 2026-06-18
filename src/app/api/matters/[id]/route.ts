import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { matterSchema } from "@/lib/validations";
import { isAdmin, canEdit } from "@/lib/rbac";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const matter = await prisma.matter.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      hearings: { orderBy: { date: "desc" } },
      invoices: { orderBy: { date: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      notices: { orderBy: { date: "desc" } },
    },
  });

  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(matter);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await request.json();
  const parsed = matterSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const old = await prisma.matter.findUnique({ where: { id } });
  const data = parsed.data;

  const matter = await prisma.matter.update({
    where: { id },
    data: {
      name: data.name,
      oppositeParty: data.oppositeParty,
      court: data.court,
      caseNumber: data.caseNumber,
      type: data.type,
      stage: data.stage,
      nextHearing: data.nextHearing ? new Date(data.nextHearing) : null,
      limitationDate: data.limitationDate ? new Date(data.limitationDate) : null,
      counsel: data.counsel,
      internalOwner: data.internalOwner,
      exposure: data.exposure ? parseFloat(data.exposure) : null,
      status: data.status,
      remarks: data.remarks,
    },
  });

  await createAuditLog({ action: "UPDATE", table: "matters", recordId: id, userId: session.user.id, oldData: old, newData: matter });
  return NextResponse.json(matter);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const old = await prisma.matter.findUnique({ where: { id } });
  await prisma.matter.delete({ where: { id } });
  await createAuditLog({ action: "DELETE", table: "matters", recordId: id, userId: session.user.id, oldData: old });
  return NextResponse.json({ success: true });
}
