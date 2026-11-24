import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const base = process.env.BASE_URL ?? "http://127.0.0.1:8080";
const outDir = fileURLToPath(new URL("../screenshots/immersive/", import.meta.url));
mkdirSync(outDir, { recursive: true });
const shot = (name) => join(outDir, name);

const errors = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

function check(condition, message) {
  if (condition) console.log(`PASS  ${message}`);
  else {
    console.error(`FAIL  ${message}`);
    errors.push(message);
  }
}

async function checkButtonInk(selector, message) {
  const ink = await page.locator(selector).first().evaluate((el) => ({
    color: getComputedStyle(el).color,
    background: getComputedStyle(el).backgroundColor,
  }));
  check(ink.color !== ink.background, message);
}

try {
  await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector(".imm-dest-card", { timeout: 30000 });

  check((await page.locator(".imm-section").count()) === 4, "四个导航区位于同一页面");
  await page.waitForTimeout(400);
  await page.locator(".imm-hero-title").click();
  await page.waitForSelector(".imm-detail-page");
  check((await page.locator(".imm-detail-page h1").innerText()).length > 0, "Hero 标题可点击进入专题详情");
  await page.locator(".imm-detail-back").click();
  await page.waitForTimeout(300);
  await page.locator(".imm-hero-stats .imm-stat").first().click();
  await page.waitForSelector(".imm-detail-page");
  check((await page.locator(".imm-detail-page h1").innerText()).includes("故宫"), "统计方框可点击进入对应详情");
  await page.locator(".imm-detail-back").click();
  await page.waitForTimeout(300);
  check((await page.locator(".imm-clickable").count()) >= 20, "页面大量信息块具备点击能力");
  check((await page.locator(".imm-dest-card").count()) === 6, "「全部」默认只展示 6 张目的地图片");
  check((await page.locator(".imm-dest-expand-btn").count()) === 1, "展开更多按钮存在");
  await page.locator(".imm-dest-expand-btn").click();
  await page.waitForTimeout(500);
  check((await page.locator(".imm-dest-card").count()) === 10, "点击展开后显示其余目的地图片");
  const destNames = (await page.locator(".imm-dest-card .imm-dest-body strong").allTextContents()).join("|");
  for (const name of ["故宫博物院", "天安门广场", "人民大会堂", "中国国家博物馆", "天坛公园", "地坛公园", "颐和园", "圆明园", "什刹海", "南锣鼓巷"]) {
    check(destNames.includes(name), `热门景点 ${name} 已出现在目的地卡片`);
  }
  await page.screenshot({ path: shot("desktop-dest-expanded.png") });
  await page.locator(".imm-dest-expand-btn").click();
  await page.waitForTimeout(400);
  check((await page.locator(".imm-dest-card").count()) === 6, "收起后恢复 6 张目的地图片");
  check((await page.locator(".imm-rail-link").allTextContents()).join("") === "01首页02目的地03行程04我的", "桌面侧边四导航标签正确");
  await page.locator(".imm-rail-link", { hasText: "行程" }).click();
  await page.waitForTimeout(700);
  const routeText = (await page.locator(".imm-route-row").allTextContents()).join("|");
  check((await page.locator(".imm-route-row").count()) === 6, "行程章节展示 6 条热门主题路线");
  for (const name of ["中轴一日", "广场建筑线", "博物馆半日", "坛庙清晨", "双园记", "水岸胡同"]) {
    check(routeText.includes(name), `热门路线 ${name} 已展示`);
  }
  check((await page.locator(".imm-gallery").count()) === 1, "全屏城市画廊章节存在");
  check((await page.locator(".imm-moment").count()) === 4, "四个时刻画面存在");
  check((await page.locator(".imm-moment-stage").count()) === 1, "四张时刻大图整合为单一轮播舞台");
  check((await page.locator(".imm-moment-dot").count()) === 4, "时刻轮播提供四个切换锚点");
  check((await page.locator(".imm-moment-arrow").count()) === 3, "时刻轮播提供上一张/下一张/播放控件");
  check((await page.locator(".imm-stat:not(.imm-stat--live)").count()) === 4, "首页统计面板四个方框均有内容");
  check((await page.locator(".imm-dest-card--featured").count()) === 0, "目的地卡片尺寸统一，无跨格特例");
  check((await page.locator(".imm-activity").count()) === 0, "实时互动记录盒子已彻底删除");
  check((await page.locator(".imm-stay-card").count()) === 3, "三张栖居大图卡片存在");

  // 时刻轮播：3 秒自动播放 + 手动切换。
  await page.locator(".imm-moment-stage").scrollIntoViewIfNeeded();
  await page.mouse.move(8, 8);
  await page.waitForTimeout(400);
  const autoStart = await page.locator(".imm-moment.is-active h3").innerText();
  await page.waitForTimeout(3400);
  const autoNext = await page.locator(".imm-moment.is-active h3").innerText();
  check(autoStart !== autoNext, "时刻轮播每 3 秒自动切换画面");
  const firstMoment = await page.locator(".imm-moment.is-active h3").innerText();
  await page.locator('button[aria-label="下一个时刻"]').click();
  await page.waitForTimeout(1100);
  const secondMoment = await page.locator(".imm-moment.is-active h3").innerText();
  check(firstMoment !== secondMoment, "点击下一张后时刻轮播切换画面");
  // 鼠标进入舞台会自动暂停，因此这里的按钮可能已经处于「继续」状态。
  const playLabel = (await page.locator(".imm-moment-play").getAttribute("aria-label")) === "继续轮播" ? "继续轮播" : "暂停轮播";
  await page.locator(`.imm-moment-play[aria-label="${playLabel}"]`).click();
  const nextLabel = playLabel === "继续轮播" ? "暂停轮播" : "继续轮播";
  check((await page.locator(`.imm-moment-play[aria-label="${nextLabel}"]`).count()) === 1, "轮播可暂停/继续");
  await page.locator('.imm-moment-dot[aria-label="查看黄昏的胡同"]').click();
  await page.waitForTimeout(450);
  const duskImage = await page.locator(".imm-moment.is-active img").first().getAttribute("src");
  check(Boolean(duskImage?.includes("nanluoguxiang.jpg")), "黄昏的胡同配图已替换为南锣鼓巷");
  await page.screenshot({ path: shot("desktop-moment-dusk.png") });

  await checkButtonInk(".imm-moment-btn", "白天模式时刻按钮文字与浅色底不冲突");
  await checkButtonInk(".imm-outro-btn", "白天模式结尾按钮文字与浅色底不冲突");

  await page.locator(".imm-rail-link", { hasText: "目的地" }).click();
  await page.waitForTimeout(900);
  check(await page.locator("#section-dest").isVisible(), "导航点击后滚动到目的地章节");
  await page.screenshot({ path: shot("desktop-dest.png") });

  // 每个分类默认三张为一列，展开后显示其余图片。
  const destCardSizes = await page.locator(".imm-dest-card").evaluateAll((nodes) =>
    nodes.slice(0, 6).map((node) => {
      const rect = node.getBoundingClientRect();
      return `${Math.round(rect.width)}x${Math.round(rect.height)}`;
    }),
  );
  check(new Set(destCardSizes).size === 1, `目的地卡片尺寸一致（${destCardSizes[0]}）`);
  for (const label of ["自然山水", "城市夜色", "胡同街巷", "人文古迹"]) {
    await page.locator(".imm-dest .imm-chip", { hasText: label }).click();
    await page.waitForTimeout(350);
    const count = await page.locator(".imm-dest-card").count();
    check(count === 3, `分类「${label}」默认展示 3 张图片`);
    const expandBtn = page.locator(".imm-dest-expand-btn");
    check(await expandBtn.isVisible(), `分类「${label}」的展开按钮始终可见`);
    if (!(await expandBtn.isDisabled())) {
      await expandBtn.click();
      await page.waitForTimeout(350);
      const expandedCount = await page.locator(".imm-dest-card").count();
      check(expandedCount > count, `分类「${label}」展开后显示其余 ${expandedCount - count} 张图片`);
    } else {
      check(count === 3, `分类「${label}」共 3 张图片，按钮禁用但仍可见`);
    }
  }
  await page.locator(".imm-dest .imm-chip", { hasText: "全部" }).click();
  await page.waitForTimeout(350);

  await page.locator(".imm-dest-card .imm-dest-open").first().click();
  await page.waitForSelector(".imm-detail-page");
  check(await page.locator(".imm-detail-page h1").isVisible(), "目的地卡片打开全屏详情页");
  check((await page.locator(".imm-detail-article section").count()) >= 2, "详情页包含多个详细段落");
  check((await page.locator(".imm-detail-related-card").count()) >= 1, "详情页提供相关子页面入口");
  await page.screenshot({ path: shot("desktop-detail.png") });
  await page.locator(".imm-detail-back").click();
  await page.waitForTimeout(300);

  await page.locator(".imm-rail-plan").click();
  await page.waitForSelector(".imm-drawer--form");
  check(await page.locator(".imm-drawer--form h2").isVisible(), "行程规划抽屉打开");
  await page.locator(".imm-style-chips .imm-chip", { hasText: "轻探险" }).click();
  await page.locator(".imm-drawer--form .imm-primary-btn").click();
  await page.waitForTimeout(900);
  check((await page.locator(".imm-drawer--form").count()) === 0, "行程提交后抽屉关闭");

  await page.locator("#section-me").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const noteTitle = "城里的一个下午";
  await page.locator(".imm-notes-head .imm-ghost-btn").click();
  await page.waitForSelector(".imm-modal--compose");
  await page.locator(".imm-modal--compose input").first().fill(noteTitle);
  await page.locator(".imm-modal--compose textarea").fill("沿着胡同慢慢走，把一个下午交给风。");
  await page.locator(".imm-modal--compose .imm-primary-btn").click();
  await page.waitForTimeout(900);
  check((await page.locator(".imm-note-card", { hasText: noteTitle }).count()) >= 1, "手记发布后写回数据库并出现在页面");
  await page.screenshot({ path: shot("desktop-me.png") });

  await page.locator(".imm-stay-card").first().click();
  await page.waitForSelector(".imm-detail-page");
  check((await page.locator(".imm-detail-page h1").innerText()).includes("四合院"), "住宿卡片打开独立详情页");
  await page.locator(".imm-detail-back").click();
  await page.waitForTimeout(300);
  await page.locator(".imm-badge-card").first().click();
  await page.waitForSelector(".imm-detail-page");
  check((await page.locator(".imm-detail-page h1").innerText()).includes("漫游者"), "徽章卡片打开独立详情页");
  await page.locator(".imm-detail-close").click();
  await page.waitForTimeout(300);

  await page.locator("#section-home").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot("desktop-hero.png") });

  // 腾讯地图 · 分类切换、真实地标与降级态
  await page.locator(".imm-rail-link", { hasText: "行程" }).click();
  await page.waitForTimeout(900);
  check((await page.locator(".imm-tmap-canvas").count()) === 1, "腾讯地图容器存在");
  check((await page.locator(".imm-atlas-scale strong").innerText()).includes("腾讯地图"), "地图标注合规来源");
  check((await page.locator(".imm-vmap-stage").count()) === 1, "矢量地图舞台存在");
  check((await page.locator(".imm-vmap-poi").count()) >= 2, "矢量地标按真实经纬度投影");
  check((await page.locator(".imm-vmap-tools button").count()) === 4, "矢量地图提供图层/指南针/缩放控件");
  const firstMapCategory = await page.locator(".imm-vmap-stage").getAttribute("data-category");
  await page.locator(".imm-atlas-switch", { hasText: "皇家园林" }).click();
  await page.waitForTimeout(700);
  const secondMapCategory = await page.locator(".imm-vmap-stage").getAttribute("data-category");
  check(firstMapCategory !== secondMapCategory && secondMapCategory === "gardens", "切换分类后矢量地图视野更新");
  check((await page.locator(".imm-atlas-switch.is-active").innerText()).trim() === "皇家园林", "切换后控件高亮状态同步");
  await page.screenshot({ path: shot("desktop-map-garden.png") });
  await page.locator('.imm-atlas-pager button[aria-label="下一张地图"]').click();
  await page.waitForTimeout(700);
  check((await page.locator(".imm-vmap-stage").getAttribute("data-category")) === "lanes", "翻页按钮继续切换矢量地图视野");

  await page.locator(".imm-atlas-switch", { hasText: "热门地标" }).click();
  await page.waitForTimeout(700);
  const mapInFallback = await page.locator(".imm-tmap-fallback").evaluate((el) => !el.classList.contains("is-hidden"));
  if (mapInFallback) {
    const stage = page.locator(".imm-vmap-stage");
    const beforeView = await stage.getAttribute("viewBox");
    await page.locator('.imm-atlas-actions button[aria-label="放大"]').click();
    await page.waitForTimeout(350);
    const afterZoom = await stage.getAttribute("viewBox");
    check(beforeView !== afterZoom, "按钮缩放改变矢量地图视野");
    const box = await stage.boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + 52, cy + 26, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(350);
      check((await stage.getAttribute("viewBox")) !== afterZoom, "拖拽平移改变矢量地图视野");
    }
    await page.locator(".imm-vmap-poi").nth(1).locator("circle").first().click();
    await page.waitForTimeout(350);
    check((await page.locator(".imm-atlas-card h3").innerText()).includes("天安门"), "点击矢量地标切换详情卡");
    await page.locator(".imm-tmap-fallback-pins button", { hasText: "故宫博物院" }).click();
    await page.waitForTimeout(300);
    await page.locator('.imm-vmap-tools button[aria-label="切换地图图层"]').click();
    check(await page.locator(".imm-vmap").evaluate((el) => el.classList.contains("is-night")), "矢量地图可切换夜间图层");
    await page.locator('.imm-vmap-tools button[aria-label="切换地图图层"]').click();
    await page.waitForTimeout(200);
  } else {
    check((await page.locator(".imm-tmap-canvas canvas").count()) >= 1, "腾讯地图瓦片已真实渲染");
  }
  check((await page.locator(".imm-atlas-card h3").innerText()).includes("故宫"), "详情卡同步当前地标");
  await page.screenshot({ path: shot("desktop-map-focus.png") });
  await page.locator('.imm-atlas-actions button[aria-label="重置视角"]').click();
  await page.waitForTimeout(500);

  // 白天 / 夜间双模式
  await page.locator("#section-home").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.locator(".imm-floating-theme").click();
  check((await page.locator(".imm-page").getAttribute("data-theme-wash")) === "to-dark", "主题切换触发渐变过渡状态");
  const washAnimation = await page.locator(".imm-theme-wash").evaluate((el) => getComputedStyle(el).animationName);
  check(washAnimation.includes("immThemeWash"), "渐变波纹动画已应用");
  await page.waitForTimeout(700);
  check((await page.locator(".imm-page").getAttribute("data-theme")) === "dark", "主题切换为夜间模式");
  await checkButtonInk(".imm-moment-btn", "夜间模式时刻按钮文字与浅色底不冲突");
  await checkButtonInk(".imm-outro-btn", "夜间模式结尾按钮文字与浅色底不冲突");
  await page.screenshot({ path: shot("desktop-hero-dark.png") });
  await page.locator("#section-me").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot("desktop-me-dark.png") });
  check((await page.evaluate(() => window.localStorage.getItem("shicheng-immersive-mode"))) === "dark", "夜间模式选择已持久化");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".imm-dest-card", { timeout: 30000 });
  check((await page.locator(".imm-page").getAttribute("data-theme")) === "dark", "刷新后仍保持夜间模式");
  await page.locator(".imm-floating-theme").click();
  await page.waitForTimeout(500);

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobile.newPage();
  mobilePage.on("pageerror", (error) => errors.push(`mobile pageerror: ${error.message}`));
  await mobilePage.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  await mobilePage.waitForSelector(".imm-dest-card", { timeout: 30000 });
  check(await mobilePage.locator(".imm-mobile-nav").isVisible(), "移动端底部章节导航可见");
  await mobilePage.screenshot({ path: shot("mobile-hero.png") });
  await mobilePage.locator(".imm-mobile-nav-item", { hasText: "目的地" }).click();
  await mobilePage.waitForTimeout(900);
  await mobilePage.screenshot({ path: shot("mobile-dest.png") });
  await mobilePage.locator(".imm-floating-theme").click();
  await mobilePage.waitForTimeout(600);
  check((await mobilePage.locator(".imm-page").getAttribute("data-theme")) === "dark", "移动端主题切换入口可用");
  await mobilePage.screenshot({ path: shot("mobile-dest-dark.png") });
  await mobile.close();

  const health = await page.request.get(`${base}/api/health`);
  const healthJson = await health.json();
  check(health.ok() && healthJson.ok && healthJson.destinations === 10, "健康检查返回数据库统计");

  console.log(`\n截图输出：${outDir}`);
} finally {
  await browser.close();
}

if (errors.length) {
  console.error(`\n${errors.length} e2e check(s) failed:`);
  for (const error of errors) console.error(`FAIL  ${error}`);
  process.exitCode = 1;
} else {
  console.log("\nImmersive e2e checks passed.");
}
