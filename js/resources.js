/* ==========================================================================
   scione.io — resource hub controller (resources.html, blog.html,
   research.html, assets.html, tutorials.html)

   Reads data/resources.csv (via js/resource-data.js) and renders the card
   grid for whichever content type the current page scopes to ("all" on
   resources.html, one type on each sub-hub). On top of the existing
   content-type dropdown in main.js (still just navigates between pages,
   unchanged), this adds a topic dropdown (same dropdown component,
   populated dynamically from whatever topics appear in the CSV for this
   page) and a search box, both of which filter the grid in place.

   To add a new resource: add a row to data/resources.csv and a matching
   content/{slug}.md file. Nothing here needs to change.

   v9: exposed as window.ResourcesController.init() instead of self-running
   at DOMContentLoaded -- js/router.js calls it once for the real initial
   page load, and again every time the SPA-style navigation swaps <main>'s
   content to a hub page. init() already self-guards (bails out immediately
   if this page has no [data-resource-type] root), so calling it on a page
   that isn't a hub page is always a safe, cheap no-op.
   ========================================================================== */

(function () {
  'use strict';

  var RD = window.ResourceData;
  var MIN_GRID_CARDS = 0;

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function init() {
    var root = document.querySelector('[data-resource-type]');
    var grid = document.getElementById('resource-grid');
    if (!root || !grid || !RD) return;

    var scopeType = root.getAttribute('data-resource-type');
    var topicDropdown = document.getElementById('topic-dropdown');
    var topicMenu = document.getElementById('topic-menu');
    var topicLabel = document.getElementById('topic-current-label');
    var searchInput = document.getElementById('resource-search');
    var emptyState = document.getElementById('resource-empty');
    var activeTopic = '';
    var scopedItems = [];

    RD.loadAll()
      .then(function (allItems) {
        scopedItems = scopeType === 'all' ? allItems : allItems.filter(function (i) { return i.content_type === scopeType; });
        buildTopicDropdown();
        render();
      })
      .catch(function (err) {
        console.error('Resource index failed to load:', err);
        grid.innerHTML = '';
        if (topicDropdown) topicDropdown.hidden = true;
        if (emptyState) {
          emptyState.hidden = false;
          emptyState.textContent = "Couldn't load the resource list just now. Refreshing usually fixes it.";
        }
      });

    function closeTopicDropdown() {
      if (!topicDropdown) return;
      topicDropdown.classList.remove('is-open');
      var toggle = topicDropdown.querySelector('.filter-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }

    function buildTopicDropdown() {
      if (!topicDropdown || !topicMenu) return;
      var topics = [];
      scopedItems.forEach(function (i) {
        if (i.topic && topics.indexOf(i.topic) === -1) topics.push(i.topic);
      });
      topics.sort(function (a, b) { return a.localeCompare(b); });

      if (!topics.length) {
        topicDropdown.hidden = true;
        topicMenu.innerHTML = '';
        return;
      }
      topicDropdown.hidden = false;

      var html = '<button type="button" class="filter-option is-active" role="option" aria-selected="true" data-topic="">' +
        '<span class="filter-option-text"><span>All topics</span></span>' +
        '<svg class="filter-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
        '</button>';
      topics.forEach(function (t) {
        html += '<button type="button" class="filter-option" role="option" data-topic="' + RD.escapeAttr(t) + '">' +
          '<span class="filter-option-text"><span>' + RD.escapeHTML(t) + '</span></span>' +
          '<svg class="filter-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
          '</button>';
      });
      topicMenu.innerHTML = html;

      topicMenu.querySelectorAll('.filter-option').forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeTopic = btn.getAttribute('data-topic') || '';
          topicMenu.querySelectorAll('.filter-option').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
          if (topicLabel) topicLabel.textContent = activeTopic || 'All topics';
          closeTopicDropdown();
          render();
        });
      });
    }

    function currentResults() {
      var pool = activeTopic ? scopedItems.filter(function (i) { return i.topic === activeTopic; }) : scopedItems.slice();
      var query = searchInput ? searchInput.value : '';
      return RD.search(pool, query);
    }

    function render() {
      var isFiltered = !!(activeTopic || (searchInput && searchInput.value.trim()));
      var results = currentResults();

      if (isFiltered && !results.length) {
        grid.innerHTML = '';
        if (emptyState) {
          emptyState.hidden = false;
          emptyState.textContent = 'Nothing matches that yet. Try a different word, or clear the filter.';
        }
        return;
      }
      if (emptyState) emptyState.hidden = true;

      var showFeatured = scopeType === 'all' && !isFiltered && results.length > 1;
      var remaining = showFeatured ? results.slice(1) : results.slice();
      var html = showFeatured ? RD.cardHTML(results[0], true) : '';

      if (!isFiltered) {
        while (remaining.length < MIN_GRID_CARDS) remaining.push(null);
      }

      var cardsHTML = remaining.map(function (item) {
        return item ? RD.cardHTML(item, false) : RD.ghostCardHTML(scopeType);
      }).join('');

      html += '<div class="grid grid-3">' + cardsHTML + '</div>';
      grid.innerHTML = html;
    }

    if (searchInput) {
      searchInput.addEventListener('input', debounce(render, 120));
    }
  }

  window.ResourcesController = { init: init };
})();
