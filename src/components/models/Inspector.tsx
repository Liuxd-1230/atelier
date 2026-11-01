import * as Slider from "@radix-ui/react-slider";
import {
  ArrowUpRight,
  ChevronDown,
  Copy,
  FolderOpen,
  Play,
  Square,
  Star,
  X,
  CircleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { KIND_LABEL } from "../../lib/data";
import { cn, formatContext, formatSize, relativeDate } from "../../lib/utils";
import { useApp } from "../../store/AppStore";
import { Button } from "../ui/Button";
import { Hint, Menu, MenuItem, MenuSeparator } from "../ui/Menu";
import { Divider, StatusBadge, Tag } from "../ui/Primitives";
import { Switch } from "../ui/Switch";
import { KindTile, StatusCell } from "./ModelBits";
import { RowMenu } from "./LibraryPage";

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="px-5 py-4">
      <div className="mb-1.5 flex h-5 items-center justify-between">
        <h3 className="section-label">
          <span className="section-tick" aria-hidden />
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function ParamRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex h-[25px] items-center justify-between gap-4">
      <span className="text-[11px] text-ink-4">{label}</span>
      <span
        className={cn(
          "truncate text-right text-[12px] text-ink-2",
          mono && "readout text-[11px]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="py-[7px]">
      <div className="flex items-center justify-between">
        <label className="text-[11.5px] text-ink-2">{label}</label>
        <span className="readout text-[11px] text-ink">
          {value}
          {suffix && <span className="ml-0.5 text-ink-4">{suffix}</span>}
        </span>
      </div>
      <Slider.Root
        className="relative mt-2 flex h-4 w-full touch-none select-none items-center"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
        aria-label={label}
      >
        <Slider.Track className="relative h-[3px] grow rounded-full bg-track">
          <Slider.Range className="absolute h-full rounded-full bg-clay/85" />
        </Slider.Track>
        <Slider.Thumb
          className="block size-[13px] rounded-full border border-line-strong bg-white shadow-[0_1px_2px_rgba(41,40,37,0.18)] transition-shadow hover:shadow-[0_1px_4px_rgba(41,40,37,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
          aria-label={label}
        />
      </Slider.Root>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-[7px]">
      <div className="min-w-0">
        <div className="text-[11.5px] text-ink-2">{label}</div>
        {description && (
          <div className="mt-[1px] text-[10px] leading-[1.45] text-ink-4">
            {description}
          </div>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function pathTail(path: string): string {
  const parts = path.split("\\");
  return parts.length > 2
    ? `…\\${parts.slice(-2).join("\\")}`
    : path;
}

export function Inspector() {
  const { state, dispatch, notify } = useApp();
  const model = state.models.find((m) => m.id === state.selectedId) ?? null;
  const open = state.inspectorOpen && model !== null;
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => {
    setCopied(false);
    setAdvanced(false);
  }, [state.selectedId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch({ type: "closeInspector" });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, dispatch]);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const copyPath = async () => {
    if (!model) return;
    try {
      await navigator.clipboard.writeText(model.file.path);
      setCopied(true);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1600);
      notify("success", "已复制文件路径", model.file.name);
    } catch {
      notify("error", "复制失败", "浏览器未授予剪贴板权限");
    }
  };

  return (
    <>
      {open && (
        <div
          className="inspector-scrim"
          onClick={() => dispatch({ type: "closeInspector" })}
          aria-hidden
        />
      )}
      <aside
        className="inspector shrink-0"
        data-open={open}
        aria-hidden={!open}
        aria-label="模型详情"
      >
        {model && (
          <div className="inspector-inner flex h-full flex-col">
            <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-line px-3">
              <span className="section-label pl-2">模型详情</span>
              <div className="flex items-center gap-0.5">
                <Hint label={model.favorite ? "取消收藏" : "加入收藏"}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "favorite", id: model.id })}
                    className="flex size-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-hover hover:text-ink"
                    aria-label={model.favorite ? "取消收藏" : "加入收藏"}
                  >
                    {model.favorite ? (
                      <Star
                        size={15}
                        strokeWidth={1.8}
                        className="fill-[#c9a227] text-[#c9a227]"
                      />
                    ) : (
                      <Star size={15} strokeWidth={1.8} />
                    )}
                  </button>
                </Hint>
                <Hint label="关闭面板">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "closeInspector" })}
                    className="flex size-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-hover hover:text-ink"
                    aria-label="关闭详情面板"
                  >
                    <X size={15} strokeWidth={1.9} />
                  </button>
                </Hint>
              </div>
            </div>

            <div
              className="anim-panel-content flex-1 overflow-y-auto"
              key={model.id}
            >
              <div className="px-5 pb-5 pt-5">
                <div className="flex items-start gap-3">
                  <KindTile kind={model.kind} />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-serif text-[19px] font-normal leading-[1.3] tracking-[0.006em] text-ink">
                      {model.name}
                    </h2>
                    <p className="mt-[3px] text-[11px] text-ink-4">
                      {model.publisher}
                      <span className="mx-1.5 text-ink-4/50">·</span>
                      {KIND_LABEL[model.kind]}
                    </p>
                  </div>
                </div>

                {/* Spec strip: the three numbers a user scans for first. */}
                <div className="mt-5 grid grid-cols-3">
                  {[
                    {
                      label: "参数量",
                      value: model.params.parameters,
                      unit: "",
                    },
                    {
                      label: "上下文",
                      value: formatContext(model.params.contextLength).replace("K", ""),
                      unit: model.params.contextLength >= 1024 ? "K" : "",
                    },
                    {
                      label: "权重",
                      value: formatSize(model.sizeGB).replace(" GB", "").replace(" MB", ""),
                      unit: formatSize(model.sizeGB).endsWith("MB") ? "MB" : "GB",
                    },
                  ].map((item, i) => (
                    <div
                      key={item.label}
                      className={
                        i > 0
                          ? "border-l border-line pl-3.5"
                          : ""
                      }
                    >
                      <div className="text-[10px] text-ink-4">{item.label}</div>
                      <div className="mt-1.5 flex items-baseline gap-0.5">
                        <span className="readout text-[17px] leading-none text-ink">
                          {item.value}
                        </span>
                        <span className="readout text-[10px] text-ink-4">
                          {item.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hairline mt-5" />

                <div className="mt-3.5 flex items-center gap-2">
                  <StatusCell status={model.status} />
                  <span className="text-ink-4/50">·</span>
                  <span className="readout text-[10.5px] text-ink-3">
                    {model.status === "downloading"
                      ? `已下载 ${Math.round(model.progress * 100)}%`
                      : `${model.file.format} · ${model.params.architecture}`}
                  </span>
                </div>

                {model.status === "error" && model.error && (
                  <div className="mt-3 flex gap-2 rounded-lg border border-[color-mix(in_srgb,var(--color-danger)_26%,var(--color-line))] bg-danger-soft px-2.5 py-2">
                    <CircleAlert
                      size={13}
                      strokeWidth={1.9}
                      className="mt-[1px] shrink-0 text-danger"
                    />
                    <div className="min-w-0">
                      <p className="text-[11.5px] font-medium leading-[1.4] text-ink">
                        上次启动失败
                      </p>
                      <p className="mt-[2px] text-[10.5px] leading-[1.5] text-ink-3">
                        {model.error}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                  {model.status === "running" ? (
                    <Button
                      variant="secondary"
                      size="md"
                      className="flex-1"
                      onClick={() => dispatch({ type: "stop", id: model.id })}
                    >
                      <Square size={12} strokeWidth={2} fill="currentColor" />
                      停止运行
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      className="flex-1"
                      disabled={
                        model.status === "downloading" || model.status === "paused"
                      }
                      onClick={() => dispatch({ type: "start", id: model.id })}
                    >
                      <Play size={12} strokeWidth={2} />
                      {model.status === "downloading"
                        ? `下载中 ${Math.round(model.progress * 100)}%`
                        : model.status === "paused"
                          ? "下载已暂停"
                          : model.status === "error"
                            ? "重试启动"
                            : "启动模型"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() =>
                      notify("info", "已打开对话", `${model.shortName} · 新会话`)
                    }
                  >
                    <ArrowUpRight size={13} strokeWidth={1.9} />
                    对话
                  </Button>
                  <RowMenu model={model} />
                </div>

                <p className="mt-3.5 text-[11.5px] leading-[1.6] text-ink-3">
                  {model.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {model.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              </div>

              <Divider />

              <Section title="参数">
                <div className="mt-0.5">
                  <ParamRow label="参数规模" value={model.params.parameters} mono />
                  <ParamRow label="量化方式" value={model.params.quantization} mono />
                  <ParamRow
                    label="上下文窗口"
                    value={`${formatContext(model.params.contextLength)} tokens`}
                    mono
                  />
                  <ParamRow label="层数" value={model.params.layers} mono />
                  <ParamRow
                    label="嵌入维度"
                    value={model.params.embeddingSize.toLocaleString("en-US")}
                    mono
                  />
                  <ParamRow
                    label="架构"
                    value={model.params.architecture}
                    mono
                  />
                </div>
              </Section>

              <Divider />

              <Section title="文件">
                <div className="mt-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[11.5px] text-ink-2">
                        {model.file.name}
                      </div>
                      <div className="mt-[2px] text-[10.5px] text-ink-4">
                        {model.file.format}
                        <span className="mx-1 text-ink-4/50">·</span>
                        {formatSize(model.file.sizeGB)}
                        <span className="mx-1 text-ink-4/50">·</span>
                        {relativeDate(model.file.updatedAt)}更新
                      </div>
                    </div>
                    <Hint label={copied ? "已复制" : "复制路径"}>
                      <button
                        type="button"
                        onClick={copyPath}
                        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded text-ink-4 transition-colors hover:bg-hover hover:text-ink-2"
                        aria-label="复制文件路径"
                      >
                        {copied ? (
                          <span className="text-[10px] text-ok">✓</span>
                        ) : (
                          <Copy size={12.5} strokeWidth={1.8} />
                        )}
                      </button>
                    </Hint>
                  </div>
                  <div className="tick-rail" aria-hidden />
                  <button
                    type="button"
                    onClick={() =>
                      notify("info", "已在文件管理器中定位", model.file.name)
                    }
                    className="group -mx-1 flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-hover"
                  >
                    <FolderOpen
                      size={12}
                      strokeWidth={1.8}
                      className="shrink-0 text-ink-4"
                    />
                    <span className="readout truncate text-ink-3">
                      {pathTail(model.file.path)}
                    </span>
                  </button>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-ink-4">
                      校验值{" "}
                      <span className="readout text-ink-3">{model.file.sha}</span>
                    </span>
                    <span className="readout text-[10px] text-ink-4">
                      {model.downloadedAt
                        ? `下载于 ${relativeDate(model.downloadedAt)}`
                        : "尚未完成"}
                    </span>
                  </div>
                </div>
              </Section>

              <Divider />

              <Section title="运行设置">
                <div className="mt-1">
                  <SliderRow
                    label="GPU 层数"
                    value={model.settings.gpuLayers}
                    min={0}
                    max={model.params.layers}
                    suffix={`/ ${model.params.layers}`}
                    onChange={(value) =>
                      dispatch({
                        type: "modelSettings",
                        id: model.id,
                        patch: { gpuLayers: value },
                      })
                    }
                  />
                  <SliderRow
                    label="线程数"
                    value={model.settings.threads}
                    min={1}
                    max={32}
                    onChange={(value) =>
                      dispatch({
                        type: "modelSettings",
                        id: model.id,
                        patch: { threads: value },
                      })
                    }
                  />
                  <SliderRow
                    label="温度"
                    value={model.settings.temperature}
                    min={0}
                    max={2}
                    step={0.05}
                    onChange={(value) =>
                      dispatch({
                        type: "modelSettings",
                        id: model.id,
                        patch: { temperature: value },
                      })
                    }
                  />
                </div>
                <div className="mt-1">
                  <ToggleRow
                    label="内存映射"
                    description="直接从磁盘加载权重，降低内存占用"
                    checked={model.settings.mmap}
                    onChange={(value) =>
                      dispatch({
                        type: "modelSettings",
                        id: model.id,
                        patch: { mmap: value },
                      })
                    }
                  />
                  <ToggleRow
                    label="Flash Attention"
                    description="长上下文下减少显存峰值"
                    checked={model.settings.flashAttention}
                    onChange={(value) =>
                      dispatch({
                        type: "modelSettings",
                        id: model.id,
                        patch: { flashAttention: value },
                      })
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setAdvanced((v) => !v)}
                  className="mt-1 flex items-center gap-1 text-[11px] text-ink-3 transition-colors hover:text-ink"
                  aria-expanded={advanced}
                >
                  <ChevronDown
                    size={12}
                    strokeWidth={2}
                    className={cn(
                      "transition-transform duration-150",
                      advanced && "rotate-180",
                    )}
                  />
                  高级选项
                </button>
                {advanced && (
                  <div className="anim-fade-in mt-2 rounded-lg border border-line bg-surface-2 p-2.5">
                    <ParamRow
                      label="上下文窗口"
                      value={`${formatContext(model.settings.contextLength)} tokens`}
                    />
                    <ParamRow
                      label="批大小"
                      value="128"
                    />
                    <ParamRow
                      label="采样"
                      value="top_p 0.95 · top_k 40"
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10.5px] text-ink-4">
                        修改将在下次启动时生效
                      </span>
                      <Menu
                        trigger={
                          <button
                            type="button"
                            className="text-[10.5px] text-ink-3 underline decoration-line-strong underline-offset-2 transition-colors hover:text-ink"
                          >
                            重置
                          </button>
                        }
                      >
                        <MenuItem
                          onSelect={() =>
                            notify("info", "设置已重置", model.shortName)
                          }
                        >
                          恢复默认值
                        </MenuItem>
                        <MenuItem
                          onSelect={() =>
                            notify("info", "已复制配置", "JSON 已写入剪贴板")
                          }
                        >
                          复制为 JSON
                        </MenuItem>
                        <MenuSeparator />
                        <MenuItem
                          onSelect={() =>
                            notify("error", "需要重启引擎", "请先停止模型")
                          }
                        >
                          重新加载配置
                        </MenuItem>
                      </Menu>
                    </div>
                  </div>
                )}
              </Section>

              <div className="px-5 pb-5 pt-1">
                <div className="flex items-center gap-1.5 text-[10.5px] text-ink-4">
                  <StatusBadge tone="neutral">本地</StatusBadge>
                  <span>配置仅保存在此设备</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
