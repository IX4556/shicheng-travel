import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(String(error.message || error)));

await page.goto("http://127.0.0.1:8080/plan", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
await page.getByRole("button", { name: "使用示例" }).click();
const exampleWorked = await page.getByText(/已填入北京五日慢走示例/).isVisible();
await page.getByRole("button", { name: "拍照出片" }).click();
await page.getByRole("button", { name: /07\.15/ }).click();
await page.getByRole("button", { name: "确认旅行条件" }).click();
await page.getByRole("button", { name: /生成我的5日路线/ }).click();
await page.waitForURL("**/plan/itinerary", { timeout: 5000 });
const planGenerated = page.url().endsWith("/plan/itinerary");

await page.getByRole("button", { name: "下午", exact: true }).click();
const slotChanged = await page.getByRole("heading", { name: "景山公园" }).isVisible();
await page.getByRole("button", { name: /02.*07\.16/ }).click();
const dayChanged = await page.getByRole("heading", { name: "在昆明湖边，把时间放慢" }).isVisible();
await page.getByRole("button", { name: /上海.*两日.*外滩与衡复街区/ }).click();
await page.waitForTimeout(800);
const citySwitchWorked = await page.getByText(/上海路线已准备/).isVisible();

await page.goto("http://127.0.0.1:8080/companions", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
await page.getByRole("button", { name: /^筛选/ }).click();
await page.getByRole("button", { name: "怀柔", exact: true }).click();
await page.getByRole("button", { name: "查看结果" }).click();
const filterWorked = (await page.locator("article").count()) === 2;
await page.getByRole("button", { name: "清除全部" }).click();
await page.getByRole("button", { name: "同城周末" }).click();
const weekendCards = await page.locator("article").count();
await page.locator("article").first().getByRole("button").click();
await page.getByRole("button", { name: "申请加入" }).click();
await page.waitForTimeout(250);
const joinSheetWorked = await page.getByText("已申请").first().isVisible();

await page.getByRole("button", { name: "发起同行" }).click();
await page.getByPlaceholder("例如：周末去慕田峪看日出").fill("周末去天坛拍清晨");
await page.getByPlaceholder("集合地点、步行强度、费用和节奏").fill("早上六点半集合，手机相机都可以。");
await page.getByRole("button", { name: "发布组队邀请" }).click();
await page.waitForTimeout(250);
const createGroupWorked = await page.getByText(/同行邀请已生成/).isVisible();

await page.goto("http://127.0.0.1:8080/me", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
await page.getByRole("button", { name: /待出行/ }).click();
const orderShortcutWorks = page.url().endsWith("/trips");

console.log(
  JSON.stringify(
    {
      planGenerated,
      exampleWorked,
      slotChanged,
      dayChanged,
      citySwitchWorked,
      filterWorked,
      weekendCards,
      joinSheetWorked,
      createGroupWorked,
      orderShortcutWorks,
      errors,
    },
    null,
    2,
  ),
);

await browser.close();
