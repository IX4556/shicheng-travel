import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../src/routes/home.tsx', import.meta.url), 'utf8');
const stage = readFileSync(new URL('../src/components/stage.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const ids = ['section-home', 'section-dest', 'section-guide', 'section-about'];
for (const id of ids) {
  if (!home.includes(`id="${id}"`)) throw new Error(`Missing one-page section: ${id}`);
  if (!stage.includes(`id: "${id}"`)) throw new Error(`Missing navigation target: ${id}`);
}
if (!stage.includes('scrollIntoView({ behavior: "smooth"')) throw new Error('Smooth section navigation is missing');
if (!stage.includes('IntersectionObserver')) throw new Error('Active section tracking is missing');
if (!home.includes('className="home-about-chapter')) throw new Error('About chapter is missing');
if (!css.includes('.reveal-section.is-visible')) throw new Error('Scroll reveal transition is missing');
if (!css.includes('.home-mobile-nav')) throw new Error('Mobile section navigation is missing');
console.log('PASS immersive one-page section IDs and navigation targets');
console.log('PASS smooth-scroll navigation and active-section tracking');
console.log('PASS about chapter, scroll reveal, and mobile section navigation');
