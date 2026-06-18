import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy, hh:mm a");
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (!amount) return "₹0";
  const n = Number(amount);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatCurrencyFull(amount: number | string | null | undefined): string {
  if (!amount) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export function isUrgent(date: Date | string | null | undefined, days = 3): boolean {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return isAfter(d, now) && isBefore(d, addDays(now, days));
}

export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  return isBefore(new Date(date), new Date());
}

export function getDaysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function generateId(prefix: string, year: number, count: number): string {
  return `${prefix}-${year}-${String(count).padStart(3, "0")}`;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
