import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { assetUrl } from "../../lib/utils";
import { useApp } from "../../store/AppStore";

/* --------------------------------------------------------------------------
   Big-Top discipline: sections are full-bleed colour fields that butt against
   each other; numbers are graphic objects; every edge is hard. No .readout,
   no rounded corners, no soft shadows anywhere on this page.
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
      { threshold: 0.18 },
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
    const dur = 1100;
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

const TICKER: string[] = [
  "96 GB GDDR7 ECC",
  "24,064 CUDA CORES",
  "752 TENSOR",
  "188 RT",
  "1.8 TB/S",
  "4,000 AI TOPS",
  "125 TFLOPS FP32",
  "600 W",
  "512-BIT",
  "PCIe 5.0 ×16",
  "GTC 2025.03.18",
];

const SPECS: {
  label: string;
  value: string;
  count?: number;
  decimals?: number;
  unit?: string;
}[] = [
  { label: "架构 ARCHITECTURE", value: "Blackwell GB202 — 完整核心，无阉割" },
  { label: "CUDA 核心 CUDA CORES", value: "24,064", count: 24064 },
  { label: "Tensor 核心", value: "752", count: 752 },
  { label: "RT 核心", value: "188", count: 188 },
  { label: "显存 MEMORY", value: "96 GB GDDR7 ECC" },
  { label: "位宽 BUS", value: "512-bit" },
  { label: "带宽 BANDWIDTH", value: "1.8 TB/s", count: 1.8, decimals: 1, unit: "TB/s" },
  { label: "FP4 AI 算力", value: "4,000 AI TOPS", count: 4000, unit: "AI TOPS" },
  { label: "FP32 算力", value: "125 TFLOPS", count: 125, unit: "TFLOPS" },
  { label: "整卡功耗 TGP", value: "600 W", count: 600, unit: "W" },
  { label: "主机接口 INTERFACE", value: "PCIe 5.0 ×16 · 双槽" },
  { label: "显示输出 DISPLAY", value: "4× DisplayPort" },
  { label: "发布 LAUNCH", value: "2025.03.18 · GTC" },
];

export function NvidiaFeaturePage() {
  const { dispatch } = useApp();
  const cover = useReveal<HTMLDivElement>();

  return (
    <div className="nf page-enter h-full overflow-y-auto overflow-x-hidden bg-white text-[#111]">
      {/* Ticker — the spec sheet as a stock ticker. */}
      <div className="overflow-hidden border-b-2 border-black bg-[#111] py-2" aria-hidden>
        <div className="nf-ticker flex w-max items-center gap-8 whitespace-nowrap font-mono text-[11px] font-medium tracking-[0.08em] text-white">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-8">
              {TICKER.map((t, i) => (
                <span key={i} className="flex items-center gap-8">
                  <span>{t}</span>
                  <span className="text-[#76b900]">▲</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Masthead chrome — square, hard. */}
      <header className="flex items-center justify-between border-b-2 border-black bg-white px-[5vw] py-3">
        <button
          type="button"
          onClick={() => dispatch({ type: "navigate", page: "gallery" })}
          className="group inline-flex items-center gap-2 border-2 border-black px-3 py-1.5 text-[11.5px] font-extrabold uppercase tracking-[0.06em] transition-colors hover:bg-[#111] hover:text-white"
        >
          <ArrowLeft size={13} strokeWidth={2.6} />
          展览
        </button>
        <span className="font-mono text-[10.5px] font-medium tracking-[0.1em] text-[#555]">
          前端构建审美一览 · 产品特辑 No.02 · 2026-11
        </span>
      </header>

      {/* COVER FIELD — headline as architecture. */}
      <div
        ref={cover.ref}
        className={`border-b-2 border-black px-[5vw] pb-14 pt-10 ${cover.seen ? "nf-in" : ""}`}
      >
        <div>
          <p className="nf-reveal font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[#76b900]">
            NVIDIA Workstation GPU — Feature
          </p>
          <h1 className="nf-reveal mt-4 text-[clamp(72px,12.5vw,190px)] font-black uppercase leading-[0.84] tracking-[-0.045em] text-[#111]">
            RTX PRO
            <span className="block text-[#76b900]">6000</span>
          </h1>
        </div>

        <div className="mt-10 grid gap-x-[4vw] gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]">
          <div className="nf-reveal" style={{ transitionDelay: "120ms" }}>
            <p className="text-[clamp(26px,3.2vw,44px)] font-black leading-[1.15] tracking-[-0.02em] text-[#111]">
              「没有给游戏留一个
              <span className="bg-[#76b900] px-2 text-white">晶体管</span>
              。」
            </p>
            <div className="mt-7 grid gap-x-10 gap-y-4 text-[13.5px] leading-[1.85] text-[#333] sm:grid-cols-2">
              <p>
                2025 年 3 月，NVIDIA 把面向数据中心的完整 GB202 交给了工作站：
                24,064 个 CUDA 核心、752 个 Tensor 核心、188 个 RT 核心——
                与 GeForce 同代的旗舰被整体砍掉了游戏通路。
              </p>
              <p>
                换来的是 96 GB GDDR7 ECC 与 1.8 TB/s 的显存带宽：
                渲染、仿真、大模型推理，都在这张双槽卡里。
                这篇特稿把它的参数当作排版来读——每一个数字都有出处。
              </p>
            </div>
          </div>

          <figure
            className="nf-reveal self-start"
            style={{ transitionDelay: "220ms" }}
          >
            <img
              src={assetUrl("rtxpro/4272-front-thumb.jpg")}
              alt="RTX PRO 6000 Blackwell Workstation Edition 正面渲染图"
              className="block w-full border-[3px] border-black"
            />
            <figcaption className="border-b-[3px] border-black bg-[#111] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white">
              双风扇 · 双槽 · 中央 X 骨架 — 图: TechPowerUp
            </figcaption>
          </figure>
        </div>
      </div>

      {/* INK FIELD — three numerals as graphic objects. */}
      <div className="border-b-2 border-black bg-[#111] px-[5vw] py-16 text-white">
        <NumeralField />
      </div>

      {/* GREEN FIELD — the spec sheet as a broadsheet table. */}
      <div className="border-b-2 border-black bg-[#76b900] px-[5vw] py-16 text-[#111]">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="text-[clamp(30px,4.5vw,56px)] font-black uppercase leading-none tracking-[-0.02em]">
            参数账目
          </h2>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]">
            Specification
          </span>
        </div>
        <SpecTable />
        <p className="mt-6 max-w-[720px] font-mono text-[10px] leading-[1.7] text-[#111]/70">
          数据来源：NVIDIA Newsroom GTC 2025 发布通稿、TechPowerUp GPU 数据库。
          Max-Q 版功耗约 400 W；Server 版无源散热（400–600 W）。
        </p>
      </div>

      {/* WHITE FIELD — the object, dimension-true. */}
      <div className="border-b-2 border-black px-[5vw] py-16">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[clamp(30px,4.5vw,56px)] font-black uppercase leading-none tracking-[-0.02em] text-[#111]">
            一块金属的尺寸
          </h2>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#767676]">
            1:1 Technical Plate
          </span>
        </div>
        <p className="mb-8 max-w-[620px] text-[14px] leading-[1.85] text-[#333]">
          双槽、267 毫米长——在它占据的每一寸里塞进 512-bit 的显存回路。
          下图按真实比例绘制，标注意为承诺：装进机箱之前，先量好。
        </p>
        <CardPlate />
      </div>

      {/* INK FIELD — the system. */}
      <div className="border-b-2 border-black bg-[#111] px-[5vw] py-16">
        <h2 className="mb-8 text-[clamp(30px,4.5vw,56px)] font-black uppercase leading-none tracking-[-0.02em] text-white">
          放进<span className="text-[#76b900]">机架</span>
        </h2>
        <figure>
          <img
            src={assetUrl("rtxpro/cptx25-workstation-tech-blog-rtx-pro-full-server-exploded-1920x1080.png")}
            alt="RTX PRO 服务器爆炸视图：8 张卡与主板、风扇、电源分层"
            className="block w-full border-2 border-white/25"
            loading="lazy"
          />
          <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-white/70">
            <span>
              Server Edition 无源散热卡 × 8 —— 单节点 768 GB 显存的形态。图: NVIDIA 官方资料
            </span>
            <span className="text-[#76b900]">1920×1080</span>
          </figcaption>
        </figure>
      </div>

      {/* WHITE FIELD — three editions. */}
      <div className="border-b-2 border-black px-[5vw] py-16">
        <h2 className="mb-10 text-[clamp(30px,4.5vw,56px)] font-black uppercase leading-none tracking-[-0.02em] text-[#111]">
          三种<span className="text-[#76b900]">形态</span>
        </h2>
        <div className="grid gap-y-10 sm:grid-cols-3 sm:divide-x-[3px] sm:divide-black">
          {[
            { n: "Workstation", d: "600 W 全功耗旗舰，风扇散热，单卡独占一台主机的核心。", tag: "本文主角" },
            { n: "Max-Q", d: "同芯降频，约 400 W，为散热受限的工作站与四卡并装而生。", tag: "安静形态" },
            { n: "Server", d: "无源散热，400–600 W，交给机架的风墙去照顾。", tag: "数据中心" },
          ].map((e, i) => (
            <div key={e.n} className={i > 0 ? "sm:pl-[3vw]" : ""}>
              <h3 className="text-[clamp(26px,2.8vw,38px)] font-black uppercase leading-none tracking-[-0.02em] text-[#111]">
                {e.n}
              </h3>
              <p className="mt-4 max-w-[300px] text-[13px] leading-[1.8] text-[#333]">{e.d}</p>
              <p className="mt-4 inline-block bg-[#76b900] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#111]">
                {e.tag}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* GREEN FIELD — the exit. */}
      <footer className="bg-[#76b900] px-[5vw] py-14 text-[#111]">
        <p className="max-w-[680px] text-[12.5px] font-medium leading-[1.8]">
          本页是展览 No.02 的展品本体：一篇独立构建的杂志特稿，与展品 No.01（Atelier）
          不共享任何布局、配色与结构语法。全部参数引自公开资料；两张图片的来源已在图注标明。
        </p>
        <ul className="mt-4 space-y-1.5 font-mono text-[11px] font-medium">
          <li>
            ·{" "}
            <a
              className="underline decoration-[#111]/40 underline-offset-2 transition-colors hover:decoration-[#111]"
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
              className="underline decoration-[#111]/40 underline-offset-2 transition-colors hover:decoration-[#111]"
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
          className="group mt-10 inline-flex items-center gap-2 border-[3px] border-black bg-[#111] px-6 py-3 text-[13px] font-extrabold uppercase tracking-[0.06em] text-white transition-colors hover:bg-white hover:text-[#111]"
        >
          <ArrowLeft size={14} strokeWidth={2.6} />
          返回展览主页
        </button>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function NumeralField() {
  const facts = useReveal<HTMLDivElement>();
  const items = [
    { v: 96, unit: "GB", label: "GDDR7 ECC 显存" },
    { v: 24064, unit: "个", label: "CUDA 核心" },
    { v: 600, unit: "W", label: "整卡功耗" },
  ];
  return (
    <div ref={facts.ref} className={facts.seen ? "nf-in" : ""}>
      <p className="nf-reveal mb-10 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[#76b900]">
        三个无法回避的数字
      </p>
      <div className="grid gap-y-12 sm:grid-cols-3 sm:gap-x-[3vw]">
        {items.map((f, i) => (
          <div key={f.label} className="nf-reveal" style={{ transitionDelay: `${i * 110}ms` }}>
            <div className="text-[clamp(96px,11vw,176px)] font-black leading-[0.82] tracking-[-0.05em] text-white">
              <CountUp to={f.v} />
            </div>
            <div className="mt-5 inline-block bg-[#76b900] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#111]">
              {f.unit} · {f.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpecTable() {
  const { ref, seen } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={seen ? "nf-in" : ""}>
      <table className="w-full border-[3px] border-black bg-[#76b900] text-left">
        <tbody>
          {SPECS.map((row, i) => (
            <tr
              key={row.label}
              className={`nf-reveal border-b-2 border-black last:border-b-0 ${
                i % 2 === 1 ? "bg-[#6fb000]" : ""
              }`}
              style={{ transitionDelay: `${Math.min(i * 45, 450)}ms` }}
            >
              <th className="w-[38%] border-r-2 border-black px-4 py-3 align-top font-mono text-[10.5px] font-bold uppercase tracking-[0.1em]">
                {row.label}
              </th>
              <td className="px-4 py-3 text-[clamp(17px,2vw,24px)] font-black tracking-[-0.01em]">
                {row.count !== undefined ? (
                  <>
                    <CountUp to={row.count} decimals={row.decimals ?? 0} />
                    {row.unit && (
                      <span className="ml-2 text-[0.5em] font-bold text-[#111]/60">
                        {row.unit}
                      </span>
                    )}
                  </>
                ) : (
                  row.value
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
    <div ref={ref} className={seen ? "nf-in" : ""}>
      <div className="border-[3px] border-black bg-white p-6 sm:p-10">
        <svg
          viewBox={`0 0 ${W} ${H + bodyY + 70}`}
          className="block w-full"
          role="img"
          aria-label="RTX PRO 6000 尺寸示意图：267 毫米长、111 毫米高、双槽位"
        >
          <rect
            x={bodyX}
            y={bodyY}
            width={W - pad * 2}
            height={H}
            fill="none"
            stroke="#111"
            strokeWidth={3}
          />
          <path
            d={`M${bodyX + 10} ${bodyY + 10} L${bodyX + (W - pad * 2) / 2 - 12} ${bodyY + H / 2} L${bodyX + 10} ${bodyY + H - 10} M${bodyX + (W - pad * 2) - 10} ${bodyY + 10} L${bodyX + (W - pad * 2) / 2 + 12} ${bodyY + H / 2} L${bodyX + (W - pad * 2) - 10} ${bodyY + H - 10}`}
            stroke="#111"
            strokeOpacity={0.22}
            strokeWidth={2}
            fill="none"
          />
          {[0, 1].map((i) => {
            const cx = bodyX + (W - pad * 2) * (i === 0 ? 0.27 : 0.73);
            const cy = bodyY + H / 2;
            return (
              <g key={i} stroke="#111" strokeWidth={2} fill="none">
                <circle cx={cx} cy={cy} r={fanR} />
                <circle cx={cx} cy={cy} r={fanR * 0.42} />
                {[0, 60, 120, 180, 240, 300].map((a) => (
                  <line
                    key={a}
                    x1={cx + fanR * 0.42 * Math.cos((a * Math.PI) / 180)}
                    y1={cy + fanR * 0.42 * Math.sin((a * Math.PI) / 180)}
                    x2={cx + fanR * 0.94 * Math.cos((a * Math.PI) / 180)}
                    y2={cy + fanR * 0.94 * Math.sin((a * Math.PI) / 180)}
                    strokeOpacity={0.45}
                  />
                ))}
              </g>
            );
          })}
          <line
            x1={bodyX - 10}
            y1={bodyY + 6}
            x2={bodyX - 10}
            y2={bodyY + H - 6}
            stroke="#111"
            strokeWidth={3}
          />
          <g stroke="#76b900" strokeWidth={3} fill="none" className={seen ? "nf-drawn" : ""}>
            <line x1={bodyX} y1={bodyY + H + 36} x2={bodyX + (W - pad * 2)} y2={bodyY + H + 36} />
            <line x1={bodyX} y1={bodyY + H + 26} x2={bodyX} y2={bodyY + H + 46} />
            <line x1={bodyX + (W - pad * 2)} y1={bodyY + H + 26} x2={bodyX + (W - pad * 2)} y2={bodyY + H + 46} />
          </g>
          <g
            stroke="#76b900"
            strokeWidth={3}
            fill="none"
            className={seen ? "nf-drawn" : ""}
            style={{ transitionDelay: "250ms" }}
          >
            <line x1={bodyX - 36} y1={bodyY} x2={bodyX - 36} y2={bodyY + H} />
            <line x1={bodyX - 44} y1={bodyY} x2={bodyX - 28} y2={bodyY} />
            <line x1={bodyX - 44} y1={bodyY + H} x2={bodyX - 28} y2={bodyY + H} />
          </g>
          <text
            x={bodyX + (W - pad * 2) / 2}
            y={bodyY + H + 72}
            textAnchor="middle"
            fontSize={20}
            fontWeight={700}
            fill="#111"
            fontFamily="Inter, Noto Sans SC, sans-serif"
          >
            267 mm
          </text>
          <text
            x={bodyX - 46}
            y={bodyY + H / 2}
            textAnchor="middle"
            fontSize={20}
            fontWeight={700}
            fill="#111"
            fontFamily="Inter, Noto Sans SC, sans-serif"
            transform={`rotate(-90 ${bodyX - 46} ${bodyY + H / 2})`}
          >
            111 mm
          </text>
          <text
            x={bodyX + (W - pad * 2) + 16}
            y={bodyY + H / 2 + 6}
            fontSize={16}
            fontWeight={700}
            fill="#111"
            fontFamily="Inter, Noto Sans SC, sans-serif"
          >
            2 槽
          </text>
        </svg>
        <p className="mt-5 border-t-[3px] border-black pt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[#555]">
          按公开规格 1:1 绘制 · 267 × 111 mm · 双槽 · 示意线稿，非官方渲染
        </p>
      </div>
    </div>
  );
}
