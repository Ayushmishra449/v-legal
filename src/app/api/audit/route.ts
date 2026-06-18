import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageUsers } from "@/lib/rbac";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { user: { select: { name: true, email: true, role: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  return NextResponse.json({ logs, total, page, limit, pages: Math.ceil(total / limit) });
}
