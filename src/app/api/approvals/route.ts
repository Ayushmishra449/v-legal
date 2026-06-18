import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const module = searchParams.get("module") || "";
  const priority = searchParams.get("priority") || "";
  const assignedToMe = searchParams.get("assignedToMe") === "true";
  const submittedByMe = searchParams.get("submittedByMe") === "true";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: any = {
    AND: [
      search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { approvalId: { contains: search, mode: "insensitive" } },
              { moduleRefLabel: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      status ? { status: status as any } : {},
      module ? { module: module as any } : {},
      priority ? { priority } : {},
      assignedToMe ? { currentApproverId: session.user.id } : {},
      submittedByMe ? { submittedById: session.user.id } : {},
    ],
  };

  const [approvals, total] = await Promise.all([
    prisma.approval.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        submittedBy: { select: { id: true, name: true, email: true, role: true } },
        currentApprover: { select: { id: true, name: true, email: true, role: true } },
        workflow: { select: { id: true, name: true, steps: { orderBy: { stepOrder: "asc" } } } },
        actions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { actor: { select: { name: true } } },
        },
        _count: { select: { actions: true } },
      },
    }),
    prisma.approval.count({ where }),
  ]);

  return NextResponse.json({ approvals, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, description, module, moduleRefId, moduleRefLabel, oneDriveLink, workflowId, priority, dueDate, currentApproverId } = body;

  if (!title || !module) {
    return NextResponse.json({ error: "Title and module are required" }, { status: 400 });
  }

  const count = await prisma.approval.count();
  const year = new Date().getFullYear();
  const approvalId = `APR-${year}-${String(count + 1).padStart(3, "0")}`;

  const approval = await prisma.approval.create({
    data: {
      approvalId,
      title,
      description: description || null,
      module: module as any,
      moduleRefId: moduleRefId || null,
      moduleRefLabel: moduleRefLabel || null,
      oneDriveLink: oneDriveLink || null,
      workflowId: workflowId || null,
      priority: priority || "NORMAL",
      dueDate: dueDate ? new Date(dueDate) : null,
      submittedById: session.user.id,
      currentApproverId: currentApproverId || null,
      status: "PENDING",
    },
    include: {
      submittedBy: { select: { name: true, email: true } },
      currentApprover: { select: { name: true, email: true } },
    },
  });

  // Record SUBMITTED action
  await prisma.approvalAction.create({
    data: {
      approvalId: approval.id,
      actorId: session.user.id,
      actionType: "SUBMITTED",
      comment: description || null,
    },
  });

  return NextResponse.json(approval, { status: 201 });
}
