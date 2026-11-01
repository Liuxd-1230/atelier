import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { assetUrl } from "../../lib/utils";
import { useApp } from "../../store/AppStore";

/* --------------------------------------------------------------------------
   Reveal system — one authored motion grammar for the whole feature:
   IntersectionObserver flips .nf-in; children stagger via transition-delay.
   -------------------------------------------------------------------------- */

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, seen };
}

function CountUp({
  to,
  decimals = 0,
  className,
}: {
  to: number;
  decimals?: number;
  className?: string;
}) {
  const { ref, seen } = useReveal<HTMLSpanElement>();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!seen) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(to);
      return;
    }
    const start = performance.now();
    const dur = 1300;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}

/* -------------------------------------------------------------------------- */

const SPECS: { label: string; value: string; unit?: string; count?: number }[] = [
  { label: "架构", value: "Blackwell · GB202", unit: "完整核心，无阉割" },
  { label: "CUDA 核心", value: "24064", count: 24064 },
  { label: "Tensor 核心", value: "752", count: 752 },
  { label: "RT 核心", value: "188", count: 188 },
  { label: "显存", value: "96", unit: "GB GDDR7 ECC" },
  { label: "显存位宽", value: "512", unit: "bit" },
  { label: "显存带宽", value: "1.8", unit: "TB/s", count: 1.8 },
  { label: "FP4 AI 算力", value: "4000", unit: "AI TOPS", count: 4000 },
  { label: "FP32 算力", value: "125", unit: "TFLOPS", count: 125 },
  { label: "整卡功耗", value: "600", unit: "W", count: 600 },
  { label: "主机接口", value: "PCIe 5.0 ×16", unit: "双槽位" },
  { label: "显示输出", value: "4×", unit: "DisplayPort" },
  { label: "发布", value: "2025.03.18", unit: "GTC 2025" },
];

function SectionHead({ no, zh }: { no: string; zh: string }) {
  return (
    <div className="mb-8 flex items-baseline gap-3">
      <span className="h-[11px] w-[3px] rounded-[1px] bg-[#76b900]" aria-hidden />
      <span className="readout text-[10.5px] text-[#767676]">{no}</span>
      <h2 className="text-[15px] font-bold tracking-[0.02em] text-[#131313]">{zh}</h2>
    </div>
  );
}

