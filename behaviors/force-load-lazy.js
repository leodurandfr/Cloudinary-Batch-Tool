// Custom browsertrix-crawler behavior: force-load all lazy/deferred content
// Adapted from Snapshift for Chanel PLP scanning.
// Simulates human interaction, dismisses modals, scrolls page, forces lazy images.

class ForceLoadLazy {
  static id = "ForceLoadLazy";

  static isMatch() {
    return true;
  }

  static init() {
    return {
      state: { scrolled: 0, imagesForced: 0, urlsFetched: 0 },
      opts: {},
    };
  }

  async *run(ctx) {
    const { Lib, state, log } = ctx;
    const sleep = Lib.sleep;

    await log("ForceLoadLazy: starting behavior");

    // --- Step 1: Human interaction simulation ---
    // WAFs like Akamai Bot Manager collect behavioral telemetry (mouse
    // movements, scroll patterns, timing) via their sensor JS.
    yield { msg: "Simulating human interaction..." };

    try {
      var vw = window.innerWidth;
      var vh = window.innerHeight;

      function emitMouse(type, x, y) {
        document.dispatchEvent(new MouseEvent(type, {
          clientX: x, clientY: y, bubbles: true, cancelable: true
        }));
      }

      var steps = 8 + Math.floor(Math.random() * 6);
      var cx = Math.floor(vw * 0.3 + Math.random() * vw * 0.4);
      var cy = Math.floor(vh * 0.3 + Math.random() * vh * 0.4);

      for (var mi = 0; mi < steps; mi++) {
        cx += Math.floor((Math.random() - 0.5) * vw * 0.15);
        cy += Math.floor((Math.random() - 0.5) * vh * 0.15);
        cx = Math.max(10, Math.min(vw - 10, cx));
        cy = Math.max(10, Math.min(vh - 10, cy));
        emitMouse("mousemove", cx, cy);
        await sleep(80 + Math.floor(Math.random() * 120));
      }

      window.scrollTo({ top: 50 + Math.floor(Math.random() * 100), behavior: "smooth" });
      await sleep(300 + Math.floor(Math.random() * 400));
      window.scrollTo({ top: 0, behavior: "smooth" });
      await sleep(200 + Math.floor(Math.random() * 300));

      for (var mj = 0; mj < 3; mj++) {
        emitMouse("mousemove",
          Math.floor(Math.random() * vw),
          Math.floor(Math.random() * vh));
        await sleep(100 + Math.floor(Math.random() * 150));
      }
    } catch (e) {
      await log("Human simulation error (non-fatal): " + e);
    }

    yield { msg: "Human interaction simulation done" };

    // --- Step 2: Dismiss modals, dialogs, and overlays ---
    yield { msg: "Dismissing popups/modals..." };

    try {
      var dismissed = 0;

      // Strategy 1: Close native <dialog> elements
      var dialogs = document.querySelectorAll("dialog[open]");
      for (var di = 0; di < dialogs.length; di++) {
        try { dialogs[di].close(); dismissed++; } catch (e) {}
      }

      // Strategy 2: Click common close/dismiss buttons
      var dismissSelectors = [
        'dialog button', 'dialog a',
        '[role="dialog"] button', '[role="dialog"] a',
        '[role="alertdialog"] button',
        'button[id*="reject"]', 'button[id*="decline"]', 'button[id*="refuse"]',
        'a[id*="reject"]', 'a[id*="decline"]',
        'button[class*="reject"]', 'button[class*="decline"]', 'button[class*="refuse"]',
        'button[aria-label="Close"]', 'button[aria-label="Fermer"]',
        'button[aria-label="close"]', 'button[aria-label="fermer"]',
        '[class*="close-modal"]', '[class*="modal-close"]', '[class*="dialog-close"]',
        '[class*="popup-close"]', '[class*="overlay-close"]',
        'button[class*="dismiss"]', 'button[class*="close"]',
      ];

      function isVisible(el) {
        if (!el) return false;
        var rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return false;
        var style = window.getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden" && parseFloat(style.opacity) > 0;
      }

      function isRefusalOrClose(el) {
        var text = (el.textContent || "").trim().toLowerCase();
        var label = (el.getAttribute("aria-label") || "").toLowerCase();
        var combined = text + " " + label;
        if (/^(oui|yes|accepter|accept|continuer|continue|proceed|ok)$/i.test(text)) return false;
        if (/non|no|fermer|close|dismiss|refuser|reject|decline|annuler|cancel|×|✕|✖/i.test(combined)) return true;
        return false;
      }

      for (var dsi = 0; dsi < dismissSelectors.length; dsi++) {
        var btns = document.querySelectorAll(dismissSelectors[dsi]);
        for (var dbi = 0; dbi < btns.length; dbi++) {
          var btn = btns[dbi];
          if (isVisible(btn) && isRefusalOrClose(btn)) {
            try { btn.click(); dismissed++; await sleep(300); } catch (e) {}
          }
        }
        if (dismissed > 0) break;
      }

      // Strategy 3: Remove modal overlays from the DOM
      await sleep(500);
      var overlaySelectors = [
        'dialog[open]', '[role="dialog"]', '[role="alertdialog"]',
        '[class*="modal"][class*="overlay"]', '[class*="modal-backdrop"]',
      ];
      for (var oi = 0; oi < overlaySelectors.length; oi++) {
        var overlays = document.querySelectorAll(overlaySelectors[oi]);
        for (var oj = 0; oj < overlays.length; oj++) {
          if (isVisible(overlays[oj])) {
            try { overlays[oj].remove(); dismissed++; } catch (e) {}
          }
        }
      }

      // Strategy 4: Remove body overflow:hidden
      if (document.body.style.overflow === "hidden") document.body.style.overflow = "";
      if (document.documentElement.style.overflow === "hidden") document.documentElement.style.overflow = "";

      if (dismissed > 0) await sleep(500);

      yield { msg: "Dismissed " + dismissed + " popups/modals" };
    } catch (e) {
      await log("Modal dismissal error (non-fatal): " + e);
    }

    // --- Step 3: Click "Load more" / "Voir plus" buttons repeatedly ---
    // PLP pages often show only 24 products initially. A button loads more.
    // We click it repeatedly until no more products appear.
    yield { msg: "Looking for load-more buttons..." };

    try {
      var loadMoreClicks = 0;
      var maxClicks = 20; // Safety limit

      while (loadMoreClicks < maxClicks) {
        // Find a visible load-more button using common selectors
        var loadMoreSelectors = [
          'button[class*="load-more"]', 'a[class*="load-more"]',
          'button[class*="loadMore"]', 'a[class*="loadMore"]',
          'button[class*="show-more"]', 'a[class*="show-more"]',
          'button[class*="voir-plus"]', 'a[class*="voir-plus"]',
          '[data-test*="load-more"]', '[data-test*="show-more"]',
          '[class*="pagination"] button', '[class*="pagination"] a',
          'button[class*="more-products"]', 'a[class*="more-products"]',
        ];

        var loadMoreBtn = null;

        // Strategy 1: Try CSS selectors
        for (var lmi = 0; lmi < loadMoreSelectors.length; lmi++) {
          var candidates = document.querySelectorAll(loadMoreSelectors[lmi]);
          for (var lmj = 0; lmj < candidates.length; lmj++) {
            var cand = candidates[lmj];
            var cRect = cand.getBoundingClientRect();
            if (cRect.width > 0 && cRect.height > 0) {
              var cStyle = window.getComputedStyle(cand);
              if (cStyle.display !== "none" && cStyle.visibility !== "hidden") {
                loadMoreBtn = cand;
                break;
              }
            }
          }
          if (loadMoreBtn) break;
        }

        // Strategy 2: Text-based search for buttons/links containing "voir plus", "load more", etc.
        if (!loadMoreBtn) {
          var allClickables = document.querySelectorAll("button, a, [role='button']");
          for (var tci = 0; tci < allClickables.length; tci++) {
            var el = allClickables[tci];
            var elText = (el.textContent || "").trim().toLowerCase();
            if (/voir plus|afficher plus|load more|show more|charger plus|plus de produits|more products/i.test(elText)) {
              var eRect = el.getBoundingClientRect();
              if (eRect.width > 0 && eRect.height > 0) {
                var eStyle = window.getComputedStyle(el);
                if (eStyle.display !== "none" && eStyle.visibility !== "hidden") {
                  loadMoreBtn = el;
                  break;
                }
              }
            }
          }
        }

        if (!loadMoreBtn) break; // No more load-more buttons found

        // Scroll the button into view and click
        loadMoreBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        await sleep(500);
        loadMoreBtn.click();
        loadMoreClicks++;

        // Wait for new content to load
        await sleep(2000);

        yield { msg: "Clicked load-more button (" + loadMoreClicks + " times)" };
      }

      if (loadMoreClicks > 0) {
        yield { msg: "Load-more complete: clicked " + loadMoreClicks + " times" };
      } else {
        yield { msg: "No load-more button found (single-page listing)" };
      }
    } catch (e) {
      await log("Load-more error (non-fatal): " + e);
    }

    // --- Step 4: Scroll down to trigger lazy loading ---
    var scrollHeight = function() {
      return Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    };
    var viewportHeight = window.innerHeight;
    var increment = Math.floor(viewportHeight * 0.5);

    yield { msg: "Scrolling page top to bottom..." };

    var pos = 0;
    var lastHeight = scrollHeight();

    while (pos < scrollHeight()) {
      window.scrollTo({ top: pos, behavior: "smooth" });
      await sleep(300);

      var newHeight = scrollHeight();
      if (newHeight > lastHeight) {
        yield { msg: "Page grew from " + lastHeight + " to " + newHeight + "px" };
        lastHeight = newHeight;
      }

      pos += increment;
      state.scrolled = pos;
    }

    window.scrollTo({ top: scrollHeight(), behavior: "smooth" });
    await sleep(2000);

    yield { msg: "Scroll complete (" + pos + "px)" };

    // --- Step 5: Force lazy images (loading="lazy" attribute) ---
    var lazyImages = document.querySelectorAll('img[loading="lazy"]');
    for (var j = 0; j < lazyImages.length; j++) {
      var img = lazyImages[j];
      img.removeAttribute("loading");
      var imgSrc2 = img.getAttribute("src");
      if (imgSrc2) {
        img.setAttribute("src", "");
        await sleep(10);
        img.setAttribute("src", imgSrc2);
      }
      state.imagesForced++;
    }

    if (lazyImages.length > 0) {
      yield { msg: "Forced " + lazyImages.length + " loading=lazy images" };
    }

    // --- Step 6: Activate data-src / data-lazy-src / data-srcset attributes ---
    var dataAttrs = [
      "data-src", "data-lazy-src", "data-original", "data-bg",
      "data-srcset", "data-lazy-srcset", "data-background-image"
    ];
    var urlsToFetch = [];

    for (var k = 0; k < dataAttrs.length; k++) {
      var attr = dataAttrs[k];
      var els = document.querySelectorAll("[" + attr + "]");
      for (var m = 0; m < els.length; m++) {
        var elem = els[m];
        var val = elem.getAttribute(attr);
        if (!val) continue;

        if (attr.indexOf("srcset") !== -1) {
          var entries = val.split(",");
          for (var n = 0; n < entries.length; n++) {
            var url = entries[n].trim().split(/\s+/)[0];
            if (url) urlsToFetch.push(url);
          }
          if (elem.tagName === "IMG" || elem.tagName === "SOURCE") {
            elem.setAttribute("srcset", val);
          }
        } else {
          urlsToFetch.push(val);
          if (elem.tagName === "IMG") {
            elem.setAttribute("src", val);
          }
        }
      }
    }

    // Collect all srcset URLs
    var srcsetEls = document.querySelectorAll("[srcset]");
    for (var p = 0; p < srcsetEls.length; p++) {
      var srcset = srcsetEls[p].getAttribute("srcset");
      if (srcset) {
        var parts = srcset.split(",");
        for (var q = 0; q < parts.length; q++) {
          var u = parts[q].trim().split(/\s+/)[0];
          if (u) urlsToFetch.push(u);
        }
      }
    }

    // Collect all image src URLs
    var allImgs = document.querySelectorAll("img[src]");
    for (var r = 0; r < allImgs.length; r++) {
      var imgSrc = allImgs[r].getAttribute("src");
      if (imgSrc) urlsToFetch.push(imgSrc);
    }

    // Deduplicate and fetch
    var uniqueUrls = {};
    var fetchList = [];
    for (var v = 0; v < urlsToFetch.length; v++) {
      var fetchUrl = urlsToFetch[v];
      if (fetchUrl && !uniqueUrls[fetchUrl] && (fetchUrl.indexOf("http") === 0 || fetchUrl.indexOf("/") === 0)) {
        uniqueUrls[fetchUrl] = true;
        fetchList.push(fetchUrl);
      }
    }

    if (fetchList.length > 0) {
      yield { msg: "Fetching " + fetchList.length + " resource URLs..." };

      for (var w = 0; w < fetchList.length; w += 10) {
        var resBatch = fetchList.slice(w, w + 10);
        var resPromises = [];
        for (var x = 0; x < resBatch.length; x++) {
          resPromises.push(fetch(resBatch[x], { mode: "no-cors" }).catch(function() {}));
        }
        await Promise.allSettled(resPromises);
        state.urlsFetched += resBatch.length;
      }

      yield { msg: "Fetched " + fetchList.length + " resource URLs" };
    }

    yield {
      msg: "Done! Scrolled " + state.scrolled + "px, forced " + state.imagesForced + " lazy images, fetched " + state.urlsFetched + " URLs",
    };
  }
}
