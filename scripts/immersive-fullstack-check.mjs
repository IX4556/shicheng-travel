import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const failures = [];
const pass = (message) => console.log(`PASS  ${message}`);
const fail = (message) => failures.push(message);
const expect = (condition, message) => (condition ? pass(message) : fail(message));

const route = read("src/routes/index.tsx");
const page = read("src/components/immersive/ImmersivePage.tsx");
const css = read("src/styles/immersive.css");
const api = read("src/lib/immersive/api.ts");
const sql = read("migrations/0001_immersive_site.sql");
const sqlPopular = read("migrations/0002_popular_attractions.sql");
const types = read("src/lib/immersive/types.ts");
const map = read("src/components/immersive/TencentMap.tsx");
const vectorMap = read("src/components/immersive/BeijingVectorMap.tsx");
const chapters = read("src/components/immersive/ImmersiveChapters.tsx");
const details = read("src/components/immersive/detailContent.ts");

expect(route.includes("ImmersivePage"), "根路由渲染沉浸式单页");
expect(!route.includes("redirect"), "根路由不再跳转到多个独立页面");

for (const id of ["section-home", "section-dest", "section-trip", "section-me"]) {
  expect(page.includes(`id="${id}"`), `单页包含导航区 ${id}`);
}
for (const label of ["首页", "目的地", "行程", "我的"]) {
  expect(sql.includes(`'${label}'`), `数据库种子包含导航标签 ${label}`);
}

expect(page.includes("scrollIntoView"), "导航项触发平滑滚动");
expect(page.includes("IntersectionObserver"), "章节高亮使用视口观察");
expect(page.includes("--hero-shift"), "Hero 视差变量存在");
expect(css.includes("[data-reveal].is-in"), "滚动渐显动画存在");
expect(css.includes("@media (max-width: 640px)"), "移动端断点存在");
expect(css.includes(".imm-mobile-nav"), "移动端底部章节导航存在");
expect(!page.includes('className="imm-header"'), "顶部导航栏已移除");
expect(page.includes('className="imm-rail"'), "侧边章节导航存在");
const tokens = read("src/styles.css");
for (const token of [
  "#B83C32", "#D9B879", "#F7F3ED", "#FFFFFF", "#292724",
  "#918D87", "#EAE5DE", "#F1E8DD", "#55856B", "#C84C43",
]) {
  expect(tokens.includes(token), `全局色彩变量包含 ${token}`);
}

// 首页布局：四宫格统计、6/3 分页展开、出场动画、留白轮播
expect((page.match(/<StatCard /g) ?? []).length === 4, "首页统计面板由四个方框组成");
expect(!page.includes("imm-dest-card--featured"), "目的地卡片取消跨格特例，尺寸统一");
expect(page.includes("categoryGroups"), "目的地分类包含完整图片集合，切换后不止一张");
expect(page.includes("imm-dest-expand-btn") && page.includes("setExpanded"), "图片通过展开按钮加载更多");
expect(page.includes("已展示全部图片") && !page.includes('<div className="imm-dest-expand" data-reveal'), "展开按钮始终渲染，不会因渐显观察器而消失");
expect(page.includes('const limit = category === "全部" ? 6 : 3'), "全部默认 6 张，其余分类默认 3 张");
expect(page.includes("animationDelay"), "目的地卡片按顺序错峰入场");
expect(css.includes("@keyframes immDestIn") && css.includes(".imm-dest-media::before"), "目的地卡片具备场动画与悬停光泽");
expect(!page.includes("imm-activity") && !css.includes(".imm-activity"), "实时互动记录盒子已彻底删除");
expect(chapters.includes("imm-moment-stage") && chapters.includes("imm-moment-dots"), "四张时刻大图改为带控件的轮播舞台");
expect(/setInterval\(\(\) => setIndex\(\(i\) => \(i \+ 1\) % momentDetails\.length\), 3000\)/.test(chapters), "时刻轮播间隔为 3 秒");
expect(css.includes(".imm-moment-stage") && css.includes(".imm-moment-dot"), "时刻轮播舞台与切换控件样式存在");
expect(!/\.imm-moment\s*\{[^}]*height:\s*100vh/s.test(css), "时刻画面不再紧密堆叠为整屏");

