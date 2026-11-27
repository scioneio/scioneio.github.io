/* ==========================================================================
   scione.io - organizations impacted directory & slider data

   Single source of truth consumed by:
     - js/main.js (homepage Organizations Impacted marquee + hover/tap card)
     - build.js (generates static HTML cards inside impact.html so every
       organization, summary, and detail is directly crawlable/indexable)

   To reorder logos or update copy: edit ORGANIZATIONS_IMPACTED below, then
   run `node build.js` to regenerate impact.html.
   ========================================================================== */

(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = data; // Node (build.js)
  } else {
    root.OrganizationsData = data; // browser (<script> tag)
    root.ORGANIZATIONS_IMPACTED = data.ORGANIZATIONS_IMPACTED;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var LOGO_BASE = 'images/organizations-impacted/';

  var ORGANIZATIONS_IMPACTED = [
    {
      slug: 'market-vantage',
      file: 'market-vantage.png',
      name: 'Market Vantage',
      headline: 'Lead web developer & organic growth engineer',
      summary: 'I lead web development, SEO, AI Engine Optimization (GEO), GA4 attribution analytics, and AI workflow automation for B2B clients.'
    },
    {
      slug: 'acclaro',
      file: 'acclaro.png',
      name: 'Acclaro',
      headline: 'Webflow rebuild, SEO, landing pages & video',
      summary: "Through Market Vantage, I project-managed the team and led Acclaro's full Webflow rebuild from plan to launch, along with SEO, landing pages, ad creatives, and social video clips edited from webinars."
    },
    {
      slug: 'appfire',
      file: 'appfire.png',
      name: 'Appfire',
      headline: 'Ad creative & marketplace SEO',
      summary: "Through Market Vantage, I led visual ad creative initiatives and ran SEO across Appfire's Atlassian Marketplace app listings and main marketing site."
    },
    {
      slug: 'camunda',
      file: 'camunda.png',
      name: 'Camunda',
      headline: 'SEO, content optimization & keywords',
      summary: 'I supported Camunda primarily through SEO, creating and optimizing page content and monitoring keyword performance.'
    },
    {
      slug: 'build-it-yourself',
      file: 'build-it-yourself.png',
      name: 'Build-It-Yourself',
      headline: 'Operations, Build-It-Blocks & workshops',
      summary: "I started teaching Blender 3D workshops alongside MIT undergraduates, later served as operations manager rebuilding Build-It-Blocks and training interns, and helped co-host an online session at MIT's Universal Village."
    },
    {
      slug: 'greater-lawrence-technical-school',
      file: 'greater-lawrence-technical-school.png',
      name: 'Greater Lawrence Technical School',
      headline: 'Valedictorian alumni & advisory board member',
      summary: "I studied electronics in the engineering cluster at Greater Lawrence Technical School, graduated valedictorian in 2008, led a peer 3D graphics class, and later returned to serve on the school's advisory board."
    },
    {
      slug: 'cramer',
      file: 'cramer.png',
      name: 'Cramer',
      headline: 'SEO, AEO/GEO, blog publishing & ad creatives',
      summary: 'Through Market Vantage, I led keyword strategy, SEO, and early AEO/GEO work for Cramer, while directly creating, editing, and publishing blog pages alongside ad banners and creatives.'
    },
    {
      slug: 'flockler',
      file: 'flockler.png',
      name: 'Flockler',
      headline: 'Paid advertising & ad creatives',
      summary: "Through Market Vantage, I supported Flockler's paid advertising efforts by designing ad creatives and reviewing landing page details."
    },
    {
      slug: 'digilent',
      file: 'digilent.png',
      name: 'Digilent',
      headline: 'SEO, keyword strategy & reporting',
      summary: 'Through Market Vantage, I focused purely on SEO for Digilent, managing keyword strategy, optimization, and ongoing progress reporting.'
    },
    {
      slug: 'l2l',
      file: 'l2l.png',
      name: 'L2L',
      headline: 'Ad creatives & conversion tracking',
      summary: 'Through Market Vantage, I supported L2L primarily with ad creatives alongside conversion tracking work.'
    },
    {
      slug: 'relay',
      file: 'relay.png',
      name: 'Relay Commerce',
      headline: 'SEO, ad creatives & HubSpot pages',
      summary: "Through Market Vantage, I contributed to Relay Commerce's SEO and ad creatives, and occasionally assisted with HubSpot landing pages."
    },
    {
      slug: 'walking-by-faith',
      file: 'walking-by-faith.png',
      name: 'Walking by Faith',
      headline: 'WordPress LMS & RTL Farsi localization',
      summary: "Through Market Vantage, I helped build a WordPress learning management system (LMS) for this Woburn church's scripture-study platform and created a second localized version in right-to-left Farsi."
    },
    {
      slug: 'pathway-law',
      file: 'pathway-law.png',
      name: 'Pathway Law',
      headline: 'Digital & web support via Market Vantage',
      summary: 'Through Market Vantage, I supported Pathway Law, a Massachusetts estate planning and long-term care law firm, with digital and website initiatives.'
    },
    {
      slug: 'apricity-robotics',
      file: 'apricity-robotics.png',
      name: 'Apricity Robotics',
      headline: 'HubSpot CMS custom theme & team leadership',
      summary: 'Through Market Vantage, I led the team through building a new website for Apricity Robotics on HubSpot CMS with a custom theme.'
    },
    {
      slug: 'spear-the-air',
      file: 'spear-the-air.png',
      name: 'Spear the Air',
      headline: 'WordPress site, strategy, deployment & training',
      summary: 'In partnership with Web Leads For You Marketing, I led the entire WordPress website project for Spear the Air, managing the account, strategy, development, deployment, and internal team training.'
    },
    {
      slug: 'boston-transxpress',
      file: 'boston-transxpress.png',
      name: 'Boston TransXpress',
      headline: 'Custom transportation booking & payment platform',
      summary: 'I built a custom pre-AI-era transportation booking and dispatch platform from scratch, integrating Google Maps routing with dynamic toll and time-of-day pricing, relational database ride persistence, and PayPal authorization, capture, tipping, and IPN workflows.'
    },
    {
      slug: 'day-zero-diagnostics',
      file: 'day-zero-diagnostics.png',
      name: 'Day Zero Diagnostics',
      headline: 'New-hire onboarding materials',
      summary: 'I helped design and produce onboarding materials and collateral to help bring new hires up to speed.'
    },
    {
      slug: 'ford-viizr',
      file: 'ford-viizr.png',
      name: 'Ford VIIZR',
      headline: 'Paid advertising & ad creatives',
      summary: 'Through Market Vantage, I designed ad creatives supporting campaigns for Ford VIIZR.'
    },
    {
      slug: 'baymont-inn-and-suites',
      file: 'baymont-inn-and-suites.png',
      name: 'Baymont Inn & Suites',
      headline: 'Online reputation management',
      summary: 'During my Image Lucidity years, I managed ongoing review monitoring, response strategy, and local listing accuracy for Baymont Inn & Suites Celebration.'
    },
    {
      slug: 'buckingham-browne-nichols-school',
      file: 'buckingham-browne-nichols-school.png',
      name: 'Buckingham Browne & Nichols School',
      headline: 'Summer camp & after-school workshops',
      summary: 'Through Build-It-Yourself, I helped lead a variety of hands-on technology and creative workshops across their summer camps and after-school programs.'
    },
    {
      slug: 'concord-academy-summer-camp',
      file: 'concord-academy-summer-camp.png',
      name: 'Concord Academy Summer Camp',
      headline: 'Summer camp workshops',
      summary: 'Through Build-It-Yourself, I helped lead hands-on technology and creative workshops for their summer camp program.'
    },
    {
      slug: 'fay-school',
      file: 'fay-school.png',
      name: 'Fay School',
      headline: 'Summer camp workshops',
      summary: 'Through Build-It-Yourself, I helped lead hands-on technology and creative workshops for their summer camp program.'
    },
    {
      slug: 'lawrence-academy',
      file: 'lawrence-academy.png',
      name: 'Lawrence Academy',
      headline: 'Summer camp workshops',
      summary: 'Through Build-It-Yourself, I helped lead hands-on technology and creative workshops for their summer camps.'
    },
    {
      slug: 'summer-fenn',
      file: 'summer-fenn.png',
      name: 'Summer Fenn',
      headline: 'Blender 3D & Photoshop workshops',
      summary: 'Contracted independently, I created my own Blender 3D curriculum guiding students to build interactive 3D games using physics engines, and also led their Photoshop workshop.'
    },
    {
      slug: 'colegio-las-hayas',
      file: 'colegio-las-hayas.png',
      name: 'Colegio Las Hayas',
      headline: 'In-class STEAM & smart city projects',
      summary: 'Through Build-It-Yourself, I helped teach in-class projects at this private school in Mexico, including regional studies and a smart city project focused on better urban design.'
    },
    {
      slug: 'john-pierce-school',
      file: 'john-pierce-school.png',
      name: 'John Pierce School',
      headline: 'After-school STEAM workshops',
      summary: 'Through Build-It-Yourself, I helped lead hands-on after-school creative and technology projects with students.'
    },
    {
      slug: 'winn-brook-elementary',
      file: 'winn-brook-elementary.png',
      name: 'Winn Brook Elementary',
      headline: 'After-school STEAM workshops',
      summary: 'Through Build-It-Yourself, I helped lead hands-on after-school creative and technology projects with students.'
    },
    {
      slug: '2359-design-industrial-design',
      file: '2359-design-industrial-design.png',
      name: '2359 Design',
      headline: 'Product visualizations & 3D space animation',
      summary: 'I supported this industrial design firm with product visualizations and created custom 3D space animations for an indie film project they contracted on.'
    },
    {
      slug: 'christian-hill-studios',
      file: 'christian-hill-studios.png',
      name: 'Christian Hill Studios',
      headline: 'Web design & development partner',
      summary: 'During my Image Lucidity years, I partnered with Christian Hill Studios as their web design and development specialist alongside photography and creative talent.'
    },
    {
      slug: 'the-silva-screen',
      file: 'the-silva-screen.png',
      name: 'The Silva Screen',
      headline: 'Websites, motion graphics & 3D animation',
      summary: 'I built websites to bring their independent movies and series to wider audiences alongside YouTube, and created motion graphics and 3D animations for multiple commercials.'
    },
    {
      slug: 'pinnacle-service-solutions',
      file: 'pinnacle-service-solutions.png',
      name: 'Pinnacle Service Solutions',
      headline: 'Electronics repair & salvaged inventory systems',
      summary: 'I started as a TV repair technician, moved into managing reclaimed inventory, and built an internal Microsoft Access parts-and-brands search system.'
    },
    {
      slug: 'acorn',
      file: 'acorn.png',
      name: 'Acorn',
      headline: 'SEO & website updates',
      summary: 'Through Market Vantage, I supported Acorn with SEO work and ongoing edits to their website.'
    },
    {
      slug: 'aguiar-painting',
      file: 'aguiar-painting.png',
      name: 'Aguiar Painting',
      headline: 'Brand identity & logo design',
      summary: "I helped establish Aguiar Painting's visual brand identity and designed their logo."
    },
    {
      slug: 'ameriquest-travel',
      file: 'ameriquest-travel.png',
      name: 'AmeriQuest Travel',
      headline: 'Logo & brand concept design',
      summary: 'I developed exploratory logo concepts and early visual design directions to help inform their branding process.'
    },
    {
      slug: 'bens-auto-body',
      file: 'bens-auto-body.png',
      name: "Ben's Auto Body",
      headline: 'Brand identity, logo & full website',
      summary: "I created Ben's Auto Body's logo and built their first full website from the ground up."
    },
    {
      slug: 'best-price-auto-sales',
      file: 'best-price-auto-sales.png',
      name: 'Best Price Auto Sales',
      headline: 'Commercial motion graphics & 3D animation',
      summary: 'Working through The Silva Screen, I created motion graphics and 3D animations for their commercial.'
    },
    {
      slug: 'boston-health-zone',
      file: 'boston-health-zone.png',
      name: 'Boston Health Zone',
      headline: 'Brand identity & logo design',
      summary: 'I created the logo and foundational branding for Boston Health Zone.'
    },
    {
      slug: 'brandividualist',
      file: 'brandividualist.png',
      name: 'Brandividualist',
      headline: 'Multi-iteration website development',
      summary: "I built two iterations of Brandividualist's website for seasoned agency branding specialist Christopher Payne-Taylor."
    },
    {
      slug: 'bryant-global-enterprise',
      file: 'bryant-global-enterprise.png',
      name: 'Bryant Global Enterprise',
      headline: 'Shopify e-commerce build & management',
      summary: 'Through Image Lucidity, I built and managed a Shopify storefront to help bring their medical product offerings to market.'
    },
    {
      slug: 'call-center-qa',
      file: 'call-center-qa.png',
      name: 'Call Center QA',
      headline: 'Web builds, PHP/MySQL tools & 3D commercial',
      summary: 'I first created 3D animations for their commercial through The Silva Screen, then retained them directly to build and later rebuild their website along with hand-coded PHP and MySQL internal tooling.'
    },
    {
      slug: 'celllife-medical',
      file: 'celllife-medical.png',
      name: 'CellLife Medical',
      headline: 'Medical practice website build',
      summary: "I built the website for CellLife Medical, Dr. Fabian Proano's regenerative medicine practice in Torrance, California, focused on non-surgical relief for joint arthritis, back pain, and spinal disc conditions."
    },
    {
      slug: 'pacific-reproductive-center',
      file: 'pacific-reproductive-center.png',
      name: 'Pacific Reproductive Center',
      headline: 'Websites & Chinese market localization',
      summary: 'Through Image Lucidity, I built two websites for this Torrance, California IVF and fertility clinic, including a localized Chinese-language site prepared for international patients and reviewed with a language specialist.'
    },
    {
      slug: 'coffee-coffee',
      file: 'coffee-coffee.png',
      name: 'Coffee Coffee',
      headline: 'WooCommerce ordering, visibility & ongoing care',
      summary: 'A favorite long-term Image Lucidity client, I managed their web presence, visibility, and a complex WooCommerce setup supporting pickup, local delivery, shipping, and gift cards.'
    },
    {
      slug: 'dahcart',
      file: 'dahcart.png',
      name: 'DAHCART',
      headline: 'Websites, event promos & creative assets',
      summary: 'Over several years, I supported DAHCART with websites, event promotional campaigns, flyers, and a wide range of marketing assets.'
    },
    {
      slug: 'design-4-lowell',
      file: 'design-4-lowell.png',
      name: 'Design 4 Lowell',
      headline: 'Featured web designer',
      summary: 'I was featured as a web designer in Design 4 Lowell magazine.'
    },
    {
      slug: 'design-by-jlor',
      file: 'design-by-jlor.png',
      name: 'Design by JLor',
      headline: 'Website design & development',
      summary: 'I designed and built the website for Design by JLor.'
    },
    {
      slug: 'elixir-hookah-lounge',
      file: 'elixir-hookah-lounge.png',
      name: 'Elixir Hookah Lounge',
      headline: 'Commercial animations',
      summary: "Working through The Silva Screen, I created animations for Elixir Hookah Lounge's commercials."
    },
    {
      slug: 'fright-kingdom',
      file: 'fright-kingdom.png',
      name: 'Fright Kingdom',
      headline: "Web updates, print design & children's book",
      summary: "Through Image Lucidity, I supported Fright Kingdom with web page updates and ticket design, and collaborated with illustrator Ahna Gell to write and bring a children's book to their venue."
    },
    {
      slug: 'garcia-brogans',
      file: 'garcia-brogans.png',
      name: "Garcia Brogan's",
      headline: 'Multi-location restaurant website',
      summary: "I helped build the website for Garcia Brogan's across their multiple restaurant locations, including menus and table reservation features."
    },
    {
      slug: 'guardian-adventures',
      file: 'guardian-adventures.png',
      name: 'Guardian Adventures',
      headline: 'Day camp instructor & storytelling',
      summary: 'As a summer day camp instructor immersed in interactive storytelling and live-action roleplay, I sharpened the narrative instincts I still draw on for brand and marketing storytelling.'
    },
    {
      slug: 'joanna-de-pena',
      file: 'joanna-de-pena.png',
      name: 'Joanna de Peña',
      headline: 'Personal brand identity',
      summary: 'I helped develop the branding and visual identity for speaker, educator, and Top Notch Scholars founder Joanna de Peña.'
    },
    {
      slug: 'massachusetts-home-hub',
      file: 'massachusetts-home-hub.png',
      name: 'Massachusetts Home Hub',
      headline: 'Brand identity & logo design',
      summary: 'I designed the logo and visual branding for Massachusetts Home Hub.'
    },
    {
      slug: 'michaels-pikliz',
      file: 'michaels-pikliz.png',
      name: "Michael's Pikliz",
      headline: 'Brand design, labels & product visualization',
      summary: 'In collaboration with Ahna Gell, I worked on branding, food packaging labels, and product visualizations for this Haitian pikliz condiment brand.'
    },
    {
      slug: 'paint-for-peace',
      file: 'paint-for-peace.png',
      name: 'Paint for Peace',
      headline: 'Brand, website & creative materials',
      summary: 'I supported Paint for Peace across their branding, website, and creative collateral.'
    },
    {
      slug: 'perfect-social-boost',
      file: 'perfect-social-boost.png',
      name: 'Perfect Social Boost',
      headline: 'Brand, 3D mascot, website & payment portal',
      summary: "Through Image Lucidity, I built the brand, website, and payment portal for this social media marketing agency, including bringing a 3D brand character to life from Ahna Gell's initial sketches."
    },
    {
      slug: 'revolution-juice',
      file: 'revolution-juice.png',
      name: 'Revolution Juice',
      headline: 'Websites & online ordering integration',
      summary: 'I built multiple iterations of the website for this health-focused Boston smoothie bar and integrated their online ordering platform.'
    },
    {
      slug: 'sienna-nicole-boutique',
      file: 'sienna-nicole-boutique.png',
      name: 'Sienna Nicole Boutique',
      headline: 'Shopify e-commerce store',
      summary: 'I built a Shopify e-commerce storefront for this Hampton Beach area consignment boutique.'
    },
    {
      slug: 'soundguru-international',
      file: 'soundguru-international.png',
      name: 'SoundGuru International',
      headline: 'Brand identity & logo design',
      summary: 'I created the logo and visual branding for SoundGuru International.'
    },
    {
      slug: 'sunnyside-diner',
      file: 'sunnyside-diner.png',
      name: 'Sunnyside Diner',
      headline: 'Commercial production appearance',
      summary: "I appeared on camera as a background extra in Sunnyside Diner's commercials produced by The Silva Screen."
    },
    {
      slug: 'the-boston-dad',
      file: 'the-boston-dad.png',
      name: 'The Boston Dad',
      headline: 'Logo design & initial website',
      summary: 'For filmmaker and internet personality Daryl Silva (The Silva Screen), I set up the initial website and created The Boston Dad logo still used today.'
    },
    {
      slug: 'top-notch-scholars',
      file: 'top-notch-scholars.png',
      name: 'Top Notch Scholars',
      headline: 'Advisory board, web design, PSA & events',
      summary: 'I served on the advisory board during the Top Notch Network era (before its pivot to the youth leadership nonprofit Top Notch Scholars), led design and web coordination with an overseas development team, supported the Patriots Alumni golf tournament at Merrimack Valley Golf Club, and helped with a Massachusetts dropout-prevention PSA featuring Tony Collins, Walter McCarty, and state leaders.'
    },
    {
      slug: 'tops-electronic-service',
      file: 'tops-electronic-service.png',
      name: 'Tops Electronic Service',
      headline: 'Internal inventory & Access database tools',
      summary: 'Before the company became Pinnacle, I built internal Microsoft Access database tools to support electronics inventory tracking and operations.'
    },
    {
      slug: 'two-guys-cigars',
      file: 'two-guys-cigars.png',
      name: 'Two Guys Cigars',
      headline: 'Commercial 3D animation & motion graphics',
      summary: "Working through The Silva Screen, I created 3D animations and motion graphics for Two Guys Smoke Shop's commercial."
    },
    {
      slug: 'xtrinity-fitness',
      file: 'xtrinity-fitness.png',
      name: 'XTrinity Fitness',
      headline: 'Website, online ordering & memberships',
      summary: "I built and managed XTrinity Fitness's website, including online ordering, membership functionality, and ongoing site updates."
    }
  ];

  return {
    LOGO_BASE: LOGO_BASE,
    ORGANIZATIONS_IMPACTED: ORGANIZATIONS_IMPACTED
  };
});
