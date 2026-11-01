import type { PageId } from "./types";
import { assetUrl } from "./utils";

/**
 * The exhibition registry — one entry per project demo on the site.
 * Adding an exhibit: add an entry here, drop a cover into /public/gallery,
 * and (optionally) build its 设计一览 page.
 */
export interface ProjectEntry {
  id: string;
  /** Exhibit number in the catalog, e.g. "01". */
  no: string;
  name: string;
  kind: string;
  summary: string;
  styleTags: string[];
  cover?: string;
  status: "live" | "wip";
  /** Where the demo itself lives, for live entries. */
  entryPage?: PageId;
  /** The project's own 设计一览 page, when one exists. */
  specimenPage?: PageId;
  /** Honest progress note for wip entries. */
  wipNote?: string;
}

export const PROJECTS: ProjectEntry[] = [
  {
    id: "atelier",
    no: "01",
    name: "Atelier",
    kind: "llama.cpp 模型管理台",
    summary:
      "本地大模型的全生命周期工作台：库、下载、运行、记录、设置在一个界面里互相连贯，数据全部本地模拟。",
    styleTags: ["暖纸底", "编辑式极简", "精密仪器"],
    cover: assetUrl("gallery/atelier-cover.jpg"),
    status: "live",
    entryPage: "library",
    specimenPage: "design",
  },
  {
    id: "nvidia-pro-6000",
    no: "02",
    name: "RTX PRO 6000",
    kind: "杂志感产品介绍页",
    summary:
      "一张 96 GB 专业显卡的单页特稿：参数当作排版来读，尺寸按比例绘图，动效只做揭示与计数。",
    styleTags: ["工业年刊", "参数即排版", "NVIDIA 绿"],
    cover: assetUrl("gallery/nvidia-cover.jpg"),
    status: "live",
    entryPage: "nvidia",
  },
];
