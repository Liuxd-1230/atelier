import {
  Bell,
  Check,
  Cpu,
  FolderOpen,
  Gauge,
  HardDrive,
  Palette,
  Rows2,
  ShieldCheck,
  Monitor,
  Keyboard,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { useApp } from "../../store/AppStore";
import type { Settings } from "../../lib/types";
import { Button } from "../ui/Button";
import { Divider } from "../ui/Primitives";
import { Select } from "../ui/Select";
import { Switch } from "../ui/Switch";

type SectionId = "appearance" | "engine" | "storage" | "privacy" | "shortcuts";

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: "appearance", label: "外观", icon: Palette },
  { id: "engine", label: "引擎", icon: Cpu },
  { id: "storage", label: "存储", icon: HardDrive },
  { id: "privacy", label: "隐私与通知", icon: ShieldCheck },
  { id: "shortcuts", label: "快捷键", icon: Keyboard },
];

function Row({
  label,
  description,
  children,
  htmlFor,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="setting-row">
      <div className="min-w-0 max-w-[420px]">
        <label
          htmlFor={htmlFor}
          className="block text-[12.5px] leading-[1.4] text-ink"
        >
          {label}
        </label>
        {description && (
          <p className="mt-[3px] text-[10.5px] leading-[1.5] text-ink-4">
            {description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  );
}

function SectionShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="section-title">
        <span className="section-tick" aria-hidden />
        {title}
      </h2>
      {description && (
        <p className="mt-[4px] text-[11px] leading-[1.5] text-ink-4">
          {description}
        </p>
      )}
      <div className="mt-2.5 divide-y divide-line border-t border-line-strong">
        {children}
      </div>
    </section>
  );
}

/**
 * A miniature of the real shell rather than a generic icon: a rail strip, a
 * content column and a couple of rules. It shows what the user is choosing
 * without resorting to illustration.
 */
function ThemePreview({ dark }: { dark: boolean }) {
  const rail = dark ? "#262521" : "#f0ede6";
  const surface = dark ? "#1b1a18" : "#ffffff";
  const line = dark ? "#3a3730" : "#e6e2d9";
  const text = dark ? "#6f6a60" : "#d5d0c5";
  return (
    <svg viewBox="0 0 92 52" className="size-full" aria-hidden>
      <rect width="92" height="52" fill={surface} />
      <rect width="21" height="52" fill={rail} />
      <line x1="21" y1="0" x2="21" y2="52" stroke={line} strokeWidth="1" />
      {[8, 14].map((y) => (
        <rect key={y} x="6" y={y} width="9" height="2" rx="1" fill={text} />
      ))}
      {[8, 14].map((y) => (
        <rect key={`r${y}`} x="28" y={y} width="12" height="2" rx="1" fill={text} />
      ))}
      <rect x="28" y="24" width="42" height="3" rx="1.5" fill={text} />
      <rect x="28" y="33" width="52" height="1.5" rx="0.75" fill={line} />
      <rect x="28" y="39" width="46" height="1.5" rx="0.75" fill={line} />
      <rect x="28" y="45" width="52" height="1.5" rx="0.75" fill={line} />
      <rect x="72" y="44" width="14" height="5" rx="2.5" fill="#b85b3a" />
    </svg>
  );
}

function ThemeChoice({
  value,
  current,
  onSelect,
  label,
}: {
  value: Settings["theme"];
  current: Settings["theme"];
  onSelect: () => void;
  label: string;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "group flex flex-col gap-2 rounded-lg p-1 transition-colors",
        active ? "text-ink" : "text-ink-3 hover:text-ink-2",
      )}
    >
      <span
        className={cn(
          "relative block h-[52px] w-[92px] overflow-hidden rounded-md border transition-colors",
          active
            ? "border-[color-mix(in_srgb,var(--color-clay)_55%,var(--color-line))]"
            : "border-line group-hover:border-line-strong",
        )}
      >
        <ThemePreview dark={value === "dark"} />
        {active && (
          <span className="absolute right-1.5 top-1.5 flex size-[14px] items-center justify-center rounded-full bg-clay text-white shadow-[0_1px_2px_rgba(41,40,37,0.2)]">
            <Check size={8} strokeWidth={3} />
          </span>
        )}
      </span>
      <span className="text-[11px]">{label}</span>
    </button>
  );
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["Ctrl", "K"], label: "打开快速查找" },
  { keys: ["↑", "↓"], label: "在列表中移动选择" },
  { keys: ["Enter"], label: "打开选中的模型或页面" },
  { keys: ["Esc"], label: "关闭面板或弹层" },
  { keys: ["Ctrl", "B"], label: "折叠或展开侧栏" },
  { keys: ["Ctrl", "D"], label: "切换信息密度" },
  { keys: ["Ctrl", "J"], label: "切换深浅主题" },
];

