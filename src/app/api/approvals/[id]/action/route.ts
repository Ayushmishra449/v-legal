import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/approvals/[id]/action
// body: { actionType: "APPROVED"|"REJECTED"|"REASSIGNED"|"REVOKED"|"COMMENTED", comment, toUserId, toUserName }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { actionType, comment, toUserId, toUserName } = body;

  if (!actionType) return NextResponse.json({ error: "actionType required" }, { status: 400 });

  const approval = await prisma.approval.findUnique({
    where: { id },
    include: { workflow: { include: { steps: { orderBy: { stepOrder: "asc" } } } } },
  });
  if (!approval) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdminOrSuper = ["SUPER_ADMIN", "ADMIN"].includes(session.user.role);
  const isCurrentApprover = approval.currentApproverId === session.user.id;
  const isSubmitter = approval.submittedById === session.user.id;

  // Permissions per action type
  if (actionType === "APPROVED" || actionType === "REJECTED") {
    if (!isCurrentApprover && !isAdminOrSuper) {
      return NextResponse.json({ error: "Only the assigned approver can approve/reject" }, { status: 403 });
    }
  }
  if (actionType === "REVOKED") {
    if (!isSubmitter && !isAdminOrSuper) {
      return NextResponse.json({ error: "Only the submitter or admin can revoke" }, { status: 403 });
    }
  }
  if (actionType === "REASSIGNED") {
    if (!isCurrentApprover && !isAdminOrSuper) {
      return NextResponse.json({ error: "Only the current approver or admin can reassign" }, { status: 403 });
    }
    if (!toUserId) return NextResponse.json({ error: "toUserId required for REASSIGNED" }, { status: 400 });
  }

  // Record the action
  await prisma.approvalAction.create({
    data: {
      approvalId: id,
      actorId: session.user.id,
      actionType: actionType as any,
      comment: comment || null,
      toUserId: toUserId || null,
      toUserName: toUserName || null,
      fromStep: approval.currentStep,
    },
  });

  // Determine new approval status and next approver
  let newStatus = approval.status;
  let newApproverId = approval.currentApproverId;
  let newStep = approval.currentStep;

  if (actionType === "APPROVED") {
    // Check if there are more workflow steps
    const steps = approval.workflow?.steps ?? [];
    const nextStep = steps.find((s) => s.stepOrder === approval.currentStep + 1);
    if (nextStep) {
      // Move to next step — find a user with that role
      newStep = nextStep.stepOrder;
      newStatus = "PENDING" as any;
      // Keep same approver slot (admin will reassign, or we leave currentApproverId as null for self-assignment)
      newApproverId = null;
    } else {
      // Final step approved
      newStatus = "APPROVED" as any;
      newApproverId = null;
    }
  } else if (actionType === "REJECTED") {
    newStatus = "REJECTED" as any;
    newApproverId = null;
  } else if (actionType === "REVOKED") {
    newStatus = "REVOKED" as any;
    newApproverId = null;
  } else if (actionType === "REASSIGNED") {
    newStatus = "PENDING" as any;
    newApproverId = toUserId;
  }
  // COMMENTED leaves status unchanged

  await prisma.approval.update({
    where: { id },
    data: {
      status: newStatus as any,
      currentApproverId: newApproverId,
      currentStep: newStep,
    },
  });

  const updated = await prisma.approval.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { name: true, email: true } },
      currentApprover: { select: { name: true, email: true } },
      actions: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });

  return NextResponse.json(updated);
}
