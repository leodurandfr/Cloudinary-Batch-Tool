#!/usr/bin/env node
/**
 * Comprehensive extractor for Chanel PDP page layouts.
 * Captures ALL CSS, full HTML structure (header/hero/content/footer),
 * font URLs, and screenshots for pixel-perfect reproduction.
 *
 * Usage: node _extract-layout-html.js
 *
 * Output goes to _extracted-layouts/:
 *   {name}-all-styles.css   — ALL CSS from the page (unfiltered)
 *   {name}-styles.css        — filtered CSS (hero/carousel only, legacy)
 *   {name}-hero.html          — hero section HTML
 *   {name}-carousel.html      — product image carousel HTML
 *   {name}-full.html           — main element innerHTML
 *   {name}-head.html           — <head> content (link/style/meta tags)
 *   {name}-header.html         — site header HTML (.cc-header)
 *   {name}-top-banner.html     — top promotional banner HTML
 *   {name}-pdp-section.html    — full PDP section (.cc-wfj-pdp-j12)
 *   {name}-meta.json           — computed info + class list
 *   {name}-screenshot.png      — viewport screenshot
 *   {name}-screenshot-full.png — full-page screenshot
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

chromium.use(StealthPlugin());

const PAGES = [
  {
    url: 'https://www.chanel.com/fr/horlogerie/p/H9657/montre-j12-calibre-12-2-33-mm/',
    name: 'H9657-simple'
  },
  {
    url: 'https://www.chanel.com/fr/horlogerie/p/H5697/montre-j12-calibre-12-1-38-mm/',
    name: 'H5697-3d'
  }
];

const OUTPUT_DIR = path.join(__dirname, '_extracted-layouts');

async function extractPage(browser, { url, name }) {
  console.log(`\n--- Extracting: ${name} (${url}) ---`);

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'fr-FR',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    console.log(`Status: ${resp.status()}`);

    if (resp.status() === 403) {
      console.log('Blocked by Akamai, waiting 10s and retrying...');
      await page.waitForTimeout(10000);
      const resp2 = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      console.log(`Retry status: ${resp2.status()}`);
    }

    // Dismiss cookie consent
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      const btn = document.querySelector('#onetrust-reject-all-handler');
      if (btn) btn.click();
    });
    await page.waitForTimeout(2000);

    // Scroll down and back to trigger lazy loading
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise(r => setTimeout(r, 200));
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 1000));
    });

    // Extract everything
    const extraction = await page.evaluate(() => {
      // --- 1. ALL CSS (unfiltered) ---
      const allStyles = [];
      const filteredStyles = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            const text = rule.cssText;
            allStyles.push(text);
            // Legacy filtered styles
            if (text.includes('cc-hero') || text.includes('cc-carousel') ||
                text.includes('product-main') || text.includes('product-hero') ||
                text.includes('swiper') || text.includes('carousel') ||
                text.includes('cc-product-image') || text.includes('cc-wfj-pdp') ||
                text.includes('cc-image') || text.includes('cc-top-banner') ||
                text.includes('cc-header') || text.includes('cc-logo') ||
                text.includes('cc-key-feature') || text.includes('cc-sticky') ||
                text.includes('cc-product-information') || text.includes('cc-expandable') ||
                text.includes('cc-suggestionsj12') || text.includes('font-face') ||
                text.includes(':root')) {
              filteredStyles.push(text);
            }
          }
        } catch (e) {
          // Cross-origin stylesheet, skip
        }
      }

      // --- 2. <head> content ---
      const headEl = document.head;
      const headItems = [];
      for (const child of headEl.children) {
        const tag = child.tagName.toLowerCase();
        if (tag === 'link' || tag === 'style' || tag === 'meta') {
          headItems.push(child.outerHTML);
        }
      }

      // --- 3. Font URLs ---
      const fontUrls = [];
      for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
        fontUrls.push(link.href);
      }

      // --- 4. HTML sections ---
      const getOuterHTML = (sel) => {
        const el = document.querySelector(sel);
        return el ? el.outerHTML : null;
      };

      const heroHTML = getOuterHTML('.cc-hero-j12');
      const carouselHTML = getOuterHTML('.cc-product-image-carousel') ||
                           getOuterHTML('.cc-wfj-pdp-j12__carousel .cc-carousel');
      const headerHTML = getOuterHTML('.cc-header') || getOuterHTML('header');
      const topBannerHTML = getOuterHTML('.cc-top-banner');
      const pdpSectionHTML = getOuterHTML('.cc-wfj-pdp-j12') ||
                             getOuterHTML('[class*="wfj-pdp-j12"]');

      // Full main content
      let fullSectionHTML = null;
      const mainEl = document.querySelector('main') || document.querySelector('#app') || document.body;
      if (mainEl) {
        fullSectionHTML = mainEl.innerHTML;
      }

      // --- 5. Zoom section (product-main-image) ---
      const zoomPicture = document.querySelector('#product-main-image-picture');
      const zoomHTML = zoomPicture ? zoomPicture.outerHTML : null;

      // --- 6. Inline <style> tags content (within body) ---
      const inlineStyles = [];
      for (const style of document.querySelectorAll('body style, .cc-wfj-pdp-j12 style')) {
        inlineStyles.push(style.textContent);
      }

      // --- 7. Computed styles for key elements ---
      const computedInfo = {};
      const keyElements = {
        'cc-hero-j12': document.querySelector('.cc-hero-j12'),
        'cc-hero-j12__img-container': document.querySelector('.cc-hero-j12__img-container'),
        'cc-carousel': document.querySelector('.cc-carousel'),
        'cc-top-banner': document.querySelector('.cc-top-banner'),
        'cc-header': document.querySelector('.cc-header'),
      };
      for (const [name, el] of Object.entries(keyElements)) {
        if (el) {
          const cs = window.getComputedStyle(el);
          computedInfo[name] = {
            display: cs.display,
            width: cs.width,
            height: cs.height,
            maxWidth: cs.maxWidth,
            position: cs.position,
            className: el.className,
            rect: el.getBoundingClientRect().toJSON()
          };
        }
      }

      // --- 8. All class names ---
      const allClasses = [...new Set(
        [...document.querySelectorAll('*')].flatMap(el =>
          [...el.classList].filter(c => c.startsWith('cc-'))
        )
      )].sort();

      return {
        allStyles: allStyles.join('\n'),
        filteredStyles: filteredStyles.join('\n'),
        headItems: headItems.join('\n'),
        fontUrls,
        heroHTML,
        carouselHTML,
        headerHTML,
        topBannerHTML,
        pdpSectionHTML: pdpSectionHTML ? pdpSectionHTML.substring(0, 500000) : null,
        fullSectionHTML: fullSectionHTML ? fullSectionHTML.substring(0, 500000) : null,
        zoomHTML,
        inlineStyles: inlineStyles.join('\n'),
        computedInfo,
        allClasses,
        heroSelector: '.cc-hero-j12'
      };
    });

    // Save all extracted data
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const save = (suffix, content) => {
      if (!content) return;
      const file = path.join(OUTPUT_DIR, `${name}-${suffix}`);
      fs.writeFileSync(file, content);
      console.log(`  ${suffix} saved (${(content.length / 1024).toFixed(1)} KB)`);
    };

    save('all-styles.css', extraction.allStyles);
    save('styles.css', extraction.filteredStyles);
    save('head.html', extraction.headItems);
    save('hero.html', extraction.heroHTML);
    save('carousel.html', extraction.carouselHTML);
    save('header.html', extraction.headerHTML);
    save('top-banner.html', extraction.topBannerHTML);
    save('pdp-section.html', extraction.pdpSectionHTML);
    save('full.html', extraction.fullSectionHTML);
    save('zoom.html', extraction.zoomHTML);
    save('inline-styles.css', extraction.inlineStyles);

    // Save metadata
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${name}-meta.json`),
      JSON.stringify({
        url,
        computedInfo: extraction.computedInfo,
        fontUrls: extraction.fontUrls,
        allClasses: extraction.allClasses,
        heroSelector: extraction.heroSelector
      }, null, 2)
    );
    console.log(`  meta.json saved`);

    // Screenshots
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `${name}-screenshot.png`),
      clip: { x: 0, y: 0, width: 1440, height: 1200 }
    });
    console.log(`  screenshot.png saved`);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `${name}-screenshot-full.png`),
      fullPage: true
    });
    console.log(`  screenshot-full.png saved`);

  } finally {
    await context.close();
  }
}

async function main() {
  console.log('Launching browser with stealth...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });

  try {
    for (const page of PAGES) {
      await extractPage(browser, page);
      // Delay between pages
      await new Promise(r => setTimeout(r, 5000));
    }
  } finally {
    await browser.close();
  }

  console.log(`\nDone! Files saved to ${OUTPUT_DIR}/`);
}

main().catch(console.error);
