import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { matterSchema } from "@/lib/validations";
import { isAdmin } from "@/lib/rbac";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const type = searchParams.get("type") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { oppositeParty: { contains: search, mode: "insensitive" as const } },
          { court: { contains: search, mode: "insensitive" as const } },
          { matterId: { contains: search, mode: "insensitive" as const } },
          { counsel: { contains: search, mode: "insensitive" as const } },
        ],
      } : {},
      status ? { status: status as any } : {},
      type ? { type: type as any } : {},
    ],
  };

  const [matters, total] = await Promise.all([
    prisma.matter.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        createdBy: { select: { name: true, email: true } },
        _count: { select: { hearings: true, invoices: true, documents: true } },
      },
    }),
    prisma.matter.count({ where }),
  ]);

  return NextResponse.json({ matters, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role) && session.user.role !== "LEGAL_TEAM" && session.user.role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = matterSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  // Generate sequential matterId
  const count = await prisma.matter.count();
  const year = new Date().getFullYear();
  const matterId = `LM-${year}-${String(count + 1).padStart(3, "0")}`;

  const matter = await prisma.matter.create({
    data: {
      matterId,
      name: data.name,
      oppositeParty: data.oppositeParty,
      court: data.court,
      caseNumber: data.caseNumber,
      type: data.type,
      stage: data.stage,
      nextHearing: data.nextHearing ? new Date(data.nextHearing) : null,
      limitationDate: data.limitationDate ? new Date(data.limitationDate) : null,
      counsel: data.counsel,
      internalOwner: data.internalOwner,
      exposure: data.exposure ? parseFloat(data.exposure) : null,
      status: data.status,
      remarks: data.remarks,
      createdById: session.user.id,
    },
  });

  await createAuditLog({ action: "CREATE", table: "matters", recordId: matter.id, userId: session.user.id, newData: matter });
  return NextResponse.json(matter, { status: 201 });
}
