import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vivid focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-vivid text-[var(--color-vivid-ink)] shadow-sm hover:bg-vivid-strong active:translate-y-[0.5px]",
        accent:
          "bg-accent text-[var(--color-accent-ink)] shadow-sm hover:bg-accent-strong active:translate-y-[0.5px]",
        secondary:
          "border border-rule bg-paper text-ink hover:border-rule-strong hover:bg-paper-hover",
        ghost: "text-ink hover:bg-paper-hover",
        link: "text-[var(--color-accent-strong)] underline-offset-4 hover:underline",
        danger:
          "border border-red-200 bg-paper text-red-700 hover:bg-red-50",
      },
      size: {
        default: "h-10 px-4 sm:h-9",
        sm: "h-9 px-3.5 text-xs sm:h-8",
        lg: "h-11 px-6 text-[15px] sm:h-10",
        icon: "h-10 w-10 sm:h-9 sm:w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
