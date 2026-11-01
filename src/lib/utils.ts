import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 19.8 → "19.8 GB"; 0.27 → "277 MB"; 0 → "0 GB" */
export function formatSize(gb: number): string {
  if (gb === 0) return "0 GB";
  if (gb < 1) return `${Math.round(gb * 1024)} MB`;
  return `${gb.toFixed(1)} GB`;
}

export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatContext(n: number): string {
  if (n >= 1024) return `${Math.round(n / 1024)}K`;
  return String(n);
}

export function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** "2026-10-21" → "10月21日" */
export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function relativeDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const now = new Date("2026-10-26T00:00:00");
  const days = Math.round((now.getTime() - d.getTime()) / 86400000);
  if (days <= 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  return `${Math.floor(days / 30)} 个月前`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function modKey(e: { ctrlKey: boolean; metaKey: boolean }): boolean {
  return e.metaKey || e.ctrlKey;
}

export const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform);

/** Label for the primary modifier key on this platform. */
export const modLabel = isMac ? "⌘" : "Ctrl";
