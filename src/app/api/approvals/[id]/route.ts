import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const approval = await prisma.approval.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { id: true, name: true, email: true, role: true } },
      currentApprover: { select: { id: true, name: true, email: true, role: true } },
      workflow: {
        include: { steps: { orderBy: { stepOrder: "asc" } } },
      },
      actions: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });

  if (!approval) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(approval);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { title, description, oneDriveLink, priority, dueDate, workflowId } = body;

  // Only submitter or admin can update metadata
  const approval = await prisma.approval.findUnique({ where: { id } });
  if (!approval) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdminOrSuper = ["SUPER_ADMIN", "ADMIN"].includes(session.user.role);
  if (approval.submittedById !== session.user.id && !isAdminOrSuper) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.approval.update({
    where: { id },
    data: {
      title: title ?? approval.title,
      description: description ?? approval.description,
      oneDriveLink: oneDriveLink ?? approval.oneDriveLink,
      priority: priority ?? approval.priority,
      dueDate: dueDate ? new Date(dueDate) : approval.dueDate,
      workflowId: workflowId ?? approval.workflowId,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isAdminOrSuper = ["SUPER_ADMIN", "ADMIN"].includes(session.user.role);
  if (!isAdminOrSuper) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.approval.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
