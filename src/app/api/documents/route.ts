import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { documentSchema } from "@/lib/validations";
import { canEdit, isAdmin } from "@/lib/rbac";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { uploadedBy: { contains: search, mode: "insensitive" as const } },
        ],
      } : {},
      type ? { type: type as any } : {},
    ],
  };

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { matter: { select: { id: true, matterId: true, name: true } } },
    }),
    prisma.document.count({ where }),
  ]);

  return NextResponse.json({ documents, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = documentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const count = await prisma.document.count();
  const year = new Date().getFullYear();
  const docId = `DOC-${year}-${String(count + 1).padStart(3, "0")}`;

  let matterId: string | null = null;
  if (data.matterId) {
    const matter = await prisma.matter.findFirst({ where: { OR: [{ id: data.matterId }, { matterId: data.matterId }] } });
    matterId = matter?.id ?? null;
  }

  const doc = await prisma.document.create({
    data: {
      docId,
      name: data.name,
      type: data.type,
      matterId,
      date: data.date ? new Date(data.date) : null,
      uploadedBy: data.uploadedBy || session.user.name,
      version: data.version,
      fileLink: data.fileLink || null,
      remarks: data.remarks,
      createdById: session.user.id,
    },
    include: { matter: { select: { id: true, matterId: true, name: true } } },
  });

  await createAuditLog({ action: "CREATE", table: "documents", recordId: doc.id, userId: session.user.id, newData: doc });
  return NextResponse.json(doc, { status: 201 });
}
