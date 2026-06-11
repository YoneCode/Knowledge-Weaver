import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium tracking-tight transition-[background,color,border-color,transform] duration-150 ease-out disabled:opacity-45 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-border focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-press active:translate-y-px",
        secondary:
          "bg-surface text-ink border border-line hover:bg-surface-2 hover:border-line-strong",
        ghost: "bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink",
        link: "text-ink-2 hover:text-ink underline-offset-4 hover:underline px-0",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
