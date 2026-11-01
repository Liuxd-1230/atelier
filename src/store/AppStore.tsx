import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { seedDownloads, seedModels, seedRuns } from "../lib/data";
import type {
  DownloadTask,
  Model,
  ModelKind,
  ModelStatus,
  PageId,
  RunRecord,
  Settings,
} from "../lib/types";

export type SortKey = "recent" | "name" | "size" | "status";
export type ViewMode = "list" | "grid";
export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface State {
  page: PageId;
  models: Model[];
  runs: RunRecord[];
  downloads: DownloadTask[];
  selectedId: string | null;
  inspectorOpen: boolean;
  query: string;
  kindFilter: ModelKind | "all";
  statusFilter: ModelStatus | "all";
  sort: SortKey;
  view: ViewMode;
  paletteOpen: boolean;
  shortcutsOpen: boolean;
  mobileNavOpen: boolean;
  removeTargetId: string | null;
  loading: boolean;
  settings: Settings;
  toasts: Toast[];
}

type Action =
  | { type: "navigate"; page: PageId }
  | { type: "select"; id: string }
  | { type: "closeInspector" }
  | { type: "query"; value: string }
  | { type: "kindFilter"; value: ModelKind | "all" }
  | { type: "statusFilter"; value: ModelStatus | "all" }
  | { type: "sort"; value: SortKey }
  | { type: "view"; value: ViewMode }
  | { type: "palette"; open: boolean }
  | { type: "mobileNav"; open: boolean }
  | { type: "shortcuts"; open: boolean }
  | { type: "removeTarget"; id: string | null }
  | { type: "settings"; patch: Partial<Settings> }
  | { type: "modelSettings"; id: string; patch: Partial<Model["settings"]> }
  | { type: "favorite"; id: string }
  | { type: "start"; id: string }
  | { type: "stop"; id: string }
  | { type: "remove"; id: string }
  | { type: "downloadPause"; id: string }
  | { type: "downloadResume"; id: string }
  | { type: "downloadCancel"; id: string }
  | { type: "tick" }
  | { type: "loading"; value: boolean }
  | { type: "toast"; toast: Toast }
  | { type: "dismissToast"; id: number };

const STORAGE_KEY = "atelier.settings.v1";

const defaultSettings: Settings = {
  theme: "light",
  density: "comfortable",
  sidebarCollapsed: false,
  reduceMotion: false,
  defaultContext: 32768,
  gpuLayers: 48,
  threads: 12,
  autoStart: true,
  keepWarm: false,
  telemetry: false,
  launchOnBoot: false,
  modelDir: "D:\\models",
  cacheDir: "D:\\models\\.cache",
  port: 8080,
  precision: "q8_0",
  logLevel: "normal",
  notifications: "important",
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return defaultSettings;
  }
}

let toastId = 0;

function toast(tone: ToastTone, title: string, description?: string): Toast {
  toastId += 1;
  return { id: toastId, tone, title, description };
}

function pageFromHash(): PageId {
  const hash = window.location.hash;
  if (hash === "#atelier/design" || hash === "#design") return "design";
  if (hash === "#atelier") return "library";
  return "gallery";
}

const initialState: State = {
  page: pageFromHash(),
  models: seedModels,
  runs: seedRuns,
  downloads: seedDownloads,
  selectedId: null,
  inspectorOpen: false,
  query: "",
  kindFilter: "all",
  statusFilter: "all",
  sort: "recent",
  view: "list",
  paletteOpen: false,
  shortcutsOpen: false,
  mobileNavOpen: false,
  removeTargetId: null,
  loading: true,
  settings: loadSettings(),
  toasts: [],
};

