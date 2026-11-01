import {
  Code2,
  Layers,
  MessageSquareText,
  ScanEye,
  type LucideIcon,
} from "lucide-react";
import type { Model, ModelKind, ModelStatus } from "../../lib/types";
import { cn } from "../../lib/utils";
import { StatusBadge } from "../ui/Primitives";

export const KIND_ICON: Record<ModelKind, LucideIcon> = {
  chat: MessageSquareText,
  vision: ScanEye,
  code: Code2,
  embedding: Layers,
};

export const KIND_TONE: Record<ModelKind, string> = {
  chat: "text-[#8a6a4f] bg-[#f3ece3]",
  vision: "text-[#5f7a86] bg-[#eaf1f2]",
  code: "text-[#6b7a5a] bg-[#edf1e7]",
  embedding: "text-[#7a6d84] bg-[#f0ecf3]",
};

export function KindTile({
  kind,
  size = "md",
}: {
  kind: ModelKind;
  size?: "md" | "sm";
}) {
  const Icon = KIND_ICON[kind];
  return (
    <span
      className={cn(
        "row-kind-tile flex shrink-0 items-center justify-center rounded-[7px]",
        size === "md" ? "size-[32px]" : "size-[26px]",
        KIND_TONE[kind],
      )}
      aria-hidden
    >
      <Icon size={size === "md" ? 16 : 14} strokeWidth={1.7} />
    </span>
  );
}

const STATUS_TONE: Record<
  ModelStatus,
  { tone: "ok" | "warn" | "danger" | "info" | "neutral" | "clay"; label: string; pulse?: boolean }
> = {
  ready: { tone: "ok", label: "就绪" },
  running: { tone: "ok", label: "运行中", pulse: true },
  downloading: { tone: "clay", label: "下载中", pulse: true },
  paused: { tone: "neutral", label: "已暂停" },
  error: { tone: "danger", label: "需处理" },
};

export function ModelStatusCell({ model }: { model: Model }) {
  const config = STATUS_TONE[model.status];
  if (model.status === "downloading") {
    return (
      <div className="flex min-w-0 flex-col gap-[5px]">
        <span className="text-[11.5px] tabular-nums leading-none text-ink-2">
          {Math.round(model.progress * 100)}%
        </span>
        <span className="h-[3px] w-[56px] overflow-hidden rounded-full bg-track">
          <span
            className="block h-full rounded-full bg-clay transition-[width] duration-700 ease-linear"
            style={{ width: `${model.progress * 100}%` }}
          />
        </span>
      </div>
    );
  }
  return (
    <StatusBadge tone={config.tone} pulse={config.pulse}>
      {config.label}
    </StatusBadge>
  );
}

export function StatusCell({ status }: { status: ModelStatus }) {
  const config = STATUS_TONE[status];
  return (
    <StatusBadge tone={config.tone} pulse={config.pulse}>
      {config.label}
    </StatusBadge>
  );
}
