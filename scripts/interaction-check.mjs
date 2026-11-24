import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(String(error.message || error)));

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1800);
const splashAutoEntered = page.url().endsWith("/home");
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(250);
const splashSessionSkip = page.url().endsWith("/home");

await page.goto("http://127.0.0.1:8080/home", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
await page.getByPlaceholder("搜景点、酒店或玩法").last().fill("故宫");
await page.getByRole("heading", { name: /“故宫”的结果/ }).waitFor();
const searchResult = await page.getByText("故宫博物院").first().isVisible();
await page.getByRole("button", { name: "清除搜索" }).last().click();

await page.getByRole("button", { name: /11\.12/ }).click();
await page.getByRole("button", { name: /2026-11-20/ }).click();
await page.getByRole("button", { name: /2026-11-22/ }).click();
await page.getByRole("button", { name: "确认入住条件" }).click();
const updatedRange = await page.getByRole("button", { name: /11\.20/ }).isVisible();

await page.goto("http://127.0.0.1:8080/hotel/courtyard", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
await page.getByRole("button", { name: "选择豪华客房" }).click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: "确认加入行程" }).click();
await page.waitForTimeout(250);
const reserved = await page.getByRole("button", { name: "豪华客房已预订" }).isVisible();

await page.goto("http://127.0.0.1:8080/trips", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
const bookingVisible = await page.getByText("豪华客房").first().isVisible();

console.log(
  JSON.stringify(
    {
      splashAutoEntered,
      splashSessionSkip,
      searchResult,
      updatedRange,
      reserved,
      bookingVisible,
      errors,
    },
    null,
    2,
  ),
);
await browser.close();
