import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

/**
 * A small pill for model state. Colour is carried by a dot plus a tinted
 * surface, never by text colour alone.
 */
export function StatusBadge({
  tone,
  children,
  pulse = false,
  className,
}: {
  tone: "ok" | "warn" | "danger" | "info" | "neutral" | "clay";
  children: ReactNode;
  pulse?: boolean;
  className?: string;
}) {
  const tones = {
    ok: { dot: "bg-ok", wrap: "text-ink-2" },
    warn: { dot: "bg-warn", wrap: "text-ink-2" },
    danger: { dot: "bg-danger", wrap: "text-ink-2" },
    info: { dot: "bg-info", wrap: "text-ink-2" },
    neutral: { dot: "bg-ink-4", wrap: "text-ink-3" },
    clay: { dot: "bg-clay", wrap: "text-ink-2" },
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11.5px] leading-none",
        tones.wrap,
        className,
      )}
    >
      <span className="relative flex size-[6px] shrink-0">
        <span className={cn("size-[6px] rounded-full", tones.dot)} />
        {pulse && (
          <span
            className={cn(
              "absolute inset-0 rounded-full opacity-60",
              tones.dot,
              "animate-ping [animation-duration:2.2s]",
            )}
          />
        )}
      </span>
      {children}
    </span>
  );
}

export function Tag({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[20px] items-center rounded-[5px] border border-line px-1.5 text-[10.5px] leading-none text-ink-3",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-line", className)} />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}
