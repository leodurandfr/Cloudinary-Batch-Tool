#!/usr/bin/env node
/**
 * scan.js — Scans chanel_images/ folders and generates inventory.json
 *
 * Usage: node scan.js
 *
 * Reads the directory structure:
 *   {category}/{reference}/{filename}.jpg
 *
 * Extracts metadata from filenames:
 *   {product-name}-packshot-{type}-{ref}-{cloudinary-id}.jpg
 *
 * Reconstructs Cloudinary URLs for preview.
 */

const fs = require('fs');
const path = require('path');

const IMAGES_ROOT = path.resolve(__dirname, '..', 'chanel_images');
const OUTPUT_FILE = path.join(__dirname, 'inventory.json');

// Chanel Cloudinary URL base
const CLOUDINARY_BASE = 'https://www.chanel.com/images/';
const THUMB_PARAMS = 't_one/q_auto:low,f_auto,fl_lossy,dpr_1/w_300';
const FULL_PARAMS = 't_one/q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1240';

// Categories to scan
const CATEGORIES = ['bagues', 'boucles-doreilles', 'bracelets', 'broches', 'colliers'];

function extractType(filename) {
  // Pattern: ...-packshot-{type}-{ref}-{id}.jpg
  const match = filename.match(/-packshot-(.+?)-(j\d+)-/i);
  if (match) return match[1];

  // Pattern: ...-worn-{type}-{ref}-{id}.jpg
  const wornMatch = filename.match(/-worn-(.+?)-(j\d+)-/i);
  if (wornMatch) return wornMatch[1];

  return 'unknown';
}

function extractRef(filename) {
  const match = filename.match(/-(j\d+)-/i);
  return match ? match[1].toUpperCase() : null;
}

function buildCloudinaryUrl(filename, params) {
  return `${CLOUDINARY_BASE}${params}/${filename}`;
}

function scan() {
  const images = [];
  const stats = {
    total: 0,
    by_category: {},
    by_type: {}
  };

  for (const category of CATEGORIES) {
    const categoryPath = path.join(IMAGES_ROOT, category);
    if (!fs.existsSync(categoryPath)) {
      console.log(`⚠️  Skipping ${category} (not found)`);
      continue;
    }

    const refs = fs.readdirSync(categoryPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const ref of refs) {
      const refPath = path.join(categoryPath, ref);
      const files = fs.readdirSync(refPath)
        .filter(f => f.endsWith('.jpg'));

      for (const filename of files) {
        const type = extractType(filename);

        stats.total++;

        stats.by_category[category] = (stats.by_category[category] || 0) + 1;
        stats.by_type[type] = (stats.by_type[type] || 0) + 1;

        images.push({
          id: filename.replace('.jpg', ''),
          filename,
          category,
          ref: ref.toUpperCase(),
          type,
          local_path: `${category}/${ref}/${filename}`,
          thumb_url: buildCloudinaryUrl(filename, THUMB_PARAMS),
          full_url: buildCloudinaryUrl(filename, FULL_PARAMS),
          group_id: null
        });
      }
    }
  }

  stats.processable = images.length;

  const inventory = { images, stats, generated_at: new Date().toISOString() };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(inventory, null, 2));

  console.log(`\n✅ Inventory generated: ${OUTPUT_FILE}`);
  console.log(`   Total images scanned: ${stats.total}`);
  console.log(`   Processable:          ${stats.processable}`);
  console.log(`\n   By category:`);
  for (const [cat, count] of Object.entries(stats.by_category).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${cat}: ${count}`);
  }
  console.log(`\n   By type:`);
  for (const [type, count] of Object.entries(stats.by_type).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${type}: ${count}`);
  }
}

scan();
