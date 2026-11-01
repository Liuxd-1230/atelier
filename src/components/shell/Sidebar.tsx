import {
  Boxes,
  Download,
  House,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  Settings2,
  Palette,
  Images,
  Command,
  ChevronsUpDown,
  X,
} from "lucide-react";
import type { PageId } from "../../lib/types";
import { useApp } from "../../store/AppStore";
import { cn } from "../../lib/utils";
import { Hint } from "../ui/Menu";

const NAV: { id: PageId; label: string; icon: typeof House }[] = [
  { id: "gallery", label: "展览主页", icon: Images },
  { id: "home", label: "首页", icon: House },
  { id: "library", label: "模型库", icon: Boxes },
  { id: "downloads", label: "下载管理", icon: Download },
  { id: "runs", label: "运行记录", icon: History },
  { id: "settings", label: "设置", icon: Settings2 },
  { id: "design", label: "设计一览", icon: Palette },
];

export function Sidebar() {
  const { state, dispatch } = useApp();
  const collapsed = state.settings.sidebarCollapsed;
  const activeDownloads = state.downloads.filter(
    (d) => d.status === "downloading",
  ).length;

  return (
    <>
      <div
        className="nav-scrim"
        data-visible={state.mobileNavOpen}
        onClick={() => dispatch({ type: "mobileNav", open: false })}
        aria-hidden
      />
      <aside
        className={cn(
          "sidebar flex h-full shrink-0 flex-col overflow-hidden border-r border-line bg-rail",
          collapsed ? "w-[60px]" : "w-[216px]",
        )}
        data-collapsed={collapsed}
        data-mobile-open={state.mobileNavOpen}
        aria-label="主导航"
      >
        <div className="flex h-[52px] shrink-0 items-center px-3">
          <div className="brand group relative flex h-9 w-full items-center gap-2.5 rounded-lg px-1">
            <div className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-[#2a2825] text-[13px] font-medium text-[#f5f1e8]">
              <span className="translate-y-[-0.5px] font-serif">A</span>
            </div>
            {!collapsed && (
              <div className="sidebar-label min-w-0 flex-1">
                <div className="text-[13px] font-medium leading-[1.15] tracking-[0.01em] text-ink">
                  Atelier
                </div>
                <div className="text-[10.5px] leading-[1.3] text-ink-4">
                  模型工作台
                </div>
              </div>
            )}
            {!collapsed && (
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "settings",
                    patch: { sidebarCollapsed: true },
                  })
                }
                className="brand-toggle"
                aria-label="折叠侧栏"
              >
                <PanelLeftClose size={15} strokeWidth={1.8} />
              </button>
            )}
            <button
              type="button"
              onClick={() => dispatch({ type: "mobileNav", open: false })}
              className="mobile-nav-close flex size-7 items-center justify-center rounded-md text-ink-3 hover:bg-hover hover:text-ink"
              aria-label="关闭导航"
            >
              <X size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {collapsed && (
          <div className="flex justify-center pb-2">
            <Hint label="展开侧栏" side="right">
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "settings",
                    patch: { sidebarCollapsed: false },
                  })
                }
                className="flex size-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-hover hover:text-ink"
                aria-label="展开侧栏"
              >
                <PanelLeftOpen size={15} strokeWidth={1.8} />
              </button>
            </Hint>
          </div>
        )}

        <nav className="flex flex-col gap-[2px] px-2 pt-1" aria-label="页面">
          {NAV.map((item) => {
            const active = state.page === item.id;
            const content = (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  dispatch({ type: "navigate", page: item.id });
                  dispatch({ type: "mobileNav", open: false });
                }}
                className="nav-item w-full"
                data-active={active}
                aria-current={active ? "page" : undefined}
              >
                <item.icon size={16} strokeWidth={1.8} />
                {!collapsed && (
                  <span className="sidebar-label flex-1 text-left">
                    {item.label}
                  </span>
                )}
                {!collapsed &&
                  item.id === "downloads" &&
                  activeDownloads > 0 && (
                    <span className="sidebar-label flex h-[17px] min-w-[17px] items-center justify-center rounded-[5px] bg-tile px-1 font-mono text-[10px] tabular-nums text-ink-2">
                      {activeDownloads}
                    </span>
                  )}
              </button>
            );
            return collapsed ? (
              <Hint key={item.id} label={item.label} side="right">
                {content}
              </Hint>
            ) : (
              content
            );
          })}
        </nav>

      <div className="flex-1" />

      <div className="px-2 pb-2">
        {!collapsed && (
          <button
            type="button"
            onClick={() => dispatch({ type: "palette", open: true })}
            className="flex h-8 w-full items-center gap-2 rounded-lg border border-line bg-surface/70 px-2 text-[11.5px] text-ink-4 transition-colors hover:border-line-strong hover:text-ink-2"
          >
            <Command size={13} strokeWidth={1.8} />
            <span className="flex-1 text-left">快速查找</span>
            <span className="font-mono text-[10px] text-ink-4">Ctrl K</span>
          </button>
        )}
        {collapsed && (
          <Hint label="快速查找" side="right" shortcut="Ctrl K">
            <button
              type="button"
              onClick={() => dispatch({ type: "palette", open: true })}
              className="mx-auto flex size-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-hover hover:text-ink"
              aria-label="打开快速查找"
            >
              <Command size={15} strokeWidth={1.8} />
            </button>
          </Hint>
        )}
      </div>

      <div className="border-t border-line/80 px-2 py-2">
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-hover",
            collapsed && "justify-center",
          )}
        >
          <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-tile text-[11px] font-medium text-ink-2">
            林
          </span>
          {!collapsed && (
            <>
              <span className="sidebar-label min-w-0 flex-1">
                <span className="block truncate text-[12px] leading-[1.3] text-ink">
                  林一舟
                </span>
                <span className="block truncate text-[10.5px] leading-[1.3] text-ink-4">
                  本地工作区
                </span>
              </span>
              <ChevronsUpDown
                size={13}
                strokeWidth={1.8}
                className="sidebar-label shrink-0 text-ink-4"
              />
            </>
          )}
        </button>
      </div>
      </aside>
    </>
  );
}
