import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowUp,
  ArrowDown,
  Boxes,
  CornerDownLeft,
  Download,
  History,
  House,
  Images,
  Palette,
  Search,
  Settings2,
  Star,
  Cpu,
  Sun,
  Moon,
  Rows3,
  PanelLeftClose,
  Play,
  Square,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { KIND_LABEL } from "../../lib/data";
import type { PageId } from "../../lib/types";
import { formatSize, modLabel } from "../../lib/utils";
import { useApp } from "../../store/AppStore";
import { KindTile, StatusCell } from "../models/ModelBits";

interface Command {
  id: string;
  group: "模型" | "页面" | "操作";
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  kind?: "model";
  modelId?: string;
  keywords?: string;
  shortcut?: string;
  run: () => void;
}

const PAGE_COMMANDS: { id: PageId; label: string; icon: LucideIcon; hint: string }[] = [
  { id: "gallery", label: "展览主页", icon: Images, hint: "全部项目设计风格一览" },
  { id: "home", label: "首页", icon: House, hint: "概览与最近活动" },
  { id: "library", label: "模型库", icon: Boxes, hint: "浏览全部本地模型" },
  { id: "downloads", label: "下载管理", icon: Download, hint: "进行中与排队任务" },
  { id: "runs", label: "运行记录", icon: History, hint: "会话与吞吐历史" },
  { id: "settings", label: "设置", icon: Settings2, hint: "偏好与引擎参数" },
  { id: "design", label: "设计一览", icon: Palette, hint: "前端构建审美标本" },
  { id: "nvidia", label: "RTX PRO 6000 特辑", icon: Cpu, hint: "杂志感产品介绍" },
];

