import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateCustomerId(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function getDaysOverdue(dueDate: Date | string): number {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = today.getTime() - due.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getDaysUntilDue(dueDate: Date | string): number {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = due.getTime() - today.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getInstallmentStatus(dueDate: Date | string): "overdue" | "due-soon" | "upcoming" | "paid" {
  const daysOverdue = getDaysOverdue(dueDate);
  if (daysOverdue > 0) return "overdue";
  if (daysOverdue >= -3) return "due-soon";
  return "upcoming";
}
