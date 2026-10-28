import React, { useState, forwardRef } from "react";
import { cn } from "../utils";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  inputClassName?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, inputClassName, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleVisibility = () => {
      if (!disabled) {
        setShowPassword((prev) => !prev);
      }
    };

    return (
      <div className={cn("relative flex items-center w-full", className)}>
        <input
          ref={ref}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          className={cn(
            "w-full px-3 py-2 pr-10 border border-border rounded-lg text-xs bg-bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors",
            disabled && "opacity-50 cursor-not-allowed bg-bg-secondary",
            inputClassName
          )}
          {...props}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          tabIndex={-1}
          aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
          title={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
          className="absolute right-2.5 p-1 rounded-md text-text-secondary/70 hover:text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {showPassword ? (
            /* Eye Off / Slashed Eye */
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
              />
            </svg>
          ) : (
            /* Eye Open */
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