export function SettingsPage() {
  const { state, dispatch, notify } = useApp();
  const [section, setSection] = useState<SectionId>("appearance");
  const settings = state.settings;

  const set = (patch: Partial<Settings>) =>
    dispatch({ type: "settings", patch });

  return (
    <div className="page page-enter">
      <div>
        <h1 className="page-title">设置</h1>
        <p className="page-desc">偏好会保存在本机，并在下次打开时恢复。</p>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[148px_minmax(0,1fr)]">
        <nav
          className="flex flex-row gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
          aria-label="设置分组"
        >
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className="settings-nav-item shrink-0"
              data-active={section === item.id}
              aria-current={section === item.id ? "true" : undefined}
            >
              <item.icon size={13.5} strokeWidth={1.8} className="shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 max-w-[720px]">
          {section === "appearance" && (
            <div className="anim-fade-in">
              <SectionShell title="主题">
                <div className="flex gap-3 py-3.5">
                  <ThemeChoice
                    value="light"
                    current={settings.theme}
                    onSelect={() => set({ theme: "light" })}
                    label="浅色"
                  />
                  <ThemeChoice
                    value="dark"
                    current={settings.theme}
                    onSelect={() => set({ theme: "dark" })}
                    label="深色"
                  />
                </div>
              </SectionShell>

              <SectionShell title="信息密度">
                <Row
                  label="列表密度"
                  description="紧凑模式会压缩行高并隐藏次要信息，适合一次浏览更多模型。"
                >
                  <div className="control-group flex items-center">
                    {(
                      [
                        { value: "comfortable", label: "标准", icon: Rows2 },
                        { value: "compact", label: "紧凑", icon: Gauge },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => set({ density: option.value })}
                        aria-pressed={settings.density === option.value}
                        className={cn(
                          "flex h-[26px] items-center gap-1.5 rounded-[6px] px-2.5 text-[11.5px] transition-colors",
                          settings.density === option.value
                            ? "bg-surface text-ink shadow-[0_1px_2px_rgba(41,40,37,0.08)]"
                            : "text-ink-3 hover:text-ink",
                        )}
                      >
                        <option.icon size={12} strokeWidth={1.8} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </Row>
                <Row
                  label="侧栏默认折叠"
                  description="只保留图标，为内容区留出更多宽度。"
                >
                  <Switch
                    checked={settings.sidebarCollapsed}
                    onCheckedChange={(value) =>
                      set({ sidebarCollapsed: value })
                    }
                    aria-label="侧栏默认折叠"
                  />
                </Row>
                <Row
                  label="减少动效"
                  description="关闭过渡与入场动画，系统层面的减少动效设置始终生效。"
                >
                  <Switch
                    checked={settings.reduceMotion}
                    onCheckedChange={(value) => set({ reduceMotion: value })}
                    aria-label="减少动效"
                  />
                </Row>
              </SectionShell>
            </div>
          )}

          {section === "engine" && (
            <div className="anim-fade-in">
              <SectionShell
                title="启动参数"
                description="新建模型时使用的默认值，可随时在详情面板中单独覆盖。"
              >
                <Row label="默认上下文窗口" htmlFor="ctx">
                  <Select
                    value={String(settings.defaultContext)}
                    onChange={(value) =>
                      set({ defaultContext: Number(value) })
                    }
                    ariaLabel="默认上下文窗口"
                    className="w-[148px]"
                    options={[
                      { value: "8192", label: "8K tokens" },
                      { value: "16384", label: "16K tokens" },
                      { value: "32768", label: "32K tokens" },
                      { value: "65536", label: "64K tokens" },
                      { value: "131072", label: "128K tokens" },
                    ]}
                  />
                </Row>
                <Row
                  label="GPU 层数上限"
                  description="超过显卡容量的层会回退到 CPU 计算。"
                >
                  <Select
                    value={String(settings.gpuLayers)}
                    onChange={(value) => set({ gpuLayers: Number(value) })}
                    ariaLabel="GPU 层数上限"
                    className="w-[148px]"
                    options={[
                      { value: "24", label: "24 层" },
                      { value: "32", label: "32 层" },
                      { value: "48", label: "48 层" },
                      { value: "64", label: "64 层" },
                      { value: "80", label: "80 层" },
                    ]}
                  />
                </Row>
                <Row label="CPU 线程数">
                  <Select
                    value={String(settings.threads)}
                    onChange={(value) => set({ threads: Number(value) })}
                    ariaLabel="CPU 线程数"
                    className="w-[148px]"
                    options={[
                      { value: "4", label: "4 线程" },
                      { value: "8", label: "8 线程" },
                      { value: "12", label: "12 线程" },
                      { value: "16", label: "16 线程" },
                      { value: "24", label: "24 线程" },
                    ]}
                  />
                </Row>
                <Row label="KV 缓存精度">
                  <Select
                    value={settings.precision}
                    onChange={(value) =>
                      set({ precision: value as Settings["precision"] })
                    }
                    ariaLabel="KV 缓存精度"
                    className="w-[148px]"
                    options={[
                      { value: "fp16", label: "FP16", description: "最高精度" },
                      { value: "q8_0", label: "Q8_0", description: "推荐" },
                      { value: "q4_0", label: "Q4_0", description: "最省显存" },
                    ]}
                  />
                </Row>
              </SectionShell>

              <SectionShell title="服务">
                <Row
                  label="自动启动上次模型"
                  description="打开工作台时恢复上一次运行的模型。"
                >
                  <Switch
                    checked={settings.autoStart}
                    onCheckedChange={(value) => set({ autoStart: value })}
                    aria-label="自动启动上次模型"
                  />
                </Row>
                <Row
                  label="空闲时保留权重"
                  description="关闭后，模型在 10 分钟无请求时释放显存。"
                >
                  <Switch
                    checked={settings.keepWarm}
                    onCheckedChange={(value) => set({ keepWarm: value })}
                    aria-label="空闲时保留权重"
                  />
                </Row>
                <Row label="服务端口" htmlFor="port">
                  <input
                    id="port"
                    type="number"
                    min={1024}
                    max={65535}
                    value={settings.port}
                    onChange={(e) => set({ port: Number(e.target.value) })}
                    className="input mono w-[110px] text-right tabular-nums"
                  />
                </Row>
                <Row label="日志级别">
                  <Select
                    value={settings.logLevel}
                    onChange={(value) =>
                      set({ logLevel: value as Settings["logLevel"] })
                    }
                    ariaLabel="日志级别"
                    className="w-[148px]"
                    options={[
                      { value: "quiet", label: "仅错误" },
                      { value: "normal", label: "标准" },
                      { value: "verbose", label: "详细" },
                    ]}
                  />
                </Row>
              </SectionShell>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    notify("success", "引擎设置已保存", "下次启动时生效")
                  }
                >
                  保存并重启引擎
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    notify("info", "已恢复默认", "引擎参数已重置")
                  }
                >
                  恢复默认
                </Button>
              </div>
            </div>
          )}

          {section === "storage" && (
            <div className="anim-fade-in">
              <SectionShell title="位置">
                <Row
                  label="模型目录"
                  description="GGUF 与 NInfer 权重的存放位置。"
                >
                  <div className="flex items-center gap-2">
                    <span className="readout rounded-md bg-surface-2 px-2 py-1 text-ink-3">
                      {settings.modelDir}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        notify("info", "选择目录", "此 Demo 未接入系统文件选择器")
                      }
                    >
                      <FolderOpen size={12} strokeWidth={1.8} />
                      更改
                    </Button>
                  </div>
                </Row>
                <Row
                  label="下载缓存"
                  description="未完成的下载会暂存在这里。"
                >
                  <div className="flex items-center gap-2">
                    <span className="readout rounded-md bg-surface-2 px-2 py-1 text-ink-3">
                      {settings.cacheDir}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        notify("success", "缓存已清理", "释放 2.4 GB 空间")
                      }
                    >
                      清理
                    </Button>
                  </div>
                </Row>
              </SectionShell>

              <SectionShell title="磁盘占用">
                <div className="py-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12.5px] text-ink">模型权重</span>
                    <span className="readout text-[11px] text-ink-3">
                      113.7 GB / 512 GB
                    </span>
                  </div>
                  <div className="mt-2 flex h-[6px] gap-[2px] overflow-hidden rounded-full">
                    <div className="h-full rounded-l-full bg-clay/80" style={{ width: "14%" }} />
                    <div className="h-full bg-[#8fa9c4]/70" style={{ width: "8%" }} />
                    <div className="h-full rounded-r-full bg-track" style={{ width: "78%" }} />
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-[10px] text-ink-4">
                    <span className="flex items-center gap-1.5">
                      <span className="size-[6px] rounded-full bg-clay/80" />
                      模型 71.6 GB
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-[6px] rounded-full bg-[#8fa9c4]/70" />
                      缓存 2.4 GB
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-[6px] rounded-full bg-track" />
                      可用 398 GB
                    </span>
                  </div>
                </div>
              </SectionShell>
            </div>
          )}

          {section === "privacy" && (
            <div className="anim-fade-in">
              <SectionShell title="数据">
                <Row
                  label="发送匿名使用统计"
                  description="只包含功能使用次数，不包含提示词与模型输出。"
                >
                  <Switch
                    checked={settings.telemetry}
                    onCheckedChange={(value) => set({ telemetry: value })}
                    aria-label="发送匿名使用统计"
                  />
                </Row>
                <Row
                  label="开机自动启动"
                  description="登录系统后在后台启动工作台服务。"
                >
                  <Switch
                    checked={settings.launchOnBoot}
                    onCheckedChange={(value) => set({ launchOnBoot: value })}
                    aria-label="开机自动启动"
                  />
                </Row>
              </SectionShell>

              <SectionShell title="通知">
                <Row label="通知级别">
                  <div className="flex flex-col gap-1.5">
                    {(
                      [
                        {
                          value: "all",
                          label: "全部",
                          hint: "下载完成、模型状态变化",
                        },
                        {
                          value: "important",
                          label: "仅重要",
                          hint: "下载失败与引擎异常",
                        },
                        { value: "off", label: "关闭", hint: "不显示任何通知" },
                      ] as const
                    ).map((option) => (
                      <label
                        key={option.value}
                        className="flex cursor-pointer items-start gap-2.5 rounded-md px-1 py-1 transition-colors hover:bg-hover/60"
                      >
                        <span
                          className={cn(
                            "mt-[2px] flex size-[14px] shrink-0 items-center justify-center rounded-full border transition-colors",
                            settings.notifications === option.value
                              ? "border-clay bg-clay"
                              : "border-line-strong bg-surface",
                          )}
                        >
                          {settings.notifications === option.value && (
                            <span className="size-[5px] rounded-full bg-white" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[12px] leading-[1.35] text-ink-2">
                            {option.label}
                          </span>
                          <span className="block text-[10.5px] leading-[1.4] text-ink-4">
                            {option.hint}
                          </span>
                        </span>
                        <input
                          type="radio"
                          name="notifications"
                          value={option.value}
                          checked={settings.notifications === option.value}
                          onChange={() =>
                            set({ notifications: option.value })
                          }
                          className="sr-only"
                        />
                      </label>
                    ))}
                  </div>
                </Row>
              </SectionShell>

              <div className="rounded-lg border border-line bg-surface-2 px-3.5 py-3">
                <div className="flex items-center gap-1.5">
                  <Bell size={12.5} strokeWidth={1.9} className="text-ink-4" />
                  <span className="text-[11.5px] text-ink-2">
                    所有模型与配置仅存储在本机
                  </span>
                </div>
                <Divider className="my-2.5" />
                <div className="flex items-center justify-between text-[10px] text-ink-4">
                  <span className="flex items-center gap-1.5">
                    <Monitor size={11} strokeWidth={1.8} />
                    桌面版 0.1.0
                  </span>
                  <span className="readout">build 20261026</span>
                </div>
              </div>
            </div>
          )}

          {section === "shortcuts" && (
            <div className="anim-fade-in">
              <SectionShell
                title="键盘快捷键"
                description="所有快捷键在任意页面可用，输入框聚焦时不会触发。"
              >
                {SHORTCUTS.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
                    <span className="text-[12px] text-ink-2">{item.label}</span>
                    <span className="flex items-center gap-1">
                      {item.keys.map((key) => (
                        <span key={key} className="kbd">
                          {key}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </SectionShell>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
