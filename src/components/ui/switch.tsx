"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps {
  isSelected?: boolean;
  onChange?: (isSelected: boolean) => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const Switch = ({ children, className, isSelected = false, onChange, disabled = false }: SwitchProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isSelected}
      disabled={disabled}
      onClick={() => onChange?.(!isSelected)}
      className={cn(
        "group inline-flex items-center gap-3 text-sm font-medium leading-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-70",
        className
      )}
      style={{ WebkitAppearance: 'none', appearance: 'none', background: 'transparent', border: 'none', padding: 0 }}
    >
      <div
        style={{
          width: '48px',
          height: '28px',
          backgroundColor: isSelected ? '#2563eb' : '#374151',
          border: isSelected ? '2px solid #2563eb' : '2px solid #4b5563',
          borderRadius: '9999px',
          position: 'relative',
          transition: 'all 0.2s ease-in-out',
          flexShrink: 0
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: 'white',
            borderRadius: '50%',
            position: 'absolute',
            top: '2px',
            left: isSelected ? '22px' : '2px',
            transition: 'left 0.2s ease-in-out',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}
        />
      </div>
      {children}
    </button>
  );
};

export { Switch }
