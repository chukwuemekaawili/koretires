import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary - Deep navy blue background, white text
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-md",
        // Secondary - Dark charcoal/gray background
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm rounded-md",
        // Outline/Tertiary - White background with border
        outline: "border border-border bg-card hover:bg-muted text-foreground rounded-md",
        // Ghost - No background
        ghost: "hover:bg-muted hover:text-foreground rounded-md",
        // Link - Text only
        link: "text-primary underline-offset-4 hover:underline",
        // Destructive
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm rounded-md",
        // Legacy variants for compatibility
        hero: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-md",
        heroOutline: "border border-white/30 bg-transparent hover:bg-white/10 text-white rounded-md",
        cta: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-md",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm rounded-md",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        xl: "h-12 px-8 text-base",
        icon: "h-10 w-10",
        iconSm: "h-8 w-8",
        iconLg: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