export function NvidiaFeaturePage() {
  const { dispatch } = useApp();
  const facts = useReveal<HTMLDivElement>();

  return (
    <div className="nf page-enter h-full overflow-y-auto overflow-x-hidden bg-[#f5f5f2] text-[#131313]">
      {/* Running head — page chrome, not an eyebrow. */}
      <header className="sticky top-0 z-40 border-b border-[#131313]/10 bg-[#f5f5f2]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-3 sm:px-10 lg:px-14">
          <button
            type="button"
            onClick={() => dispatch({ type: "navigate", page: "gallery" })}
            className="group inline-flex items-center gap-1.5 text-[12px] font-medium text-[#131313]"
          >
            <ArrowLeft
              size={13}
              strokeWidth={2}
              className="transition-transform duration-150 group-hover:-translate-x-0.5"
            />
            展览主页
          </button>
          <span className="readout text-[10.5px] text-[#767676]">
            前端构建审美一览 · 产品特辑 No.02 · 2026-11
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-6 pb-24 sm:px-10 lg:px-14">
        {/* Cover spread */}
        <div className="grid items-end gap-x-14 gap-y-10 pb-16 pt-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div>
            <h1 className="text-[clamp(64px,9vw,132px)] font-extrabold leading-[0.95] tracking-[-0.035em] text-[#131313]">
              RTX PRO
              <span className="block pl-[0.06em] text-[#76b900]">6000</span>
            </h1>
            <p className="mt-7 max-w-[460px] text-[17px] font-medium leading-[1.6] text-[#131313]">
              Blackwell 的完整形态：一整颗 GB202，装进一张双槽显卡。
            </p>
            <p className="mt-5 max-w-[520px] text-[14px] leading-[1.9] text-[#565656]">
              2025 年 3 月，NVIDIA 把面向数据中心的完整核心交给了工作站。没有给游戏留一个晶体管——
              24,064 个 CUDA 核心的全部产出，交给渲染、仿真与大模型。这篇特稿把它的参数当作排版来读：
              每一个数字都有出处，每一个数字都值得一个版面。
            </p>
          </div>

          <figure className="justify-self-end">
            <div className="w-[min(440px,100%)] rounded-[6px] border border-[#131313]/10 bg-white p-4 shadow-[0_2px_6px_rgba(19,19,19,0.06)]">
              <img
                src={assetUrl("rtxpro/4272-front-thumb.jpg")}
                alt="RTX PRO 6000 Blackwell Workstation Edition 正面渲染图"
                className="block w-full"
              />
              <figcaption className="mt-3 border-t border-[#131313]/10 pt-2.5 text-[10px] leading-[1.6] text-[#767676]">
                档案照 · 双风扇双槽外壳，中央 X 形骨架
                <span className="block">图: TechPowerUp GPU 数据库</span>
              </figcaption>
            </div>
          </figure>
        </div>

        {/* Three headline numerals */}
        <div
          ref={facts.ref}
          className={`grid gap-x-10 gap-y-10 border-t-2 border-[#131313] py-12 sm:grid-cols-3 ${facts.seen ? "nf-in" : ""}`}
        >
          {[
            { v: 96, d: 0, unit: "GB", label: "GDDR7 ECC 显存" },
            { v: 24064, d: 0, unit: "个", label: "CUDA 核心" },
            { v: 600, d: 0, unit: "W", label: "整卡功耗" },
          ].map((f, i) => (
            <div key={f.label} className="nf-reveal" style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="h-px w-9 bg-[#76b900]" aria-hidden />
              <div className="mt-5 font-mono text-[clamp(48px,5.4vw,84px)] font-medium leading-none tracking-[-0.04em] text-[#131313]">
                <CountUp to={f.v} decimals={f.d} />
                <span className="ml-2 text-[0.4em] font-normal text-[#76b900]">{f.unit}</span>
              </div>
              <p className="readout mt-3 text-[10.5px] uppercase tracking-[0.14em] text-[#767676]">
                {f.label}
              </p>
            </div>
          ))}
        </div>

        {/* Spec ledger */}
        <section className="border-t border-[#131313]/12 py-14">
          <SectionHead no="特稿 01" zh="参数账目" />
          <div>
            {SPECS.map((row, i) => (
              <SpecRow key={row.label} row={row} index={i} />
            ))}
          </div>
          <p className="readout mt-6 text-[10px] leading-[1.7] text-[#767676]">
            数据来源：NVIDIA Newsroom GTC 2025 发布通稿、TechPowerUp GPU 数据库。
            <span className="block">Max-Q 版功耗约 400 W，Server 版为无源散热（400–600 W）。</span>
          </p>
        </section>

        {/* The object, dimension-true */}
        <section className="border-t border-[#131313]/12 py-14">
          <SectionHead no="特稿 02" zh="一块金属的尺寸" />
          <p className="mb-8 max-w-[560px] text-[13.5px] leading-[1.85] text-[#565656]">
            双槽、267 毫米长——在它占据的每一寸里塞进 512-bit 的显存回路。
            下图按真实比例绘制，标注意为承诺：装进机箱之前，先量好。
          </p>
          <CardPlate />
        </section>

        {/* The system, official asset */}
        <section className="border-t border-[#131313]/12 py-14">
          <SectionHead no="特稿 03" zh="放进机架" />
          <figure>
            <img
              src={assetUrl("rtxpro/cptx25-workstation-tech-blog-rtx-pro-full-server-exploded-1920x1080.png")}
              alt="RTX PRO 服务器爆炸视图：8 张卡与主板、风扇、电源分层"
              className="block w-full rounded-[6px] border border-[#131313]/10 bg-black"
              loading="lazy"
            />
            <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-2 text-[10.5px] text-[#767676]">
              <span>
                Server Edition 无源散热卡 × 8——单节点 768 GB 显存的形态。图: NVIDIA 官方资料
              </span>
              <span className="readout">1920×1080 · 原图 659 KB</span>
            </figcaption>
          </figure>
        </section>

        {/* Editions */}
        <section className="border-t border-[#131313]/12 py-14">
          <SectionHead no="特稿 04" zh="三种形态" />
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { n: "Workstation", d: "600 W 全功耗旗舰，风扇散热，单卡独占一台主机的核心。", tag: "本文主角" },
              { n: "Max-Q", d: "同芯降频，约 400 W，为散热受限的工作站与四卡并装而生。", tag: "安静形态" },
              { n: "Server", d: "无源散热，400–600 W，交给机架的风墙去照顾。", tag: "数据中心" },
            ].map((e) => (
              <div key={e.n} className="border-t-2 border-[#131313] pt-4">
                <h3 className="text-[17px] font-bold tracking-[-0.01em] text-[#131313]">{e.n}</h3>
                <p className="mt-2.5 text-[12.5px] leading-[1.75] text-[#565656]">{e.d}</p>
                <p className="readout mt-3 text-[10px] uppercase tracking-[0.14em] text-[#76b900]">
                  {e.tag}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Coda */}
        <footer className="border-t-2 border-[#131313] pt-8">
          <p className="max-w-[640px] text-[11.5px] leading-[1.8] text-[#767676]">
            本页是展览 No.02 的展品本体：一篇独立构建的杂志特稿，与展品 No.01（Atelier）
            不共享任何布局与配色。全部参数引自公开资料，来源如下；两张图片的来源与授权状态已在图注标明。
          </p>
          <ul className="mt-4 space-y-1.5 text-[11.5px] text-[#565656]">
            <li>
              ·{" "}
              <a
                className="underline decoration-[#131313]/20 underline-offset-2 transition-colors hover:text-[#131313]"
                href="https://nvidianews.nvidia.com/news/nvidia-blackwell-rtx-pro-comes-to-workstations-and-servers-for-designers-developers-data-scientists-and-creatives-to-build-and-collaborate-with-agentic-ai"
                target="_blank"
                rel="noopener noreferrer"
              >
                NVIDIA Newsroom — RTX PRO Blackwell 发布通稿（GTC 2025）
              </a>
            </li>
            <li>
              ·{" "}
              <a
                className="underline decoration-[#131313]/20 underline-offset-2 transition-colors hover:text-[#131313]"
                href="https://www.techpowerup.com/gpu-specs/rtx-pro-6000-blackwell-workstation.c4272"
                target="_blank"
                rel="noopener noreferrer"
              >
                TechPowerUp GPU 数据库 — 规格核对与档案照
              </a>
            </li>
          </ul>
          <button
            type="button"
            onClick={() => dispatch({ type: "navigate", page: "gallery" })}
            className="group mt-9 inline-flex items-center gap-2 border-2 border-[#131313] px-5 py-2.5 text-[13px] font-bold text-[#131313] transition-colors hover:bg-[#131313] hover:text-[#f5f5f2]"
          >
            <ArrowLeft size={14} strokeWidth={2.2} />
            返回展览主页
          </button>
        </footer>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SpecRow({
  row,
  index,
}: {
  row: { label: string; value: string; unit?: string; count?: number };
  index: number;
}) {
  const { ref, seen } = useReveal<HTMLDivElement>();
  const big = row.count !== undefined && row.count >= 96;

  return (
    <div
      ref={ref}
      className={`nf-reveal flex items-baseline justify-between gap-6 border-t border-[#131313]/12 py-4 ${
        index === 0 ? "border-t-0" : ""
      } ${seen ? "nf-in" : ""}`}
    >
      <span className="readout shrink-0 text-[11px] text-[#767676]">{row.label}</span>
      <span
        className={`min-w-0 text-right font-mono font-medium tracking-[-0.02em] text-[#131313] ${
          big ? "text-[clamp(24px,3vw,34px)]" : "text-[clamp(18px,2.2vw,24px)]"
        }`}
      >
        {row.count !== undefined ? (
          <CountUp to={row.count} decimals={row.count % 1 ? 1 : 0} />
        ) : (
          row.value
        )}
        {row.unit && (
          <span className="ml-2.5 text-[0.52em] font-normal text-[#767676]">{row.unit}</span>
        )}
      </span>
    </div>
  );
}

/** Dimension-true technical plate, drawn from the card's real 267×111 mm body. */
function CardPlate() {
  const { ref, seen } = useReveal<HTMLDivElement>();

  // 267mm → 940px, so 1mm ≈ 3.52px; body 111mm ≈ 391px tall.
  const W = 940;
  const H = 391;
  const pad = 86;
  const bodyX = pad;
  const bodyY = 96;
  const fanR = 132;

  return (
    <div ref={ref} className="overflow-hidden rounded-[6px] border border-[#131313]/10 bg-white p-6 sm:p-10">
      <svg
        viewBox={`0 0 ${W} ${H + bodyY + 60}`}
        className="block w-full"
        role="img"
        aria-label="RTX PRO 6000 尺寸示意图：267 毫米长、111 毫米高、双槽位"
      >
        {/* Body */}
        <rect
          x={bodyX}
          y={bodyY}
          width={W - pad * 2}
          height={H}
          rx={14}
          fill="none"
          stroke="#131313"
          strokeWidth={2}
        />
        {/* X brace */}
        <path
          d={`M${bodyX + 8} ${bodyY + 8} L${bodyX + (W - pad * 2) / 2 - 10} ${bodyY + H / 2} L${bodyX + 8} ${bodyY + H - 8} M${bodyX + (W - pad * 2) - 8} ${bodyY + 8} L${bodyX + (W - pad * 2) / 2 + 10} ${bodyY + H / 2} L${bodyX + (W - pad * 2) - 8} ${bodyY + H - 8}`}
          stroke="#131313"
          strokeOpacity={0.25}
          strokeWidth={1.5}
          fill="none"
        />
        {/* Fans */}
        {[0, 1].map((i) => {
          const cx = bodyX + (W - pad * 2) * (i === 0 ? 0.27 : 0.73);
          const cy = bodyY + H / 2;
          return (
            <g key={i} stroke="#131313" strokeWidth={1.5} fill="none">
              <circle cx={cx} cy={cy} r={fanR} />
              <circle cx={cx} cy={cy} r={fanR * 0.42} />
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <line
                  key={a}
                  x1={cx + fanR * 0.42 * Math.cos((a * Math.PI) / 180)}
                  y1={cy + fanR * 0.42 * Math.sin((a * Math.PI) / 180)}
                  x2={cx + fanR * 0.94 * Math.cos((a * Math.PI) / 180)}
                  y2={cy + fanR * 0.94 * Math.sin((a * Math.PI) / 180)}
                  strokeOpacity={0.4}
                />
              ))}
            </g>
          );
        })}
        {/* Bracket / slot hint */}
        <line
          x1={bodyX - 10}
          y1={bodyY + 6}
          x2={bodyX - 10}
          y2={bodyY + H - 6}
          stroke="#131313"
          strokeWidth={2}
        />
        {/* Dimension: length */}
        <g
          stroke="#76b900"
          strokeWidth={1.5}
          fill="none"
          className={seen ? "nf-drawn" : ""}
        >
          <line x1={bodyX} y1={bodyY + H + 34} x2={bodyX + (W - pad * 2)} y2={bodyY + H + 34} />
          <line x1={bodyX} y1={bodyY + H + 26} x2={bodyX} y2={bodyY + H + 42} />
          <line x1={bodyX + (W - pad * 2)} y1={bodyY + H + 26} x2={bodyX + (W - pad * 2)} y2={bodyY + H + 42} />
        </g>
        {/* Dimension: height */}
        <g
          stroke="#76b900"
          strokeWidth={1.5}
          fill="none"
          className={seen ? "nf-drawn" : ""}
          style={{ transitionDelay: "300ms" }}
        >
          <line x1={bodyX - 34} y1={bodyY} x2={bodyX - 34} y2={bodyY + H} />
          <line x1={bodyX - 42} y1={bodyY} x2={bodyX - 26} y2={bodyY} />
          <line x1={bodyX - 42} y1={bodyY + H} x2={bodyX - 26} y2={bodyY + H} />
        </g>
        <text
          x={bodyX + (W - pad * 2) / 2}
          y={bodyY + H + 26 + 32}
          textAnchor="middle"
          fontSize={17}
          fill="#131313"
          fontFamily="IBM Plex Mono, monospace"
        >
          267 mm
        </text>
        <text
          x={bodyX - 44}
          y={bodyY + H / 2}
          textAnchor="middle"
          fontSize={17}
          fill="#131313"
          fontFamily="IBM Plex Mono, monospace"
          transform={`rotate(-90 ${bodyX - 44} ${bodyY + H / 2})`}
        >
          111 mm
        </text>
        <text
          x={bodyX + (W - pad * 2) + 14}
          y={bodyY + H / 2 + 5}
          fontSize={15}
          fill="#767676"
          fontFamily="IBM Plex Mono, monospace"
        >
          2 槽
        </text>
      </svg>
      <p className="readout mt-4 border-t border-[#131313]/10 pt-3 text-[10px] text-[#767676]">
        按公开规格 1:1 绘制 · 267 × 111 mm · 双槽 · 示意线稿，非官方渲染
      </p>
    </div>
  );
}
