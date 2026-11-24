import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const results = [];

for (const path of ["/plan", "/plan/itinerary", "/companions", "/me"]) {
  await page.goto(`http://127.0.0.1:8080${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  results.push({
    path,
    horizontalOverflow: await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    ),
    bodyTextLength: (await page.locator("body").innerText()).length,
  });
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