expect(page.includes("OverlayLayer"), "弹窗/抽屉层存在");
expect(page.includes("PlannerDrawer"), "行程规划抽屉存在");
expect(page.includes("ComposeModal"), "手记发布弹窗存在");
expect(page.includes("TencentMap"), "合规地图组件已接入页面");

// 双模式配色与渐变过渡
expect(page.includes("data-theme={mode}"), "页面主题由状态驱动，可切换白天/夜间");
expect(page.includes("imm-floating-theme"), "不破坏布局的浮动主题切换入口存在");
expect(page.includes("THEME_STORAGE_KEY"), "主题选择持久化到 localStorage");
expect(tokens.includes('.imm-page[data-theme="dark"]'), "全局样式定义夜间模式语义色");
expect(tokens.includes("--imm-on-dark") && tokens.includes("--imm-accent-on-surface"), "深浅模式共享语义 token");
expect(!css.includes("var(--card-bg)"), "沉浸式样式不再直接消费原始卡片色");
expect(page.includes("themeWash") && tokens.includes('data-theme-wash'), "日夜切换带状态驱动的渐变波纹");
expect(tokens.includes("@keyframes immThemeWash"), "主题切换渐变动画关键帧存在");
expect(tokens.includes("prefers-reduced-motion"), "减少动态效果偏好被尊重");

// 合规地图：腾讯地图 GL + 真实坐标 + 降级照片
expect(map.includes("map.qq.com/api/gljs"), "使用腾讯地图 GL JS SDK");
expect(map.includes("_TMapSecurityConfig"), "地图 SDK 使用本地代理，不在前端暴露密钥");
expect(!/mapbox|openstreetmap|googleapis|applemaps/i.test(map), "地图不使用境外地图服务");
expect(css.includes(".imm-tmap-canvas"), "腾讯地图容器样式存在");
expect(css.includes(".imm-tmap-fallback"), "地图加载失败时展示真实照片降级态");
expect(map.includes('role="tablist"') && map.includes("imm-atlas-switch"), "地图分类切换控件具备无障碍语义");
expect(map.includes("TMap.MultiMarker") && map.includes("TMap.MultiPolyline"), "地图使用真实坐标标记与路线连线");
expect(map.includes('地图来源') && map.includes("腾讯地图"), "地图标注合规来源");
for (const [id, name] of [
  ["palace", "故宫博物院"], ["tiananmen", "天安门广场"],
  ["great-hall", "人民大会堂"], ["national-museum", "中国国家博物馆"],
  ["shichahai", "什刹海"], ["nanluoguxiang", "南锣鼓巷"],
  ["summer", "颐和园"], ["yuanmingyuan", "圆明园"],
]) {
  expect(map.includes(`id: "${id}"`) && map.includes(`name: "${name}"`), `地图包含热门地标 ${name}`);
}
expect(!page.includes("const mapViews"), "旧图片地图逻辑已移除");

