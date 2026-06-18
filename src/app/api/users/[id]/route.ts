import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { userSchema } from "@/lib/validations";
import { canManageUsers, isSuperAdmin } from "@/lib/rbac";
import bcrypt from "bcryptjs";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await request.json();
  const parsed = userSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const old = await prisma.user.findUnique({ where: { id }, select: { role: true, email: true } });
  if (!old) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Guard: only super admin can assign super admin role
  if (data.role === "SUPER_ADMIN" && !isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: "Only Super Admin can assign Super Admin role" }, { status: 403 });
  }

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.role) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.password) updateData.password = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, isActive: true, updatedAt: true },
  });

  await createAuditLog({ action: "UPDATE", table: "users", recordId: id, userId: session.user.id, oldData: old, newData: { role: user.role } });
  return NextResponse.json(user);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !isSuperAdmin(session.user.role)) return NextResponse.json({ error: "Only Super Admin can delete users" }, { status: 403 });
  const { id } = await params;

  if (id === session.user.id) return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

  const old = await prisma.user.findUnique({ where: { id } });
  // Soft delete: deactivate instead of hard delete
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  await createAuditLog({ action: "DELETE", table: "users", recordId: id, userId: session.user.id, oldData: old });
  return NextResponse.json({ success: true });
}
