import { ArrowUpRight, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { PROJECTS, type ProjectEntry } from "../../lib/projects";
import { useApp } from "../../store/AppStore";

/**
 * The exhibition lobby. Deliberately colourless — paper, ink, hairlines, no
 * accent — so the only colour on the page belongs to the exhibits.
 */

function ExhibitRow({ project }: { project: ProjectEntry }) {
  const { dispatch } = useApp();

  return (
    <article className="grid items-center gap-x-12 gap-y-7 border-t border-line py-12 first:border-t-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="order-2 min-w-0 lg:order-1">
        <div className="flex items-baseline gap-3">
          <span className="readout text-[11px] text-ink-4">No.{project.no}</span>
          {project.status === "wip" && (
            <span className="readout rounded-full border border-line px-2 py-0.5 text-[9.5px] text-ink-3">
              构建中
            </span>
          )}
        </div>

        <h2 className="mt-3 font-serif text-[30px] font-normal leading-[1.15] text-ink">
          {project.name}
          <span className="ml-3 text-[15px] text-ink-3">{project.kind}</span>
        </h2>

        <p className="mt-3.5 max-w-[460px] text-[13px] leading-[1.7] text-ink-2">
          {project.summary}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {project.styleTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-line px-2.5 py-1 text-[10.5px] text-ink-3"
            >
              {tag}
            </span>
          ))}
        </div>

        {project.status === "live" ? (
          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
            <button
              type="button"
              onClick={() =>
                project.entryPage &&
                dispatch({ type: "navigate", page: project.entryPage })
              }
              className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-ink"
            >
              进入 demo
              <ChevronRight
                size={14}
                strokeWidth={2}
                className="transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </button>
            {project.specimenPage && (
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: "navigate", page: project.specimenPage! })
                }
                className="group inline-flex items-center gap-1.5 text-[12.5px] text-ink-3 transition-colors hover:text-ink"
              >
                设计一览
                <ArrowUpRight
                  size={13}
                  strokeWidth={1.9}
                  className="transition-opacity duration-150 group-hover:opacity-100 sm:opacity-50"
                />
              </button>
            )}
          </div>
        ) : (
          <p className="mt-7 text-[11.5px] text-ink-4">{project.wipNote}</p>
        )}
      </div>

      <div className="order-1 min-w-0 lg:order-2">
        {project.cover ? (
          <button
            type="button"
            onClick={() =>
              project.entryPage &&
              dispatch({ type: "navigate", page: project.entryPage })
            }
            aria-label={`进入 ${project.name}`}
            className="group block w-full cursor-pointer overflow-hidden rounded-[10px] border border-line bg-surface text-left shadow-[var(--shadow-panel)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]"
          >
            <img
              src={project.cover}
              alt={`${project.name} — ${project.kind} 界面预览`}
              className="block w-full"
              loading="lazy"
            />
          </button>
        ) : (
          <div
            className="flex aspect-[16/10] w-full items-center justify-center rounded-[10px] border border-dashed border-line-strong bg-surface-2"
            aria-label="展品尚未完成"
          >
            <span className="readout text-[10.5px] text-ink-4">
              画框已挂好，作品装裱中
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

export function GalleryPage() {
  const live = PROJECTS.filter((p) => p.status === "live").length;

  const dateLine = useMemo(() => {
    const d = new Date();
    const week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 · 星期${week}`;
  }, []);

  return (
    <div className="page-enter h-full overflow-y-auto overflow-x-hidden bg-canvas">
      <div className="mx-auto max-w-[1180px] px-6 pb-24 pt-16 sm:px-10 lg:px-14">
        <div className="flex items-center gap-3">
          <span className="h-px w-[22px] bg-ink/70" aria-hidden />
          <span className="readout text-[10.5px] text-ink-4">{dateLine}</span>
        </div>

        <h1 className="display-hero mt-6">
          前端构建
          <span className="display-hero-indent">审美一览</span>
        </h1>

        <p className="display-sub mt-7 max-w-[540px]">
          一组独立构建的前端 demo，每件有自己的视觉世界。这里只负责装裱与照明——
          <span className="font-normal text-ink">画廊无色，展品有色。</span>
        </p>

        <div className="mt-14">
          <div className="flex items-baseline justify-between border-b border-line-strong pb-3.5">
            <h2 className="text-[12.5px] font-medium text-ink">展品</h2>
            <span className="readout text-[10.5px] text-ink-4">
              {live} / {PROJECTS.length} 件在展
            </span>
          </div>
          {PROJECTS.map((project) => (
            <ExhibitRow key={project.id} project={project} />
          ))}
        </div>

        <div className="border-t border-line-strong pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a
              href="https://github.com/Liuxd-1230/atelier"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-[12px] text-ink-3 transition-colors hover:text-ink"
            >
              GitHub 仓库
              <ArrowUpRight
                size={12}
                strokeWidth={1.9}
                className="transition-opacity duration-150 group-hover:opacity-100 sm:opacity-50"
              />
            </a>
            <p className="text-[10.5px] text-ink-4">
              画廊与展品由同一份构建栈驱动 · React 19 · Vite 8
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
