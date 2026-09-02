import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  return null;
}

export async function requireAuth() {
  return null;
}

export async function requireRole(allowedRoles: string[]) {
  return null;
}

export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

export function hasAnyRole(userRoles: string[], allowedRoles: string[]): boolean {
  return userRoles.some(role => allowedRoles.includes(role));
}

export const ROLES = {
  WHITEFOX_ADMIN: 'WHITEFOX_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  PLANT_MANAGER: 'PLANT_MANAGER',
  PLANT_OPERATOR: 'PLANT_OPERATOR',
  DRIVER: 'DRIVER',
  EMPLOYEE: 'EMPLOYEE',
  SUPERVISOR: 'SUPERVISOR',
  AUDITOR: 'AUDITOR',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];