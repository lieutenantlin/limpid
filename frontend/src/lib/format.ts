import { type DeviceStatus, type UserRole } from "@/lib/types";

export function formatDateTime(value?: string | null) {
  if (!value) return "Unavailable";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatNumber(value: number, digits = 1) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatRole(role: UserRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function formatStatus(status: DeviceStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
