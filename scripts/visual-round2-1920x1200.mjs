import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:8080";
const outDir = "screenshots/1920x1200-round2";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const screens = [
  { name: "01-lazy-plan", path: "/plan", wait: 700 },
  { name: "02-smart-itinerary", path: "/plan/itinerary", wait: 700 },
  { name: "03-companions", path: "/companions", wait: 700 },
  { name: "04-profile", path: "/me", wait: 700 },
  { name: "05-home-with-shortcuts", path: "/home", wait: 700 },
];

const results = [];

for (const screen of screens) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1200 } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error.message || error)));
  await page.goto(`${base}${screen.path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(screen.wait);
  const screenshot = `${outDir}/${screen.name}.png`;
  await page.screenshot({ path: screenshot, fullPage: false });
  results.push({
    name: screen.name,
    screenshot,
    viewport: await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
    })),
    errors,
  });
  await context.close();
}

async function captureState(name, path, action) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1200 } });
  const page = await context.newPage();
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  await action(page);
  await page.waitForTimeout(300);
  const screenshot = `${outDir}/${name}.png`;
  await page.screenshot({ path: screenshot, fullPage: false });
  results.push({ name, screenshot });
  await context.close();
}

await captureState("06-plan-date-sheet", "/plan", async (page) => {
  await page.getByRole("button", { name: /07\.15/ }).click();
});

await captureState("07-companion-detail", "/companions", async (page) => {
  await page.locator("article").first().getByRole("button").click();
});

console.log(JSON.stringify(results, null, 2));
await browser.close();
