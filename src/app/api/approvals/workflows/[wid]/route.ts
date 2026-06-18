import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ wid: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { wid } = await params;
  const workflow = await prisma.approvalWorkflow.findUnique({
    where: { id: wid },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(workflow);
}

export async function PUT(request: Request, { params }: { params: Promise<{ wid: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { wid } = await params;
  const body = await request.json();
  const { name, description, module, isActive, steps } = body;

  // Delete old steps and recreate
  await prisma.approvalWorkflowStep.deleteMany({ where: { workflowId: wid } });

  const updated = await prisma.approvalWorkflow.update({
    where: { id: wid },
    data: {
      name: name ?? undefined,
      description: description ?? undefined,
      module: module ? (module as any) : undefined,
      isActive: isActive ?? undefined,
      steps: {
        create: (steps || []).map((s: any, i: number) => ({
          stepOrder: s.stepOrder ?? i + 1,
          stepName: s.stepName,
          approverRole: s.approverRole as any,
          description: s.description || null,
        })),
      },
    },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ wid: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { wid } = await params;
  await prisma.approvalWorkflow.delete({ where: { id: wid } });
  return NextResponse.json({ success: true });
}
