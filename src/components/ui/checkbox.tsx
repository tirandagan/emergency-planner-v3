"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Minus } from "lucide-react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'checked'> {
  checked?: boolean | "indeterminate";
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = checked === "indeterminate";
      }
    }, [checked]);

    return (
      <div className="relative flex items-center justify-center w-4 h-4">
        <input
          type="checkbox"
          ref={inputRef}
          checked={checked === true}
          className={cn(
            "peer h-4 w-4 shrink-0 rounded border border-input shadow-sm shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer z-10",
            className
          )}
          {...props}
        />
        {checked === true && (
          <Check className="absolute h-3 w-3 text-white pointer-events-none z-20 stroke-[3px]" />
        )}
        {checked === "indeterminate" && (
          <Minus className="absolute h-3 w-3 text-blue-600 pointer-events-none z-20 stroke-[3px]" />
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };











