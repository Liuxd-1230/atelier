import {
  ArrowUpDown,
  Check,
  Download,
  LayoutGrid,
  LayoutList,
  Pause,
  Play,
  Plus,
  Search,
  SlidersHorizontal,
  Square,
  Trash2,
  X,
  MoreHorizontal,
  Copy,
  FolderOpen,
  RefreshCw,
  Star,
  StarOff,
  CircleAlert,
} from "lucide-react";
import { useMemo } from "react";
import { KIND_LABEL, STATUS_LABEL } from "../../lib/data";
import type { Model, ModelKind, ModelStatus } from "../../lib/types";
import { cn, formatContext, formatSize, relativeDate } from "../../lib/utils";
import { useApp, type SortKey, type ViewMode } from "../../store/AppStore";
import { Button } from "../ui/Button";
import { Hint, Menu, MenuItem, MenuLabel, MenuSeparator } from "../ui/Menu";
import { KindTile, ModelStatusCell } from "./ModelBits";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "最近更新" },
  { value: "name", label: "名称" },
  { value: "size", label: "文件大小" },
  { value: "status", label: "状态" },
];

const STATUS_ORDER: Record<ModelStatus, number> = {
  running: 0,
  downloading: 1,
  paused: 2,
  error: 3,
  ready: 4,
};

const KIND_FILTERS: { value: ModelKind | "all"; label: string }[] = [
  { value: "all", label: "全部类型" },
  { value: "chat", label: "对话" },
  { value: "vision", label: "多模态" },
  { value: "code", label: "代码" },
  { value: "embedding", label: "嵌入" },
];

const STATUS_FILTERS: { value: ModelStatus | "all"; label: string }[] = [
  { value: "all", label: "全部状态" },
  { value: "ready", label: "就绪" },
  { value: "running", label: "运行中" },
  { value: "downloading", label: "下载中" },
  { value: "paused", label: "已暂停" },
  { value: "error", label: "需处理" },
];

function filterAndSort(
  models: Model[],
  query: string,
  kind: ModelKind | "all",
  status: ModelStatus | "all",
  sort: SortKey,
): Model[] {
  const q = query.trim().toLowerCase();
  const filtered = models.filter((m) => {
    if (kind !== "all" && m.kind !== kind) return false;
    if (status !== "all" && m.status !== status) return false;
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.publisher.toLowerCase().includes(q) ||
      m.shortName.toLowerCase().includes(q) ||
      m.params.quantization.toLowerCase().includes(q) ||
      m.params.parameters.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return [...filtered].sort((a, b) => {
    switch (sort) {
      case "name":
        return a.shortName.localeCompare(b.shortName, "zh-Hans-CN");
      case "size":
        return b.sizeGB - a.sizeGB;
      case "status":
        return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      default:
        return b.updatedAt.localeCompare(a.updatedAt);
    }
  });
}

function RowActions({ model }: { model: Model }) {
  const { dispatch } = useApp();
  const running = model.status === "running";
  const blocked = model.status === "downloading" || model.status === "paused";

  return (
    <div className="row-actions flex items-center justify-end gap-0.5">
      {!blocked && (
        <Hint label={running ? "停止运行" : "启动模型"}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: running ? "stop" : "start", id: model.id });
            }}
            className={cn(
              "flex h-[26px] shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-1.5 text-[11.5px] transition-colors",
              running
                ? "text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] hover:text-danger"
                : "text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)] hover:text-ink",
            )}
          >
            {running ? (
              <Square size={10} strokeWidth={2.2} fill="currentColor" />
            ) : (
              <Play size={11} strokeWidth={2.2} />
            )}
            <span className="row-action-label">
              {running ? "停止" : "启动"}
            </span>
          </button>
        </Hint>
      )}
      {blocked && (
        <span className="whitespace-nowrap pr-1 text-[11px] text-ink-4">
          {model.status === "downloading" ? "下载中" : "等待下载"}
        </span>
      )}
      <RowMenu model={model} />
    </div>
  );
}

export function RowMenu({ model }: { model: Model }) {
  const { dispatch, notify } = useApp();

  return (
    <Menu
      trigger={
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="flex size-[26px] items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)] hover:text-ink"
          aria-label={`${model.shortName} 的更多操作`}
        >
          <MoreHorizontal size={15} strokeWidth={1.9} />
        </button>
      }
    >
      <MenuItem
        icon={model.favorite ? StarOff : Star}
        onSelect={() => dispatch({ type: "favorite", id: model.id })}
      >
        {model.favorite ? "取消收藏" : "加入收藏"}
      </MenuItem>
      <MenuItem
        icon={Copy}
        onSelect={() =>
          notify("success", "已复制模型标识", model.id)
        }
      >
        复制模型标识
      </MenuItem>
      <MenuItem
        icon={FolderOpen}
        onSelect={() =>
          notify("info", "已在文件管理器中定位", model.file.name)
        }
      >
        在文件夹中显示
      </MenuItem>
      <MenuItem
        icon={RefreshCw}
        onSelect={() =>
          notify(
            "success",
            "已检查更新",
            `${model.shortName} 已是最新版本`,
          )
        }
      >
        检查更新
      </MenuItem>
      <MenuSeparator />
      <MenuItem
        icon={Trash2}
        danger
        onSelect={() => dispatch({ type: "removeTarget", id: model.id })}
      >
        移出工作台
      </MenuItem>
    </Menu>
  );
}

const SORT_COLUMN: Record<SortKey, string | null> = {
  recent: "更新",
  name: "模型",
  size: "大小",
  status: "状态",
};

function ListHeader() {
  const { state } = useApp();
  const active = SORT_COLUMN[state.sort];
  const mark = (label: string) => (
    <span className="whitespace-nowrap">
      {label}
      {active === label && <span className="sort-marker" aria-hidden />}
    </span>
  );

  return (
    <div className="model-grid h-[30px] border-b border-line-strong text-[10.5px] text-ink-4">
      <span className={active === "模型" ? "text-ink-3" : undefined}>
        {mark("模型")}
      </span>
      <span className="col-kind">{mark("类型")}</span>
      <span className="col-quant">{mark("量化")}</span>
      <span className="col-ctx text-right">{mark("上下文")}</span>
      <span className="col-size text-right">{mark("大小")}</span>
      <span className="col-last">{mark("状态")}</span>
      <span className="col-updated text-right">{mark("更新")}</span>
      <span className="text-right">
        <span className="sr-only">操作</span>
      </span>
    </div>
  );
}

function ListRow({ model }: { model: Model }) {
  const { state, dispatch } = useApp();
  const selected = state.selectedId === model.id && state.inspectorOpen;

  return (
    <div
      role="button"
      tabIndex={0}
      className="model-grid model-row group"
      data-selected={selected}
      onClick={() => dispatch({ type: "select", id: model.id })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          dispatch({ type: "select", id: model.id });
        }
      }}
      aria-label={`${model.name}，${STATUS_LABEL[model.status]}，${formatSize(model.sizeGB)}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <KindTile kind={model.kind} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="row-name row-name-link truncate text-[12.5px] leading-[1.35] text-ink">
              {model.name}
            </span>
            {model.favorite && (
              <Star
                size={11}
                strokeWidth={1.8}
                className="shrink-0 fill-[#c9a227] text-[#c9a227]"
                aria-label="已收藏"
              />
            )}
          </div>
          <div className="row-sub mt-[2px] flex items-center gap-1.5 truncate text-[10.5px]">
            <span className="truncate">{model.publisher}</span>
            <span className="text-ink-4/60">·</span>
            <span className="mono shrink-0 text-[10.5px]">
              {model.params.parameters}
            </span>
            <span className="text-ink-4/60">·</span>
            <span className="shrink-0">{model.params.quantization}</span>
          </div>
        </div>
      </div>

      <span className="col-kind truncate text-[11.5px] text-ink-3">
        {KIND_LABEL[model.kind]}
      </span>
      <span className="col-quant mono truncate text-[10.5px] text-ink-3">
        {model.params.quantization}
      </span>
      <span className="col-ctx text-right text-[11.5px] tabular-nums text-ink-3">
        {formatContext(model.params.contextLength)}
      </span>
      <span className="col-size text-right text-[11.5px] tabular-nums text-ink-2">
        {formatSize(model.sizeGB)}
      </span>
      <span className="col-last min-w-0">
        <ModelStatusCell model={model} />
      </span>
      <span className="col-updated text-right text-[11.5px] text-ink-4">
        {relativeDate(model.updatedAt)}
      </span>
      <div className="flex justify-end">
        <RowActions model={model} />
      </div>
    </div>
  );
}

function GridCard({ model }: { model: Model }) {
  const { state, dispatch } = useApp();
  const selected = state.selectedId === model.id && state.inspectorOpen;

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "select", id: model.id })}
      className="grid-card"
      data-selected={selected}
    >
      <div className="flex items-start justify-between gap-2">
        <KindTile kind={model.kind} />
        <span className="mt-0.5">
          <ModelStatusCell model={model} />
        </span>
      </div>
      <div className="mt-3 truncate text-[12.5px] font-medium text-ink">
        {model.shortName}
      </div>
      <div className="mt-[2px] truncate text-[10.5px] text-ink-4">
        {model.publisher} · {model.params.parameters}
      </div>
      <div className="mt-3.5 flex items-center justify-between border-t border-line pt-2.5">
        <span className="readout text-ink-3">{model.params.quantization}</span>
        <span className="readout text-ink-3">{formatSize(model.sizeGB)}</span>
      </div>
    </button>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  const { state } = useApp();
  const hasFilters =
    state.query.trim() !== "" ||
    state.kindFilter !== "all" ||
    state.statusFilter !== "all";

  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex size-10 items-center justify-center rounded-full border border-line bg-surface-2 text-ink-4">
        {hasFilters ? (
          <Search size={17} strokeWidth={1.7} />
        ) : (
          <CircleAlert size={17} strokeWidth={1.7} />
        )}
      </div>
      <p className="mt-4 text-[13.5px] font-medium text-ink">
        {hasFilters ? "没有匹配的模型" : "模型库是空的"}
      </p>
      <p className="mt-1.5 max-w-[300px] text-[11.5px] leading-[1.6] text-ink-3">
        {hasFilters
          ? "试着缩短关键词，或放宽类型与状态筛选。"
          : "导入本地模型文件，或从下载管理中添加新的权重。"}
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>
        {hasFilters ? "清除筛选" : "导入模型"}
      </Button>
    </div>
  );
}

export function LibraryPage() {
  const { state, dispatch, notify, refresh } = useApp();

  const visible = useMemo(
    () =>
      filterAndSort(
        state.models,
        state.query,
        state.kindFilter,
        state.statusFilter,
        state.sort,
      ),
    [state.models, state.query, state.kindFilter, state.statusFilter, state.sort],
  );

  const counts = useMemo(
    () => ({
      total: state.models.length,
      running: state.models.filter((m) => m.status === "running").length,
      downloading: state.models.filter((m) => m.status === "downloading").length,
    }),
    [state.models],
  );

  const hasFilters =
    state.query.trim() !== "" ||
    state.kindFilter !== "all" ||
    state.statusFilter !== "all";

  const clearFilters = () => {
    dispatch({ type: "query", value: "" });
    dispatch({ type: "kindFilter", value: "all" });
    dispatch({ type: "statusFilter", value: "all" });
  };

  return (
    <div className="page page-enter">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">
            模型库
            <span className="page-title-count">{state.models.length}</span>
          </h1>
          <p className="page-desc">
            管理工作区中的本地权重，查看参数并直接启动推理。
          </p>
        </div>
        <div className="flex items-center gap-2 pb-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refresh();
              notify("info", "正在重新扫描", "已读取模型目录");
            }}
          >
            <RefreshCw size={13} strokeWidth={1.9} />
            重新扫描
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              dispatch({ type: "navigate", page: "downloads" });
              notify("info", "前往下载管理", "可以从模型仓库添加新权重");
            }}
          >
            <Plus size={14} strokeWidth={2} />
            添加模型
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-[320px]">
          <Search
            size={14}
            strokeWidth={1.9}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-4"
          />
          <input
            type="search"
            value={state.query}
            onChange={(e) => dispatch({ type: "query", value: e.target.value })}
            placeholder="搜索模型、发布者或量化方式"
            aria-label="搜索模型"
            className="input h-[32px] pl-[30px] pr-8 text-[12px]"
          />
          {state.query && (
            <button
              type="button"
              onClick={() => dispatch({ type: "query", value: "" })}
              className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-ink-4 hover:bg-hover hover:text-ink-2"
              aria-label="清除搜索"
            >
              <X size={12} strokeWidth={2} />
            </button>
          )}
        </div>

        <Menu
          align="start"
          trigger={
            <Button
              variant="outline"
              size="md"
              className={cn(
                "h-[32px] font-normal",
                state.kindFilter !== "all" && "border-line-strong text-ink",
              )}
            >
              <SlidersHorizontal size={13} strokeWidth={1.9} />
              {KIND_FILTERS.find((f) => f.value === state.kindFilter)?.label}
            </Button>
          }
        >
          <MenuLabel>模型类型</MenuLabel>
          {KIND_FILTERS.map((filter) => (
            <MenuItem
              key={filter.value}
              onSelect={() => dispatch({ type: "kindFilter", value: filter.value })}
            >
              <span className="flex w-full items-center justify-between">
                {filter.label}
                {state.kindFilter === filter.value && (
                  <Check size={13} strokeWidth={2} className="text-clay" />
                )}
              </span>
            </MenuItem>
          ))}
        </Menu>

        <Menu
          align="start"
          trigger={
            <Button
              variant="outline"
              size="md"
              className={cn(
                "h-[32px] font-normal",
                state.statusFilter !== "all" && "border-line-strong text-ink",
              )}
            >
              {STATUS_FILTERS.find((f) => f.value === state.statusFilter)?.label}
            </Button>
          }
        >
          <MenuLabel>状态</MenuLabel>
          {STATUS_FILTERS.map((filter) => (
            <MenuItem
              key={filter.value}
              onSelect={() =>
                dispatch({ type: "statusFilter", value: filter.value })
              }
            >
              <span className="flex w-full items-center justify-between">
                {filter.label}
                {state.statusFilter === filter.value && (
                  <Check size={13} strokeWidth={2} className="text-clay" />
                )}
              </span>
            </MenuItem>
          ))}
        </Menu>

        <Menu
          align="start"
          trigger={
            <Button
              variant="outline"
              size="md"
              className="h-[32px] font-normal text-ink-2"
            >
              <ArrowUpDown size={13} strokeWidth={1.9} />
              {SORTS.find((s) => s.value === state.sort)?.label}
            </Button>
          }
        >
          <MenuLabel>排序方式</MenuLabel>
          {SORTS.map((sort) => (
            <MenuItem
              key={sort.value}
              onSelect={() => dispatch({ type: "sort", value: sort.value })}
            >
              <span className="flex w-full items-center justify-between">
                {sort.label}
                {state.sort === sort.value && (
                  <Check size={13} strokeWidth={2} className="text-clay" />
                )}
              </span>
            </MenuItem>
          ))}
        </Menu>

        <div className="ml-auto flex items-center gap-2">
          <div className="control-group flex items-center">
            {(
              [
                { value: "list", icon: LayoutList, label: "列表视图" },
                { value: "grid", icon: LayoutGrid, label: "网格视图" },
              ] as const
            ).map((option) => (
              <Hint key={option.value} label={option.label}>
                <button
                  type="button"
                  onClick={() =>
                    dispatch({ type: "view", value: option.value as ViewMode })
                  }
                  aria-label={option.label}
                  aria-pressed={state.view === option.value}
                  className={cn(
                    "flex size-[26px] items-center justify-center rounded-[6px] transition-colors",
                    state.view === option.value
                      ? "bg-surface text-ink shadow-[0_1px_2px_rgba(41,40,37,0.08)]"
                      : "text-ink-4 hover:text-ink-2",
                  )}
                >
                  <option.icon size={14} strokeWidth={1.8} />
                </button>
              </Hint>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[11.5px] text-ink-4">
        <span className="readout">
          {hasFilters ? (
            <>
              {visible.length} / {state.models.length} 个模型
              <span className="mx-2 text-ink-4/50">·</span>
              <button
                type="button"
                onClick={clearFilters}
                className="link-underline"
              >
                清除筛选
              </button>
            </>
          ) : (
            <>
              {counts.total} 个模型
              <span className="mx-2 text-ink-4/50">·</span>
              {counts.running} 运行中
              <span className="mx-2 text-ink-4/50">·</span>
              {counts.downloading} 下载中
            </>
          )}
        </span>
      </div>

      <div className="model-list mt-1">
        {state.loading ? (
          <div className="pt-1">
            <div className="model-grid h-8 border-b border-line" />
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="model-grid h-[60px]">
                <div className="flex items-center gap-2.5">
                  <div className="skeleton size-[32px] rounded-[7px]" />
                  <div className="flex-1">
                    <div className="skeleton h-[11px] w-[46%]" />
                    <div className="skeleton mt-[7px] h-[9px] w-[64%]" />
                  </div>
                </div>
                <div className="col-kind skeleton h-[9px] w-[36px]" />
                <div className="col-quant skeleton h-[9px] w-[42px]" />
                <div className="col-ctx skeleton ml-auto h-[9px] w-[30px]" />
                <div className="col-size skeleton ml-auto h-[9px] w-[40px]" />
                <div className="col-last skeleton h-[9px] w-[48px]" />
                <div className="col-updated skeleton ml-auto h-[9px] w-[44px]" />
                <div />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            onClear={
              hasFilters
                ? clearFilters
                : () => dispatch({ type: "navigate", page: "downloads" })
            }
          />
        ) : state.view === "list" ? (
          <>
            <ListHeader />
            <div className="pt-0.5">
              {visible.map((model) => (
                <ListRow key={model.id} model={model} />
              ))}
            </div>
          </>
        ) : (
          <div className="model-grid-cards pt-2">
            {visible.map((model) => (
              <GridCard key={model.id} model={model} />
            ))}
          </div>
        )}
      </div>

      {visible.length > 0 && !state.loading && (
        <div className="mt-5 flex items-center justify-between border-t border-line pt-3 text-[11px] text-ink-4">
          <span>
            显示 {visible.length} / {state.models.length}
          </span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Download size={11} strokeWidth={1.9} />
              下载在后台继续
            </span>
            <span className="flex items-center gap-1">
              <Pause size={11} strokeWidth={1.9} />
              空闲模型会释放显存
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
