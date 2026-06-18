import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/rbac";

// All default fields for every module — matches exactly what the forms show
const DEFAULT_FIELDS = [
  // ─── MATTERS ───────────────────────────────────────────────
  { module: "matters", fieldKey: "name", label: "Matter Name", isRequired: true, isVisible: true, sortOrder: 1, options: null },
  { module: "matters", fieldKey: "oppositeParty", label: "Opposite Party", isRequired: true, isVisible: true, sortOrder: 2, options: null },
  { module: "matters", fieldKey: "court", label: "Court / Tribunal", isRequired: true, isVisible: true, sortOrder: 3, options: null },
  { module: "matters", fieldKey: "caseNumber", label: "Case Number", isRequired: false, isVisible: true, sortOrder: 4, options: null },
  {
    module: "matters", fieldKey: "type", label: "Type", isRequired: true, isVisible: true, sortOrder: 5,
    options: [
      { value: "CIVIL", label: "Civil" },
      { value: "ARBITRATION", label: "Arbitration" },
      { value: "REGULATORY", label: "Regulatory" },
      { value: "WRIT_ADMINISTRATIVE", label: "Writ / Administrative" },
      { value: "CRIMINAL", label: "Criminal" },
      { value: "LABOUR", label: "Labour" },
      { value: "LAND_ACQUISITION", label: "Land Acquisition" },
      { value: "CONTRACT_DISPUTE", label: "Contract Dispute" },
    ],
  },
  {
    module: "matters", fieldKey: "stage", label: "Stage", isRequired: true, isVisible: true, sortOrder: 6,
    options: [
      { value: "PRE_FILING", label: "Pre Filing" },
      { value: "PLEADINGS", label: "Pleadings" },
      { value: "EVIDENCE", label: "Evidence" },
      { value: "ARGUMENTS", label: "Arguments" },
      { value: "RESERVED", label: "Reserved" },
      { value: "ORDER_RECEIVED", label: "Order Received" },
      { value: "EXECUTION", label: "Execution" },
    ],
  },
  { module: "matters", fieldKey: "nextHearing", label: "Next Hearing", isRequired: false, isVisible: true, sortOrder: 7, options: null },
  { module: "matters", fieldKey: "limitationDate", label: "Limitation Date", isRequired: false, isVisible: true, sortOrder: 8, options: null },
  { module: "matters", fieldKey: "counsel", label: "Counsel", isRequired: false, isVisible: true, sortOrder: 9, options: null },
  { module: "matters", fieldKey: "internalOwner", label: "Internal Owner", isRequired: false, isVisible: true, sortOrder: 10, options: null },
  { module: "matters", fieldKey: "exposure", label: "Financial Exposure (INR)", isRequired: false, isVisible: true, sortOrder: 11, options: null },
  {
    module: "matters", fieldKey: "status", label: "Status", isRequired: true, isVisible: true, sortOrder: 12,
    options: [
      { value: "ONGOING", label: "Ongoing" },
      { value: "SETTLED", label: "Settled" },
      { value: "CLOSED", label: "Closed" },
      { value: "DISMISSED", label: "Dismissed" },
      { value: "STAY_GRANTED", label: "Stay Granted" },
    ],
  },
  { module: "matters", fieldKey: "remarks", label: "Remarks", isRequired: false, isVisible: true, sortOrder: 13, options: null },

  // ─── HEARINGS ──────────────────────────────────────────────
  { module: "hearings", fieldKey: "matterId", label: "Matter", isRequired: true, isVisible: true, sortOrder: 1, options: null },
  { module: "hearings", fieldKey: "date", label: "Hearing Date", isRequired: true, isVisible: true, sortOrder: 2, options: null },
  {
    module: "hearings", fieldKey: "type", label: "Hearing Type", isRequired: true, isVisible: true, sortOrder: 3,
    options: [
      { value: "INITIAL", label: "Initial" },
      { value: "ARGUMENTS", label: "Arguments" },
      { value: "EVIDENCE", label: "Evidence" },
      { value: "ORDER", label: "Order" },
      { value: "MENTION", label: "Mention" },
    ],
  },
  {
    module: "hearings", fieldKey: "status", label: "Status", isRequired: true, isVisible: true, sortOrder: 4,
    options: [
      { value: "SCHEDULED", label: "Scheduled" },
      { value: "HEARD", label: "Heard" },
      { value: "ADJOURNED", label: "Adjourned" },
      { value: "ORDER_PASSED", label: "Order Passed" },
    ],
  },
  { module: "hearings", fieldKey: "nextDate", label: "Next Date", isRequired: false, isVisible: true, sortOrder: 5, options: null },
  { module: "hearings", fieldKey: "docLink", label: "Order Document Link", isRequired: false, isVisible: true, sortOrder: 6, options: null },
  { module: "hearings", fieldKey: "updatedBy", label: "Updated By", isRequired: false, isVisible: true, sortOrder: 7, options: null },
  { module: "hearings", fieldKey: "outcome", label: "Outcome / Summary", isRequired: false, isVisible: true, sortOrder: 8, options: null },

  // ─── INVOICES ──────────────────────────────────────────────
  { module: "invoices", fieldKey: "vendor", label: "Vendor", isRequired: true, isVisible: true, sortOrder: 1, options: null },
  { module: "invoices", fieldKey: "billNo", label: "Bill Number", isRequired: false, isVisible: true, sortOrder: 2, options: null },
  { module: "invoices", fieldKey: "date", label: "Date", isRequired: true, isVisible: true, sortOrder: 3, options: null },
  { module: "invoices", fieldKey: "amount", label: "Amount (INR)", isRequired: true, isVisible: true, sortOrder: 4, options: null },
  { module: "invoices", fieldKey: "matterId", label: "Linked Matter", isRequired: false, isVisible: true, sortOrder: 5, options: null },
  {
    module: "invoices", fieldKey: "type", label: "Invoice Type", isRequired: true, isVisible: true, sortOrder: 6,
    options: [
      { value: "COUNSEL_FEES", label: "Counsel Fees" },
      { value: "ARBITRATOR_FEES", label: "Arbitrator Fees" },
      { value: "MISC", label: "Miscellaneous" },
    ],
  },
  {
    module: "invoices", fieldKey: "paymentStatus", label: "Payment Status", isRequired: true, isVisible: true, sortOrder: 7,
    options: [
      { value: "PENDING", label: "Pending" },
      { value: "PAID", label: "Paid" },
      { value: "REJECTED", label: "Rejected" },
    ],
  },
  {
    module: "invoices", fieldKey: "pendingAt", label: "Pending At Stage", isRequired: false, isVisible: true, sortOrder: 8,
    options: [
      { value: "PR_INDENT_CREATION", label: "PR / Indent Creation" },
      { value: "PO_CREATION", label: "PO Creation" },
      { value: "PO_RELEASE", label: "PO Release" },
      { value: "SRN_CREATION", label: "SRN Creation" },
      { value: "ACCOUNTS_PROCESSING", label: "Accounts Processing" },
      { value: "MANAGEMENT_APPROVAL", label: "Management Approval" },
      { value: "PAYMENT_RELEASED", label: "Payment Released" },
    ],
  },
  { module: "invoices", fieldKey: "paymentDate", label: "Payment Date", isRequired: false, isVisible: true, sortOrder: 9, options: null },
  { module: "invoices", fieldKey: "remarks", label: "Remarks", isRequired: false, isVisible: true, sortOrder: 10, options: null },

  // ─── DOCUMENTS ─────────────────────────────────────────────
  { module: "documents", fieldKey: "name", label: "Document Name", isRequired: true, isVisible: true, sortOrder: 1, options: null },
  {
    module: "documents", fieldKey: "type", label: "Document Type", isRequired: true, isVisible: true, sortOrder: 2,
    options: [
      { value: "PETITION_PLAINT", label: "Petition / Plaint" },
      { value: "COURT_ORDER", label: "Court Order" },
      { value: "EVIDENCE", label: "Evidence" },
      { value: "LEGAL_NOTICE", label: "Legal Notice" },
      { value: "CONTRACT", label: "Contract" },
      { value: "CORRESPONDENCE", label: "Correspondence" },
      { value: "OTHER", label: "Other" },
    ],
  },
  { module: "documents", fieldKey: "matterId", label: "Linked Matter", isRequired: false, isVisible: true, sortOrder: 3, options: null },
  { module: "documents", fieldKey: "date", label: "Date", isRequired: false, isVisible: true, sortOrder: 4, options: null },
  { module: "documents", fieldKey: "uploadedBy", label: "Uploaded By", isRequired: false, isVisible: true, sortOrder: 5, options: null },
  { module: "documents", fieldKey: "version", label: "Version", isRequired: false, isVisible: true, sortOrder: 6, options: null },
  { module: "documents", fieldKey: "fileLink", label: "Google Drive Link", isRequired: false, isVisible: true, sortOrder: 7, options: null },
  { module: "documents", fieldKey: "remarks", label: "Remarks", isRequired: false, isVisible: true, sortOrder: 8, options: null },

  // ─── NOTICES ───────────────────────────────────────────────
  {
    module: "notices", fieldKey: "direction", label: "Direction", isRequired: true, isVisible: true, sortOrder: 1,
    options: [
      { value: "SENT", label: "Sent" },
      { value: "RECEIVED", label: "Received" },
    ],
  },
  { module: "notices", fieldKey: "counterparty", label: "Counterparty", isRequired: true, isVisible: true, sortOrder: 2, options: null },
  { module: "notices", fieldKey: "date", label: "Date", isRequired: true, isVisible: true, sortOrder: 3, options: null },
  { module: "notices", fieldKey: "replyDue", label: "Reply Due Date", isRequired: false, isVisible: true, sortOrder: 4, options: null },
  { module: "notices", fieldKey: "matterId", label: "Linked Matter", isRequired: false, isVisible: true, sortOrder: 5, options: null },
  {
    module: "notices", fieldKey: "status", label: "Status", isRequired: true, isVisible: true, sortOrder: 6,
    options: [
      { value: "PENDING_REPLY", label: "Pending Reply" },
      { value: "REPLIED", label: "Replied" },
      { value: "SENT", label: "Sent" },
      { value: "NO_REPLY_REQUIRED", label: "No Reply Required" },
    ],
  },
  { module: "notices", fieldKey: "subject", label: "Subject", isRequired: true, isVisible: true, sortOrder: 7, options: null },
  { module: "notices", fieldKey: "noticeLink", label: "Notice Document Link", isRequired: false, isVisible: true, sortOrder: 8, options: null },
  { module: "notices", fieldKey: "replyLink", label: "Reply Document Link", isRequired: false, isVisible: true, sortOrder: 9, options: null },
];

// POST: seed all default fields (idempotent — skips existing)
export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: "Only Super Admin can seed field configs" }, { status: 403 });
  }

  let created = 0;
  let skipped = 0;

  for (const field of DEFAULT_FIELDS) {
    try {
      await prisma.fieldConfig.create({ data: field as any });
      created++;
    } catch (err: any) {
      if (err.code === "P2002") {
        skipped++; // Already exists
      } else {
        throw err;
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: `Seeded ${created} fields, skipped ${skipped} already existing`,
    created,
    skipped,
  });
}
