/* ==========================================================================
   scione.io — shared site behavior

   v9: this site now navigates SPA-style (see js/router.js) -- clicking an
   internal link fetches the real target page and swaps <main>'s content in
   place, rather than a full reload. That means anything bound to elements
   *inside* <main> (scroll-reveal, the filter dropdowns) has to be re-run
   after every navigation, since those elements get replaced each time.
   Anything bound to the header/footer (nav toggle, mega-menu, sticky
   header, footer year) is bound to elements that persist for the entire
   session and must only ever be wired up ONCE -- rebinding those on every
   navigation would stack up duplicate click handlers.

   So this file is split accordingly:
     - Header/footer setup below runs once, right here, at DOMContentLoaded.
     - updateActiveNav() and initMainContent() are exposed on
       window.SiteBehavior instead of self-invoking. js/router.js is the
       single place that calls them -- once for the real initial page load,
       and again after every subsequent in-app navigation.
   ========================================================================== */

(function () {
  'use strict';

  function detectSiteBase() {
    var script = document.currentScript;
    if (!script || !script.src) {
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        var src = scripts[i].getAttribute('src') || '';
        if (/(?:^|\/)js\/main\.js(?:[?#]|$)/i.test(src) && scripts[i].src) {
          script = scripts[i];
          break;
        }
      }
    }
    if (script && script.src) {
      try {
        var baseUrl = new URL('../', script.src);
        var basePath = baseUrl.pathname || '/';
        if (basePath.charAt(basePath.length - 1) !== '/') basePath += '/';
        return basePath;
      } catch (e) {}
    }
    return '/';
  }

  var SITE_BASE = detectSiteBase();

  function sitePath(relPath) {
    var p = String(relPath == null ? '' : relPath);
    if (/^(https?:)?\/\//i.test(p)) return p;
    return SITE_BASE + p.replace(/^\/+/, '');
  }

  function pathRelativeToSiteBase(pathname) {
    var raw = String(pathname || '/');
    if (SITE_BASE !== '/' && raw.toLowerCase().indexOf(SITE_BASE.toLowerCase()) === 0) {
      raw = raw.slice(SITE_BASE.length);
    }
    return raw.replace(/^\/+/, '').toLowerCase();
  }

  var chromeNormalized = false;
  function normalizeChromeLinks() {
    if (chromeNormalized || location.protocol === 'file:') return;
    chromeNormalized = true;
    document.querySelectorAll('header.site-header a[href], footer.site-footer a[href]').forEach(function (a) {
      var rawHref = a.getAttribute('href') || '';
      if (!rawHref || /^(mailto:|tel:|javascript:)/i.test(rawHref) || rawHref.charAt(0) === '#') return;
      var target = (a.getAttribute('target') || '').toLowerCase();
      if (target && target !== '_self') return;
      if (a.origin !== location.origin) return;
      a.setAttribute('href', a.pathname + a.search + a.hash);
    });
  }

  if (document.readyState !== 'loading') normalizeChromeLinks();

  /* ---------------------------------------------------------------------
     Organizations Impacted Logo Slider + Hover/Tap Preview Card
     Organization entries & details live in js/organizations.js.
     --------------------------------------------------------------------- */
  var DEFAULT_LOGO_BASE = 'images/organizations-impacted/';

  var RESOURCE_SUBFOLDER_HUB = {
    blog: 'blog.html',
    research: 'research.html',
    assets: 'assets.html',
    tutorials: 'tutorials.html'
  };

  var marqueeState = null;

  function cleanupOrganizationsMarquee() {
    if (!marqueeState) return;
    if (marqueeState.timerId) clearInterval(marqueeState.timerId);
    if (marqueeState.closeTimer) clearTimeout(marqueeState.closeTimer);
    window.removeEventListener('scroll', marqueeState.onCheck);
    window.removeEventListener('resize', marqueeState.onCheck);
    if (marqueeState.onScrollClose) window.removeEventListener('scroll', marqueeState.onScrollClose);
    if (marqueeState.onKeyDown) document.removeEventListener('keydown', marqueeState.onKeyDown);
    if (marqueeState.previewBackdrop && marqueeState.previewBackdrop.parentNode) {
      marqueeState.previewBackdrop.parentNode.removeChild(marqueeState.previewBackdrop);
    }
    if (marqueeState.previewCard && marqueeState.previewCard.parentNode) {
      marqueeState.previewCard.parentNode.removeChild(marqueeState.previewCard);
    }
    marqueeState = null;
  }

  function loadLogoImage(img) {
    var src = img.getAttribute('data-src');
    if (!src) return;
    img.removeAttribute('data-src');
    img.addEventListener('load', function () {
      img.classList.add('is-loaded');
    }, { once: true });
    img.addEventListener('error', function () {
      var slot = img.parentNode;
      if (slot && slot.classList.contains('marquee-logo')) {
        slot.style.display = 'none';
      }
    }, { once: true });
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('is-loaded');
    }
  }

  function checkVisibleLogos() {
    if (document.hidden || !marqueeState || !marqueeState.unloaded.length) return;
    var mRect = marqueeState.marquee.getBoundingClientRect();
    if (mRect.bottom < -250 || mRect.top > window.innerHeight + 300) return;

    var leftBound = Math.max(0, mRect.left) - 260;
    var rightBound = Math.min(window.innerWidth, mRect.right) + 260;
    var unloaded = marqueeState.unloaded;

    for (var i = unloaded.length - 1; i >= 0; i--) {
      var img = unloaded[i];
      var rect = img.getBoundingClientRect();
      if (rect.right >= leftBound && rect.left <= rightBound) {
        loadLogoImage(img);
        unloaded.splice(i, 1);
      }
    }

    if (!unloaded.length && marqueeState) {
      if (marqueeState.timerId) {
        clearInterval(marqueeState.timerId);
        marqueeState.timerId = null;
      }
      window.removeEventListener('scroll', marqueeState.onCheck);
      window.removeEventListener('resize', marqueeState.onCheck);
    }
  }

  function isDesktopHoverDevice() {
    return window.innerWidth > 900 && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  function initOrganizationsMarquee() {
    cleanupOrganizationsMarquee();
    var marquee = document.getElementById('organizations-marquee');
    var track = document.getElementById('organizations-marquee-track');
    var orgData = window.OrganizationsData || {};
    var orgs = orgData.ORGANIZATIONS_IMPACTED || window.ORGANIZATIONS_IMPACTED || [];
    var logoBase = sitePath(orgData.LOGO_BASE || DEFAULT_LOGO_BASE);
    if (!marquee || !track || !orgs.length) return;

    track.innerHTML = '';
    track.style.setProperty('--marquee-duration', Math.max(24, orgs.length * 2.5) + 's');

    var backdrop = document.createElement('div');
    backdrop.id = 'org-preview-backdrop';
    backdrop.className = 'org-preview-backdrop';

    var card = document.createElement('div');
    card.id = 'org-preview-card';
    card.className = 'org-preview-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'false');
    card.setAttribute('aria-hidden', 'true');
    card.innerHTML =
      '<button type="button" class="org-preview-close" aria-label="Close preview">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
      '<div class="org-preview-logo"><img width="200" height="100" alt=""></div>' +
      '<div class="org-preview-body">' +
        '<h4 class="org-preview-name"></h4>' +
        '<p class="org-preview-headline"></p>' +
        '<p class="org-preview-summary"></p>' +
        '<div class="org-preview-actions">' +
          '<a class="btn btn-primary btn-sm org-preview-link" href="' + sitePath('impact.html') + '">Learn more ' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>' +
          '</a>' +
        '</div>' +
      '</div>';

    document.body.appendChild(backdrop);
    document.body.appendChild(card);

    var closeBtn = card.querySelector('.org-preview-close');
    var cardImg = card.querySelector('.org-preview-logo img');
    var cardName = card.querySelector('.org-preview-name');
    var cardHeadline = card.querySelector('.org-preview-headline');
    var cardSummary = card.querySelector('.org-preview-summary');
    var cardLink = card.querySelector('.org-preview-link');

    var activeSlot = null;
    var unloaded = [];

    function cancelCloseTimer() {
      if (marqueeState && marqueeState.closeTimer) {
        clearTimeout(marqueeState.closeTimer);
        marqueeState.closeTimer = null;
      }
    }

    function closeOrgPreview() {
      cancelCloseTimer();
      marquee.classList.remove('is-preview-open');
      if (activeSlot) {
        activeSlot.classList.remove('is-active');
        activeSlot = null;
      }
      card.classList.remove('is-open', 'is-modal');
      card.setAttribute('aria-modal', 'false');
      card.setAttribute('aria-hidden', 'true');
      backdrop.classList.remove('is-open');
    }

    function scheduleClose() {
      cancelCloseTimer();
      if (!marqueeState) return;
      marqueeState.closeTimer = setTimeout(function () {
        if (card.matches(':hover') || (activeSlot && activeSlot.matches(':hover'))) {
          return;
        }
        closeOrgPreview();
      }, 150);
    }

    function openOrgPreview(slotBtn, asModal) {
      cancelCloseTimer();
      var idx = Number(slotBtn.getAttribute('data-org-index'));
      var org = orgs[idx];
      if (!org) return;

      if (activeSlot && activeSlot !== slotBtn) {
        activeSlot.classList.remove('is-active');
      }
      activeSlot = slotBtn;
      activeSlot.classList.add('is-active');
      marquee.classList.add('is-preview-open');

      cardImg.src = logoBase + org.file;
      cardImg.alt = org.name || '';
      cardName.textContent = org.name || '';
      cardHeadline.textContent = org.headline || '';
      cardHeadline.hidden = !org.headline;
      cardSummary.textContent = org.summary || '';
      cardSummary.hidden = !org.summary;
      cardLink.setAttribute('href', sitePath('impact.html#' + encodeURIComponent(org.slug)));

      if (asModal) {
        card.classList.add('is-modal');
        card.setAttribute('aria-modal', 'true');
        card.style.left = '';
        card.style.top = '';
        backdrop.classList.add('is-open');
      } else {
        card.classList.remove('is-modal');
        card.setAttribute('aria-modal', 'false');
        backdrop.classList.remove('is-open');

        var rect = slotBtn.getBoundingClientRect();
        var cardW = card.offsetWidth || 340;
        var cardH = card.offsetHeight || 280;
        var left = rect.left + (rect.width / 2) - (cardW / 2);
        var top = rect.top + (rect.height / 2) - (cardH / 2);
        var maxLeft = Math.max(16, window.innerWidth - cardW - 16);
        var maxTop = Math.max(92, window.innerHeight - cardH - 16);
        left = Math.min(Math.max(16, left), maxLeft);
        top = Math.min(Math.max(92, top), maxTop);
        card.style.left = Math.round(left) + 'px';
        card.style.top = Math.round(top) + 'px';
      }

      card.classList.add('is-open');
      card.setAttribute('aria-hidden', 'false');
    }

    function buildGroup(isDuplicate) {
      var group = document.createElement('div');
      group.className = 'marquee-group';
      if (isDuplicate) group.setAttribute('aria-hidden', 'true');

      orgs.forEach(function (org, idx) {
        var slot = document.createElement('button');
        slot.type = 'button';
        slot.className = 'marquee-logo';
        slot.setAttribute('data-org-index', String(idx));
        slot.setAttribute('aria-label', 'View details for ' + org.name);
        if (isDuplicate) slot.tabIndex = -1;

        var img = document.createElement('img');
        img.setAttribute('data-src', logoBase + org.file);
        img.alt = isDuplicate ? '' : org.name;
        img.width = 200;
        img.height = 100;
        img.decoding = 'async';
        img.loading = 'lazy';

        slot.addEventListener('mouseenter', function () {
          if (isDesktopHoverDevice()) {
            openOrgPreview(slot, false);
          }
        });
        slot.addEventListener('mouseleave', function () {
          if (isDesktopHoverDevice()) {
            scheduleClose();
          }
        });
        slot.addEventListener('click', function () {
          openOrgPreview(slot, !isDesktopHoverDevice());
        });

        slot.appendChild(img);
        group.appendChild(slot);
        unloaded.push(img);
      });

      return group;
    }

    card.addEventListener('mouseenter', cancelCloseTimer);
    card.addEventListener('mouseleave', function () {
      if (isDesktopHoverDevice() && !card.classList.contains('is-modal')) {
        scheduleClose();
      }
    });
    closeBtn.addEventListener('click', closeOrgPreview);
    backdrop.addEventListener('click', closeOrgPreview);
    cardLink.addEventListener('click', closeOrgPreview);

    function onScrollClose() {
      if (card.classList.contains('is-open') && !card.classList.contains('is-modal')) {
        closeOrgPreview();
      }
    }
    function onKeyDown(e) {
      if (e.key === 'Escape' && card.classList.contains('is-open')) {
        closeOrgPreview();
      }
    }

    track.appendChild(buildGroup(false));
    track.appendChild(buildGroup(true));

    marqueeState = {
      marquee: marquee,
      unloaded: unloaded,
      onCheck: checkVisibleLogos,
      onScrollClose: onScrollClose,
      onKeyDown: onKeyDown,
      previewBackdrop: backdrop,
      previewCard: card,
      closeTimer: null,
      timerId: setInterval(checkVisibleLogos, 250)
    };

    window.addEventListener('scroll', checkVisibleLogos, { passive: true });
    window.addEventListener('resize', checkVisibleLogos, { passive: true });
    window.addEventListener('scroll', onScrollClose, { passive: true });
    document.addEventListener('keydown', onKeyDown);

    checkVisibleLogos();
    if ('requestAnimationFrame' in window) {
      window.requestAnimationFrame(checkVisibleLogos);
    }
  }

  /* ---- Header / mobile / mega-menu helpers ---- */
  function closeMegaMenus() {
    document.querySelectorAll('.nav-item-mega').forEach(function (item) {
      item.classList.remove('is-open');
      var toggle = item.querySelector('.nav-link-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  }

  function closeMobileNav() {
    var navToggle = document.querySelector('.nav-toggle');
    var navLinks = document.querySelector('.nav-links');
    if (navLinks) navLinks.classList.remove('is-open');
    if (navToggle) {
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
    closeMegaMenus();
  }

  /* ---- Active nav link + mega-menu trigger highlighting ----
     Re-run after every navigation (the highlighted link changes), but safe
     to call repeatedly either way: it only ever toggles a CSS class, never
     adds a listener, so there's no accumulation risk. */
  function updateActiveNav() {
    var rawPath = pathRelativeToSiteBase(window.location.pathname);
    var currentPage = rawPath || 'index.html';
    var segments = currentPage.split('/').filter(Boolean);
    var topSegment = segments[0] || '';
    var resourceHubForArticle = segments.length > 1 ? (RESOURCE_SUBFOLDER_HUB[topSegment] || '') : '';

    document.querySelectorAll('.nav-link[href]').forEach(function (link) {
      var href = pathRelativeToSiteBase(link.pathname);
      var isActive = href === currentPage || href === currentPage + '.html';
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    document.querySelectorAll('.nav-item-mega').forEach(function (item) {
      var childActive = false;
      item.querySelectorAll('.mega-menu-item[href]').forEach(function (a) {
        var href = pathRelativeToSiteBase(a.pathname);
        var isExact = href === currentPage || href === currentPage + '.html';
        var isSubActive = isExact || (resourceHubForArticle && href === resourceHubForArticle);
        a.classList.toggle('is-active', Boolean(isSubActive));
        if (isExact) {
          a.setAttribute('aria-current', 'page');
        } else {
          a.removeAttribute('aria-current');
        }
        if (isSubActive) childActive = true;
      });
      var trigger = item.querySelector('.nav-link-toggle');
      if (trigger) trigger.classList.toggle('is-active', childActive);
    });
  }

  /* ---- Everything scoped to <main>'s current content ----
     Re-run after every navigation, since <main>'s contents are replaced
     each time. Safe to call repeatedly: querySelectorAll always reflects
     whatever is currently in the DOM, IntersectionObserver.observe() is a
     harmless no-op on an already-observed element, and any listeners added
     here are bound to elements that get thrown away (along with the
     listeners) the moment <main> is next replaced. */
  function initMainContent() {
    cleanupOrganizationsMarquee();
    initOrganizationsMarquee();

    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
      );
      revealEls.forEach(function (el, i) {
        el.style.transitionDelay = (i % 4) * 70 + 'ms';
        io.observe(el);
      });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }

    /* Mobile-only "Search and filter" collapsible wrapper on hub pages */
    document.querySelectorAll('.filter-bar-mobile-toggle').forEach(function (btn) {
      var bar = btn.closest('.filter-bar');
      if (!bar) return;
      btn.addEventListener('click', function () {
        var isOpen = bar.classList.toggle('is-mobile-open');
        btn.setAttribute('aria-expanded', String(isOpen));
      });
    });

    /* Filter dropdown (content-type dropdown on hub pages, plus the topic
       dropdown resources.js populates) -- outside click & Escape live once
       in DOMContentLoaded below so SPA navigation doesn't stack listeners. */
    document.querySelectorAll('.filter-dropdown').forEach(function (dropdown) {
      var toggle = dropdown.querySelector('.filter-toggle');
      var menu = dropdown.querySelector('.filter-menu');
      if (!toggle || !menu) return;

      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var willOpen = !dropdown.classList.contains('is-open');
        document.querySelectorAll('.filter-dropdown.is-open').forEach(function (other) {
          if (other !== dropdown) {
            other.classList.remove('is-open');
            var otherToggle = other.querySelector('.filter-toggle');
            if (otherToggle) otherToggle.setAttribute('aria-expanded', 'false');
          }
        });
        dropdown.classList.toggle('is-open', willOpen);
        toggle.setAttribute('aria-expanded', String(willOpen));
      });
    });
  }

  window.SiteBehavior = {
    siteBase: SITE_BASE,
    sitePath: sitePath,
    pathRelativeToSiteBase: pathRelativeToSiteBase,
    normalizeChromeLinks: normalizeChromeLinks,
    updateActiveNav: updateActiveNav,
    initMainContent: initMainContent,
    closeMenus: closeMobileNav
  };

  /* ---- Everything below runs exactly once, ever: header/footer elements
     persist for the whole session regardless of in-app navigation. ---- */
  document.addEventListener('DOMContentLoaded', function () {
    normalizeChromeLinks();

    /* Mobile nav toggle */
    var navToggle = document.querySelector('.nav-toggle');
    var navLinks = document.querySelector('.nav-links');
    if (navToggle && navLinks) {
      navToggle.addEventListener('click', function () {
        var willOpen = !navLinks.classList.contains('is-open');
        if (willOpen) {
          navLinks.classList.add('is-open');
          navToggle.classList.add('is-open');
          navToggle.setAttribute('aria-expanded', 'true');
        } else {
          closeMobileNav();
        }
      });
      navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMobileNav);
      });
      document.addEventListener('click', function (e) {
        if (navLinks.classList.contains('is-open') && !navLinks.contains(e.target) && !navToggle.contains(e.target)) {
          closeMobileNav();
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          closeMobileNav();
        }
      });
    }

    /* Sticky header shadow/background on scroll */
    var header = document.querySelector('.site-header');
    if (header) {
      var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* Resources mega-menu (desktop dropdown / mobile accordion) */
    document.querySelectorAll('.nav-item-mega').forEach(function (item) {
      var toggle = item.querySelector('.nav-link-toggle');
      var menu = item.querySelector('.mega-menu');
      if (!toggle || !menu) return;

      var close = function () {
        item.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      };
      var open = function () {
        item.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
      };

      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        item.classList.contains('is-open') ? close() : open();
      });
      menu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMegaMenus);
      });
      document.addEventListener('click', function (e) {
        if (!item.contains(e.target)) close();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
      });
    });

    /* Close any open <main> filter dropdowns cleanly (delegated once) */
    document.addEventListener('click', function (e) {
      document.querySelectorAll('.filter-dropdown.is-open').forEach(function (dropdown) {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('is-open');
          var toggle = dropdown.querySelector('.filter-toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.filter-dropdown.is-open').forEach(function (dropdown) {
          dropdown.classList.remove('is-open');
          var toggle = dropdown.querySelector('.filter-toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        });
      }
    });

    /* Footer year */
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  });

  /* ---- Deferred post-load Google Tag Manager (non-render-blocking) ---- */
  var GTM_ID = 'GTM-PFGQT6FX';
  var gtmLoaded = false;

  function loadGoogleTagManager() {
    if (gtmLoaded) return;
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    gtmLoaded = true;

    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      window.gtag = function () { window.dataLayer.push(arguments); };
    }
    window.gtag('js', new Date());
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(GTM_ID);
    (document.head || document.body || document.documentElement).appendChild(script);
  }

  function scheduleDeferredAnalytics() {
    var trigger = function () {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(loadGoogleTagManager, { timeout: 2000 });
      } else {
        setTimeout(loadGoogleTagManager, 1);
      }
    };

    if (document.readyState === 'complete') {
      trigger();
    } else {
      window.addEventListener('load', trigger, { once: true });
    }
  }

  scheduleDeferredAnalytics();
})();
