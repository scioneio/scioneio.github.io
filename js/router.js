/* ==========================================================================
   scione.io — client-side navigation layer (progressive enhancement over
   a fully real, multi-page static site)

   Every URL on this site is still a real, individually-generated static
   file that returns a genuine 200 (or a genuine 404) with complete,
   correct content and metadata on its own -- that part hasn't changed
   from the previous build, and is exactly what makes this safe: nothing
   below changes what a browser with JS disabled, a search crawler, or a
   direct page load/refresh/share sees. This file only changes what
   happens *after* a page has already loaded, when the visitor clicks
   another link on the same site: instead of a full reload, it fetches the
   real target file (the same bytes a fresh visitor would get), swaps
   <main>'s content in place, updates the address bar via
   history.pushState, and re-runs the small bits of setup that only apply
   to whatever's currently inside <main> (see js/main.js and
   js/resources.js). The header and footer are never touched, so they
   never re-render or flicker between pages in the same session.

   If anything goes wrong -- the fetch fails, the response isn't ok, the
   response doesn't look like a real page -- this falls back to a normal
   browser navigation immediately. The visitor is never left stuck.
   ========================================================================== */

(function () {
  'use strict';

  // We restore scroll position ourselves (see below); let the browser's
  // own automatic scroll restoration stay out of the way.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  var scrollPositions = {};
  var currentKey = location.pathname + location.search;
  var activeController = null; // aborts a still-in-flight fetch if a newer navigation starts

  var HEAD_SYNC_SELECTORS = [
    'base',
    'title',
    'link[rel="canonical"]',
    'meta[name="description"]',
    'meta[name="author"]',
    'meta[name="robots"]',
    'meta[property="og:type"]',
    'meta[property="og:site_name"]',
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[property="og:url"]',
    'meta[property="og:image"]',
    'meta[property="article:published_time"]',
    'meta[property="article:author"]',
    'meta[name="twitter:card"]',
    'meta[name="twitter:title"]',
    'meta[name="twitter:description"]',
    'meta[name="twitter:image"]',
    'script[type="application/ld+json"]'
  ];

  function isPlainLeftClick(e) {
    return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
  }

  function findLink(target) {
    while (target && target !== document.body) {
      if (target.tagName === 'A') return target;
      target = target.parentNode;
    }
    return null;
  }

  function isSpaNavigable(link) {
    if (!link || !link.href) return false;
    var rawHref = link.getAttribute('href') || '';
    if (!rawHref || /^(mailto:|tel:|javascript:)/i.test(rawHref)) return false;
    if (link.hasAttribute('download')) return false;
    var target = (link.getAttribute('target') || '').toLowerCase();
    if (target && target !== '_self') return false;
    if (link.origin !== location.origin) return false;
    // Same-page hash link (including bare "#" placeholders) -- let the
    // browser handle its native anchor/no-op behavior.
    if (link.hash && link.pathname === location.pathname && link.search === location.search) return false;
    if (rawHref === '#') return false;
    return true;
  }

  function syncMainAttributes(curMain, newMain) {
    // <main> itself (e.g. <main data-resource-type="blog">) is never
    // touched by curMain.innerHTML = newMain.innerHTML -- that only
    // replaces *children*. Hub pages key their scope off an attribute
    // on <main> itself, so it has to be synced explicitly, or a
    // navigation from a page with no such attribute (or a different
    // one) leaves the wrong value in place and ResourcesController
    // can't find its scope root.
    Array.prototype.slice.call(curMain.attributes).forEach(function (a) { curMain.removeAttribute(a.name); });
    Array.prototype.slice.call(newMain.attributes).forEach(function (a) { curMain.setAttribute(a.name, a.value); });
  }

  function syncHead(newDoc) {
    HEAD_SYNC_SELECTORS.forEach(function (sel) {
      if (sel === 'title') {
        document.title = newDoc.title;
        return;
      }
      var incoming = newDoc.head.querySelector(sel);
      var current = document.head.querySelector(sel);
      if (!incoming) {
        if (current) current.parentNode.removeChild(current);
        return;
      }
      if (!current) {
        current = document.createElement(incoming.tagName);
        document.head.appendChild(current);
      }
      Array.prototype.slice.call(current.attributes).forEach(function (a) { current.removeAttribute(a.name); });
      Array.prototype.slice.call(incoming.attributes).forEach(function (a) { current.setAttribute(a.name, a.value); });
      if (incoming.tagName === 'SCRIPT') current.textContent = incoming.textContent;
    });
  }

  function runPageInit() {
    if (window.SiteBehavior) {
      if (window.SiteBehavior.updateActiveNav) window.SiteBehavior.updateActiveNav();
      if (window.SiteBehavior.initMainContent) window.SiteBehavior.initMainContent();
    }
    if (window.ResourcesController && window.ResourcesController.init) window.ResourcesController.init();
  }

  function applySwap(html, key, opts) {
    var newDoc = new DOMParser().parseFromString(html, 'text/html');
    var newMain = newDoc.querySelector('main');
    var curMain = document.querySelector('main');
    if (!newMain || !curMain) return false;

    syncHead(newDoc);
    syncMainAttributes(curMain, newMain);
    curMain.innerHTML = newMain.innerHTML;
    runPageInit();

    if (opts && opts.restoreScroll && typeof scrollPositions[key] === 'number') {
      window.scrollTo(0, scrollPositions[key]);
    } else if (opts && opts.hash) {
      var targetId = '';
      try { targetId = decodeURIComponent(opts.hash.slice(1)); } catch (e) { targetId = opts.hash.slice(1); }
      var hashTarget = targetId ? document.getElementById(targetId) : null;
      if (hashTarget) {
        hashTarget.scrollIntoView({ behavior: 'auto' });
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      window.scrollTo(0, 0);
    }
    currentKey = key;
    return true;
  }

  function navigate(url, opts) {
    opts = opts || {};
    if (window.SiteBehavior && window.SiteBehavior.closeMenus) {
      window.SiteBehavior.closeMenus();
    }

    if (!opts.isPopstate && window.SiteBehavior && window.SiteBehavior.normalizeChromeLinks) {
      window.SiteBehavior.normalizeChromeLinks();
    }

    var parsed = new URL(url, location.href);
    var key = parsed.pathname + parsed.search;
    var fetchUrl = parsed.pathname + parsed.search;
    var swapOpts = {
      isPopstate: opts.isPopstate,
      restoreScroll: opts.restoreScroll,
      hash: parsed.hash
    };

    scrollPositions[currentKey] = window.scrollY;

    if (activeController) activeController.abort();
    var controller = ('AbortController' in window) ? new AbortController() : null;
    activeController = controller;

    fetch(fetchUrl, controller ? { signal: controller.signal } : undefined)
      .then(function (res) {
        if (!res.ok) throw new Error('Non-OK response: ' + res.status);
        return res.text();
      })
      .then(function (html) {
        if (activeController !== controller) return; // superseded by a newer navigation
        if (!swapOpts.isPopstate) history.pushState({ spaKey: key }, '', parsed.href);
        var ok = applySwap(html, key, swapOpts);
        if (!ok) window.location.href = parsed.href;
      })
      .catch(function (err) {
        if (err && err.name === 'AbortError') return; // expected when superseded
        window.location.href = parsed.href; // never leave the visitor on a half-broken page
      });
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || !isPlainLeftClick(e)) return;
    var link = findLink(e.target);
    if (!isSpaNavigable(link)) return;
    if (link.href === location.href) { e.preventDefault(); return; } // already here, no-op
    e.preventDefault();
    navigate(link.href, {});
  });

  window.addEventListener('popstate', function () {
    navigate(location.href, { isPopstate: true, restoreScroll: true });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runPageInit);
  } else {
    runPageInit();
  }
})();
