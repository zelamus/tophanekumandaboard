import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const app = express();
app.use(express.json({ limit: '8mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const fileFor = (id) => path.join(DATA_DIR, `${id}.json`);

// Tüm kayıtların listesi
app.get('/api/saves', (_req, res) => {
  const items = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).map(f => {
    try {
      const doc = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
      return { id: doc.id, name: doc.name, updatedAt: doc.updatedAt, kind: doc.kind ?? 'kullanıcı' };
    } catch { return null; }
  }).filter(Boolean).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  res.json(items);
});

app.get('/api/saves/:id', (req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(fileFor(req.params.id), 'utf8'))); }
  catch { res.status(404).json({ error: 'bulunamadı' }); }
});

app.post('/api/saves', (req, res) => {
  const { id, name, doc } = req.body ?? {};
  if (!name || !doc) return res.status(400).json({ error: 'name ve doc gerekli' });
  const sid = id ?? crypto.randomUUID();
  const payload = { id: sid, name, updatedAt: new Date().toISOString(), doc };
  fs.writeFileSync(fileFor(sid), JSON.stringify(payload, null, 2), 'utf8');
  res.status(201).json(payload);
});

app.delete('/api/saves/:id', (req, res) => {
  try { fs.rmSync(fileFor(req.params.id)); res.json({ ok: true }); }
  catch { res.status(404).json({ error: 'bulunamadı' }); }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 8787;
app.listen(PORT, () => console.log(`Kayıt sunucusu hazır: http://localhost:${PORT}`));
