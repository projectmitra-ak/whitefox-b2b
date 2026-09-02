import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    IN_USE: 'status-in-use',
    IN_LOCKER: 'status-in-locker',
    IN_LAUNDRY: 'status-in-laundry',
    IN_TRANSIT: 'status-in-laundry',
    RECEIVED_AT_PLANT: 'status-in-laundry',
    SORTING: 'status-in-laundry',
    WASHING: 'status-washing',
    DRYING: 'status-drying',
    QC_PENDING: 'status-qc',
    QC_PASSED: 'status-delivered',
    QC_FAILED: 'status-qc',
    REPAIRING: 'status-in-laundry',
    REPAIRED: 'status-delivered',
    PACKED: 'status-delivered',
    DISPATCHED: 'status-delivered',
    DELIVERED: 'status-delivered',
    MISSING: 'status-missing',
    LOST: 'status-missing',
    DAMAGED: 'status-missing',
    RETIRED: 'bg-gray-100 text-gray-800',
    PROCURED: 'bg-slate-100 text-slate-800',
    TAGGED: 'bg-indigo-100 text-indigo-800',
    ALLOCATED: 'bg-teal-100 text-teal-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    IN_USE: 'In Use',
    IN_LOCKER: 'In Locker',
    IN_LAUNDRY: 'In Laundry',
    IN_TRANSIT: 'In Transit',
    RECEIVED_AT_PLANT: 'Received at Plant',
    SORTING: 'Sorting',
    WASHING: 'Washing',
    DRYING: 'Drying',
    QC_PENDING: 'QC Pending',
    QC_PASSED: 'QC Passed',
    QC_FAILED: 'QC Failed',
    REPAIRING: 'Repairing',
    REPAIRED: 'Repaired',
    PACKED: 'Packed',
    DISPATCHED: 'Dispatched',
    DELIVERED: 'Delivered',
    MISSING: 'Missing',
    LOST: 'Lost',
    DAMAGED: 'Damaged',
    RETIRED: 'Retired',
    PROCURED: 'Procured',
    TAGGED: 'Tagged',
    ALLOCATED: 'Allocated',
  };
  return labels[status] || status;
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}