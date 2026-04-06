import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function maturityLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'Initial',
    2: 'Developing',
    3: 'Defined',
    4: 'Managed',
    5: 'Optimized',
  };
  return labels[level] ?? 'Unknown';
}

export function maturityColor(level: number): string {
  const colors: Record<number, string> = {
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-blue-500',
    5: 'bg-green-500',
  };
  return colors[level] ?? 'bg-gray-500';
}

export function confidenceColor(confidence: number): string {
  if (confidence >= 0.7) return 'text-green-600';
  if (confidence >= 0.4) return 'text-yellow-600';
  return 'text-red-600';
}