export function CommandPalette() {
  const { state, dispatch, notify } = useApp();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const open = state.paletteOpen;

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const modelCommands: Command[] = state.models.map((model) => ({
      id: `model-${model.id}`,
      group: "模型",
      title: model.name,
      subtitle: `${model.publisher} · ${KIND_LABEL[model.kind]} · ${formatSize(model.sizeGB)}`,
      kind: "model",
      modelId: model.id,
      keywords: `${model.shortName} ${model.publisher} ${model.params.quantization} ${model.tags.join(" ")}`,
      run: () => {
        dispatch({ type: "navigate", page: "library" });
        dispatch({ type: "select", id: model.id });
      },
    }));

    const pageCommands: Command[] = PAGE_COMMANDS.map((page) => ({
      id: `page-${page.id}`,
      group: "页面",
      title: page.label,
      subtitle: page.hint,
      icon: page.icon,
      keywords: page.hint,
      run: () => dispatch({ type: "navigate", page: page.id }),
    }));

    const running = state.models.find((m) => m.status === "running");
    const actionCommands: Command[] = [
      running
        ? {
            id: "action-stop",
            group: "操作",
            title: "停止当前模型",
            subtitle: running.shortName,
            icon: Square,
            keywords: "stop 停止 释放 显存",
            run: () => dispatch({ type: "stop", id: running.id }),
          }
        : {
            id: "action-start",
            group: "操作",
            title: "启动最近使用的模型",
            subtitle: state.models[0]?.shortName,
            icon: Play,
            keywords: "start 启动 运行",
            run: () =>
              state.models[0] &&
              dispatch({ type: "start", id: state.models[0].id }),
          },
      {
        id: "action-theme",
        group: "操作",
        title: state.settings.theme === "dark" ? "切换到浅色主题" : "切换到深色主题",
        icon: state.settings.theme === "dark" ? Sun : Moon,
        keywords: "theme dark light 主题 深色 浅色",
        run: () =>
          dispatch({
            type: "settings",
            patch: { theme: state.settings.theme === "dark" ? "light" : "dark" },
          }),
      },
      {
        id: "action-density",
        group: "操作",
        title:
          state.settings.density === "compact"
            ? "切换到标准密度"
            : "切换到紧凑密度",
        icon: Rows3,
        keywords: "density compact 密度 紧凑",
        run: () =>
          dispatch({
            type: "settings",
            patch: {
              density:
                state.settings.density === "compact" ? "comfortable" : "compact",
            },
          }),
      },
      {
        id: "action-sidebar",
        group: "操作",
        title: state.settings.sidebarCollapsed ? "展开侧栏" : "折叠侧栏",
        icon: PanelLeftClose,
        keywords: "sidebar 侧栏 折叠",
        run: () =>
          dispatch({
            type: "settings",
            patch: { sidebarCollapsed: !state.settings.sidebarCollapsed },
          }),
      },
      {
        id: "action-favorite",
        group: "操作",
        title: "查看收藏的模型",
        icon: Star,
        keywords: "favorite star 收藏",
        run: () => {
          dispatch({ type: "navigate", page: "library" });
          const favorite = state.models.find((m) => m.favorite);
          if (favorite) dispatch({ type: "select", id: favorite.id });
          else notify("info", "还没有收藏的模型", "在模型行右侧菜单中收藏");
        },
      },
      {
        id: "action-rescan",
        group: "操作",
        title: "重新扫描模型目录",
        icon: Cpu,
        keywords: "scan refresh 扫描 刷新",
        run: () => {
          dispatch({ type: "navigate", page: "library" });
          notify("info", "正在重新扫描", state.settings.modelDir);
        },
      },
    ];

    return [...modelCommands, ...pageCommands, ...actionCommands];
  }, [state.models, state.settings, dispatch, notify]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default view: running model, pages, then a few actions. No giant list.
      const favorites = state.models.filter((m) => m.favorite).slice(0, 3);
      const rest = state.models
        .filter((m) => !m.favorite)
        .slice(0, Math.max(0, 5 - favorites.length));
      const modelIds = new Set([...favorites, ...rest].map((m) => m.id));
      return commands.filter(
        (c) =>
          c.group !== "模型" ||
          (c.modelId !== undefined && modelIds.has(c.modelId)),
      );
    }
    return commands
      .map((command) => {
        const haystack = `${command.title} ${command.subtitle ?? ""} ${command.keywords ?? ""}`.toLowerCase();
        const title = command.title.toLowerCase();
        let score = 0;
        if (title === q) score = 100;
        else if (title.startsWith(q)) score = 80;
        else if (title.includes(q)) score = 60;
        else if (haystack.includes(q)) score = 40;
        return { command, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.command);
  }, [commands, query, state.models]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const groups = useMemo(() => {
    const order: Command["group"][] = ["模型", "页面", "操作"];
    return order
      .map((group) => ({
        group,
        items: results.filter((r) => r.group === group),
      }))
      .filter((g) => g.items.length > 0);
  }, [results]);

  const execute = (command: Command) => {
    command.run();
    dispatch({ type: "palette", open: false });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) =>
        results.length ? (i - 1 + results.length) % results.length : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const command = results[active];
      if (command) execute(command);
    }
  };

  let runningIndex = -1;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => dispatch({ type: "palette", open: value })}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-scrim backdrop-blur-[2px] data-[state=open]:animate-[atelier-fade-in_140ms_ease]" />
        <Dialog.Content
          className="anim-palette-in fixed left-1/2 top-[16vh] z-[61] w-[min(580px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-xl bg-surface shadow-dialog focus:outline-none"
          aria-label="快速查找"
          onKeyDown={onKeyDown}
        >
          <Dialog.Title className="sr-only">快速查找</Dialog.Title>
          <Dialog.Description className="sr-only">
            搜索模型、页面与操作。使用方向键选择，Enter 执行，Escape 关闭。
          </Dialog.Description>

          <div className="flex items-center gap-2.5 border-b border-line px-4">
            <Search size={15} strokeWidth={1.9} className="shrink-0 text-ink-4" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索模型、页面或操作"
              className="h-[46px] w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-4"
              aria-label="搜索模型、页面或操作"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => dispatch({ type: "palette", open: false })}
              className="shrink-0 rounded border border-line px-1.5 py-[1px] text-[10px] text-ink-4 transition-colors hover:border-line-strong hover:text-ink-2"
            >
              Esc
            </button>
          </div>

          <div
            ref={listRef}
            className="palette-scroll max-h-[min(430px,54vh)] overflow-y-auto overscroll-contain p-1.5"
            role="listbox"
            aria-label="搜索结果"
          >
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex size-9 items-center justify-center rounded-full border border-line bg-surface-2 text-ink-4">
                  <Search size={15} strokeWidth={1.7} />
                </div>
                <p className="mt-3 text-[12.5px] font-medium text-ink">
                  没有找到“{query}”
                </p>
                <p className="mt-1 text-[11.5px] text-ink-3">
                  试试模型名称、发布者，或页面名称。
                </p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.group} className="mb-1 last:mb-0">
                  <div className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-medium tracking-[0.02em] text-ink-4">
                    {group.group}
                  </div>
                  {group.items.map((command) => {
                    runningIndex += 1;
                    const index = runningIndex;
                    const isActive = index === active;
                    return (
                      <button
                        key={command.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        data-index={index}
                        onMouseMove={() => setActive(index)}
                        onClick={() => execute(command)}
                        className="palette-item"
                        data-active={isActive}
                      >
                        {command.kind === "model" ? (
                          <KindTile
                            kind={
                              state.models.find((m) => m.id === command.modelId)
                                ?.kind ?? "chat"
                            }
                            size="sm"
                          />
                        ) : command.icon ? (
                          <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[6px] border border-line bg-surface-2 text-ink-3">
                            <command.icon size={13.5} strokeWidth={1.8} />
                          </span>
                        ) : null}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] leading-[1.35]">
                            {command.title}
                          </span>
                          {command.subtitle && (
                            <span className="palette-hint block truncate text-[10.5px] leading-[1.4] text-ink-4">
                              {command.subtitle}
                            </span>
                          )}
                        </span>
                        {command.kind === "model" &&
                          command.modelId &&
                          (() => {
                            const model = state.models.find(
                              (m) => m.id === command.modelId,
                            );
                            return model ? (
                              <span className="shrink-0">
                                <StatusCell status={model.status} />
                              </span>
                            ) : null;
                          })()}
                        {isActive && (
                          <CornerDownLeft
                            size={12}
                            strokeWidth={1.9}
                            className="shrink-0 text-ink-4"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t border-line px-3 py-2 text-[10.5px] text-ink-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <ArrowUp size={11} strokeWidth={2} />
                <ArrowDown size={11} strokeWidth={2} />
                选择
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft size={11} strokeWidth={2} />
                打开
              </span>
            </div>
            <span className="flex items-center gap-1">
              <span className="font-mono">{modLabel}</span>
              <span className="font-mono">K</span>
              切换
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
