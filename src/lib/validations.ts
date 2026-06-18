import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const matterSchema = z.object({
  name: z.string().min(2, "Matter name is required"),
  oppositeParty: z.string().min(1, "Opposite party is required"),
  court: z.string().min(1, "Court/tribunal is required"),
  caseNumber: z.string().optional(),
  type: z.enum(["CIVIL", "ARBITRATION", "REGULATORY", "WRIT_ADMINISTRATIVE", "CRIMINAL", "LABOUR", "LAND_ACQUISITION", "CONTRACT_DISPUTE"]),
  stage: z.enum(["PRE_FILING", "PLEADINGS", "EVIDENCE", "ARGUMENTS", "RESERVED", "ORDER_RECEIVED", "EXECUTION"]),
  nextHearing: z.string().optional().nullable(),
  limitationDate: z.string().optional().nullable(),
  counsel: z.string().optional(),
  internalOwner: z.string().optional(),
  exposure: z.string().optional().nullable(),
  status: z.enum(["ONGOING", "SETTLED", "CLOSED", "DISMISSED", "STAY_GRANTED"]),
  remarks: z.string().optional(),
});

export const hearingSchema = z.object({
  matterId: z.string().min(1, "Matter is required"),
  date: z.string().min(1, "Hearing date is required"),
  type: z.enum(["INITIAL", "ARGUMENTS", "EVIDENCE", "ORDER", "MENTION"]),
  status: z.enum(["SCHEDULED", "HEARD", "ADJOURNED", "ORDER_PASSED"]),
  outcome: z.string().optional(),
  nextDate: z.string().optional().nullable(),
  docLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  updatedBy: z.string().optional(),
});

export const invoiceSchema = z.object({
  vendor: z.string().min(1, "Vendor is required"),
  billNo: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  amount: z.string().min(1, "Amount is required"),
  matterId: z.string().optional().nullable(),
  type: z.enum(["COUNSEL_FEES", "ARBITRATOR_FEES", "MISC"]),
  paymentStatus: z.enum(["PENDING", "PAID", "REJECTED"]),
  pendingAt: z.enum(["PR_INDENT_CREATION", "PO_CREATION", "PO_RELEASE", "SRN_CREATION", "ACCOUNTS_PROCESSING", "MANAGEMENT_APPROVAL", "PAYMENT_RELEASED"]).optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  remarks: z.string().optional(),
});

export const documentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  type: z.enum(["PETITION_PLAINT", "COURT_ORDER", "EVIDENCE", "LEGAL_NOTICE", "CONTRACT", "CORRESPONDENCE", "OTHER"]),
  matterId: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  uploadedBy: z.string().optional(),
  version: z.string().optional(),
  fileLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  remarks: z.string().optional(),
});

export const noticeSchema = z.object({
  direction: z.enum(["SENT", "RECEIVED"]),
  counterparty: z.string().min(1, "Counterparty is required"),
  date: z.string().min(1, "Date is required"),
  replyDue: z.string().optional().nullable(),
  matterId: z.string().optional().nullable(),
  status: z.enum(["PENDING_REPLY", "REPLIED", "SENT", "NO_REPLY_REQUIRED"]),
  subject: z.string().min(1, "Subject is required"),
  noticeLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  replyLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "LEGAL_TEAM", "FINANCE", "VIEWER"]),
  isActive: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type MatterInput = z.infer<typeof matterSchema>;
export type HearingInput = z.infer<typeof hearingSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type NoticeInput = z.infer<typeof noticeSchema>;
export type UserInput = z.infer<typeof userSchema>;
