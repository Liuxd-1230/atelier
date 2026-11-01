import * as Slider from "@radix-ui/react-slider";
import {
  ArrowUpRight,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { Kbd, StatusBadge, Tag } from "../ui/Primitives";
import { Select } from "../ui/Select";
import { Switch } from "../ui/Switch";
import { StatusCell } from "../models/ModelBits";
import { ThroughputGraph } from "../pages/HomePage";
import { useApp } from "../../store/AppStore";

/* --------------------------------------------------------------------------
   Live token values — the hex readouts re-measure the document when the
   theme flips, so the catalog can never disagree with the page it sits on.
   -------------------------------------------------------------------------- */

const TOKEN_LIST = [
  "--color-canvas",
  "--color-rail",
  "--color-surface",
  "--color-ink",
  "--color-ink-3",
  "--color-line",
  "--color-clay",
  "--color-clay-strong",
  "--color-ok",
  "--color-danger",
];

function useTokenValues() {
  const [values, setValues] = useState<Record<string, string>>({});

  // Measure on data-theme changes only — the attribute write happens in the
  // store's own effect, so reading state here would lag one render behind.
  useEffect(() => {
    const root = document.documentElement;
    const measure = () => {
      const cs = getComputedStyle(root);
      const next: Record<string, string> = {};
      for (const token of TOKEN_LIST) {
        next[token] = cs.getPropertyValue(token).trim();
      }
      setValues(next);
    };
    measure();
    const observer = new MutationObserver(measure);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return values;
}

/* --------------------------------------------------------------------------
   Live throughput — same simulation grammar as the workbench home, so the
   specimen page streams the same instrument, not a picture of one.
   -------------------------------------------------------------------------- */

const GRAPH_WINDOW = 60;

function useThroughputSim() {
  const baseline = 38.4;
  const [history, setHistory] = useState<number[]>(() =>
    Array.from({ length: 18 }, (_, i) =>
      i === 17 ? baseline : baseline * (0.86 + Math.random() * 0.2),
    ),
  );
  const seed = useRef(1);

  useEffect(() => {
    const timer = window.setInterval(() => {
      seed.current = (seed.current * 1103515245 + 12345) % 2147483648;
      const noise = (seed.current / 2147483648 - 0.5) * 0.22;
      setHistory((prev) => [...prev.slice(-GRAPH_WINDOW + 1), baseline * (1 + noise)]);
    }, 1400);
    return () => window.clearInterval(timer);
  }, [baseline]);

  const ceiling = Math.max(48, ...history) * 1.15;
  const current = history[history.length - 1] ?? 0;
  return { history, ceiling, current };
}

/* --------------------------------------------------------------------------
   Sections — a sticky catalog column beside each specimen field.
   -------------------------------------------------------------------------- */

function SpecimenSection({
  no,
  id,
  title,
  note,
  children,
}: {
  no: string;
  id: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-x-14 gap-y-8 border-t border-line py-14 lg:grid-cols-[210px_minmax(0,1fr)]"
    >
      <div>
        <div className="lg:sticky lg:top-10">
          <div className="flex items-baseline gap-2">
            <span className="section-tick" aria-hidden />
            <span className="readout text-[10.5px] text-ink-4">{no}</span>
          </div>
          <h2 id={id} className="mt-2.5 text-[15px] font-medium text-ink">
            {title}
          </h2>
          <p className="mt-1.5 text-[11.5px] leading-[1.6] text-ink-4">{note}</p>
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function ColorRow({
  token,
  note,
  values,
}: {
  token: string;
  note: string;
  values: Record<string, string>;
}) {
  return (
    <div className="flex items-center gap-4 py-2.5">
      <span
        className="size-12 shrink-0 rounded-lg border border-line"
        style={{ background: `var(${token})` }}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="readout block text-[11.5px] text-ink">{token}</span>
        <span className="block text-[10.5px] text-ink-4">{note}</span>
      </span>
      <span className="readout shrink-0 text-[11px] uppercase text-ink-3">
        {values[token] || "—"}
      </span>
    </div>
  );
}

function TypeRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid items-baseline gap-x-8 gap-y-2 border-t border-line py-4 first:border-t-0 sm:grid-cols-[190px_minmax(0,1fr)]">
      <span className="readout text-[10.5px] leading-relaxed text-ink-4">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function DesignSpecimenPage() {
  const { state, dispatch, notify } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const tokenValues = useTokenValues();
  const { history, ceiling, current } = useThroughputSim();

  const [switchOn, setSwitchOn] = useState(true);
  const [switchOff, setSwitchOff] = useState(false);
  const [gpuLayers, setGpuLayers] = useState(64);
  const [precision, setPrecision] = useState<"fp16" | "q8_0" | "q4_0">("q8_0");
  const [split, setSplit] = useState(50);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? el.scrollTop / max : 0);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // The page honours the workbench's own theme shortcut.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        dispatch({
          type: "settings",
          patch: { theme: state.settings.theme === "dark" ? "light" : "dark" },
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, state.settings.theme]);

  const dateLine = useMemo(() => {
    const d = new Date();
    const week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
    return `${d.getMonth() + 1}月${d.getDate()}日 · 星期${week}`;
  }, []);

  const dark = state.settings.theme === "dark";

  return (
    <div
      ref={scrollRef}
      className="page-enter h-full overflow-y-auto overflow-x-hidden bg-canvas"
    >
      {/* Fixed instrument chrome: scroll progress + the master live switch. */}
      <div className="fixed inset-x-0 top-0 z-40 h-[2px] bg-transparent" aria-hidden>
        <div
          className="h-full bg-clay transition-[width] duration-100 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <Button
        variant="outline"
        size="icon"
        aria-label={dark ? "切换到浅色主题" : "切换到深色主题"}
        className="fixed right-5 top-4 z-40 rounded-full bg-surface/90 backdrop-blur-sm"
        onClick={() =>
          dispatch({
            type: "settings",
            patch: { theme: dark ? "light" : "dark" },
          })
        }
      >
        {dark ? <Sun size={14} strokeWidth={1.9} /> : <Moon size={14} strokeWidth={1.9} />}
      </Button>

      <div className="mx-auto max-w-[1180px] px-6 pb-24 pt-14 sm:px-10 lg:px-14">
        {/* Opening — the workbench's own opening device, at specimen scale. */}
        <div className="flex items-center gap-3">
          <span className="rule-lead" aria-hidden />
          <span className="readout text-[10.5px] text-ink-4">{dateLine}</span>
        </div>

        <h1 className="display-hero mt-6">
          前端构建
          <span className="display-hero-indent">审美一览</span>
        </h1>

        <p className="display-sub mt-7 max-w-[520px]">
          这不是一篇关于 Atelier 的文章，而是它本身：以下每件标本都由工作台的真实
          <span className="readout text-[15px] text-ink"> tokens </span>与组件直接渲染——
          能活的，都在活。
        </p>

        <div className="hairline-strong mt-12" />
        <div className="flex flex-wrap items-center gap-x-10 gap-y-2 py-3.5">
          <span className="text-[10.5px] text-ink-4">
            构建产物{" "}
            <span className="readout text-ink-3">JS 151 KB · CSS 98 KB gzip</span>
          </span>
          <span className="text-[10.5px] text-ink-4">
            运行时{" "}
            <span className="readout text-ink-3">React 19 · Vite 8</span>
          </span>
          <span className="text-[10.5px] text-ink-4">
            标本{" "}
            <span className="readout text-ink-3">01–07 · 全部可交互</span>
          </span>
        </div>

        {/* 01 — 色彩 */}
        <SpecimenSection
          no="标本 01"
          id="s-color"
          title="色彩"
          note="十六个语义变量撑起整个系统，陶土是唯一的饱和色。右侧读数为实时测量值——切换主题，它们会跟着文档重算。"
        >
          <div className="grid gap-x-10 lg:grid-cols-2">
            <div>
              <p className="mb-1 text-[10.5px] text-ink-4">底色</p>
              <ColorRow token="--color-canvas" note="暖纸底，整页的地面" values={tokenValues} />
              <ColorRow token="--color-rail" note="侧栏与凹陷区" values={tokenValues} />
              <ColorRow token="--color-surface" note="浮起的面板" values={tokenValues} />
              <p className="mb-1 mt-5 text-[10.5px] text-ink-4">墨与线</p>
              <ColorRow token="--color-ink" note="正文与标题" values={tokenValues} />
              <ColorRow token="--color-ink-3" note="次要信息" values={tokenValues} />
              <ColorRow token="--color-line" note="发丝分割线" values={tokenValues} />
            </div>
            <div>
              <p className="mb-1 text-[10.5px] text-ink-4">强调</p>
              <ColorRow token="--color-clay" note="主操作与选中态，仅此两处" values={tokenValues} />
              <ColorRow token="--color-clay-strong" note="陶土的按压与描边级" values={tokenValues} />
              <p className="mb-1 mt-5 text-[10.5px] text-ink-4">语义</p>
              <ColorRow token="--color-ok" note="运行中、已完成" values={tokenValues} />
              <ColorRow token="--color-danger" note="失败、需处理" values={tokenValues} />
              <p className="mt-5 text-[11px] leading-[1.7] text-ink-4">
                完整清单见 <span className="readout">src/styles/index.css</span> 的
                <span className="readout"> @theme</span> 块——30+ 个语义变量，
                深色主题以同一套名字整体覆盖，组件层永远不写裸色值。
              </p>
            </div>
          </div>
        </SpecimenSection>

        {/* 02 — 字阶 */}
        <SpecimenSection
          no="标本 02"
          id="s-type"
          title="字阶"
          note="衬线只出现在页面标题与状态句，等宽只出现在可以被执行的数据处——两种字体各有辖区，互不越界。"
        >
          <TypeRow label="display-hero&#10;Newsreader · 68px · 400">
            <div className="display-hero text-[56px]">
              下午好，
              <span className="display-hero-indent">林一舟</span>
            </div>
          </TypeRow>
          <TypeRow label="display-sub&#10;Newsreader · 17px">
            <p className="display-sub">
              <span className="font-medium text-ink">Qwen3 32B</span>{" "}
              正在运行，随时可以开始新的对话。
            </p>
          </TypeRow>
          <TypeRow label="节标题&#10;Inter · 12.5px · 500">
            <h3 className="text-[12.5px] font-medium text-ink">最近使用</h3>
          </TypeRow>
          <TypeRow label="正文&#10;Inter · 13px">
            <p className="text-[13px] text-ink-2">
              管理工作区中的本地权重，查看参数并直接启动推理。
            </p>
          </TypeRow>
          <TypeRow label="辅助信息&#10;Inter · 10.5px">
            <p className="text-[10.5px] text-ink-4">
              Alibaba · 32B · 对话 · 19.8 GB · 更新于 5 天前
            </p>
          </TypeRow>
          <TypeRow label="readout&#10;IBM Plex Mono · tabular-nums">
            <p className="readout text-[13px] text-ink">
              38.4 <span className="text-ink-4">tok/s</span>
              <span className="mx-3 text-ink-4">·</span>
              151:29:51
              <span className="mx-3 text-ink-4">·</span>
              D:\models\.cache
            </p>
          </TypeRow>
          <TypeRow label="kbd&#10;按键引用">
            <p className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
              按 <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> 唤起命令面板
            </p>
          </TypeRow>
        </SpecimenSection>

        {/* 03 — 空间与线 */}
        <SpecimenSection
          no="标本 03"
          id="s-space"
          title="空间与线"
          note="层级靠留白与发丝线建立，不靠框。间距只用 4/8/12/16/24/32/48 七档，刻度线为一切读数提供度量参照。"
        >
          <div className="space-y-8">
            <div>
              <p className="readout mb-2 text-[10.5px] text-ink-4">
                hairline 7% / hairline-strong 11% 墨色
              </p>
              <div className="space-y-3">
                <div className="hairline" />
                <div className="hairline-strong" />
              </div>
            </div>
            <div>
              <p className="readout mb-2 text-[10.5px] text-ink-4">
                tick-rail / tick-rail-dense
              </p>
              <div className="space-y-3">
                <div className="tick-rail" aria-hidden />
                <div className="tick-rail tick-rail-dense" aria-hidden />
              </div>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <p className="readout mb-3 text-[10.5px] text-ink-4">
                  间距 4–48
                </p>
                <div className="flex items-end gap-3">
                  {[4, 8, 12, 16, 24, 32, 48].map((n) => (
                    <div key={n} className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-[7px] rounded-sm bg-line-strong"
                        style={{ height: n }}
                        aria-hidden
                      />
                      <span className="readout text-[9.5px] text-ink-4">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="readout mb-3 text-[10.5px] text-ink-4">
                  圆角 6 / 8 / 10 / 16
                </p>
                <div className="flex items-center gap-3">
                  {[6, 8, 10, 16].map((r) => (
                    <div key={r} className="flex flex-col items-center gap-1.5">
                      <div
                        className="size-11 border border-line-strong bg-surface"
                        style={{ borderRadius: r }}
                        aria-hidden
                      />
                      <span className="readout text-[9.5px] text-ink-4">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p className="readout mb-3 text-[10.5px] text-ink-4">
                三层阴影 token
              </p>
              <div className="flex flex-wrap gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-20 rounded-[10px] bg-surface shadow-[var(--shadow-panel)]" aria-hidden />
                  <span className="readout text-[9.5px] text-ink-4">panel</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="size-20 rounded-[10px] bg-surface shadow-[var(--shadow-pop)]" aria-hidden />
                  <span className="readout text-[9.5px] text-ink-4">pop</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="size-20 rounded-[10px] bg-surface shadow-[var(--shadow-dialog)]" aria-hidden />
                  <span className="readout text-[9.5px] text-ink-4">dialog</span>
                </div>
              </div>
            </div>
          </div>
        </SpecimenSection>

        {/* 04 — 部件 */}
        <SpecimenSection
          no="标本 04"
          id="s-parts"
          title="交互部件"
          note="以下全部是工作台在用的真实组件，不是截图——开关可以拨，滑杆可以拖，通知真的会弹。"
        >
          <div className="space-y-9">
            <div>
              <p className="readout mb-3 text-[10.5px] text-ink-4">button · 六种语态</p>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button variant="primary">浏览模型库</Button>
                <Button variant="secondary">重新扫描</Button>
                <Button variant="outline">停止运行</Button>
                <Button variant="ghost">高级选项</Button>
                <Button variant="quiet">取消</Button>
                <Button variant="danger">移出工作台</Button>
              </div>
              <div className="mt-3 flex flex-wrap items-baseline gap-2.5">
                <Button variant="secondary" size="xs">xs</Button>
                <Button variant="secondary" size="sm">sm</Button>
                <Button variant="secondary" size="md">md</Button>
                <Button variant="secondary" size="lg">lg</Button>
              </div>
            </div>

            <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
              <div>
                <p className="readout mb-3 text-[10.5px] text-ink-4">switch</p>
                <div className="space-y-3.5">
                  <label className="flex items-center justify-between gap-4">
                    <span className="text-[12px] text-ink-2">Flash Attention</span>
                    <Switch checked={switchOn} onCheckedChange={setSwitchOn} aria-label="Flash Attention" />
                  </label>
                  <label className="flex items-center justify-between gap-4">
                    <span className="text-[12px] text-ink-2">mmap 加载</span>
                    <Switch checked={switchOff} onCheckedChange={setSwitchOff} aria-label="mmap 加载" />
                  </label>
                </div>
              </div>
              <div>
                <p className="readout mb-3 text-[10.5px] text-ink-4">slider</p>
                <div className="py-[7px]">
                  <div className="flex items-center justify-between">
                    <label className="text-[11.5px] text-ink-2">GPU 层数</label>
                    <span className="readout text-[11px] text-ink">
                      {gpuLayers}
                      <span className="ml-0.5 text-ink-4">/ 64</span>
                    </span>
                  </div>
                  <Slider.Root
                    className="relative mt-2 flex h-4 w-full touch-none select-none items-center"
                    value={[gpuLayers]}
                    min={0}
                    max={64}
                    step={1}
                    onValueChange={([next]) => setGpuLayers(next)}
                    aria-label="GPU 层数"
                  >
                    <Slider.Track className="relative h-[3px] grow rounded-full bg-track">
                      <Slider.Range className="absolute h-full rounded-full bg-clay/85" />
                    </Slider.Track>
                    <Slider.Thumb className="block size-[13px] rounded-full border border-line-strong bg-white shadow-[0_1px_2px_rgba(41,40,37,0.18)] transition-shadow hover:shadow-[0_1px_4px_rgba(41,40,37,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40" aria-label="GPU 层数" />
                  </Slider.Root>
                </div>
              </div>
              <div>
                <p className="readout mb-3 text-[10.5px] text-ink-4">select</p>
                <Select
                  className="w-[200px]"
                  ariaLabel="权重精度"
                  value={precision}
                  onChange={setPrecision}
                  options={[
                    { value: "fp16", label: "fp16", description: "半精度，显存换质量" },
                    { value: "q8_0", label: "q8_0", description: "8 比特，均衡" },
                    { value: "q4_0", label: "q4_0", description: "4 比特，省显存" },
                  ]}
                />
              </div>
              <div>
                <p className="readout mb-3 text-[10.5px] text-ink-4">status · kind</p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
                  <StatusCell status="running" />
                  <StatusCell status="ready" />
                  <StatusCell status="downloading" />
                  <StatusCell status="paused" />
                  <StatusCell status="error" />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Tag>对话</Tag>
                  <Tag>多模态</Tag>
                  <Tag>代码</Tag>
                  <Tag>嵌入</Tag>
                  <StatusBadge tone="ok" pulse>已完成</StatusBadge>
                  <StatusBadge tone="danger">失败</StatusBadge>
                </div>
              </div>
              <div>
                <p className="readout mb-3 text-[10.5px] text-ink-4">meter</p>
                <div className="tick-rail" aria-hidden />
                <div className="meter-bar meter-bar-clay mt-1">
                  <span style={{ width: "88%" }} />
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="readout text-[10px] text-ink-4">19.8 GB</span>
                  <span className="readout text-[10px] text-ink-4">88%</span>
                </div>
              </div>
              <div>
                <p className="readout mb-3 text-[10.5px] text-ink-4">toast</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => notify("success", "已启动 Qwen3 32B", "64 层已全部进驻 GPU")}>
                    成功
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => notify("error", "CUDA 显存不足", "释放 2.4 GB 后重试")}>
                    错误
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => notify("info", "扫描完成", "12 个模型，无变化")}>
                    信息
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <p className="readout mb-3 text-[10.5px] text-ink-4">
                throughput · 实时流动，1.4s 一拍
              </p>
              <div className="instrument overflow-hidden">
                <div className="flex items-end justify-between px-4 pb-1 pt-4">
                  <div>
                    <div className="readout-lg">{current.toFixed(1)}</div>
                    <div className="mt-1.5 text-[10.5px] text-ink-4">tokens / 秒</div>
                  </div>
                  <span className="readout text-[11px] text-ink-3">峰值 {Math.round(ceiling)}</span>
                </div>
                <div className="px-4 pb-4 pt-3 text-ink-3">
                  <ThroughputGraph history={history} ceiling={ceiling} />
                </div>
                <div className="tick-rail mt-[-1px]" aria-hidden />
                <div className="mt-1.5 flex items-center justify-between px-4 pb-3 text-[10px] text-ink-4">
                  <span className="readout">60 秒前</span>
                  <span className="readout">现在</span>
                </div>
              </div>
            </div>
          </div>
        </SpecimenSection>

        {/* 05 — 演进 */}
        <SpecimenSection
          no="标本 05"
          id="s-evolution"
          title="演进"
          note="一轮「bolder」放大了什么：拖动分割线，左为放大前，右为放大后。截图为浅色主题下的同一页面。"
        >
          <div>
            <div
              className="relative select-none overflow-hidden rounded-[10px] border border-line bg-surface"
              style={{ aspectRatio: "16 / 10" }}
            >
              <img
                src="/specimen/evolution-after.jpg"
                alt="放大后的工作台首页"
                draggable={false}
                className="absolute inset-0 size-full object-cover"
              />
              <img
                src="/specimen/evolution-before.jpg"
                alt="放大前的工作台首页"
                draggable={false}
                className="absolute inset-0 size-full object-cover"
                style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
              />
              <div
                className="pointer-events-none absolute inset-y-0 z-10 w-[1.5px] bg-clay"
                style={{ left: `${split}%` }}
                aria-hidden
              >
                <span className="absolute left-1/2 top-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-clay bg-surface shadow-[var(--shadow-pop)]" />
              </div>
              <span
                className="readout pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-surface/90 px-2 py-1 text-[10px] text-ink-2 backdrop-blur-sm"
                aria-hidden
              >
                前
              </span>
              <span
                className="readout pointer-events-none absolute right-3 top-3 z-10 rounded-md bg-clay px-2 py-1 text-[10px] text-white"
                aria-hidden
              >
                后
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={split}
                onChange={(e) => setSplit(Number(e.target.value))}
                aria-label="拖动查看放大前后对比"
                className="absolute inset-0 z-20 size-full cursor-ew-resize opacity-0"
              />
            </div>
            <div className="hairline mt-4" />
            <div className="flex flex-wrap items-center gap-x-10 gap-y-2 py-3">
              <span className="text-[10.5px] text-ink-4">
                衬线 <span className="readout text-ink-3">44 → 68px</span>
              </span>
              <span className="text-[10.5px] text-ink-4">
                读数 <span className="readout text-ink-3">30 → 40px</span>
              </span>
              <span className="text-[10.5px] text-ink-4">
                吞吐图 <span className="readout text-ink-3">58 → 76px</span>
              </span>
              <span className="text-[10.5px] text-ink-4">
                模型名 <span className="readout text-ink-3">灰 → 墨</span>
              </span>
            </div>
          </div>
        </SpecimenSection>

        {/* 06 — 构建方法 */}
        <SpecimenSection
          no="标本 06"
          id="s-build"
          title="构建方法"
          note="变量编译期展开、零运行时 CSS-in-JS；列降级用容器查询；数字列一律 tabular-nums。"
        >
          <div className="space-y-9">
            <div className="instrument overflow-hidden">
              <div className="border-b border-line px-4 py-2.5">
                <span className="readout text-[10.5px] text-ink-4">
                  src/styles/index.css · @theme（节选）
                </span>
              </div>
              <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[11.5px] leading-[1.7]">
                <code>
                  <span className="text-ink-4">{"/* 设计变量集中在 @theme，深色主题同名覆盖 */"}</span>
                  {"\n"}
                  <span className="text-ink-2">@theme</span>
                  <span className="text-ink"> {"{"}</span>
                  {"\n  "}
                  <span className="text-ink-2">--color-canvas</span>
                  <span className="text-ink">: </span>
                  <span className="text-clay-strong">#fcfcfb</span>
                  <span className="text-ink">;</span>
                  {"\n  "}
                  <span className="text-ink-2">--color-ink</span>
                  <span className="text-ink">: </span>
                  <span className="text-clay-strong">#292825</span>
                  <span className="text-ink">;</span>
                  {"\n  "}
                  <span className="text-ink-2">--color-clay</span>
                  <span className="text-ink">: </span>
                  <span className="text-clay-strong">#d97757</span>
                  <span className="text-ink">;</span>
                  {"\n  "}
                  <span className="text-ink-2">--font-serif</span>
                  <span className="text-ink">: </span>
                  <span className="text-clay-strong">"Newsreader Variable", "Noto Serif SC Variable"</span>
                  <span className="text-ink">;</span>
                  {"\n"}
                  <span className="text-ink">{"}"}</span>
                  {"\n\n"}
                  <span className="text-ink-4">{"/* 组件类只引用变量，从不写裸色值 */"}</span>
                  {"\n"}
                  <span className="text-ink-2">.hairline</span>
                  <span className="text-ink"> {"{ height: 1px; background: color-mix(in srgb, var(--color-ink) 7%, transparent); }"}</span>
                </code>
              </pre>
            </div>

            <div>
              <p className="readout mb-1 text-[10.5px] text-ink-4">
                结构账目 · 行数统计于 2026 年 11 月
              </p>
              <div className="hairline mt-2" />
              {[
                { path: "src/styles/index.css", role: "设计变量、组件类、动效关键帧——系统的唯一住址", n: "1258" },
                { path: "src/store/AppStore.tsx", role: "reducer + Context，下载与吞吐的本地模拟引擎", n: "518" },
                { path: "src/lib/data.ts", role: "虚构但自洽的演示数据", n: "620" },
                { path: "src/components/ui/*", role: "五个原语：button / switch / select / menu / primitives", n: "5 文件" },
              ].map((row) => (
                <div key={row.path} className="border-t border-line py-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="readout text-[11.5px] text-ink">{row.path}</span>
                    <span className="readout shrink-0 text-[11px] text-ink-3">{row.n}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink-4">{row.role}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="readout mb-1 text-[10.5px] text-ink-4">三条硬规矩</p>
              <div className="hairline mt-2" />
              {[
                "陶土只出现在主操作与选中态——强调色越忙，页面越平。",
                "所有数字用 tabular-nums 等宽——仪器读数不许抖动。",
                "响应式按结构处理：列降级、面板转浮层、侧栏变抽屉，而非单纯缩小。",
              ].map((line, i) => (
                <div key={i} className="flex items-baseline gap-3 border-t border-line py-3">
                  <span className="readout shrink-0 text-[10.5px] text-clay">0{i + 1}</span>
                  <p className="text-[12.5px] leading-[1.65] text-ink-2">{line}</p>
                </div>
              ))}
            </div>
          </div>
        </SpecimenSection>

        {/* 07 — 尾注 */}
        <SpecimenSection
          no="标本 07"
          id="s-coda"
          title="尾注"
          note="离开标本抽屉的路。"
        >
          <div>
            <div className="hairline" />
            <button
              type="button"
              onClick={() => dispatch({ type: "navigate", page: "home" })}
              className="group -mx-2 flex w-full items-center justify-between gap-4 rounded-md px-2 py-3.5 text-left transition-colors hover:bg-hover"
            >
              <span>
                <span className="block text-[13px] text-ink">进入工作台</span>
                <span className="mt-0.5 block text-[11px] text-ink-4">
                  标本的母体——首页、模型库、下载、运行记录、设置
                </span>
              </span>
              <ChevronRight
                size={14}
                strokeWidth={1.9}
                className="shrink-0 text-ink-4 transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </button>
            <div className="hairline" />
            <a
              href="https://github.com/Liuxd-1230/atelier"
              target="_blank"
              rel="noopener noreferrer"
              className="group -mx-2 flex w-full items-center justify-between gap-4 rounded-md px-2 py-3.5 text-left transition-colors hover:bg-hover"
            >
              <span>
                <span className="block text-[13px] text-ink">GitHub 仓库</span>
                <span className="mt-0.5 block text-[11px] text-ink-4">
                  全部源码与这条演进史
                </span>
              </span>
              <ArrowUpRight
                size={14}
                strokeWidth={1.9}
                className="shrink-0 text-ink-4 transition-opacity duration-150 group-hover:opacity-100 sm:opacity-40"
              />
            </a>
            <div className="hairline" />
            <div className="flex items-baseline justify-between gap-4 py-3.5">
              <span className="text-[13px] text-ink">字体</span>
              <span className="text-right text-[11px] text-ink-4">
                Newsreader · Inter · IBM Plex Mono · 思源宋体 · 思源黑体
                <span className="mt-0.5 block text-[10.5px]">全部经 fontsource 自托管，无外部字体请求</span>
              </span>
            </div>
            <div className="hairline" />
            <p className="pt-5 text-[11px] text-ink-4">
              本页与工作台由同一份 <span className="readout text-ink-3">src/styles/index.css</span>{" "}
              驱动 · Atelier v1.0.0 · 2026 年 11 月
            </p>
          </div>
        </SpecimenSection>
      </div>
    </div>
  );
}
