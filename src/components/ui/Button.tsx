import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", children, ...props }, ref) => {
    const base =
      "font-semibold text-[15px] px-6 py-3 rounded-2xl transition-colors duration-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-foreground text-white hover:bg-accent",
      secondary:
        "bg-card text-foreground border border-line hover:bg-chip",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
