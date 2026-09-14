'use client';

import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

// Context for single-selection toggle group
interface ToggleGroupContextValue {
  value: string;
  onChange: (value: string) => void;
}

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

function useToggleGroupContext() {
  const context = useContext(ToggleGroupContext);
  if (!context) {
    throw new Error('ToggleGroupItem must be used within ToggleGroup');
  }
  return context;
}

interface ToggleGroupProps {
  className?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  type?: 'single';
  size?: 'sm' | 'md' | 'lg';
}

function ToggleGroup({
  className,
  value: controlledValue,
  defaultValue,
  onValueChange,
  children,
}: ToggleGroupProps) {
  const [internalValue, setInternalValue] = useState<string>(defaultValue || '');

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = useCallback(
    (newValue: string) => {
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [controlledValue, onValueChange]
  );

  return (
    <ToggleGroupContext.Provider value={{ value, onChange: handleChange }}>
      <div
        data-slot="toggle-group"
        className={cn('inline-flex items-center justify-center gap-1', className)}
        role="group"
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

interface ToggleGroupItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

function ToggleGroupItem({
  className,
  value: itemValue,
  ...props
}: ToggleGroupItemProps) {
  const { value, onChange } = useToggleGroupContext();
  const isActive = value === itemValue;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      data-state={isActive ? 'on' : 'off'}
      data-slot="toggle-group-item"
      className={cn(
        'flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all cursor-pointer',
        'hover:bg-muted hover:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
        className
      )}
      onClick={() => onChange(itemValue)}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