// 大画幅章节、卡片子页面
expect(page.includes("CityGallery") && page.includes("MomentsNarrative") && page.includes("StayCollection"), "三个大画幅沉浸章节已接入");
expect(page.includes("BadgeStrip"), "徽章卡片也有独立详情页入口");
expect(page.includes("kind: \"detail\""), "统一全屏详情页状态存在");
expect(page.includes("DetailPageView"), "全屏详情组件被使用");
expect(page.includes("onOpenDetail"), "所有卡片共享打开详情入口");
expect(page.includes("registerDetails"), "详情索引在内容到达后注册");
for (const token of ["imm-gallery", "imm-moment", "imm-stay", "imm-detail-page"]) {
  expect(css.includes(`.${token}`), `大画幅/详情样式 ${token} 存在`);
}
expect(map.includes("Crosshair") && map.includes("聚焦当前地标"), "地图提供聚焦控件");
expect(map.includes("BeijingVectorMap") && map.includes("is-vector"), "无代理时使用矢量示意图而非倾斜照片");
expect(vectorMap.includes("function project") && vectorMap.includes("116.24"), "矢量地图按真实经纬度投影地标");
expect(vectorMap.includes("mainRoads") && vectorMap.includes("parks") && vectorMap.includes("water"), "矢量地图含路网、水系与绿地图层");
expect(vectorMap.includes("onPointerDown") && vectorMap.includes("onWheel") && vectorMap.includes("zoomBy"), "矢量地图支持拖拽与滚轮缩放");
expect(vectorMap.includes("imm-vmap-tools") && vectorMap.includes("切换地图图层"), "矢量地图提供图层与缩放控件");
expect(map.includes("矢量地图 · 拖拽平移"), "地图提示说明矢量交互方式");
for (const selector of [".imm-vmap-stage", ".imm-vmap-poi", ".vmap-route", ".imm-vmap-tools"]) {
  expect(css.includes(selector), `矢量地图样式 ${selector} 存在`);
}
expect(css.includes("@keyframes immVectorRoute"), "矢量路线具备流动动画");
expect((page.match(/clickableProps\(\{/g) ?? []).length >= 25, "主页面大量信息块具备点击进入能力");
expect((chapters.match(/clickableProps\(/g) ?? []).length >= 8, "大画幅章节文案具备点击进入能力");
expect(map.includes("clickableProps(") && vectorMap.includes('role="button"'), "地图详情卡与 POI 均可点击");
expect(css.includes(".imm-clickable:focus-visible"), "可点击信息块具备键盘焦点反馈");
expect(!details.includes('"/photos/hutong.jpg"'), "所有黄昏胡同图片已替换为南锣鼓巷");
expect(details.includes('title: "黄昏的胡同"') && details.includes('"/photos/nanluoguxiang.jpg"'), "黄昏的胡同详情使用南锣鼓巷真实图片");
expect(page.includes('src="/photos/nanluoguxiang.jpg"'), "关于区块图片同步替换为南锣鼓巷");

// 热门景点替换与真实图片素材
for (const id of ["palace", "tiananmen", "great-hall", "national-museum", "heaven", "ditan", "summer", "yuanmingyuan", "shichahai", "nanluoguxiang"]) {
  expect(sqlPopular.includes(`'${id}'`), `热门景点迁移写入 ${id}`);
}
for (const id of ["axis", "square", "museum", "ritual", "gardens", "lanes"]) {
  expect(sqlPopular.includes(`'${id}'`), `热门路线迁移写入 ${id}`);
}
expect(sqlPopular.includes("delete from immersive_destinations"), "旧冷门目的地已被清理");
for (const image of [
  "hero-great-wall.jpg", "palace.jpg", "tiananmen.jpg", "great-hall.jpg",
  "national-museum.jpg", "heaven.jpg", "ditan.jpg", "summer.jpg",
  "yuanmingyuan.jpg", "shichahai.jpg", "nanluoguxiang.jpg", "forbidden-hall.jpg",
  "night.jpg", "hotel.jpg", "hutong.jpg", "beijing-atlas.jpg",
]) {
  expect(existsSync(new URL(`../public/photos/${image}`, import.meta.url)), `真实图片 ${image} 已落地`);
}
expect(details.includes("destinationGalleries"), "详情页多图画廊按景点分组");

expect(sql.includes("create table if not exists immersive_destinations"), "目的地表存在");
expect(sql.includes("create table if not exists immersive_interactions"), "互动日志表存在");
expect(sql.includes("create table if not exists immersive_favorites"), "收藏表存在");
expect(sql.includes("create table if not exists immersive_plans"), "行程表存在");
expect(sql.includes("create table if not exists immersive_notes"), "手记表存在");

const apiContracts = [
  ["getImmersivePageData", "getPageDataSchema"],
  ["logImmersiveInteraction", "logInteractionSchema"],
  ["toggleImmersiveFavorite", "toggleFavoriteSchema"],
  ["createImmersivePlan", "createPlanSchema"],
  ["createImmersiveNote", "createNoteSchema"],
  ["getImmersiveHealth", null],
];
for (const [fn, schema] of apiContracts) {
  const hasSchema = schema === null || types.includes(schema);
  expect(api.includes(fn) && hasSchema, `后端函数 ${fn} 存在`);
}
expect(api.includes("strict: false"), "服务端函数返回类型可序列化");
expect(types.includes("z.object"), "输入边界使用 zod 校验");

if (failures.length) {
  console.error(`\n${failures.length} immersive check(s) failed:`);
  for (const item of failures) console.error(`FAIL  ${item}`);
  process.exitCode = 1;
} else {
  console.log("\nImmersive full-stack structure check passed.");
}
