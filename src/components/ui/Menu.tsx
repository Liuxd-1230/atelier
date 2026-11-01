import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function Menu({
  trigger,
  children,
  align = "end",
  side = "bottom",
  sideOffset = 4,
  className,
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  className?: string;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          side={side}
          sideOffset={sideOffset}
          className={cn("menu-content", className)}
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function MenuItem({
  icon: Icon,
  children,
  onSelect,
  shortcut,
  danger,
  disabled,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  onSelect?: () => void;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu.Item
      className={cn("menu-item", danger && "menu-item-danger")}
      onSelect={onSelect}
      disabled={disabled}
    >
      {Icon && <Icon size={14} strokeWidth={1.8} className="shrink-0" />}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="ml-2 font-mono text-[10px] text-ink-4">{shortcut}</span>
      )}
    </DropdownMenu.Item>
  );
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="menu-separator" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu.Label className="px-2 pb-1 pt-1.5 text-[10.5px] font-medium tracking-[0.02em] text-ink-4">
      {children}
    </DropdownMenu.Label>
  );
}

export function Hint({
  label,
  children,
  side = "bottom",
  shortcut,
}: {
  label: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  shortcut?: string;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side={side}
          sideOffset={6}
          className="z-[80] flex items-center gap-2 rounded-md bg-tooltip-bg px-2 py-[5px] text-[11px] leading-none text-tooltip-ink shadow-[0_4px_14px_rgba(41,40,37,0.22)]"
        >
          {label}
          {shortcut && (
            <span className="font-mono text-[10px] text-tooltip-ink/60">
              {shortcut}
            </span>
          )}
          <Tooltip.Arrow className="fill-tooltip-bg" width={8} height={4} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