function withModel(
  state: State,
  id: string,
  patch: Partial<Model>,
): Model[] {
  return state.models.map((m) => (m.id === id ? { ...m, ...patch } : m));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "navigate":
      return {
        ...state,
        page: action.page,
        paletteOpen: false,
        shortcutsOpen: false,
        mobileNavOpen: false,
      };

    case "select":
      return { ...state, selectedId: action.id, inspectorOpen: true };

    case "closeInspector":
      return { ...state, inspectorOpen: false };

    case "query":
      return { ...state, query: action.value };

    case "kindFilter":
      return { ...state, kindFilter: action.value };

    case "statusFilter":
      return { ...state, statusFilter: action.value };

    case "sort":
      return { ...state, sort: action.value };

    case "view":
      return { ...state, view: action.value };

    case "palette":
      return { ...state, paletteOpen: action.open };

    case "mobileNav":
      return { ...state, mobileNavOpen: action.open };

    case "shortcuts":
      return { ...state, shortcutsOpen: action.open };

    case "removeTarget":
      return { ...state, removeTargetId: action.id };

    case "settings":
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case "modelSettings": {
      const models = state.models.map((m) =>
        m.id === action.id
          ? { ...m, settings: { ...m.settings, ...action.patch } }
          : m,
      );
      return { ...state, models };
    }

    case "favorite": {
      const target = state.models.find((m) => m.id === action.id);
      if (!target) return state;
      return {
        ...state,
        models: withModel(state, action.id, { favorite: !target.favorite }),
        toasts: [
          ...state.toasts,
          toast(
            "success",
            target.favorite ? "已取消收藏" : "已加入收藏",
            target.shortName,
          ),
        ].slice(-3),
      };
    }

    case "start": {
      const target = state.models.find((m) => m.id === action.id);
      if (!target) return state;
      if (target.status === "downloading" || target.status === "paused") {
        return {
          ...state,
          toasts: [
            ...state.toasts,
            toast("error", "无法启动", "模型文件尚未下载完成"),
          ].slice(-3),
        };
      }
      if (target.status === "error") {
        return {
          ...state,
          toasts: [
            ...state.toasts,
            toast("error", "启动失败", target.error ?? "引擎返回未知错误"),
          ].slice(-3),
        };
      }
      const models = state.models.map((m) => {
        if (m.id === action.id) {
          return {
            ...m,
            status: "running" as const,
            startedAt: new Date().toISOString(),
          };
        }
        // The demo engine runs a single model at a time.
        if (m.status === "running") return { ...m, status: "ready" as const };
        return m;
      });
      return {
        ...state,
        models,
        runs: [
          {
            id: `run-${Date.now()}`,
            modelId: target.id,
            modelName: target.shortName,
            startedAt: new Date().toISOString(),
            durationLabel: "进行中",
            tokensPerSecond: 0,
            tokens: 0,
            status: "completed",
            note: "新会话",
          },
          ...state.runs,
        ],
        toasts: [
          ...state.toasts,
          toast("success", "已启动", `${target.shortName} 正在加载权重`),
        ].slice(-3),
      };
    }

    case "stop": {
      const target = state.models.find((m) => m.id === action.id);
      if (!target || target.status !== "running") return state;
      return {
        ...state,
        models: withModel(state, action.id, { status: "ready", startedAt: undefined }),
        toasts: [
          ...state.toasts,
          toast("info", "已停止", `${target.shortName} 已释放显存`),
        ].slice(-3),
      };
    }

    case "remove": {
      const target = state.models.find((m) => m.id === action.id);
      if (!target) return state;
      return {
        ...state,
        models: state.models.filter((m) => m.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
        inspectorOpen:
          state.selectedId === action.id ? false : state.inspectorOpen,
        removeTargetId: null,
        toasts: [
          ...state.toasts,
          toast("info", "已移出工作台", `${target.shortName} 的文件仍保留在磁盘`),
        ].slice(-3),
      };
    }

    case "downloadPause": {
      const task = state.downloads.find((d) => d.modelId === action.id);
      if (!task) return state;
      return {
        ...state,
        downloads: state.downloads.map((d) =>
          d.modelId === action.id
            ? { ...d, status: "paused", speedMBps: 0, etaLabel: "已暂停" }
            : d,
        ),
        models: withModel(state, action.id, { status: "paused" }),
        toasts: [
          ...state.toasts,
          toast("info", "下载已暂停", task.modelName),
        ].slice(-3),
      };
    }

    case "downloadResume": {
      const task = state.downloads.find((d) => d.modelId === action.id);
      if (!task) return state;
      return {
        ...state,
        downloads: state.downloads.map((d) =>
          d.modelId === action.id
            ? {
                ...d,
                status: "downloading",
                speedMBps: 18.4,
                etaLabel: "计算中",
              }
            : d,
        ),
        models: withModel(state, action.id, {
          status: "downloading",
          speedMBps: 18.4,
        }),
        toasts: [
          ...state.toasts,
          toast("success", "继续下载", task.modelName),
        ].slice(-3),
      };
    }

    case "downloadCancel": {
      const task = state.downloads.find((d) => d.modelId === action.id);
      if (!task) return state;
      return {
        ...state,
        downloads: state.downloads.filter((d) => d.modelId !== action.id),
        models: state.models.filter((m) => m.id !== action.id),
        toasts: [
          ...state.toasts,
          toast("info", "已取消下载", task.modelName),
        ].slice(-3),
      };
    }

    case "tick": {
      if (state.downloads.length === 0) return state;
      const finished: DownloadTask[] = [];
      let models = state.models;
      let downloads = state.downloads.map((task) => {
        if (task.status !== "downloading") return task;
        const perTick = (task.speedMBps / (task.sizeGB * 1024)) * 8;
        const progress = Math.min(1, task.progress + perTick);
        models = models.map((m) =>
          m.id === task.modelId ? { ...m, progress } : m,
        );
        if (progress >= 1) {
          finished.push(task);
          models = models.map((m) =>
            m.id === task.modelId
              ? {
                  ...m,
                  status: "ready" as const,
                  progress: 1,
                  downloadedAt: new Date().toISOString().slice(0, 10),
                  updatedAt: new Date().toISOString().slice(0, 10),
                }
              : m,
          );
          return { ...task, progress: 1, status: "paused" as const };
        }
        const remainingGB = task.sizeGB * (1 - progress);
        const seconds = Math.max(
          1,
          Math.round((remainingGB * 1024) / Math.max(task.speedMBps, 1)),
        );
        return {
          ...task,
          progress,
          etaLabel:
            seconds >= 60
              ? `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`
              : `${seconds} 秒`,
        };
      });
      downloads = downloads.filter(
        (d) => !finished.some((f) => f.modelId === d.modelId),
      );
      const promoting = downloads.some((d) => d.status === "downloading")
        ? null
        : downloads.find((d) => d.status === "queued");
      if (promoting) {
        downloads = downloads.map((d) =>
          d.modelId === promoting.modelId
            ? {
                ...d,
                status: "downloading" as const,
                speedMBps: 18.4,
                etaLabel: "计算中",
              }
            : d,
        );
        models = models.map((m) =>
          m.id === promoting.modelId
            ? { ...m, status: "downloading" as const, speedMBps: 18.4 }
            : m,
        );
      }
      const toasts = finished.reduce<Toast[]>(
        (acc, task) =>
          [
            ...acc,
            toast("success", "下载完成", `${task.modelName} 已可用于启动`),
          ].slice(-3),
        state.toasts,
      );
      return { ...state, downloads, models, toasts };
    }

    case "loading":
      return { ...state, loading: action.value };

    case "toast":
      return { ...state, toasts: [...state.toasts, action.toast].slice(-3) };

    case "dismissToast":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };

    default:
      return state;
  }
}

