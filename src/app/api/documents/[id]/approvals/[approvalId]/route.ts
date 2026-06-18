import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["APPROVED", "REJECTED"]),
  comments: z.string().optional(),
});

// PUT: approve or reject an approval request
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; approvalId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, approvalId } = await params;
  const body = await request.json();
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Find the approval
  const approval = await prisma.documentApproval.findFirst({
    where: { id: approvalId, documentId: id },
  });
  if (!approval) return NextResponse.json({ error: "Approval not found" }, { status: 404 });

  // The approver must match the session user's email
  if (approval.approverEmail !== session.user.email) {
    return NextResponse.json({ error: "You are not authorized to act on this approval" }, { status: 403 });
  }

  if (approval.status !== "PENDING") {
    return NextResponse.json({ error: "This approval has already been actioned" }, { status: 409 });
  }

  const updated = await prisma.documentApproval.update({
    where: { id: approvalId },
    data: {
      status: parsed.data.action,
      comments: parsed.data.comments ?? approval.comments,
      approvedAt: new Date(),
    },
    include: { requestedBy: { select: { name: true, email: true } } },
  });

  return NextResponse.json(updated);
}
