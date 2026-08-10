// Run: npm run dashboard   (serves the button-driven dashboard at :4400)
// Neither this file nor anything else in stress-test/ is imported by the
// Vue app's src/ — vite build never sees it, so it can't affect the app's
// own bundle size. Independent of the Angular dashboard (frontend-poc/
// stress-test) — no shared files, no shared dependencies, different port.
import express from 'express';
import cors from 'cors';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { runStressTest } from './stress-test.js';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const DIST_ASSETS_DIR = path.join(APP_ROOT, 'dist', 'assets');
const DIST_INDEX_HTML = path.join(APP_ROOT, 'dist', 'index.html');
const PORT = 4400;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/build', async (req, res) => {
  try {
    const start = Date.now();
    await execAsync('npm run build', { cwd: APP_ROOT, timeout: 120_000 });
    const durationMs = Date.now() - start;

    const indexHtml = fs.readFileSync(DIST_INDEX_HTML, 'utf-8');
    const referenced = new Set(
      [...indexHtml.matchAll(/(?:src|href)="[^"]*\/(assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]),
    );

    const files = fs.readdirSync(DIST_ASSETS_DIR).filter((f) => f.endsWith('.js') || f.endsWith('.css'));
    const rows = files
      .map((file) => {
        const full = path.join(DIST_ASSETS_DIR, file);
        const raw = fs.statSync(full).size;
        const gzip = zlib.gzipSync(fs.readFileSync(full)).length;
        const type = referenced.has(`assets/${file}`) ? 'initial' : 'lazy';
        return { file, type, raw, gzip };
      })
      .sort((a, b) => (a.type === b.type ? b.raw - a.raw : a.type === 'initial' ? -1 : 1));

    const initialRaw = rows.filter((r) => r.type === 'initial').reduce((s, r) => s + r.raw, 0);
    const initialGzip = rows.filter((r) => r.type === 'initial').reduce((s, r) => s + r.gzip, 0);

    res.json({ durationMs, rows, initialRaw, initialGzip, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/stress-test', async (req, res) => {
  try {
    const cycles = Number(req.body?.cycles) || 25;
    const result = await runStressTest(cycles);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});
