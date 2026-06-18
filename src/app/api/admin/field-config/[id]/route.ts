import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/rbac";
import { z } from "zod";

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional().nullable(),
  isRequired: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: "Only Super Admin can update field configs" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const config = await prisma.fieldConfig.update({ where: { id }, data: parsed.data });
  return NextResponse.json(config);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: "Only Super Admin can delete field configs" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.fieldConfig.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
