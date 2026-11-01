import {
  ArrowUpRight,
  ChevronRight,
  Play,
  Square,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { KIND_LABEL } from "../../lib/data";
import { formatSize, relativeDate } from "../../lib/utils";
import { useApp } from "../../store/AppStore";
import { Button } from "../ui/Button";
import { StatusCell } from "../models/ModelBits";

/* --------------------------------------------------------------------------
   Instrument: live throughput
   -------------------------------------------------------------------------- */

const GRAPH_W = 268;
const GRAPH_H = 76;
const WINDOW = 60;

function ThroughputGraph({
  history,
  ceiling,
}: {
  history: number[];
  ceiling: number;
}) {
  const pad = history.length >= WINDOW ? history.slice(-WINDOW) : history;
  const points = pad.map((value, i) => {
    const x = pad.length === 1 ? GRAPH_W : (i / (pad.length - 1)) * GRAPH_W;
    const y = GRAPH_H - Math.min(1, value / ceiling) * GRAPH_H;
    return [x, y] as const;
  });
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area =
    points.length > 1
      ? `0,${GRAPH_H} ${line} ${GRAPH_W},${GRAPH_H}`
      : "";
  const last = points[points.length - 1];

  return (
    <svg
      width="100%"
      height={GRAPH_H}
      viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`}
      preserveAspectRatio="none"
      aria-hidden
      className="overflow-visible"
    >
      {/* Graduations: quarter steps, so the reading has a scale to sit against. */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1="0"
          x2={GRAPH_W}
          y1={GRAPH_H * f}
          y2={GRAPH_H * f}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-ink-4/25"
        />
      ))}
      <line
        x1="0"
        x2={GRAPH_W}
        y1={GRAPH_H}
        y2={GRAPH_H}
        stroke="currentColor"
        strokeWidth="0.75"
        className="text-ink-4/45"
      />
      {area && (
        <polygon
          points={area}
          fill="var(--color-clay)"
          opacity="0.07"
        />
      )}
      {points.length > 1 && (
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-clay)"
          strokeWidth="1.25"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {last && (
        <>
          <line
            x1={last[0]}
            x2={last[0]}
            y1="0"
            y2={GRAPH_H}
            stroke="var(--color-clay)"
            strokeWidth="0.75"
            opacity="0.4"
          />
          <circle cx={last[0]} cy={last[1]} r="2" fill="var(--color-clay)" />
        </>
      )}
    </svg>
  );
}

function ElapsedClock({ since }: { since: string }) {
  const [label, setLabel] = useState("00:00:00");

  useEffect(() => {
    const tick = () => {
      const seconds = Math.max(
        0,
        Math.floor((Date.now() - new Date(since).getTime()) / 1000),
      );
      const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
      const s = String(seconds % 60).padStart(2, "0");
      setLabel(`${h}:${m}:${s}`);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [since]);

  return <span className="readout text-[12px] text-ink-2">{label}</span>;
}

function VramMeter({ usedGB, totalGB }: { usedGB: number; totalGB: number }) {
  const pct = Math.min(100, (usedGB / totalGB) * 100);
  return (
    <div>
      <div className="tick-rail" aria-hidden />
      <div className="mt-1 flex items-center gap-2.5">
        <div className="meter-bar meter-bar-clay flex-1">
          <span style={{ width: `${pct}%` }} />
        </div>
        <span className="readout shrink-0 text-[11px] text-ink-3">
          {usedGB.toFixed(1)} / {totalGB.toFixed(1)} GB
        </span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Page
   -------------------------------------------------------------------------- */

function RowLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group -mx-2 flex w-full items-center gap-3 rounded-md px-2 py-[11px] text-left transition-colors hover:bg-hover"
    >
      {children}
    </button>
  );
}

export function HomePage() {
  const { state, dispatch } = useApp();
  const running = state.models.find((m) => m.status === "running");
  const recentRuns = state.runs.slice(0, 4);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return "夜深了";
    if (hour < 12) return "早上好";
    if (hour < 18) return "下午好";
    return "晚上好";
  }, []);

  const dateLine = useMemo(() => {
    const d = new Date();
    const week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
    return `${d.getMonth() + 1}月${d.getDate()}日 · 星期${week}`;
  }, []);

  // Throughput history for the running session. The baseline sits near the
  // model's rated speed, so the line reads as a real measurement drifting
  // around a centre rather than random noise.
  const baseline = running?.kind === "embedding" ? 0 : 38.4;
  const [history, setHistory] = useState<number[]>(() =>
    Array.from({ length: 18 }, (_, i) =>
      i === 17 ? baseline : baseline * (0.86 + Math.random() * 0.2),
    ),
  );
  const seed = useRef(1);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      seed.current = (seed.current * 1103515245 + 12345) % 2147483648;
      const noise = (seed.current / 2147483648 - 0.5) * 0.22;
      setHistory((prev) => [...prev.slice(-WINDOW + 1), baseline * (1 + noise)]);
    }, 1400);
    return () => window.clearInterval(timer);
  }, [running, baseline]);

  const ceiling = Math.max(48, ...history) * 1.15;
  const current = history[history.length - 1] ?? 0;

  return (
    <div className="page page-enter">
      {/* ------------------------------------------------------------------
          Asymmetric composition: a wide editorial column on the left, a
          narrower instrument column on the right that starts lower. The
          instrument column is second in the DOM so stacked viewports read
          greeting → live session → history.
          ------------------------------------------------------------------ */}
      <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1.42fr)_minmax(300px,0.85fr)] lg:grid-rows-[auto_1fr] lg:gap-y-0">
        <div className="lg:col-start-1 lg:row-start-1">
          <div className="flex items-center gap-3">
            <span className="rule-lead" aria-hidden />
            <span className="readout text-[10.5px] text-ink-4">{dateLine}</span>
          </div>

          <h1 className="display-hero mt-6">
            {greeting}，
            <span className="display-hero-indent">林一舟</span>
          </h1>

          <p className="display-sub mt-7 max-w-[420px]">
            {running ? (
              <>
                <span className="font-medium text-ink">{running.shortName}</span>
                {" "}正在运行，随时可以开始新的对话。
              </>
            ) : (
              "引擎当前空闲，选择一个模型开始今天的工作。"
            )}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            <Button
              variant="primary"
              size="lg"
              onClick={() => dispatch({ type: "navigate", page: "library" })}
            >
              浏览模型库
            </Button>
            {running ? (
              <Button
                variant="outline"
                size="lg"
                onClick={() => dispatch({ type: "stop", id: running.id })}
              >
                <Square size={11} strokeWidth={2} fill="currentColor" />
                停止运行
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={() =>
                  state.models[0] &&
                  dispatch({ type: "start", id: state.models[0].id })
                }
              >
                <Play size={11} strokeWidth={2} />
                启动上次模型
              </Button>
            )}
          </div>
        </div>

        {/* Right column: the instrument. Starts lower to break the baseline. */}
        <div className="lg:col-start-2 lg:row-start-1 lg:row-end-3 lg:pt-[86px]">
          <div className="instrument overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3.5">
              <span className="section-label">当前会话</span>
              {running ? (
                <StatusCell status="running" />
              ) : (
                <span className="flex items-center gap-1.5 text-[11.5px] leading-none text-ink-3">
                  <span className="size-[6px] rounded-full bg-ink-4" />
                  待机
                </span>
              )}
            </div>

            {running ? (
              <>
                <div className="px-4 pt-3.5">
                  <div className="truncate text-[14px] font-medium text-ink">
                    {running.shortName}
                  </div>
                  <div className="mt-[3px] text-[11px] text-ink-4">
                    {running.publisher} · {running.params.quantization} ·{" "}
                    {formatSize(running.sizeGB)}
                  </div>
                </div>

                <div className="px-4 pb-4 pt-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="readout-lg">{current.toFixed(1)}</div>
                      <div className="mt-1.5 text-[10.5px] text-ink-4">
                        tokens / 秒
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10.5px] text-ink-4">已运行</div>
                      <div className="mt-1">
                        <ElapsedClock since={running.startedAt ?? new Date().toISOString()} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-ink-3">
                    <ThroughputGraph history={history} ceiling={ceiling} />
                  </div>
                  <div className="tick-rail mt-[-1px]" aria-hidden />
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-ink-4">
                    <span className="readout">60 秒前</span>
                    <span className="readout">峰值 {Math.round(ceiling)}</span>
                    <span className="readout">现在</span>
                  </div>
                </div>

                <div className="hairline" />

                <div className="px-4 py-4">
                  <div className="mb-2">
                    <span className="text-[10.5px] text-ink-4">显存占用</span>
                  </div>
                  <VramMeter
                    usedGB={Math.round((running.sizeGB / 1.4) * 10) / 10}
                    totalGB={16}
                  />
                  <div className="mt-3 flex items-center justify-between text-[10.5px] text-ink-4">
                    <span>
                      GPU 层数{" "}
                      <span className="readout text-ink-3">
                        {running.settings.gpuLayers}/{running.params.layers}
                      </span>
                    </span>
                    <span>
                      上下文{" "}
                      <span className="readout text-ink-3">
                        {Math.round(running.settings.contextLength / 1024)}K
                      </span>
                    </span>
                  </div>
                </div>

                <div className="hairline" />

                <button
                  type="button"
                  onClick={() => dispatch({ type: "select", id: running.id })}
                  className="group flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-hover/60"
                >
                  <span className="text-[11.5px] text-ink-2">查看会话详情</span>
                  <ChevronRight
                    size={13}
                    strokeWidth={1.9}
                    className="text-ink-4 transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                </button>
              </>
            ) : (
              <div className="px-4 pb-5 pt-4">
                <div className="display-sub text-ink-3">引擎空闲</div>
                <p className="mt-2 text-[11.5px] leading-[1.6] text-ink-4">
                  显存已全部释放。启动模型后，这里会显示实时吞吐与占用。
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() =>
                    state.models[0] &&
                    dispatch({ type: "start", id: state.models[0].id })
                  }
                >
                  <Play size={11} strokeWidth={2} />
                  启动模型
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Recent models — an editorial ledger, not a card grid. Its own grid
            item: under the hero at lg, after the instrument column in DOM so
            stacked viewports read status before history. */}
        <div className="lg:col-start-1 lg:row-start-2">
          <div className="hairline-strong lg:mt-11" />

          <div className="mt-1">
            <div className="flex items-baseline justify-between py-3.5">
              <h2 className="text-[12.5px] font-medium text-ink">最近使用</h2>
              <button
                type="button"
                onClick={() => dispatch({ type: "navigate", page: "library" })}
                className="link-underline text-[11.5px]"
              >
                全部 {state.models.length} 个模型
              </button>
            </div>
            <div className="hairline" />
            {state.models.slice(0, 4).map((model) => (
              <div key={model.id}>
                <RowLink onClick={() => dispatch({ type: "select", id: model.id })}>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[12.5px] text-ink">
                        {model.shortName}
                      </span>
                      {model.favorite && (
                        <Star
                          size={9}
                          strokeWidth={2}
                          className="shrink-0 fill-clay text-clay"
                        />
                      )}
                    </span>
                    <span className="mt-[2px] block truncate text-[10.5px] text-ink-4">
                      {model.publisher} · {model.params.parameters} ·{" "}
                      {KIND_LABEL[model.kind]} · {formatSize(model.sizeGB)}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-4">
                    {relativeDate(model.updatedAt)}
                  </span>
                  <ArrowUpRight
                    size={13}
                    strokeWidth={1.8}
                    className="shrink-0 text-ink-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  />
                </RowLink>
                <div className="hairline" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent runs, full width below the fold line of the composition. */}
      <div className="mt-14">
        <div className="hairline-strong" />
        <div className="flex items-baseline justify-between py-3.5">
          <h2 className="text-[12.5px] font-medium text-ink">最近运行</h2>
          <button
            type="button"
            onClick={() => dispatch({ type: "navigate", page: "runs" })}
            className="link-underline flex items-center gap-1 text-[11.5px]"
          >
            运行记录
            <ChevronRight size={12} strokeWidth={2} />
          </button>
        </div>
        <div className="hairline" />
        {recentRuns.map((run) => (
          <div key={run.id} className="flex items-center gap-4 py-[11px]">
            <span className="readout w-[74px] shrink-0 text-[10.5px] text-ink-4">
              {run.startedAt.slice(5, 10).replace("-", "/")}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-2">
              {run.modelName}
            </span>
            <span className="hidden w-[130px] shrink-0 truncate text-[11px] text-ink-4 sm:block">
              {run.note}
            </span>
            <span className="readout w-[76px] shrink-0 text-right text-[11px] text-ink-3">
              {run.tokensPerSecond > 0 ? `${run.tokensPerSecond} tok/s` : "—"}
            </span>
            <span className="w-[64px] shrink-0 text-right text-[11px] text-ink-4">
              {run.durationLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
