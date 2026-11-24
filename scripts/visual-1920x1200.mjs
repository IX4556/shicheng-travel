import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:8080";
const outDir = "screenshots/1920x1200";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const pages = [
  { name: "01-splash", path: "/", wait: 220 },
  { name: "02-home", path: "/home", wait: 700 },
  { name: "03-hotel-detail", path: "/hotel/courtyard", wait: 700 },
  { name: "04-rank", path: "/rank?cat=all", wait: 700 },
  { name: "05-destination", path: "/dest", wait: 700 },
  { name: "06-trips", path: "/trips", wait: 700 },
  { name: "07-profile", path: "/me", wait: 700 },
  { name: "08-spot-detail", path: "/spot/palace", wait: 700 },
];

const reports = [];

for (const item of pages) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1200 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(String(error.message || error)));

  await page.goto(`${base}${item.path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(item.wait);
  const screenshot = `${outDir}/${item.name}.png`;
  await page.screenshot({ path: screenshot, fullPage: false });
  reports.push({
    page: item.name,
    screenshot,
    viewport: await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
    })),
    consoleErrors,
    pageErrors,
  });
  await context.close();
}

async function captureSheet(name, path, action) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1200 } });
  const page = await context.newPage();
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  await action(page);
  await page.waitForTimeout(300);
  const screenshot = `${outDir}/${name}.png`;
  await page.screenshot({ path: screenshot, fullPage: false });
  reports.push({ page: name, screenshot });
  await context.close();
}

await captureSheet("09-home-date-sheet", "/home", async (page) => {
  await page.getByRole("button", { name: /11\.12/ }).click();
});

await captureSheet("10-hotel-room-sheet", "/hotel/courtyard", async (page) => {
  await page.getByRole("button", { name: "选择豪华客房" }).click();
});

console.log(JSON.stringify(reports, null, 2));
await browser.close();
