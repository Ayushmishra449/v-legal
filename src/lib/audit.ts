import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

export async function createAuditLog({
  action,
  table,
  recordId,
  userId,
  oldData,
  newData,
}: {
  action: AuditAction;
  table: string;
  recordId: string;
  userId: string;
  oldData?: object | null;
  newData?: object | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        table,
        recordId,
        userId,
        oldData: oldData ?? undefined,
        newData: newData ?? undefined,
      },
    });
  } catch (error) {
    // Non-blocking: audit failures should not break main operations
    console.error("Audit log failed:", error);
  }
}
