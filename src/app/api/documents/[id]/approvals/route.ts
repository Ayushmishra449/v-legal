import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const approvalRequestSchema = z.object({
  approverEmail: z.string().email("Valid approver email is required"),
  comments: z.string().optional(),
});

// GET: list approvals for a document
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const approvals = await prisma.documentApproval.findMany({
    where: { documentId: id },
    include: { requestedBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(approvals);
}

// POST: send document for approval
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = approvalRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Check document exists
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  // Check if there's already a pending approval
  const existing = await prisma.documentApproval.findFirst({
    where: { documentId: id, status: "PENDING" },
  });
  if (existing) {
    return NextResponse.json({ error: "An approval request is already pending for this document" }, { status: 409 });
  }

  const approval = await prisma.documentApproval.create({
    data: {
      documentId: id,
      approverEmail: parsed.data.approverEmail,
      requestedById: session.user.id,
      comments: parsed.data.comments,
      status: "PENDING",
    },
    include: { requestedBy: { select: { name: true, email: true } } },
  });

  return NextResponse.json(approval, { status: 201 });
}