interface AppContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  notify: (tone: ToastTone, title: string, description?: string) => void;
  refresh: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Keep the URL hash in step with the page: "" is the gallery lobby,
  // #atelier the workbench, #atelier/design its specimen page.
  useEffect(() => {
    const hash =
      state.page === "gallery"
        ? ""
        : state.page === "design"
          ? "#atelier/design"
          : "#atelier";
    if (window.location.hash !== hash) {
      history.replaceState(null, "", hash || window.location.pathname);
    }
  }, [state.page]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = state.settings.theme;
    root.dataset.density = state.settings.density;
    root.dataset.reduceMotion = String(state.settings.reduceMotion);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
    } catch {
      /* storage may be unavailable; the demo still works in memory */
    }
  }, [state.settings]);

  useEffect(() => {
    if (!state.loading) return;
    const timer = window.setTimeout(
      () => dispatch({ type: "loading", value: false }),
      620,
    );
    return () => window.clearTimeout(timer);
  }, [state.loading]);

  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      dispatch,
      notify: (tone, title, description) =>
        dispatch({ type: "toast", toast: toast(tone, title, description) }),
      refresh: () => {
        dispatch({ type: "loading", value: true });
        window.setTimeout(
          () => dispatch({ type: "loading", value: false }),
          620,
        );
      },
    }),
    [state],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
