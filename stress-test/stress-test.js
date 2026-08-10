// Run: npm install && npm start   (requires the Vue app running on :7000)
// Repeats a fixed interaction cycle against the Parts Manager screen and
// writes report.html with heap/DOM/listener readings per cycle.
//
// Independent of the Angular stress-test tool in frontend-poc/stress-test —
// no shared files, no shared dependencies, points at Vue's own ports.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const URL = 'http://localhost:7000/stress-test';
const DEFAULT_CYCLES = 25;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickByText(page, selector, text) {
  const handle = await page.evaluateHandle(
    (sel, txt) => Array.from(document.querySelectorAll(sel)).find((el) => el.textContent?.trim().includes(txt)),
    selector,
    text,
  );
  const el = handle.asElement();
  if (!el) throw new Error(`Could not find "${text}" within "${selector}"`);
  await el.click();
  await handle.dispose();
}

async function runCycle(page) {
  const searchSelector = '.filter-bar__search input';

  // Search, then clear it.
  await page.waitForSelector(searchSelector, { visible: true });
  await page.click(searchSelector, { clickCount: 3 });
  await page.type(searchSelector, 'brake', { delay: 15 });
  await sleep(350);
  await page.click(searchSelector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await sleep(350);

  // Category filter round-trip (Vuetify v-select — click the field to open
  // the menu overlay, then click the matching v-list-item by text).
  await page.click('.filter-bar__category');
  await page.waitForSelector('.v-list-item', { visible: true });
  await clickByText(page, '.v-list-item', 'Brakes');
  await sleep(250);
  await page.click('.filter-bar__category');
  await page.waitForSelector('.v-list-item', { visible: true });
  await clickByText(page, '.v-list-item', 'All');
  await sleep(250);

  // Sort toggle (v-data-table-server column header).
  await clickByText(page, 'th', 'Name');
  await sleep(200);
  await clickByText(page, 'th', 'Name');
  await sleep(200);

  // Open + cancel the Add Part dialog.
  await clickByText(page, '.v-btn', 'Add part');
  await page.waitForSelector('.v-card-actions', { visible: true });
  await sleep(200);
  await clickByText(page, '.v-card-actions .v-btn', 'Cancel');
  await sleep(300);

  // Virtual scroll through the 5,000-row bulk dataset, then back.
  await clickByText(page, '.v-btn', 'Virtual scroll');
  await page.waitForSelector('.virtual-list__viewport', { visible: true });
  await sleep(400);
  const viewport = await page.$('.virtual-list__viewport');
  if (viewport) {
    await viewport.hover();
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel({ deltaY: 1500 });
      await sleep(120);
    }
  }
  await clickByText(page, '.v-btn', 'Paged');
  await sleep(300);
}

async function snapshot(page) {
  // Force a GC pass before reading — otherwise readings are dominated by
  // not-yet-collected garbage rather than what's actually still retained.
  await page.evaluate(() => {
    if (typeof window.gc === 'function') window.gc();
  });
  const m = await page.metrics();
  return {
    heapMB: +(m.JSHeapUsedSize / 1e6).toFixed(1),
    nodes: m.Nodes,
    listeners: m.JSEventListeners,
  };
}

function pct(a, b) {
  return a ? `${(((b - a) / a) * 100).toFixed(1)}%` : 'n/a';
}

function renderHtml(samples, durations) {
  const rows = samples
    .map(
      (s, i) =>
        `<tr><td>${i}</td><td>${i === 0 ? '–' : `${durations[i - 1]}ms`}</td><td>${s.heapMB} MB</td><td>${s.nodes}</td><td>${s.listeners}</td></tr>`,
    )
    .join('\n');

  const first = samples[1] ?? samples[0];
  const last = samples[samples.length - 1];

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Vue stress-test report</title>
<style>
  body { font: 14px/1.5 system-ui, sans-serif; max-width: 720px; margin: 40px auto; color: #1a1a1a; }
  h1 { font-size: 20px; }
  table { border-collapse: collapse; width: 100%; margin-top: 8px; }
  th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: right; }
  th:first-child, td:first-child { text-align: left; }
  .summary { background: #f6f6f6; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; }
  .summary div { margin: 4px 0; }
</style>
</head>
<body>
  <h1>Vue Parts Manager — stress-test report</h1>
  <p>${samples.length - 1} cycles against ${URL}, generated ${new Date().toLocaleString()}</p>
  <div class="summary">
    <div><strong>Heap used:</strong> ${first.heapMB}MB → ${last.heapMB}MB (${pct(first.heapMB, last.heapMB)})</div>
    <div><strong>DOM nodes:</strong> ${first.nodes} → ${last.nodes} (${pct(first.nodes, last.nodes)})</div>
    <div><strong>JS listeners:</strong> ${first.listeners} → ${last.listeners} (${pct(first.listeners, last.listeners)})</div>
    <div><strong>Cycle time:</strong> ${durations[0]}ms (first) → ${durations[durations.length - 1]}ms (last)</div>
  </div>
  <p>A healthy app keeps heap/node/listener growth flat across cycles. Steady growth in any of
  those points at a leak — something not cleaned up when a component is torn down. Rising cycle
  time points at accumulating main-thread cost rather than just memory.</p>
  <table>
    <tr><th>Cycle</th><th>Duration</th><th>Heap used</th><th>DOM nodes</th><th>JS listeners</th></tr>
    ${rows}
  </table>
</body>
</html>`;
}

/**
 * Runs the fixed interaction cycle `cycles` times against the Vue app and
 * returns the raw samples/durations. Shared by the CLI entry point below and
 * by server.js's /stress-test endpoint.
 */
export async function runStressTest(cycles = DEFAULT_CYCLES, onProgress) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--js-flags=--expose-gc'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto(URL, { waitUntil: 'networkidle0' });
  await sleep(500);

  const samples = [await snapshot(page)];
  const durations = [];

  for (let i = 1; i <= cycles; i++) {
    const start = Date.now();
    await runCycle(page);
    durations.push(Date.now() - start);
    samples.push(await snapshot(page));
    onProgress?.(i, cycles);
  }

  await browser.close();
  return { url: URL, cycles, samples, durations, timestamp: new Date().toISOString() };
}

async function main() {
  console.log(`Opening ${URL}`);
  const { samples, durations, cycles } = await runStressTest(DEFAULT_CYCLES, (i, total) =>
    console.log(`Cycle ${i}/${total} done`),
  );

  fs.writeFileSync('report.html', renderHtml(samples, durations));
  console.log(`\nDone (${cycles} cycles). Open stress-test/report.html to view the results.`);
}

// Only auto-run when this file is executed directly (`node stress-test.js`),
// not when server.js imports runStressTest() from it.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
