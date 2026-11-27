#!/usr/bin/env node
/* ==========================================================================
   scione.io -- static build script

   Turns data/resources.csv + content/*.md into real, individual HTML files:
   blog/{slug}.html, research/{slug}.html, assets/{slug}.html,
   tutorials/{slug}.html -- plus a plain 404.html and a sitemap.xml. Every
   generated file is a genuine static file with a real 200 status: no
   client-side routing, no redirects, no runtime CSV fetch for its own
   content.

   Run this after adding or editing a CSV row or a content/*.md file:
     npm install      (once)
     node build.js

   Uses the exact same CSV parsing / search / card / hrefFor / relatedTo
   logic as the live hub-page search (js/resource-data.js, required below),
   so a resource can never be described differently by the generated page
   than by the search results that link to it.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const ROOT = __dirname;
const RD = require('./js/resource-data.js');
const ORG = require('./js/organizations.js');

// The one thing this script has to guess: the real domain the site ends up
// hosted at, used for the parts that MUST be absolute (og:image, canonical,
// sitemap.xml, JSON-LD). This matches the domain already assumed elsewhere
// in the project (about.html's JSON-LD uses the same one) -- change this
// single constant if the real domain differs.
const SITE_URL = 'https://scione.io';
const WEBSITE_ID = SITE_URL + '/#website';
const PERSON_ID = SITE_URL + '/#brent-scione';
const SAME_AS = [
  'https://www.linkedin.com/in/brent-scione/',
  'https://www.youtube.com/@brentscione'
];
const PERSON_SUMMARY =
  'Brent Scione is a lead web developer and organic growth engineer at Market Vantage who designs and maintains web platforms, AI workflows, brand systems, and analytics infrastructure, pairing traditional programming with a background spanning electronics engineering, eLearning, and multimedia production.';
const PERSON_REF = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Brent Scione',
  url: SITE_URL + '/about.html',
  jobTitle: 'Lead Web Developer and Organic Growth Engineer',
  sameAs: SAME_AS
};

const TYPE_FOLDERS = ['blog', 'research', 'assets', 'tutorials'];
const DEFAULT_OG_IMAGE = 'images/brent-scione.avif';

const HUB_PAGES = [
  {
    file: 'resources.html',
    scopeType: 'all',
    hubName: 'Resources',
    title: 'Resources | Brent Scione | scione.io',
    description: 'Articles, research, downloadable checklists, and tutorials by Brent Scione on web development, SEO, GEO/AEO, analytics, and AI workflows.'
  },
  {
    file: 'blog.html',
    scopeType: 'blog',
    hubName: 'Blog',
    title: 'Blog | Brent Scione | Web Development, SEO & AI',
    description: 'Longer-form posts by Brent Scione covering web development, technical SEO, GEO/AEO, brand systems, and practical AI workflows.'
  },
  {
    file: 'research.html',
    scopeType: 'research',
    hubName: 'Research',
    title: 'Research | Brent Scione | Search, Performance & Security',
    description: 'Focused research write-ups by Brent Scione answering practical questions on page speed, SEO, analytics, security, and platform selection.'
  },
  {
    file: 'assets.html',
    scopeType: 'assets',
    hubName: 'Assets',
    title: 'Assets & Checklists | Brent Scione | scione.io',
    description: 'Practical website launch and PageSpeed optimization checklists by Brent Scione.'
  },
  {
    file: 'tutorials.html',
    scopeType: 'tutorial',
    hubName: 'Tutorials',
    title: 'Tutorials | Brent Scione | Analytics & Web Guides',
    description: 'Step-by-step how-to guides by Brent Scione on GA4, Google Tag Manager, Looker Studio, and web infrastructure.'
  }
];
const HUB_BY_TYPE = {
  blog: HUB_PAGES[1],
  research: HUB_PAGES[2],
  assets: HUB_PAGES[3],
  tutorial: HUB_PAGES[4]
};
const MIN_GRID_CARDS = 0;

const purifyWindow = new JSDOM('').window;
const DOMPurify = createDOMPurify(purifyWindow);

const TEMPLATE = fs.readFileSync(path.join(ROOT, '_template.html'), 'utf8');

function fillTemplate(tokens) {
  return TEMPLATE.replace(/\{\{(\w+)\}\}/g, function (match, key) {
    return Object.prototype.hasOwnProperty.call(tokens, key) ? tokens[key] : '';
  });
}

function renderMarkdown(mdText) {
  return DOMPurify.sanitize(marked.parse(mdText));
}

function absoluteAsset(relPath) {
  if (/^https?:\/\//i.test(relPath)) return relPath;
  return SITE_URL + '/' + relPath.replace(/^\/+/, '');
}

function ogImageFor(item) {
  return absoluteAsset(item.featured_image || DEFAULT_OG_IMAGE);
}

function buildHeadExtras(item, canonicalUrl) {
  const title = RD.escapeAttr(item.title);
  const desc = RD.escapeAttr(item.excerpt);
  const image = ogImageFor(item);
  const keywords = (item.keywords || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean);
  const articleType = item.content_type === 'blog' ? 'BlogPosting' : 'TechArticle';
  const hub = HUB_BY_TYPE[item.content_type] || HUB_PAGES[0];

  const breadcrumbs = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' },
    { '@type': 'ListItem', position: 2, name: 'Resources', item: SITE_URL + '/resources.html' }
  ];
  if (hub.file !== 'resources.html') {
    breadcrumbs.push({ '@type': 'ListItem', position: 3, name: hub.hubName, item: SITE_URL + '/' + hub.file });
    breadcrumbs.push({ '@type': 'ListItem', position: 4, name: item.title, item: canonicalUrl });
  } else {
    breadcrumbs.push({ '@type': 'ListItem', position: 3, name: item.title, item: canonicalUrl });
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': articleType,
        '@id': canonicalUrl + '#article',
        headline: item.title,
        description: item.excerpt,
        datePublished: item.publish_date,
        keywords: keywords,
        articleSection: item.topic || hub.hubName,
        author: PERSON_REF,
        publisher: PERSON_REF,
        image: image,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
        isPartOf: { '@id': WEBSITE_ID }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs
      }
    ]
  };
  return [
    '<link rel="canonical" href="' + canonicalUrl + '">',
    '<meta name="author" content="Brent Scione">',
    '<meta property="og:type" content="article">',
    '<meta property="og:site_name" content="scione.io">',
    '<meta property="og:title" content="' + title + '">',
    '<meta property="og:description" content="' + desc + '">',
    '<meta property="og:url" content="' + canonicalUrl + '">',
    '<meta property="og:image" content="' + image + '">',
    '<meta property="article:published_time" content="' + RD.escapeAttr(item.publish_date) + '">',
    '<meta property="article:author" content="' + SITE_URL + '/about.html">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + title + '">',
    '<meta name="twitter:description" content="' + desc + '">',
    '<meta name="twitter:image" content="' + image + '">',
    '<script type="application/ld+json">' + JSON.stringify(jsonLd) + '</script>'
  ].join('\n');
}

function buildMetaRow(item) {
  const metaLabel = (RD.TYPE_META_LABEL && RD.TYPE_META_LABEL[item.content_type]) || 'Brent Scione';
  const dateLabel = RD.formatDate(item.publish_date);
  return (
    '<div class="article-meta">' +
      '<div class="avatar avatar-sm">BS</div>' +
      '<span class="meta-name">' + RD.escapeHTML(metaLabel) + '</span>' +
      '<span class="dot-sep"></span>' +
      '<span>' + RD.escapeHTML(dateLabel) + '</span>' +
    '</div>'
  );
}

function buildHeroBlock(item) {
  if (!item.featured_image) return '';
  const isAbsolute = /^https?:\/\//i.test(item.featured_image);
  const src = isAbsolute ? item.featured_image : '../' + item.featured_image;
  return (
    '<div class="container container--narrow">' +
      '<div class="post-hero-image">' +
        '<img src="' + RD.escapeAttr(src) + '" alt="' + RD.escapeAttr(item.title) + '">' +
      '</div>' +
    '</div>'
  );
}

function buildRelatedBlock(item, allItems) {
  const related = RD.relatedTo(allItems, item, 3);
  if (!related.length) return '';
  const cards = related.map(function (r) { return RD.cardHTML(r, false, 1); }).join('');
  return (
    '<div class="section section-alt">' +
      '<div class="container">' +
        '<div class="related-strip">' +
          '<h3 class="reveal" style="margin-bottom:28px;">Related resources</h3>' +
          '<div class="grid grid-3">' + cards + '</div>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function generateResourcePage(item, allItems) {
  const folder = RD.TYPE_URL_FOLDER[item.content_type] || item.content_type;
  const outDir = path.join(ROOT, folder);
  const outFile = path.join(outDir, item.slug + '.html');
  const canonicalUrl = SITE_URL + '/' + RD.hrefFor(item);

  const mdPath = path.join(ROOT, 'content', item.slug + '.md');
  const mdText = fs.readFileSync(mdPath, 'utf8');
  const bodyHTML = renderMarkdown(mdText);

  const typeLabel = (RD.TYPE_LABELS && RD.TYPE_LABELS[item.content_type]) || item.content_type;
  const cta = (RD.TYPE_CTA && RD.TYPE_CTA[item.content_type]) || ["Let's connect or work with me", "Let's connect to talk shop and compare notes, or work together through Market Vantage on what you're building."];

  const html = fillTemplate({
    REL: '../',
    META_TITLE: RD.escapeHTML(item.title) + ' | Brent Scione',
    DESCRIPTION: RD.escapeAttr(item.excerpt),
    HEAD_EXTRAS: buildHeadExtras(item, canonicalUrl),
    TAG: RD.escapeHTML(typeLabel),
    TITLE: RD.escapeHTML(item.title),
    LEAD: RD.escapeHTML(item.excerpt),
    META_ROW: buildMetaRow(item),
    HERO_IMAGE_BLOCK: buildHeroBlock(item),
    BODY: bodyHTML,
    RELATED_BLOCK: buildRelatedBlock(item, allItems),
    CTA_TITLE: RD.escapeHTML(cta[0]),
    CTA_TEXT: RD.escapeHTML(cta[1])
  });

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, html);
  return folder + '/' + item.slug + '.html';
}

function generate404Page() {
  const mdPath = path.join(ROOT, 'content', '404.md');
  const bodyHTML = renderMarkdown(fs.readFileSync(mdPath, 'utf8'));
  const notFoundBaseScript = '<script>(function(){var p=location.pathname,m=p.match(/^(.*?\\/)(?:blog|research|assets|tutorials)\\//i),b=m?m[1]:(/^(?:www\\.)?scione\\.io$/i.test(location.hostname)?\'/\':\'\');if(b){var el=document.createElement(\'base\');el.href=b;document.head.appendChild(el);}})();</script>';

  const html = fillTemplate({
    REL: '',
    META_TITLE: 'Page Not Found | Brent Scione | scione.io',
    DESCRIPTION: "The page or resource you're looking for has moved or doesn't exist.",
    HEAD_EXTRAS: '<meta name="robots" content="noindex">\n' + notFoundBaseScript,
    TAG: 'Not found',
    TITLE: "This page doesn&#39;t exist",
    LEAD: 'The link might be out of date, or the address was mistyped.',
    META_ROW: '',
    HERO_IMAGE_BLOCK: '',
    BODY: bodyHTML,
    RELATED_BLOCK: '',
    CTA_TITLE: "Let's connect or work with me",
    CTA_TEXT: "Let's connect to talk shop and compare notes, or work together through Market Vantage on what you're building."
  });

  fs.writeFileSync(path.join(ROOT, '404.html'), html);
}

function generateSitemap(items) {
  const today = new Date().toISOString().slice(0, 10);
  const staticPaths = [
    '', 'about.html', 'capabilities.html', 'experience.html',
    'work.html', 'connect.html', 'impact.html', 'resources.html', 'blog.html',
    'research.html', 'assets.html', 'tutorials.html'
  ];
  const entries = staticPaths.map(function (p) {
    return { loc: SITE_URL + '/' + p, lastmod: today };
  }).concat(items.map(function (item) {
    return { loc: SITE_URL + '/' + RD.hrefFor(item), lastmod: item.publish_date || today };
  }));

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries.map(function (e) {
      return '  <url><loc>' + e.loc + '</loc><lastmod>' + e.lastmod + '</lastmod></url>';
    }).join('\n') + '\n' +
    '</urlset>\n';

  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
}

function renderDefaultGrid(scopeType, allItems) {
  // Mirrors js/resources.js's render() for the "no filter active" case
  // exactly -- same scoping, same default sort (RD.search with an empty
  // query sorts newest-first), same featured/ghost-padding rules. Anything
  // that diverges here would mean the static markup and the live JS
  // disagree, which is exactly what this is trying to avoid.
  const scopedItems = scopeType === 'all' ? allItems.slice() : allItems.filter(function (i) { return i.content_type === scopeType; });
  const results = RD.search(scopedItems, '');

  const showFeatured = scopeType === 'all' && results.length > 1;
  const remaining = showFeatured ? results.slice(1) : results.slice();
  while (remaining.length < MIN_GRID_CARDS) remaining.push(null);

  const cardsHTML = remaining.map(function (item) {
    return item ? RD.cardHTML(item, false) : RD.ghostCardHTML(scopeType);
  }).join('');

  return (showFeatured ? RD.cardHTML(results[0], true) : '') +
    '<div class="grid grid-3">' + cardsHTML + '</div>';
}

function injectHubGrids(items) {
  const marker = /<!-- BUILD:GRID:START -->[\s\S]*?<!-- BUILD:GRID:END -->/;
  HUB_PAGES.forEach(function (hub) {
    const filePath = path.join(ROOT, hub.file);
    const html = fs.readFileSync(filePath, 'utf8');
    if (!marker.test(html)) {
      throw new Error(hub.file + ': BUILD:GRID markers not found -- has the #resource-grid div been edited by hand?');
    }
    const gridHTML = renderDefaultGrid(hub.scopeType, items);
    const replaced = html.replace(marker, '<!-- BUILD:GRID:START -->' + gridHTML + '<!-- BUILD:GRID:END -->');
    fs.writeFileSync(filePath, replaced);
  });
}

function renderImpactList(orgs) {
  const base = ORG.LOGO_BASE || 'images/organizations-impacted/';
  return orgs.map(function (org) {
    const slug = RD.escapeAttr(org.slug);
    const name = RD.escapeHTML(org.name);
    const alt = RD.escapeAttr(org.name);
    const src = RD.escapeAttr(base + org.file);
    const headlineHTML = org.headline ? '<p class="impact-card-headline">' + RD.escapeHTML(org.headline) + '</p>' : '';
    const summaryHTML = org.summary ? '<p class="impact-card-summary">' + RD.escapeHTML(org.summary) + '</p>' : '';
    return (
      '<article class="impact-card scroll-offset" id="' + slug + '">' +
        '<div class="impact-card-logo">' +
          '<img src="' + src + '" alt="' + alt + '" width="200" height="100" loading="lazy" decoding="async">' +
        '</div>' +
        '<div class="impact-card-body">' +
          '<h3>' + name + '</h3>' +
          headlineHTML +
          summaryHTML +
        '</div>' +
      '</article>'
    );
  }).join('');
}

function injectImpactList(orgs) {
  const filePath = path.join(ROOT, 'impact.html');
  const marker = /<!-- BUILD:IMPACT:START -->[\s\S]*?<!-- BUILD:IMPACT:END -->/;
  const html = fs.readFileSync(filePath, 'utf8');
  if (!marker.test(html)) {
    throw new Error('impact.html: BUILD:IMPACT markers not found -- has the #impact-list div been edited by hand?');
  }
  const listHTML = renderImpactList(orgs);
  const replaced = html.replace(marker, '<!-- BUILD:IMPACT:START -->' + listHTML + '<!-- BUILD:IMPACT:END -->');
  fs.writeFileSync(filePath, replaced);
}

function injectImpactSchema(orgs) {
  const filePath = path.join(ROOT, 'impact.html');
  const marker = /<!-- BUILD:SCHEMA:START -->[\s\S]*?<!-- BUILD:SCHEMA:END -->/;
  const html = fs.readFileSync(filePath, 'utf8');
  if (!marker.test(html)) {
    throw new Error('impact.html: BUILD:SCHEMA markers not found.');
  }
  const canonicalUrl = SITE_URL + '/impact.html';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': canonicalUrl + '#webpage',
        url: canonicalUrl,
        name: 'Organizations Impacted | Brent Scione',
        description: 'Directory of ' + orgs.length + ' companies, schools, agencies, and teams Brent Scione has supported across web development, SEO, GEO/AEO, brand systems, analytics, education, and AI workflows.',
        about: PERSON_REF,
        isPartOf: { '@id': WEBSITE_ID },
        mainEntity: {
          '@type': 'ItemList',
          name: 'Organizations impacted by Brent Scione',
          numberOfItems: orgs.length,
          itemListElement: orgs.map(function (org, idx) {
            return {
              '@type': 'ListItem',
              position: idx + 1,
              name: org.name,
              description: (org.headline ? org.headline + ': ' : '') + (org.summary || ''),
              url: canonicalUrl + '#' + org.slug
            };
          })
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' },
          { '@type': 'ListItem', position: 2, name: 'Impact', item: canonicalUrl }
        ]
      }
    ]
  };
  const tag = '<script type="application/ld+json">' + JSON.stringify(jsonLd) + '</script>';
  fs.writeFileSync(filePath, html.replace(marker, '<!-- BUILD:SCHEMA:START -->' + tag + '<!-- BUILD:SCHEMA:END -->'));
}

function injectHubSchemas(items) {
  const marker = /<!-- BUILD:SCHEMA:START -->[\s\S]*?<!-- BUILD:SCHEMA:END -->/;
  HUB_PAGES.forEach(function (hub) {
    const filePath = path.join(ROOT, hub.file);
    const html = fs.readFileSync(filePath, 'utf8');
    if (!marker.test(html)) {
      throw new Error(hub.file + ': BUILD:SCHEMA markers not found.');
    }
    const scoped = hub.scopeType === 'all' ? items.slice() : items.filter(function (i) { return i.content_type === hub.scopeType; });
    const sorted = RD.search(scoped, '');
    const canonicalUrl = SITE_URL + '/' + hub.file;
    const breadcrumbs = [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' }];
    if (hub.file === 'resources.html') {
      breadcrumbs.push({ '@type': 'ListItem', position: 2, name: 'Resources', item: canonicalUrl });
    } else {
      breadcrumbs.push({ '@type': 'ListItem', position: 2, name: 'Resources', item: SITE_URL + '/resources.html' });
      breadcrumbs.push({ '@type': 'ListItem', position: 3, name: hub.hubName, item: canonicalUrl });
    }
    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': canonicalUrl + '#webpage',
          url: canonicalUrl,
          name: hub.title,
          description: hub.description,
          about: PERSON_REF,
          isPartOf: { '@id': WEBSITE_ID },
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: sorted.length,
            itemListElement: sorted.map(function (it, idx) {
              return {
                '@type': 'ListItem',
                position: idx + 1,
                name: it.title,
                url: SITE_URL + '/' + RD.hrefFor(it)
              };
            })
          }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbs
        }
      ]
    };
    const tag = '<script type="application/ld+json">' + JSON.stringify(jsonLd) + '</script>';
    fs.writeFileSync(filePath, html.replace(marker, '<!-- BUILD:SCHEMA:START -->' + tag + '<!-- BUILD:SCHEMA:END -->'));
  });
}

function generateLlmsTxt(items, orgs) {
  const sorted = RD.search(items.slice(), '');
  const lines = [
    '# Brent Scione (scione.io)',
    '',
    '> ' + PERSON_SUMMARY,
    '',
    '## Quick Identity',
    '- Name: Brent Scione',
    '- Current Role: Lead Web Developer & Organic Growth Engineer at Market Vantage (Mar 2021 to Present, Groton, MA, Remote)',
    '- Former Studio Founder: Image Lucidity, a multimedia studio (Oct 2009 to Mar 2021, Lowell, MA)',
    '- Early Career & EdTech: Operations Manager (Jan 2018 to Aug 2020) and Webmaster & Multimedia Instructor (May 2007 to Jan 2018) at Build-It-Yourself (Cambridge, MA); early electronics work at Pinnacle Electronics',
    '- Speaking & Teaching: Session co-host at MIT\'s Universal Village (2018, 2020) alongside John Galinato; guest instructor with Boston University\'s U-Design program',
    '- Education: University of Massachusetts Lowell (2008 to 2009, UMASS Scholars Scholarship, Dean\'s List, 3.5+ GPA); Greater Lawrence Technical School (2004 to 2008, Electronics/Engineering Valedictorian, Advisory Board member)',
    '- LinkedIn: https://www.linkedin.com/in/brent-scione/',
    '- YouTube: https://www.youtube.com/@brentscione',
    '',
    '## Core Pages',
    '- Home: https://scione.io/',
    '- About Brent Scione: https://scione.io/about.html',
    '- Capabilities: https://scione.io/capabilities.html',
    '- Experience & Education: https://scione.io/experience.html',
    '- Selected Work & Case Studies: https://scione.io/work.html',
    '- Organizations Impacted (' + orgs.length + ' total): https://scione.io/impact.html',
    '- Connect: https://scione.io/connect.html',
    '- Resources Hub: https://scione.io/resources.html',
    '',
    '## Organizations Impacted (' + orgs.length + ')',
    ''
  ];

  orgs.forEach(function (org) {
    lines.push('- **' + org.name + '** (' + org.headline + '): ' + org.summary + ' [Details](https://scione.io/impact.html#' + org.slug + ')');
  });

  lines.push('');
  lines.push('## Published Writing, Research & Guides (' + sorted.length + ')');
  lines.push('');

  sorted.forEach(function (it) {
    const label = (RD.TYPE_LABELS && RD.TYPE_LABELS[it.content_type]) || it.content_type;
    lines.push('- [' + it.title + '](' + SITE_URL + '/' + RD.hrefFor(it) + ') (' + label + ', ' + it.topic + ', ' + it.publish_date + '): ' + it.excerpt);
  });

  lines.push('');
  fs.writeFileSync(path.join(ROOT, 'llms.txt'), lines.join('\n'));
}

function cleanGeneratedFolders() {
  TYPE_FOLDERS.forEach(function (folder) {
    const dir = path.join(ROOT, folder);
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); return; }
    // Every .html file in these folders is build-owned -- nothing hand-authored
    // ever lives here -- so it's safe to clear them before each rebuild. This
    // is what stops a renamed/removed CSV slug from leaving a stale, orphaned
    // file behind.
    fs.readdirSync(dir).forEach(function (f) {
      if (f.endsWith('.html')) fs.unlinkSync(path.join(dir, f));
    });
  });
}

function validate(items) {
  const errors = [];
  const seen = new Set();
  items.forEach(function (item, i) {
    const row = 'row ' + (i + 2); // +2: 1-indexed, plus header row
    if (!item.slug) errors.push(row + ': missing slug');
    if (!item.title) errors.push(row + ': missing title');
    if (!item.content_type) errors.push(row + ': missing content_type');
    else if (!RD.TYPE_URL_FOLDER[item.content_type]) {
      errors.push(row + ': unknown content_type "' + item.content_type + '" (expected blog, research, assets, or tutorial)');
    }
    const key = item.content_type + '/' + item.slug;
    if (seen.has(key)) errors.push(row + ': duplicate slug "' + item.slug + '" for content_type "' + item.content_type + '"');
    seen.add(key);
    if (item.slug) {
      const mdPath = path.join(ROOT, 'content', item.slug + '.md');
      if (!fs.existsSync(mdPath)) errors.push(row + ': content/' + item.slug + '.md not found for slug "' + item.slug + '"');
    }
  });
  return errors;
}

function main() {
  const csvText = fs.readFileSync(path.join(ROOT, 'data', 'resources.csv'), 'utf8');
  const items = RD.csvToObjects(csvText).filter(function (item) { return item.slug && item.title; });

  const errors = validate(items);
  if (errors.length) {
    console.error('Build failed -- fix these first:\n');
    errors.forEach(function (e) { console.error('  - ' + e); });
    process.exit(1);
  }

  cleanGeneratedFolders();

  const generated = items.map(function (item) { return generateResourcePage(item, items); });
  generate404Page();
  generateSitemap(items);
  injectHubGrids(items);
  injectHubSchemas(items);
  injectImpactList(ORG.ORGANIZATIONS_IMPACTED);
  injectImpactSchema(ORG.ORGANIZATIONS_IMPACTED);
  generateLlmsTxt(items, ORG.ORGANIZATIONS_IMPACTED);

  console.log('Built ' + generated.length + ' resource page(s):');
  generated.forEach(function (g) { console.log('  ' + g); });
  console.log('Built 404.html, sitemap.xml, and llms.txt.');
  console.log('Injected default resource-grid markup and schemas into ' + HUB_PAGES.length + ' hub page(s).');
  console.log('Injected ' + ORG.ORGANIZATIONS_IMPACTED.length + ' organization(s) and schema into impact.html.');
}

main();
