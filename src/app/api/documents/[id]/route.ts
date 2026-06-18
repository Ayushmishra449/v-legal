import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { documentSchema } from "@/lib/validations";
import { canEdit, isAdmin } from "@/lib/rbac";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await request.json();
  const parsed = documentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const old = await prisma.document.findUnique({ where: { id } });

  let matterId: string | null = null;
  if (data.matterId) {
    const matter = await prisma.matter.findFirst({ where: { OR: [{ id: data.matterId }, { matterId: data.matterId }] } });
    matterId = matter?.id ?? null;
  }

  const doc = await prisma.document.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      matterId,
      date: data.date ? new Date(data.date) : null,
      uploadedBy: data.uploadedBy,
      version: data.version,
      fileLink: data.fileLink || null,
      remarks: data.remarks,
    },
    include: { matter: { select: { id: true, matterId: true, name: true } } },
  });

  await createAuditLog({ action: "UPDATE", table: "documents", recordId: id, userId: session.user.id, oldData: old, newData: doc });
  return NextResponse.json(doc);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const old = await prisma.document.findUnique({ where: { id } });
  await prisma.document.delete({ where: { id } });
  await createAuditLog({ action: "DELETE", table: "documents", recordId: id, userId: session.user.id, oldData: old });
  return NextResponse.json({ success: true });
}
