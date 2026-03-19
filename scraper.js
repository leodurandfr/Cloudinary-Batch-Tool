#!/usr/bin/env node
/**
 * scraper.js — Playwright-based Chanel PLP/PDP scraper
 *
 * Scrapes Chanel jewelry PLP pages to extract PDP links,
 * then visits each PDP to collect Cloudinary image URLs.
 * Produces inventory.json in the same format as scan.js.
 *
 * Uses playwright-extra + stealth to avoid bot detection.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

chromium.use(StealthPlugin());

// --- Constants (matching scan.js) ---
const CLOUDINARY_BASE = 'https://www.chanel.com/images/';
const THUMB_PARAMS = 't_one/q_auto:low,f_auto,fl_lossy,dpr_1/w_300';
const FULL_PARAMS = 't_one/q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1240';
const OUTPUT_FILE = path.join(__dirname, 'inventory.json');

// Regex to extract image type and ref from Chanel filenames
const PACKSHOT_RE = /-packshot-(.+?)-(j\d+)-/i;
const WORN_RE = /-worn-(.+?)-(j\d+)-/i;
const PORTEE_RE = /-portee-(\d+)-(j\d+)-/i;

// Extract filename from any Chanel Cloudinary URL
// Matches the last path segment that looks like an image filename
// Works with both /images/t_one/... and /images/as/t_one/... URL patterns
const CHANEL_FILENAME_RE = /\/([a-zA-Z0-9][a-zA-Z0-9-]+-j\d+-[a-zA-Z0-9]+)\.(jpg|webp|png)(?:\?.*)?$/i;

// Block rules for unnecessary requests
const BLOCK_RULES_FILE = path.join(__dirname, 'block-rules.json');

// --- Utilities ---

function extractType(filename) {
  const match = filename.match(PACKSHOT_RE);
  if (match) return match[1];
  const wornMatch = filename.match(WORN_RE);
  if (wornMatch) return wornMatch[1];
  return 'unknown';
}

function extractRef(filename) {
  const match = filename.match(/-(j\d+)-/i);
  return match ? match[1].toUpperCase() : null;
}

function categoryFromUrl(plpUrl) {
  // e.g. https://www.chanel.com/fr/joaillerie/bagues/c/3x1x2/
  const parts = new URL(plpUrl).pathname.split('/').filter(Boolean);
  const cIdx = parts.indexOf('c');
  if (cIdx > 0) return parts[cIdx - 1];
  return parts[parts.length - 1] || 'unknown';
}

function buildCloudinaryUrl(filename, params) {
  return `${CLOUDINARY_BASE}${params}/${filename}`;
}

function loadBlockRules() {
  try {
    const rules = JSON.parse(fs.readFileSync(BLOCK_RULES_FILE, 'utf8'));
    return rules.map(r => new RegExp(r.url, 'i'));
  } catch {
    return [];
  }
}

function randomDelay(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}

// --- Anti-bot behavior (ported from behaviors/force-load-lazy.js) ---

async function runBehavior(page, emit) {
  // Step 1: Human interaction simulation
  emit({ phase: 'behavior', step: 'Simulation humaine...' });
  await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    function emitMouse(type, x, y) {
      document.dispatchEvent(new MouseEvent(type, {
        clientX: x, clientY: y, bubbles: true, cancelable: true
      }));
    }

    const steps = 8 + Math.floor(Math.random() * 6);
    let cx = Math.floor(vw * 0.3 + Math.random() * vw * 0.4);
    let cy = Math.floor(vh * 0.3 + Math.random() * vh * 0.4);

    for (let i = 0; i < steps; i++) {
      cx += Math.floor((Math.random() - 0.5) * vw * 0.15);
      cy += Math.floor((Math.random() - 0.5) * vh * 0.15);
      cx = Math.max(10, Math.min(vw - 10, cx));
      cy = Math.max(10, Math.min(vh - 10, cy));
      emitMouse('mousemove', cx, cy);
      await sleep(80 + Math.floor(Math.random() * 120));
    }

    window.scrollTo({ top: 50 + Math.floor(Math.random() * 100), behavior: 'smooth' });
    await sleep(300 + Math.floor(Math.random() * 400));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await sleep(200 + Math.floor(Math.random() * 300));
  });

  // Step 2: Dismiss cookie consent + modals
  emit({ phase: 'behavior', step: 'Fermeture modales...' });
  await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // --- OneTrust / cookie consent ---
    // Try clicking "Refuser" or "Tout refuser" first (French cookie banners)
    const consentSelectors = [
      '#onetrust-reject-all-handler',
      '#onetrust-pc-btn-handler',
      'button[id*="reject"]',
      '.onetrust-close-btn-handler',
      '#onetrust-close-btn-container button',
    ];
    for (const sel of consentSelectors) {
      const btn = document.querySelector(sel);
      if (btn) {
        try { btn.click(); await sleep(500); break; } catch {}
      }
    }

    // Force remove OneTrust overlay if still present
    await sleep(300);
    const onetrust = document.querySelector('#onetrust-consent-sdk');
    if (onetrust) { try { onetrust.remove(); } catch {} }
    const otBackdrop = document.querySelector('.onetrust-pc-dark-filter');
    if (otBackdrop) { try { otBackdrop.remove(); } catch {} }

    // --- Close native dialogs ---
    document.querySelectorAll('dialog[open]').forEach(d => { try { d.close(); } catch {} });

    // --- Click dismiss/close buttons ---
    const dismissSelectors = [
      'dialog button', '[role="dialog"] button',
      'button[aria-label="Close"]', 'button[aria-label="Fermer"]',
      'button[aria-label="close"]', 'button[aria-label="fermer"]',
      '[class*="close-modal"]', '[class*="modal-close"]',
      'button[class*="dismiss"]', 'button[class*="close"]',
    ];

    function isVisible(el) {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;
    }

    function isRefusalOrClose(el) {
      const text = (el.textContent || '').trim().toLowerCase();
      const label = (el.getAttribute('aria-label') || '').toLowerCase();
      const combined = text + ' ' + label;
      if (/^(oui|yes|accepter|accept|continuer|continue|proceed|ok)$/i.test(text)) return false;
      return /non|no|fermer|close|dismiss|refuser|reject|decline|annuler|cancel|×|✕|✖/i.test(combined);
    }

    for (const sel of dismissSelectors) {
      const btns = document.querySelectorAll(sel);
      for (const btn of btns) {
        if (isVisible(btn) && isRefusalOrClose(btn)) {
          try { btn.click(); await sleep(300); } catch {}
        }
      }
    }

    // --- Remove remaining overlays ---
    await sleep(300);
    ['dialog[open]', '[role="dialog"]', '[class*="modal-backdrop"]'].forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        try { el.remove(); } catch {}
      });
    });

    if (document.body.style.overflow === 'hidden') document.body.style.overflow = '';
    if (document.documentElement.style.overflow === 'hidden') document.documentElement.style.overflow = '';
  });

  // Step 3: Click "Load more" / "Voir plus" buttons
  emit({ phase: 'behavior', step: 'Chargement complet...' });
  let loadMoreClicks = 0;
  for (let attempt = 0; attempt < 30; attempt++) {
    const clicked = await page.evaluate(() => {
      function isVisible(el) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }

      // Try CSS selectors
      const selectors = [
        'button[class*="load-more"]', 'a[class*="load-more"]',
        'button[class*="loadMore"]', 'a[class*="loadMore"]',
        'button[class*="show-more"]', 'a[class*="show-more"]',
        'button[class*="voir-plus"]', 'a[class*="voir-plus"]',
        '[data-test*="load-more"]', '[data-test*="show-more"]',
        '[class*="pagination"] button', '[class*="pagination"] a',
      ];

      for (const sel of selectors) {
        for (const el of document.querySelectorAll(sel)) {
          if (isVisible(el)) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.click();
            return true;
          }
        }
      }

      // Text-based search
      for (const el of document.querySelectorAll('button, a, [role="button"]')) {
        const text = (el.textContent || '').trim().toLowerCase();
        if (/voir plus|afficher plus|load more|show more|charger plus|plus de produits/i.test(text) && isVisible(el)) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.click();
          return true;
        }
      }

      return false;
    });

    if (!clicked) break;
    loadMoreClicks++;
    await page.waitForTimeout(randomDelay(1500, 2500));
  }

  if (loadMoreClicks > 0) {
    emit({ phase: 'behavior', step: `${loadMoreClicks} clics "voir plus"` });
  }

  // Step 4: Scroll to trigger lazy loading
  emit({ phase: 'behavior', step: 'Scroll de la page...' });
  await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const vh = window.innerHeight;
    const increment = Math.floor(vh * 0.5);
    let pos = 0;

    while (pos < Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)) {
      window.scrollTo({ top: pos, behavior: 'smooth' });
      await sleep(300);
      pos += increment;
    }

    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    await sleep(2000);
  });

  // Step 5: Force lazy images
  await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    for (const img of lazyImages) {
      img.removeAttribute('loading');
      const src = img.getAttribute('src');
      if (src) {
        img.setAttribute('src', '');
        await sleep(10);
        img.setAttribute('src', src);
      }
    }

    // Activate data-src attributes
    for (const attr of ['data-src', 'data-lazy-src', 'data-original']) {
      for (const el of document.querySelectorAll(`[${attr}]`)) {
        const val = el.getAttribute(attr);
        if (val && el.tagName === 'IMG') el.setAttribute('src', val);
      }
    }
  });
}

// --- Sitemap-based PDP link discovery ---

const SITEMAP_URL = 'https://www.chanel.com/fr/sitemap.xml';

// Category mapping: slug prefix → category name (matching PLP URL segments)
const SLUG_TO_CATEGORY = {
  'bague': 'bagues',
  'bracelet': 'bracelets',
  'manchette': 'bracelets',
  'collier': 'colliers',
  'sautoir': 'colliers',
  'pendentif': 'colliers',
  'choker': 'colliers',
  'boucles-doreilles': 'boucles-doreilles',
  'creoles': 'boucles-doreilles',
  'puces-d': 'boucles-doreilles',
  'mono-boucle': 'boucles-doreilles',
  'mono-clip': 'boucles-doreilles',
  'pendants-d': 'boucles-doreilles',
  'clips-doreilles': 'boucles-doreilles',
  'clip-doreille': 'boucles-doreilles',
  'broche': 'broches',
  'medaille': 'colliers',
  'mini-creole': 'boucles-doreilles',
};

function fetchSitemap() {
  return new Promise((resolve, reject) => {
    https.get(SITEMAP_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function categoryFromSlug(slug) {
  for (const [prefix, cat] of Object.entries(SLUG_TO_CATEGORY)) {
    if (slug.startsWith(prefix)) return cat;
  }
  return 'autre';
}

async function getPdpLinksFromSitemap(category, emit) {
  emit({ phase: 'behavior', step: 'Chargement du sitemap...' });

  const sitemap = await fetchSitemap();

  // Extract all jewelry PDP URLs from sitemap
  const allUrls = [...sitemap.matchAll(/<loc>(https:\/\/www\.chanel\.com\/fr\/joaillerie\/p\/[^<]+)<\/loc>/g)]
    .map(m => m[1]);

  emit({ phase: 'behavior', step: `${allUrls.length} produits joaillerie dans le sitemap` });

  // Filter by category using slug
  const filtered = allUrls.filter(url => {
    const slug = url.split('/').filter(Boolean).pop();
    return categoryFromSlug(slug) === category;
  });

  return filtered;
}

async function scrapePLP(page, plpUrl, emit) {
  const category = categoryFromUrl(plpUrl);

  // Strategy 1: Try to get PDP links from PLP page directly (page 1)
  emit({ phase: 'plp_navigate', url: plpUrl });
  let plpLinks = [];
  try {
    await page.goto(plpUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(randomDelay(2000, 3000));
    await runBehavior(page, emit);

    plpLinks = await page.evaluate(() => {
      const links = new Set();
      const origin = window.location.origin;
      for (const a of document.querySelectorAll('a[href]')) {
        const href = a.getAttribute('href');
        if (!href) continue;
        let url;
        try { url = new URL(href, origin); } catch { continue; }
        if (url.origin !== origin) continue;
        if (url.pathname.match(/\/p\/[A-Z0-9]+\//i)) {
          links.add(url.origin + url.pathname);
        }
      }
      return [...links];
    });

    // Check if there are more pages (pagination)
    const totalPages = await page.evaluate(() => {
      const btn = document.querySelector('[data-total-page]');
      return btn ? parseInt(btn.getAttribute('data-total-page') || '1', 10) : 1;
    });

    if (totalPages > 1) {
      emit({ phase: 'behavior', step: `PLP page 1: ${plpLinks.length} produits (${totalPages} pages au total)` });
      emit({ phase: 'behavior', step: 'Pagination bloquee par Akamai — utilisation du sitemap...' });

      // Strategy 2: Use sitemap to get ALL PDP links for this category
      const sitemapLinks = await getPdpLinksFromSitemap(category, emit);
      emit({ phase: 'behavior', step: `${sitemapLinks.length} produits ${category} trouves via sitemap` });

      // Merge: sitemap has the complete list, PLP confirms what's currently live
      const allLinks = new Set([...plpLinks, ...sitemapLinks]);
      return [...allLinks];
    }

    emit({ phase: 'behavior', step: `${plpLinks.length} produits trouves` });
    return plpLinks;
  } catch (e) {
    // PLP failed entirely — fallback to sitemap
    emit({ phase: 'behavior', step: `PLP inaccessible (${e.message.substring(0, 50)}) — utilisation du sitemap...` });
    const sitemapLinks = await getPdpLinksFromSitemap(category, emit);
    emit({ phase: 'behavior', step: `${sitemapLinks.length} produits ${category} trouves via sitemap` });
    return sitemapLinks;
  }
}

// --- PDP scraping ---

async function scrapePDP(browser, pdpUrl, category, blockPatterns, emit) {
  // Fresh context per PDP to avoid Akamai session tracking
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'fr-FR',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  const interceptedUrls = new Set();

  // Block unnecessary requests
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (blockPatterns.some(p => p.test(url))) return route.abort();
    return route.continue();
  });

  // Intercept network responses for Cloudinary image URLs
  const responseHandler = (response) => {
    const url = response.url();
    if (url.includes('chanel.com/images/')) {
      interceptedUrls.add(url);
    }
  };
  page.on('response', responseHandler);

  try {
    const resp = await page.goto(pdpUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Handle 403 — Akamai rate limiting
    if (resp.status() === 403) {
      return { images: [], blocked: true };
    }

    await page.waitForTimeout(randomDelay(2000, 3500));

    await runBehavior(page, emit);

    // Extract image URLs from DOM
    const domUrls = await page.evaluate(() => {
      const urls = new Set();

      // All img src
      for (const img of document.querySelectorAll('img[src]')) {
        const src = img.getAttribute('src');
        if (src && src.includes('chanel.com/images/')) urls.add(src);
      }

      // All data-src
      for (const img of document.querySelectorAll('[data-src]')) {
        const src = img.getAttribute('data-src');
        if (src && src.includes('chanel.com/images/')) urls.add(src);
      }

      // All srcset
      for (const el of document.querySelectorAll('[srcset]')) {
        const srcset = el.getAttribute('srcset');
        if (srcset) {
          for (const entry of srcset.split(',')) {
            const url = entry.trim().split(/\s+/)[0];
            if (url && url.includes('chanel.com/images/')) urls.add(url);
          }
        }
      }

      return [...urls];
    });

    // Merge DOM + intercepted URLs
    const allUrls = new Set([...domUrls, ...interceptedUrls]);

    // Extract matching filenames
    const images = [];
    const seenIds = new Set();

    for (const url of allUrls) {
      const match = url.match(CHANEL_FILENAME_RE);
      if (!match) continue;

      const id = match[1];
      const ext = match[2];
      if (seenIds.has(id)) continue;

      const filename = `${id}.${ext}`;
      const ref = extractRef(filename);
      if (!ref) continue;

      // Only keep packshot, worn, and portée images
      const hasPackshot = PACKSHOT_RE.test(filename);
      const hasWorn = WORN_RE.test(filename);
      if (!hasPackshot && !hasWorn) continue;

      seenIds.add(id);
      const type = extractType(filename);

      images.push({
        id,
        filename,
        category,
        ref,
        type,
        local_path: `${category}/${ref}/${filename}`,
        thumb_url: buildCloudinaryUrl(filename, THUMB_PARAMS),
        full_url: buildCloudinaryUrl(filename, FULL_PARAMS),
        group_id: null
      });
    }

    return { images, blocked: false };
  } finally {
    page.off('response', responseHandler);
    await context.close();
  }
}

// --- Main scrape function ---

async function scrape(urls, emit) {
  emit({ phase: 'init', total_plps: urls.length });

  // Load block rules
  const blockPatterns = loadBlockRules();

  // Launch browser
  emit({ phase: 'browser', step: 'Lancement du navigateur...' });
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });

  try {
    // Create a shared context for PLP scraping (sitemap doesn't need it, but PLP page 1 does)
    const plpContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: 'fr-FR',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const plpPage = await plpContext.newPage();
    await plpPage.route('**/*', (route) => {
      const url = route.request().url();
      if (blockPatterns.some(p => p.test(url))) return route.abort();
      return route.continue();
    });

    // Load existing inventory for merge
    let existingImages = [];
    const seenIds = new Set();
    try {
      if (fs.existsSync(OUTPUT_FILE)) {
        const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        existingImages = existing.images || [];
        for (const img of existingImages) {
          seenIds.add(img.id);
        }
        emit({ phase: 'info', step: `Inventaire existant: ${existingImages.length} images` });
      }
    } catch {}

    const newImages = [];
    let totalPdps = 0;
    let processedPdps = 0;
    let blockedCount = 0;

    // Phase 1: Collect PDP links for each PLP URL (via PLP page 1 + sitemap fallback)
    const plpResults = [];
    for (let i = 0; i < urls.length; i++) {
      const plpUrl = urls[i];
      const category = categoryFromUrl(plpUrl);

      emit({ phase: 'plp', url: plpUrl, index: i, total: urls.length, category });

      try {
        const pdpLinks = await scrapePLP(plpPage, plpUrl, emit);
        plpResults.push({ category, pdpLinks });
        totalPdps += pdpLinks.length;
        emit({ phase: 'plp_done', url: plpUrl, pdp_count: pdpLinks.length, category, index: i, total: urls.length });
      } catch (e) {
        emit({ phase: 'plp_error', url: plpUrl, error: e.message });
      }
    }

    await plpContext.close();

    // Phase 2: Scrape each PDP with a fresh context (to avoid Akamai session tracking)
    for (const { category, pdpLinks } of plpResults) {
      for (let j = 0; j < pdpLinks.length; j++) {
        const pdpUrl = pdpLinks[j];
        processedPdps++;

        emit({
          phase: 'pdp',
          url: pdpUrl,
          pdp_index: processedPdps - 1,
          pdp_total: totalPdps,
          category
        });

        try {
          const result = await scrapePDP(browser, pdpUrl, category, blockPatterns, emit);

          if (result.blocked) {
            blockedCount++;
            emit({ phase: 'pdp_error', url: pdpUrl, error: 'Bloque par Akamai (403)' });

            // If we get 3 consecutive blocks, wait longer
            if (blockedCount >= 3) {
              emit({ phase: 'behavior', step: `${blockedCount} blocages consecutifs — pause de 30s...` });
              await new Promise(r => setTimeout(r, 30000));
              blockedCount = 0; // Reset counter after pause
            }
            continue;
          }

          blockedCount = 0; // Reset on success

          let added = 0;
          let duplicates = 0;
          for (const img of result.images) {
            if (seenIds.has(img.id)) {
              duplicates++;
              continue;
            }
            seenIds.add(img.id);
            newImages.push(img);
            added++;
          }

          emit({
            phase: 'pdp_done',
            url: pdpUrl,
            images_found: added,
            duplicates
          });
        } catch (e) {
          emit({ phase: 'pdp_error', url: pdpUrl, error: e.message });
        }

        // Delay between PDPs (5-8 seconds to avoid rate limiting)
        if (processedPdps < totalPdps) {
          await new Promise(r => setTimeout(r, randomDelay(5000, 8000)));
        }
      }
    }

    // Merge existing + new images
    const allImages = [...existingImages, ...newImages];

    // Detect duplicates by composite key (category + ref + type)
    const compositeKeySeen = new Set();
    for (const img of allImages) {
      const key = `${img.category}::${img.ref}::${img.type}`;
      if (compositeKeySeen.has(key)) {
        img.duplicate = true;
      } else {
        compositeKeySeen.add(key);
        delete img.duplicate;
      }
    }

    // Build stats on merged inventory
    const stats = {
      total: allImages.length,
      by_category: {},
      by_type: {}
    };

    for (const img of allImages) {
      stats.by_category[img.category] = (stats.by_category[img.category] || 0) + 1;
      stats.by_type[img.type] = (stats.by_type[img.type] || 0) + 1;
    }
    stats.processable = allImages.length;

    // Write merged inventory.json
    const inventory = {
      images: allImages,
      stats,
      generated_at: new Date().toISOString()
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(inventory, null, 2));

    const duplicateCount = allImages.filter(i => i.duplicate).length;

    emit({
      done: true,
      total: allImages.length,
      new_count: newImages.length,
      duplicate_count: duplicateCount,
      existing_count: existingImages.length,
      by_category: stats.by_category,
      by_type: stats.by_type,
      file: OUTPUT_FILE
    });
  } finally {
    await browser.close();
  }
}

module.exports = { scrape };
