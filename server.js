#!/usr/bin/env node
/**
 * server.js — Minimal Express server for the Chanel Image Batch Tool
 *
 * - Serves the app (index.html)
 * - Serves local images for "before" preview
 * - REST endpoints for inventory and groups persistence
 *
 * Usage: node server.js
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { scrape } = require('./scraper');

const PORT = 3000;
const IMAGES_ROOT = path.resolve(__dirname, '..', 'chanel_images');
const INVENTORY_FILE = path.join(__dirname, 'inventory.json');
const GROUPS_FILE = path.join(__dirname, 'groups.json');

const app = express();
app.use(express.json({ limit: '10mb' }));

let scanRunning = false;

// Serve the app
app.use(express.static(__dirname));

// Serve local images (for "before" preview fallback)
app.use('/images', express.static(IMAGES_ROOT, {
  maxAge: '1d',
  immutable: true
}));

// GET inventory
app.get('/api/inventory', (req, res) => {
  if (!fs.existsSync(INVENTORY_FILE)) {
    return res.status(404).json({ error: 'Run "node scan.js" first to generate inventory.' });
  }
  res.sendFile(INVENTORY_FILE);
});

// POST inventory (save updated inventory)
app.post('/api/inventory', (req, res) => {
  fs.writeFileSync(INVENTORY_FILE, JSON.stringify(req.body, null, 2));
  res.json({ ok: true, count: req.body.images?.length || 0 });
});

// GET groups
app.get('/api/groups', (req, res) => {
  if (!fs.existsSync(GROUPS_FILE)) {
    return res.json({ groups: [] });
  }
  res.sendFile(GROUPS_FILE);
});

// POST groups (save)
app.post('/api/groups', (req, res) => {
  fs.writeFileSync(GROUPS_FILE, JSON.stringify(req.body, null, 2));
  res.json({ ok: true, saved: req.body.groups?.length || 0 });
});

// POST export (generate final mapping)
app.post('/api/export', (req, res) => {
  const { groups } = req.body;
  if (!groups || !groups.length) {
    return res.status(400).json({ error: 'No groups to export' });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportDir = path.join(__dirname, 'exports');
  fs.mkdirSync(exportDir, { recursive: true });
  const exportFile = path.join(exportDir, `export-${timestamp}.json`);

  fs.writeFileSync(exportFile, JSON.stringify(req.body, null, 2));
  res.json({ ok: true, file: exportFile });
});

// POST export-images (download transformed images from Cloudinary)
app.post('/api/export-images', async (req, res) => {
  const { group_name, format, images } = req.body;
  if (!images || !images.length) {
    return res.status(400).json({ error: 'No images' });
  }

  const safeName = (group_name || 'export').replace(/[^a-zA-Z0-9_-]/g, '_');
  const outDir = path.join(__dirname, 'exports', safeName);
  fs.mkdirSync(outDir, { recursive: true });

  // Stream progress as newline-delimited JSON
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Transfer-Encoding', 'chunked');

  let downloaded = 0;
  let errors = 0;

  for (const img of images) {
    try {
      // Force format via Cloudinary URL: replace f_auto with f_{format}
      let url = img.url;
      if (format && format !== 'jpg') {
        url = url.replace(/f_auto/, `f_${format}`);
      }

      const response = await fetch(url);
      if (!response.ok) {
        errors++;
        res.write(JSON.stringify({ progress: `${downloaded + errors} / ${images.length} (${errors} erreurs)`, percent: Math.round(((downloaded + errors) / images.length) * 100) }) + '\n');
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const ext = format || 'jpg';
      const outFilename = img.filename.replace(/\.\w+$/, `.${ext}`);
      fs.writeFileSync(path.join(outDir, outFilename), buffer);
      downloaded++;
    } catch (e) {
      errors++;
    }

    res.write(JSON.stringify({
      progress: `${downloaded + errors} / ${images.length}${errors ? ` (${errors} erreurs)` : ''}`,
      percent: Math.round(((downloaded + errors) / images.length) * 100)
    }) + '\n');
  }

  res.write(JSON.stringify({ done: true, total: downloaded, errors, folder: `exports/${safeName}` }) + '\n');
  res.end();
});

// GET scan status
app.get('/api/scan/status', (req, res) => {
  res.json({ running: scanRunning });
});

// POST scan (launch Playwright scraper)
app.post('/api/scan', async (req, res) => {
  const { urls } = req.body;
  if (!urls || !urls.length) {
    return res.status(400).json({ error: 'No URLs provided' });
  }
  if (scanRunning) {
    return res.status(409).json({ error: 'Un scan est déjà en cours' });
  }

  scanRunning = true;
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Transfer-Encoding', 'chunked');

  const emit = (msg) => {
    try { res.write(JSON.stringify(msg) + '\n'); } catch {}
  };

  try {
    await scrape(urls, emit);
  } catch (e) {
    emit({ error: e.message });
  } finally {
    scanRunning = false;
    res.end();
  }
});

// POST open-folder (open in Finder)
app.post('/api/open-folder', (req, res) => {
  const { folder } = req.body;
  if (!folder) return res.status(400).json({ error: 'No folder' });
  const fullPath = path.resolve(__dirname, folder);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Folder not found' });
  require('child_process').spawn('open', [fullPath], { detached: true, stdio: 'ignore' }).unref();
  res.json({ ok: true, path: fullPath });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Chanel Image Batch Tool`);
  console.log(`   http://localhost:${PORT}\n`);
});
