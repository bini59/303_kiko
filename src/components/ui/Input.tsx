import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", ...props }, ref) => {
    const borderColor = error ? "border-accent" : "border-line";
    const focusBorder =
      "focus:border-accent focus:ring-2 focus:ring-accent/40";

    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`w-full text-[15px] px-4 py-3 rounded-2xl border ${borderColor} bg-card text-foreground placeholder:text-faint outline-none ${focusBorder} transition-colors ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-accent">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
