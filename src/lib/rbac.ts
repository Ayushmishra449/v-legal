import { Role } from "@prisma/client";

export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 6,
  ADMIN: 5,
  MANAGER: 4,
  LEGAL_TEAM: 3,
  FINANCE: 2,
  VIEWER: 1,
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  LEGAL_TEAM: "Legal Team",
  FINANCE: "Finance",
  VIEWER: "Viewer",
};

export const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700 border-red-200",
  ADMIN: "bg-orange-100 text-orange-700 border-orange-200",
  MANAGER: "bg-blue-100 text-blue-700 border-blue-200",
  LEGAL_TEAM: "bg-purple-100 text-purple-700 border-purple-200",
  FINANCE: "bg-green-100 text-green-700 border-green-200",
  VIEWER: "bg-gray-100 text-gray-600 border-gray-200",
};

export function canManageUsers(role: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN;
}

export function canEdit(role: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.LEGAL_TEAM;
}

export function canViewFinance(role: Role): boolean {
  return (
    ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.FINANCE
  );
}

export function isAdmin(role: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN;
}

export function isSuperAdmin(role: Role): boolean {
  return role === "SUPER_ADMIN";
}
