import {
  Download,
  Pause,
  Play,
  Plus,
  Trash2,
  ArrowDownToLine,
  Inbox,
  CircleAlert,
} from "lucide-react";
import { formatSize } from "../../lib/utils";
import { useApp } from "../../store/AppStore";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/Primitives";
import { cn } from "../../lib/utils";

const STATUS_META = {
  downloading: { label: "下载中", tone: "clay" as const, pulse: true },
  paused: { label: "已暂停", tone: "neutral" as const, pulse: false },
  queued: { label: "排队中", tone: "info" as const, pulse: false },
};

export function DownloadsPage() {
  const { state, dispatch, notify } = useApp();

  const active = state.downloads.filter((d) => d.status === "downloading");
  const totalRemaining = state.downloads.reduce(
    (sum, d) => sum + d.sizeGB * (1 - d.progress),
    0,
  );

  return (
    <div className="page page-enter">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">下载管理</h1>
          <p className="page-desc">
            模型权重在后台下载，完成后会自动出现在模型库中。
          </p>
        </div>
        <div className="pb-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => notify("info", "已刷新队列", "下载进度已同步")}
          >
            刷新队列
          </Button>
        </div>
      </div>

      <div className="readout mt-5 flex flex-wrap items-center gap-x-6 gap-y-1 text-[10.5px] text-ink-4">
        <span>
          {active.length > 0
            ? `${active.length} 个任务正在下载`
            : "当前没有进行中的下载"}
        </span>
        <span>剩余 {formatSize(totalRemaining)}</span>
        <span>保存至 {state.settings.cacheDir}</span>
      </div>

      {state.downloads.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="hairline-strong w-[120px]" />
          <div className="mt-6 flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink-4">
            <Inbox size={15} strokeWidth={1.7} />
          </div>
          <p className="mt-4 text-[13.5px] font-medium text-ink">下载队列为空</p>
          <p className="mt-1.5 max-w-[300px] text-[11.5px] leading-[1.6] text-ink-3">
            从模型仓库添加权重后，任务会在这里排队并显示实时进度。
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-5"
            onClick={() =>
              notify("info", "模型仓库", "此 Demo 未接入真实下载源")
            }
          >
            <Plus size={12} strokeWidth={2} />
            添加模型
          </Button>
          <div className="hairline-strong mt-6 w-[120px]" />
        </div>
      ) : (
        <div className="mt-6">
          <div className="border-y border-line">
            {state.downloads.map((task) => {
              const meta = STATUS_META[task.status];
              return (
                <div
                  key={task.modelId}
                  className="flex flex-col gap-3 border-b border-line py-4 last:border-b-0 md:flex-row md:items-center md:gap-5"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="mt-[1px] flex size-8 shrink-0 items-center justify-center rounded-[7px] bg-tile text-ink-3">
                      <ArrowDownToLine size={15} strokeWidth={1.7} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[12.5px] font-medium text-ink">
                          {task.modelName}
                        </span>
                        <StatusBadge tone={meta.tone} pulse={meta.pulse}>
                          {meta.label}
                        </StatusBadge>
                      </div>
                      <div className="mt-[3px] text-[10.5px] text-ink-4">
                        {task.publisher}
                        <span className="mx-1.5 text-ink-4/50">·</span>
                        {formatSize(task.sizeGB)}
                        <span className="mx-1.5 text-ink-4/50">·</span>
                        {task.status === "downloading"
                          ? `${task.speedMBps.toFixed(1)} MB/s`
                          : task.status === "queued"
                            ? "等待当前任务完成"
                            : "已暂停，可随时继续"}
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full items-center gap-4 md:w-[300px] md:shrink-0">
                    <div className="min-w-0 flex-1">
                      <div className="tick-rail" aria-hidden />
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="readout text-[10.5px] text-ink-4">
                          {task.progress > 0
                            ? `${formatSize(task.sizeGB * task.progress)} / ${formatSize(task.sizeGB)}`
                            : `未开始 / ${formatSize(task.sizeGB)}`}
                        </span>
                        <span className="readout text-[11px] text-ink-2">
                          {Math.round(task.progress * 100)}%
                        </span>
                      </div>
                      <div className="meter-bar mt-1.5 h-1">
                        <span
                          className={cn(
                            task.status === "paused"
                              ? "opacity-40"
                              : task.status === "queued"
                                ? "opacity-30"
                                : "",
                          )}
                          style={{ width: `${task.progress * 100}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="readout text-[10px] text-ink-4">
                          {task.status === "downloading"
                            ? `${task.speedMBps.toFixed(1)} MB/s`
                            : task.status === "queued"
                              ? "排队中"
                              : "已暂停"}
                        </span>
                        <span className="readout text-[10px] text-ink-4">
                          {task.etaLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {task.status === "downloading" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            dispatch({ type: "downloadPause", id: task.modelId })
                          }
                        >
                          <Pause size={11} strokeWidth={2} />
                          暂停
                        </Button>
                      )}
                      {task.status === "paused" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            dispatch({
                              type: "downloadResume",
                              id: task.modelId,
                            })
                          }
                        >
                          <Play size={11} strokeWidth={2} />
                          继续
                        </Button>
                      )}
                      {task.status === "queued" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            dispatch({
                              type: "downloadResume",
                              id: task.modelId,
                            })
                          }
                        >
                          优先下载
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          dispatch({
                            type: "downloadCancel",
                            id: task.modelId,
                          })
                        }
                        aria-label={`取消 ${task.modelName} 的下载`}
                      >
                        <Trash2 size={13} strokeWidth={1.8} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-start gap-2 text-[10.5px] leading-[1.5] text-ink-4">
            <CircleAlert size={13} strokeWidth={1.8} className="mt-[1px] shrink-0" />
            <span>
              下载进度每秒更新一次；此 Demo 使用本地模拟数据，不会访问网络。
            </span>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-2">
        <p className="text-[10.5px] leading-[1.6] text-ink-4">
          同一时间只下载一个任务，以保持磁盘读写稳定。暂停的任务会保留已下载的分片，
          继续时从断点续传。
        </p>
        <div className="flex items-center gap-1.5 text-[10.5px] text-ink-4">
          <Download size={12} strokeWidth={1.8} />
          已完成的模型可在
          <button
            type="button"
            onClick={() => dispatch({ type: "navigate", page: "library" })}
            className="link-underline"
          >
            模型库
          </button>
          中查看。
        </div>
      </div>
    </div>
  );
}
