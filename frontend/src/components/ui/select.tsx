'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  placeholder?: string;
  className?: string;
}

/**
 * Robust Native Select component with modern UI styling.
 * 100% fail-safe: Closes immediately on selection, never locks modal focus,
 * allows instant saving, and works reliably on all devices and dialogs.
 */
export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, children, options, placeholder, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            'flex h-10 w-full appearance-none items-center justify-between rounded-xl border border-input bg-background px-3.5 py-2 pr-9 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer hover:bg-muted/30 transition-colors shadow-sm',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-muted-foreground bg-background">
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-background text-foreground py-1">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 text-muted-foreground" />
      </div>
    );
  }
);
NativeSelect.displayName = 'NativeSelect';

/* ──────────────── Shim compatibility for existing Radix-like syntax ──────────────── */
interface SelectContextValue {
  value?: string;
  onValueChange?: (val: string) => void;
}
const SelectContext = React.createContext<SelectContextValue>({});

export function Select({
  value,
  onValueChange,
  children,
}: {
  value?: string;
  onValueChange?: (val: string) => void;
  children: React.ReactNode;
}) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  // Pass-through wrapper
  return <div className={cn('relative w-full', className)}>{children}</div>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return null;
}

export function SelectContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { value, onValueChange } = React.useContext(SelectContext);

  return (
    <div className="relative w-full">
      <select
        value={value ?? ''}
        onChange={(e) => onValueChange?.(e.target.value)}
        className={cn(
          'flex h-10 w-full appearance-none items-center justify-between rounded-xl border border-input bg-background px-3.5 py-2 pr-9 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer hover:bg-muted/30 transition-colors shadow-sm',
          className
        )}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 text-muted-foreground" />
    </div>
  );
}

export function SelectItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <option value={value} className={cn('bg-background text-foreground py-1', className)}>
      {children}
    </option>
  );
}

export function SelectGroup({ children }: { children: React.ReactNode }) {
  return <optgroup>{children}</optgroup>;
}

export function SelectLabel({ children }: { children: React.ReactNode }) {
  return <optgroup label={typeof children === 'string' ? children : ''} />;
}

export function SelectSeparator() {
  return null;
}