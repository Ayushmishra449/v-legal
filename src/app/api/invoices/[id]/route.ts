import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { invoiceSchema } from "@/lib/validations";
import { canViewFinance, isAdmin } from "@/lib/rbac";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canViewFinance(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await request.json();
  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const old = await prisma.invoice.findUnique({ where: { id } });

  let matterId: string | null = null;
  if (data.matterId) {
    const matter = await prisma.matter.findFirst({ where: { OR: [{ id: data.matterId }, { matterId: data.matterId }] } });
    matterId = matter?.id ?? null;
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
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
    },
    include: { matter: { select: { id: true, matterId: true, name: true } } },
  });

  await createAuditLog({ action: "UPDATE", table: "invoices", recordId: id, userId: session.user.id, oldData: old, newData: invoice });
  return NextResponse.json(invoice);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const old = await prisma.invoice.findUnique({ where: { id } });
  await prisma.invoice.delete({ where: { id } });
  await createAuditLog({ action: "DELETE", table: "invoices", recordId: id, userId: session.user.id, oldData: old });
  return NextResponse.json({ success: true });
}
