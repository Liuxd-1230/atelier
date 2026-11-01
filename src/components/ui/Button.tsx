import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-[background-color,border-color,color,box-shadow] duration-150 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-ink hover:bg-primary-hover active:bg-primary-hover",
        secondary:
          "bg-tile text-ink hover:bg-[color-mix(in_srgb,var(--color-tile)_82%,var(--color-ink))] active:bg-[color-mix(in_srgb,var(--color-tile)_72%,var(--color-ink))]",
        outline:
          "border border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink",
        ghost: "text-ink-2 hover:bg-hover hover:text-ink",
        danger:
          "bg-danger text-white hover:bg-[color-mix(in_srgb,var(--color-danger)_88%,black)]",
        quiet: "text-ink-3 hover:bg-hover hover:text-ink",
      },
      size: {
        xs: "h-6 rounded-md px-2 text-[11.5px]",
        sm: "h-7 px-2.5 text-xs",
        md: "h-8 px-3 text-xs",
        lg: "h-9 px-4 text-[13px]",
        icon: "size-7 rounded-md",
        "icon-sm": "size-6 rounded-md",
        "icon-lg": "size-8",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(button({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { button as buttonStyles };
