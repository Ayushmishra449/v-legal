import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/rbac";
import { z } from "zod";

const fieldConfigSchema = z.object({
  module: z.enum(["matters", "hearings", "invoices", "documents", "notices"]),
  fieldKey: z.string().min(1),
  label: z.string().min(1),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional().nullable(),
  isRequired: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const module = searchParams.get("module");

  const configs = await prisma.fieldConfig.findMany({
    where: module ? { module } : {},
    orderBy: [{ module: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: "Only Super Admin can manage field configs" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = fieldConfigSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const config = await prisma.fieldConfig.create({ data: parsed.data as any });
    return NextResponse.json(config, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "A config for this module+field already exists" }, { status: 409 });
    }
    throw err;
  }
}
