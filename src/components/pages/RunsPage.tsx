import { History, Clock, ArrowUpRight, Inbox } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "../../store/AppStore";
import { cn } from "../../lib/utils";
import { StatusBadge } from "../ui/Primitives";
import { Button } from "../ui/Button";

const FILTERS = [
  { value: "all", label: "全部" },
  { value: "completed", label: "已完成" },
  { value: "stopped", label: "已停止" },
  { value: "failed", label: "失败" },
] as const;

const RUN_STATUS = {
  completed: { label: "已完成", tone: "ok" as const },
  stopped: { label: "已停止", tone: "neutral" as const },
  failed: { label: "失败", tone: "danger" as const },
};

function formatStartedAt(iso: string): string {
  const d = new Date(iso);
  const date = `${d.getMonth() + 1}月${d.getDate()}日`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
  return `${date} ${time}`;
}

export function RunsPage() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");

  const runs = useMemo(
    () =>
      filter === "all"
        ? state.runs
        : state.runs.filter((run) => run.status === filter),
    [state.runs, filter],
  );

  const totalTokens = state.runs.reduce((sum, r) => sum + r.tokens, 0);
  const avgSpeed =
    state.runs.filter((r) => r.tokensPerSecond > 0).length > 0
      ? state.runs
          .filter((r) => r.tokensPerSecond > 0)
          .reduce((sum, r) => sum + r.tokensPerSecond, 0) /
        state.runs.filter((r) => r.tokensPerSecond > 0).length
      : 0;
  const maxSpeed = Math.max(1, ...state.runs.map((r) => r.tokensPerSecond));

  return (
    <div className="page page-enter">
      <div>
        <h1 className="page-title">
          运行记录
          <span className="page-title-count">{state.runs.length}</span>
        </h1>
        <p className="page-desc">
          每次启动与对话的吞吐、时长和状态，便于比较不同模型的本地表现。
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="control-group flex items-center">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={cn(
                "h-[26px] rounded-[6px] px-2.5 text-[11.5px] transition-colors",
                filter === option.value
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgba(41,40,37,0.08)]"
                  : "text-ink-3 hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="readout flex items-center gap-5 text-[10.5px] text-ink-4">
          <span>
            累计{" "}
            <span className="text-ink-3">
              {totalTokens.toLocaleString("en-US")}
            </span>{" "}
            tokens
          </span>
          <span>
            平均{" "}
            <span className="text-ink-3">{avgSpeed.toFixed(1)}</span> tok/s
          </span>
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-[10px] border border-dashed border-line-strong bg-surface-2 px-6 py-16 text-center">
          <div className="flex size-10 items-center justify-center rounded-full border border-line bg-surface text-ink-4">
            <Inbox size={17} strokeWidth={1.7} />
          </div>
          <p className="mt-3.5 text-[13px] font-medium text-ink">没有匹配的记录</p>
          <p className="mt-1 text-[11.5px] text-ink-3">
            换一个状态筛选，或启动一个模型开始新的会话。
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setFilter("all")}
          >
            查看全部记录
          </Button>
        </div>
      ) : (
        <div className="mt-5 border-t border-line">
          <div className="hidden h-[30px] grid-cols-[124px_minmax(0,1.1fr)_minmax(0,1fr)_96px_80px_76px] items-center gap-4 border-b border-line-strong text-[10.5px] text-ink-4 md:grid">
            <span>开始时间</span>
            <span>模型</span>
            <span>备注</span>
            <span className="text-right">吞吐</span>
            <span className="text-right">Tokens</span>
            <span className="text-right">状态</span>
          </div>
          {runs.map((run) => (
            <div
              key={run.id}
              className="group grid grid-cols-1 items-center gap-x-4 gap-y-1.5 border-b border-line py-3 transition-colors hover:bg-hover/50 md:h-[50px] md:grid-cols-[124px_minmax(0,1.1fr)_minmax(0,1fr)_96px_80px_76px] md:gap-y-0 md:py-0"
            >
              <span className="readout flex items-center gap-1.5 text-ink-3">
                <Clock size={12} strokeWidth={1.8} className="text-ink-4 md:hidden" />
                {formatStartedAt(run.startedAt)}
              </span>
              <button
                type="button"
                onClick={() => {
                  const exists = state.models.find((m) => m.id === run.modelId);
                  if (exists) dispatch({ type: "select", id: run.modelId });
                }}
                className="flex min-w-0 items-center gap-1.5 text-left"
              >
                <span className="truncate text-[12px] text-ink-2 group-hover:text-ink">
                  {run.modelName}
                </span>
                <ArrowUpRight
                  size={12}
                  strokeWidth={1.9}
                  className="shrink-0 text-ink-4 opacity-0 transition-opacity group-hover:opacity-100"
                />
              </button>
              <span className="truncate text-[11.5px] text-ink-4">
                {run.note ?? "—"}
              </span>
              <span className="flex items-center gap-2.5 md:justify-end">
                {run.tokensPerSecond > 0 ? (
                  <>
                    <span className="meter-bar hidden w-[46px] shrink-0 md:block">
                      <span
                        style={{
                          width: `${(run.tokensPerSecond / maxSpeed) * 100}%`,
                        }}
                      />
                    </span>
                    <span className="readout shrink-0 text-ink-2">
                      {run.tokensPerSecond.toFixed(1)}
                      <span className="ml-0.5 text-ink-4">tok/s</span>
                    </span>
                  </>
                ) : (
                  <span className="readout shrink-0 text-ink-4">—</span>
                )}
              </span>
              <span className="readout text-ink-3 md:text-right">
                {run.tokens > 0
                  ? run.tokens.toLocaleString("en-US")
                  : "—"}
              </span>
              <span className="md:flex md:justify-end">
                <StatusBadge tone={RUN_STATUS[run.status].tone}>
                  {RUN_STATUS[run.status].label}
                </StatusBadge>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center gap-1.5 text-[11px] text-ink-4">
        <History size={12} strokeWidth={1.8} />
        记录保留最近 30 天，可在设置中调整保留策略。
      </div>
    </div>
  );
}
