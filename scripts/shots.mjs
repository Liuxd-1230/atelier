import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(String(err)));

const shot = async (name) => {
  await page.screenshot({ path: `${OUT}/${name}.png` });
};

await page.goto("http://localhost:5273/", { waitUntil: "networkidle" });
await page.waitForTimeout(1400);

await shot("01-library");

// Hover a row to check the action reveal + hover surface
await page.getByText("Gemma 3 27B IT").first().hover();
await page.waitForTimeout(400);
await shot("02-row-hover");

// More menu open
await page
  .locator(".model-row", { hasText: "Gemma 3 27B IT" })
  .getByLabel("Gemma 3 27B 的更多操作")
  .click();
await page.waitForTimeout(350);
await shot("03-row-menu");
await page.keyboard.press("Escape");
await page.waitForTimeout(250);

// Inspector
await page.getByText("Qwen3 32B Instruct").first().click();
await page.waitForTimeout(700);
await shot("04-inspector");
await page.locator(".inspector .anim-panel-content").evaluate((el) => (el.scrollTop = 620));
await page.waitForTimeout(400);
await shot("05-inspector-scrolled");

// Palette
await page.keyboard.press("Control+k");
await page.waitForTimeout(400);
await shot("06-palette");
await page.keyboard.type("启动");
await page.waitForTimeout(350);
await shot("07-palette-search");
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

// Filter dropdown open
await page.getByRole("button", { name: "全部类型" }).click();
await page.waitForTimeout(350);
await shot("08-filter-menu");
await page.keyboard.press("Escape");
await page.waitForTimeout(250);

// Compact density
await page.keyboard.press("Control+d");
await page.waitForTimeout(500);
await shot("09-compact");
await page.keyboard.press("Control+d");
await page.waitForTimeout(400);

// Grid view
await page.getByLabel("网格视图").click();
await page.waitForTimeout(500);
await shot("10-grid");
await page.getByLabel("列表视图").click();
await page.waitForTimeout(300);

// Empty state
await page.getByLabel("搜索模型").fill("zzzz");
await page.waitForTimeout(400);
await shot("11-empty");
await page.getByLabel("搜索模型").fill("");
await page.waitForTimeout(300);

// Settings
await page.locator('nav[aria-label="页面"] button', { hasText: "设置" }).click();
await page.waitForTimeout(500);
await shot("12-settings");
await page.locator('nav[aria-label="设置分组"] button', { hasText: "引擎" }).click();
await page.waitForTimeout(400);
await shot("13-settings-engine");
await page.locator('nav[aria-label="设置分组"] button', { hasText: "存储" }).click();
await page.waitForTimeout(400);
await shot("14-settings-storage");
await page.locator('nav[aria-label="设置分组"] button', { hasText: "隐私与通知" }).click();
await page.waitForTimeout(400);
await shot("15-settings-privacy");

// Home
await page.locator('nav[aria-label="页面"] button', { hasText: "首页" }).click();
await page.waitForTimeout(500);
await shot("16-home");

// Downloads
await page.locator('nav[aria-label="页面"] button', { hasText: "下载管理" }).click();
await page.waitForTimeout(500);
await shot("17-downloads");

// Runs
await page.locator('nav[aria-label="页面"] button', { hasText: "运行记录" }).click();
await page.waitForTimeout(500);
await shot("18-runs");

// Collapsed rail
await page.locator('nav[aria-label="页面"] button', { hasText: "模型库" }).click();
await page.waitForTimeout(400);
await page.keyboard.press("Control+b");
await page.waitForTimeout(600);
await shot("19-collapsed");
await page.keyboard.press("Control+b");
await page.waitForTimeout(400);

// Narrow + mobile drawer
await page.setViewportSize({ width: 900, height: 820 });
await page.waitForTimeout(500);
await shot("20-narrow");

await page.setViewportSize({ width: 600, height: 820 });
await page.waitForTimeout(500);
await shot("21-mobile");
await page.getByLabel("打开导航").click();
await page.waitForTimeout(500);
await shot("22-mobile-nav");
await page.mouse.click(500, 400);
await page.waitForTimeout(400);

// Inspector as overlay on narrow
await page.locator(".model-row").first().click();
await page.waitForTimeout(600);
await shot("23-mobile-inspector");
await page.keyboard.press("Escape");
await page.waitForTimeout(400);

// Dark theme
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(400);
await page.keyboard.press("Control+j");
await page.waitForTimeout(700);
await shot("24-dark");
await page.getByText("Qwen3 32B Instruct").first().click();
await page.waitForTimeout(600);
await shot("25-dark-inspector");

// Toast
await page
  .locator(".model-row", { hasText: "Phi-4 Mini" })
  .getByLabel("Phi-4 Mini 的更多操作")
  .click();
await page.waitForTimeout(300);
await page.getByRole("menuitem", { name: "加入收藏" }).click();
await page.waitForTimeout(700);
await shot("26-dark-toast");

console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "NO CONSOLE ERRORS");
await browser.close();
