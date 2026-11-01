export type ModelStatus = "ready" | "running" | "downloading" | "paused" | "error";
export type ModelKind = "chat" | "vision" | "code" | "embedding";
export type PageId = "home" | "library" | "downloads" | "runs" | "settings" | "design";

export interface ModelParams {
  parameters: string;
  quantization: string;
  contextLength: number;
  layers: number;
  embeddingSize: number;
  architecture: string;
}

export interface ModelFile {
  name: string;
  path: string;
  sizeGB: number;
  format: "GGUF" | "NInfer";
  updatedAt: string;
  sha: string;
}

export interface Model {
  id: string;
  name: string;
  shortName: string;
  publisher: string;
  kind: ModelKind;
  status: ModelStatus;
  /** Total file size in GB. */
  sizeGB: number;
  /** Share of sizeGB already on disk, 0..1. Only meaningful while downloading. */
  progress: number;
  downloadedAt: string | null;
  updatedAt: string;
  favorite: boolean;
  description: string;
  tags: string[];
  params: ModelParams;
  file: ModelFile;
  /** Free-form runtime settings the user can adjust in the inspector. */
  settings: {
    gpuLayers: number;
    threads: number;
    temperature: number;
    contextLength: number;
    mmap: boolean;
    flashAttention: boolean;
  };
  /** Only for status === "downloading". Bytes/s, mocked. */
  speedMBps?: number;
  /** Only for status === "running": when the run started, ISO. */
  startedAt?: string;
  error?: string;
}

export interface RunRecord {
  id: string;
  modelId: string;
  modelName: string;
  startedAt: string;
  durationLabel: string;
  tokensPerSecond: number;
  tokens: number;
  status: "completed" | "stopped" | "failed";
  note?: string;
}

export interface DownloadTask {
  modelId: string;
  modelName: string;
  publisher: string;
  sizeGB: number;
  progress: number;
  speedMBps: number;
  etaLabel: string;
  status: "downloading" | "paused" | "queued";
}

export interface Settings {
  theme: "light" | "dark";
  density: "comfortable" | "compact";
  sidebarCollapsed: boolean;
  reduceMotion: boolean;
  defaultContext: number;
  gpuLayers: number;
  threads: number;
  autoStart: boolean;
  keepWarm: boolean;
  telemetry: boolean;
  launchOnBoot: boolean;
  modelDir: string;
  cacheDir: string;
  port: number;
  precision: "fp16" | "q8_0" | "q4_0";
  logLevel: "quiet" | "normal" | "verbose";
  notifications: "all" | "important" | "off";
}
