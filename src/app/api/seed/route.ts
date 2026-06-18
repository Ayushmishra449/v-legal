import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isSuperAdmin } from "@/lib/rbac";

// Seed endpoint: POST /api/seed — creates initial super admin
// Should be called once after DB migration
export async function POST(request: Request) {
  const session = await auth();

  // If any users exist, only allow super admin to re-seed
  const userCount = await prisma.user.count();
  if (userCount > 0 && (!session || !isSuperAdmin(session.user.role))) {
    return NextResponse.json({ error: "Forbidden: seed already done" }, { status: 403 });
  }

  const body = await request.json();
  const { adminEmail = "admin@vikramsolar.com", adminPassword = "Admin@123", adminName = "Super Admin" } = body;

  const hashed = await bcrypt.hash(adminPassword, 10);

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: adminName,
      password: hashed,
      role: "SUPER_ADMIN",
    },
  });

  return NextResponse.json({
    success: true,
    message: "Super Admin created",
    email: user.email,
    note: "Delete this endpoint or add security before production deployment",
  });
}
