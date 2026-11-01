import * as Tooltip from "@radix-ui/react-tooltip";
import { useEffect } from "react";
import { AppProvider, useApp } from "./store/AppStore";
import { Sidebar } from "./components/shell/Sidebar";
import { Header } from "./components/shell/Header";
import { Toasts } from "./components/shell/Toasts";
import { RemoveDialog, ShortcutsDialog } from "./components/shell/Dialogs";
import { LibraryPage } from "./components/models/LibraryPage";
import { Inspector } from "./components/models/Inspector";
import { CommandPalette } from "./components/palette/CommandPalette";
import { HomePage } from "./components/pages/HomePage";
import { DownloadsPage } from "./components/pages/DownloadsPage";
import { RunsPage } from "./components/pages/RunsPage";
import { SettingsPage } from "./components/pages/SettingsPage";
import { modKey } from "./lib/utils";

function Workspace() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (modKey(e) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        dispatch({ type: "palette", open: !state.paletteOpen });
        return;
      }
      if (typing) return;

      if (modKey(e) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        dispatch({
          type: "settings",
          patch: { sidebarCollapsed: !state.settings.sidebarCollapsed },
        });
      } else if (modKey(e) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        dispatch({
          type: "settings",
          patch: {
            density:
              state.settings.density === "compact" ? "comfortable" : "compact",
          },
        });
      } else if (modKey(e) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        dispatch({
          type: "settings",
          patch: {
            theme: state.settings.theme === "dark" ? "light" : "dark",
          },
        });
      } else if (e.key === "/" && !modKey(e)) {
        e.preventDefault();
        if (state.page !== "library") {
          dispatch({ type: "navigate", page: "library" });
        }
        window.setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>(
            'input[type="search"]',
          );
          input?.focus();
        }, 30);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, state.paletteOpen, state.page, state.settings]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-canvas">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto">
            {state.page === "home" && <HomePage />}
            {state.page === "library" && <LibraryPage />}
            {state.page === "downloads" && <DownloadsPage />}
            {state.page === "runs" && <RunsPage />}
            {state.page === "settings" && <SettingsPage />}
          </main>
          <Inspector />
        </div>
      </div>
      <CommandPalette />
      <ShortcutsDialog />
      <RemoveDialog />
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <Tooltip.Provider delayDuration={420} skipDelayDuration={200}>
      <AppProvider>
        <Workspace />
      </AppProvider>
    </Tooltip.Provider>
  );
}
