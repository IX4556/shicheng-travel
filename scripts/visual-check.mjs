import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:8080";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function openPage(path, viewport, screenshot, options = {}) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(String(error.message || error)));
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(options.wait ?? 500);
  if (options.action) await options.action(page);
  await page.screenshot({ path: screenshot, fullPage: options.fullPage ?? false });
  const report = {
    path,
    screenshot,
    horizontalOverflow: await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    ),
    consoleErrors,
    pageErrors,
  };
  await page.close();
  return report;
}

const reports = [];
reports.push(
  await openPage("/", { width: 390, height: 844 }, "screenshots/redesign-splash-mobile.png", {
    wait: 180,
    fullPage: true,
  }),
);
reports.push(
  await openPage("/home", { width: 390, height: 844 }, "screenshots/redesign-home-mobile.png", {
    wait: 700,
    fullPage: true,
  }),
);
reports.push(
  await openPage("/home", { width: 1440, height: 900 }, "screenshots/redesign-home-desktop.png", {
    wait: 700,
    fullPage: true,
  }),
);
reports.push(
  await openPage(
    "/home",
    { width: 390, height: 844 },
    "screenshots/redesign-home-date-sheet.png",
    {
      wait: 500,
      action: async (page) => {
        await page.getByRole("button", { name: /11\.12/ }).click();
        await page.waitForTimeout(250);
      },
    },
  ),
);
reports.push(
  await openPage(
    "/hotel/courtyard",
    { width: 390, height: 844 },
    "screenshots/redesign-hotel-mobile.png",
    {
      wait: 700,
      fullPage: true,
    },
  ),
);
reports.push(
  await openPage(
    "/hotel/courtyard",
    { width: 1440, height: 900 },
    "screenshots/redesign-hotel-desktop.png",
    {
      wait: 700,
      fullPage: true,
    },
  ),
);
reports.push(
  await openPage(
    "/hotel/courtyard",
    { width: 390, height: 844 },
    "screenshots/redesign-hotel-room-sheet.png",
    {
      wait: 500,
      action: async (page) => {
        await page.getByRole("button", { name: "选择", exact: true }).first().click();
        await page.waitForTimeout(250);
      },
    },
  ),
);

console.log(JSON.stringify(reports, null, 2));
await browser.close();
