import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const formatGB = (bytes: number) => {
  if (bytes <= 0) return "0 GB";
  return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
};

export const thresholds = {
  cpu: { warning: 70, critical: 85 },
  memory: { warning: 75, critical: 90 },
  disk: { warning: 80, critical: 95 },
};

export const getStatusColor = (value: number, type: "cpu" | "memory" | "disk") => {
  if (value >= thresholds[type].critical) return "#ef4444";
  if (value >= thresholds[type].warning) return "#f59e0b";
  return "#10b981";
};

export const getStatusBadge = (value: number, type: "cpu" | "memory" | "disk") => {
  if (value >= thresholds[type].critical) return { text: "Critical", variant: "destructive" as const };
  if (value >= thresholds[type].warning) return { text: "Warning", variant: "secondary" as const };
  return { text: "Healthy", variant: "outline" as const };
};

export const safeFetch = async <T,>(apiBase: string, path: string): Promise<T | null> => {
  try {
    const res = await fetch(`${apiBase}${path}`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (e) {
    console.error(`Fetch ${path} failed:`, e);
    return null;
  }
};


export const safeToFixed = (value: unknown, decimals: number = 1): string => {
  const num = typeof value === 'number' ? value : 0;
  return num.toFixed(decimals);
};