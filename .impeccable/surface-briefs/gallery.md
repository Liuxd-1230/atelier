# Surface brief — gallery 展览主页

Scope: site-level landing surface, outside all project chrome; hosts a registry of independent front-end demos, each with its own visual world. Visitor mode: **Experience/Persuade 之间——同行目录**. 语言 zh-CN。

## Direction contract

THESIS — 画廊无色，展品有色：前言厅只有纸、墨与发丝线，零强调色（不出现陶土），页面上唯一携带色彩的是展品自身——封面截图与其风格标签。它拒绝品类默认的「作品集卡片网格」，用美术馆索引行的编辑式构图代替。

OWN-WORLD — 复用构建栈的纸墨 token（canvas/ink 阶/line/surface），但刻意不用 clay 与一切彩色语义色；衬线大题（思源宋/Newsreader）+ Inter + IBM Plex Mono 读数。目录编号（No.01…）作为可引用的展位号。

STORY — 同行在前言厅读到策展句，扫过展品行：封面、名目、风格标签、两处入口（进入 demo / 设计一览）；对构建中的展品看到诚实的空画框与预告。离开时知道：这是一组各自成立的设计世界，且随时会有下一件。

FIRST VIEWPORT — 顶部 rule + 日期读数；68px 衬线「前端构建 / 审美一览」两行缩进；一句策展句；随后第一条展品行已入画（Atelier 封面 + 名目 + 双入口）。

FORM — 编辑式索引行（非卡片网格），用户在结构问询中选定「中性纸感画廊」世界；code-led 构建。签名交互：封面悬停的轻微抬升与阴影加深（唯一的动效，克制即身份）。展品注册表 `src/lib/projects.ts`——加一件展品 = 一条注册项 + 一张封面。

FINISH — unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
