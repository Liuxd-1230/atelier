import {
  CircleHelp,
  Menu,
  Moon,
  PanelLeftOpen,
  Rows2,
  Rows3,
  Search,
  Sun,
} from "lucide-react";
import { useApp } from "../../store/AppStore";
import type { PageId } from "../../lib/types";
import { cn, modLabel } from "../../lib/utils";
import { Hint } from "../ui/Menu";

const PAGE_LABEL: Record<PageId, string> = {
  home: "首页",
  library: "模型库",
  downloads: "下载管理",
  runs: "运行记录",
  settings: "设置",
};

export function Header() {
  const { state, dispatch } = useApp();
  const running = state.models.find((m) => m.status === "running");
  const collapsed = state.settings.sidebarCollapsed;
  const isDark = state.settings.theme === "dark";

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between gap-4 border-b border-line bg-canvas px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => dispatch({ type: "mobileNav", open: true })}
          className="mobile-nav-trigger flex size-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-hover hover:text-ink"
          aria-label="打开导航"
        >
          <Menu size={16} strokeWidth={1.8} />
        </button>
        {collapsed && (
          <button
            type="button"
            onClick={() =>
              dispatch({ type: "settings", patch: { sidebarCollapsed: false } })
            }
            className="desktop-only flex size-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-hover hover:text-ink"
            aria-label="展开侧栏"
          >
            <PanelLeftOpen size={15} strokeWidth={1.8} />
          </button>
        )}
        <nav aria-label="面包屑" className="flex min-w-0 items-center gap-1.5">
          <span className="text-[12px] text-ink-4">工作台</span>
          <span className="text-[11px] text-ink-4/70">/</span>
          <span className="truncate text-[12px] font-medium text-ink-2">
            {PAGE_LABEL[state.page]}
          </span>
        </nav>
        <span className="mx-1.5 hidden h-3 w-px bg-line sm:block" aria-hidden />
        <span className="hidden items-center gap-1.5 text-[11.5px] text-ink-3 sm:flex">
          <span
            className={cn(
              "size-[5px] rounded-full",
              running ? "bg-ok" : "bg-ink-4",
            )}
          />
          <span className="truncate">
            {running ? (
              <>
                正在运行
                <span className="ml-1 text-ink-4">{running.shortName}</span>
              </>
            ) : (
              "引擎空闲"
            )}
          </span>
          <span className="mono ml-0.5 text-ink-4">:{state.settings.port}</span>
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => dispatch({ type: "palette", open: true })}
          className="mr-1 hidden h-7 items-center gap-2 rounded-md border border-line bg-surface px-2 text-[11.5px] text-ink-4 transition-colors hover:border-line-strong hover:text-ink-2 md:flex"
        >
          <Search size={12.5} strokeWidth={1.9} />
          <span>搜索模型</span>
          <span className="ml-1 font-mono text-[10px]">{modLabel} K</span>
        </button>

        <div className="mr-1 flex items-center rounded-md border border-line bg-surface p-[2px]">
          {(
            [
              { value: "comfortable", icon: Rows2, label: "标准密度" },
              { value: "compact", icon: Rows3, label: "紧凑密度" },
            ] as const
          ).map((option) => (
            <Hint key={option.value} label={option.label}>
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "settings",
                    patch: { density: option.value },
                  })
                }
                aria-label={option.label}
                aria-pressed={state.settings.density === option.value}
                className={cn(
                  "flex size-[22px] items-center justify-center rounded-[4px] transition-colors",
                  state.settings.density === option.value
                    ? "bg-tile text-ink"
                    : "text-ink-4 hover:text-ink-2",
                )}
              >
                <option.icon size={13} strokeWidth={1.8} />
              </button>
            </Hint>
          ))}
        </div>

        <Hint label={isDark ? "切换浅色" : "切换深色"}>
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: "settings",
                patch: { theme: isDark ? "light" : "dark" },
              })
            }
            className="flex size-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-hover hover:text-ink"
            aria-label={isDark ? "切换浅色主题" : "切换深色主题"}
          >
            {isDark ? (
              <Sun size={15} strokeWidth={1.8} />
            ) : (
              <Moon size={15} strokeWidth={1.8} />
            )}
          </button>
        </Hint>

        <Hint label="快捷键与帮助">
          <button
            type="button"
            onClick={() => dispatch({ type: "shortcuts", open: true })}
            className="flex size-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-hover hover:text-ink"
            aria-label="快捷键与帮助"
          >
            <CircleHelp size={15} strokeWidth={1.8} />
          </button>
        </Hint>
      </div>
    </header>
  );
}
