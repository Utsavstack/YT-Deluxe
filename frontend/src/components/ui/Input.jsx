import React from "react";
import { cn } from "../../utils/cn";

const Input = React.forwardRef(({
  className,
  type = "text",
  label,
  description,
  error,
  required = false,
  id,
  ...props
}, ref) => {
  // Generate unique ID if not provided
  const inputId = id || `input-${Math.random()?.toString(36)?.substr(2, 9)}`;

  // Base input classes
  const baseInputClasses = "flex h-10 w-full rounded-xl border border-border/50 bg-white/50 dark:bg-black/20 backdrop-blur-md px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all shadow-sm hover:bg-white/80 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50";

  // Checkbox-specific styles
  if (type === "checkbox") {
    return (
      <input
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        id={inputId}
        {...props}
      />
    );
  }

  // Radio button-specific styles
  if (type === "radio") {
    return (
      <input
        type="radio"
        className={cn(
          "h-4 w-4 rounded-full border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        id={inputId}
        {...props}
      />
    );
  }

  // For regular inputs with wrapper structure
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            error ? "text-destructive" : "text-foreground"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <input
        type={type}
        className={cn(
          baseInputClasses,
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        id={inputId}
        {...props}
      />

      {description && !error && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;