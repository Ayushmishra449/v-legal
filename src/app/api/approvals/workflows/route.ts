import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflows = await prisma.approvalWorkflow.findMany({
    orderBy: { name: "asc" },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });
  return NextResponse.json(workflows);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, module, isActive, steps } = body;

  if (!name || !module) return NextResponse.json({ error: "name and module required" }, { status: 400 });

  const workflow = await prisma.approvalWorkflow.create({
    data: {
      name,
      description: description || null,
      module: module as any,
      isActive: isActive ?? true,
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

  return NextResponse.json(workflow, { status: 201 });
}
