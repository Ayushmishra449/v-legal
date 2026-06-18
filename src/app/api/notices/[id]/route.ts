import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { noticeSchema } from "@/lib/validations";
import { canEdit, isAdmin } from "@/lib/rbac";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await request.json();
  const parsed = noticeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const old = await prisma.notice.findUnique({ where: { id } });

  let matterId: string | null = null;
  if (data.matterId) {
    const matter = await prisma.matter.findFirst({ where: { OR: [{ id: data.matterId }, { matterId: data.matterId }] } });
    matterId = matter?.id ?? null;
  }

  const notice = await prisma.notice.update({
    where: { id },
    data: {
      direction: data.direction,
      counterparty: data.counterparty,
      date: new Date(data.date),
      replyDue: data.replyDue ? new Date(data.replyDue) : null,
      matterId,
      status: data.status,
      subject: data.subject,
      noticeLink: data.noticeLink || null,
      replyLink: data.replyLink || null,
    },
    include: { matter: { select: { id: true, matterId: true, name: true } } },
  });

  await createAuditLog({ action: "UPDATE", table: "notices", recordId: id, userId: session.user.id, oldData: old, newData: notice });
  return NextResponse.json(notice);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const old = await prisma.notice.findUnique({ where: { id } });
  await prisma.notice.delete({ where: { id } });
  await createAuditLog({ action: "DELETE", table: "notices", recordId: id, userId: session.user.id, oldData: old });
  return NextResponse.json({ success: true });
}
