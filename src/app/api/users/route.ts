import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { userSchema } from "@/lib/validations";
import { canManageUsers, isSuperAdmin } from "@/lib/rbac";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, avatar: true, isActive: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  if (!data.password) return NextResponse.json({ error: "Password is required" }, { status: 400 });

  // Only super admin can create other super admins
  if (data.role === "SUPER_ADMIN" && !isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: "Only Super Admin can create Super Admin users" }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 400 });

  const hashed = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, password: hashed, role: data.role },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });

  await createAuditLog({ action: "CREATE", table: "users", recordId: user.id, userId: session.user.id, newData: { name: user.name, email: user.email, role: user.role } });
  return NextResponse.json(user, { status: 201 });
}
