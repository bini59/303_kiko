import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  // ponytail: 손그림 tape/tack 장식은 미니멀 디자인에서 제거됨. prop은 호출부 호환을 위해 남기되 무시한다.
  decoration?: "tape" | "tack" | "none";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ decoration = "none", className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-card border border-line rounded-[18px] shadow-card p-6 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export { Card };
export type { CardProps };
