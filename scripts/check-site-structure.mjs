import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const failures = [];
const pass = (message) => console.log(`PASS  ${message}`);
const fail = (message) => failures.push(message);

const requiredRoutes = [
  "/home",
  "/dest",
  "/trips",
  "/plan",
  "/plan/itinerary",
  "/me",
  "/rank",
  "/companions",
  "/spot/$id",
  "/hotel/$id",
];
const routeTree = read("src/routeTree.gen.ts");
for (const route of requiredRoutes) {
  if (routeTree.includes(`'${route}'`) || routeTree.includes(`path: '${route}'`)) {
    pass(`route ${route} is registered`);
  } else {
    fail(`route ${route} is missing from routeTree.gen.ts`);
  }
}

const stage = read("src/components/stage.tsx");
for (const label of ["首页", "目的地", "行程", "我的"]) {
  if (stage.includes(`label: "${label}"`)) pass(`primary navigation includes ${label}`);
  else fail(`primary navigation is missing ${label}`);
}
for (const routeRule of [
  'pathname === "/home"',
  'pathname === "/dest" || pathname.startsWith("/spot/") || pathname === "/rank"',
  'pathname === "/trips" || pathname.startsWith("/plan") || pathname.startsWith("/hotel/")',
  'pathname === "/me" || pathname.startsWith("/companions")',
]) {
  if (stage.includes(routeRule)) pass(`navigation active-state rule exists`);
  else fail(`navigation active-state rule missing: ${routeRule}`);
}

const routeFiles = [
  "src/routes/home.tsx",
  "src/routes/dest.tsx",
  "src/routes/trips.tsx",
  "src/routes/plan.tsx",
  "src/routes/plan_.itinerary.tsx",
  "src/routes/me.tsx",
  "src/routes/rank.tsx",
  "src/routes/companions.tsx",
  "src/routes/spot.$id.tsx",
  "src/routes/hotel.$id.tsx",
];
for (const file of routeFiles) {
  const source = read(file);
  if (source.includes("<Stage")) pass(`${file} uses shared site shell`);
  else fail(`${file} does not use shared site shell`);
  if (source.includes("tabs={false}")) fail(`${file} disables global navigation`);
}

const css = read("src/styles.css");
for (const token of ["--ds-nav-rail: 112px", "--ds-content: 1280px", "--site-bg: var(--page-bg)", "--site-surface: var(--card-bg)", "--site-accent: var(--brand-cinnabar)"]) {
  if (css.toLowerCase().includes(token.toLowerCase())) pass(`design token ${token}`);
  else fail(`design token missing: ${token}`);
}
if (/\.site-right-nav\s*\{[^}]*position:\s*fixed/s.test(css)) pass("desktop right navigation is fixed");
else fail("desktop right navigation is not fixed");
if (/\.mobile-tabbar\s*\{[^}]*position:\s*fixed/s.test(css)) pass("mobile navigation is fixed");
else fail("mobile navigation is not fixed");
if (css.includes("@media (max-width: 1023px)") && css.includes("@media (max-width: 760px)")) pass("tablet and mobile breakpoints exist");
else fail("tablet/mobile breakpoints are incomplete");

const pwa = read("scripts/grok-pwa-shared.mjs");
const installHtml = read("scripts/install-page.html");
if (!pwa.includes('"#000000"') && pwa.includes('"#1D2932"')) pass("PWA manifest uses graphite background");
else fail("PWA manifest still uses black or misses graphite background");
if (!installHtml.includes('content="#000000"') && installHtml.includes('content="#1D2932"')) pass("install page theme-color uses graphite background");
else fail("install page theme-color is still black or missing");

const sourceFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const relative = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) walk(relative);
    else if (/\.(?:ts|tsx|js|jsx|mjs)$/.test(entry.name)) sourceFiles.push(relative);
  }
}
walk("src");
const missingAssets = new Set();
for (const file of sourceFiles) {
  const source = read(file);
  for (const match of source.matchAll(/\/photos\/[A-Za-z0-9._-]+/g)) {
    const asset = match[0];
    if (!fs.existsSync(path.join(root, "public", asset.slice(1)))) missingAssets.add(`${file}: ${asset}`);
  }
}
if (missingAssets.size === 0) pass("all statically referenced /photos assets exist");
else for (const asset of missingAssets) fail(`missing public asset ${asset}`);

if (failures.length) {
  console.error(`\n${failures.length} site-structure check(s) failed:`);
  for (const failure of failures) console.error(`FAIL  ${failure}`);
  process.exitCode = 1;
} else {
  console.log("\nSite structure check passed.");
}
