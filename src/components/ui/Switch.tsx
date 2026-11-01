import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/utils";

export function Switch({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative inline-flex h-[20px] w-[34px] shrink-0 items-center rounded-full border border-transparent transition-colors duration-150",
        "data-[state=unchecked]:bg-line-strong data-[state=unchecked]:hover:bg-[color-mix(in_srgb,var(--color-line-strong)_80%,var(--color-ink))]",
        "data-[state=checked]:bg-clay",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-[16px] rounded-full bg-white shadow-[0_1px_2px_rgba(41,40,37,0.24)] transition-transform duration-150 ease-out",
          "translate-x-[2px] data-[state=checked]:translate-x-[16px]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
