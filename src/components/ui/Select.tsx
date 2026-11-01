import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

/**
 * A quiet custom select. Native selects cannot match the rest of the UI, so
 * this is a button plus a listbox; keyboard support covers the common path.
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
  menuClassName,
  renderValue,
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  menuClassName?: string;
  renderValue?: (option: SelectOption<T> | undefined) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "input flex cursor-pointer items-center justify-between gap-2 text-left",
          open && "border-[color-mix(in_srgb,var(--color-clay)_55%,var(--color-line))] shadow-[0_0_0_3px_rgba(217,119,87,0.13)]",
        )}
      >
        <span className="truncate">
          {renderValue ? renderValue(current) : current?.label}
        </span>
        <ChevronDown
          size={13}
          strokeWidth={1.9}
          className={cn(
            "shrink-0 text-ink-4 transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            "menu-content anim-pop-in absolute right-0 top-[calc(100%+4px)] z-[75] max-h-[280px] w-full min-w-[180px] overflow-y-auto",
            menuClassName,
          )}
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "menu-item w-full",
                  selected && "bg-hover text-ink",
                )}
              >
                <span className="flex-1 text-left">
                  {option.label}
                  {option.description && (
                    <span className="block text-[10.5px] text-ink-4">
                      {option.description}
                    </span>
                  )}
                </span>
                {selected && (
                  <Check size={13} strokeWidth={2} className="text-clay" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
