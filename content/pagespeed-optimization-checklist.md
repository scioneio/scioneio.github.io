PageSpeed problems tend to hide in the same handful of places every time. This is the order I actually check them in, from the changes that move the needle most to the smaller cleanup that rounds things out.

### Images first

- Compress every image without visibly losing quality
- Switch to modern formats like AVIF or WebP where the platform supports it
- Lazy-load anything below the fold so it isn't competing with the content someone actually opened the page to see

### CSS and JavaScript

- Minify all three: CSS, JavaScript and HTML
- Remove anything unused. Old themes and page builders leave a lot of dead code behind
- Load JavaScript asynchronously wherever the page doesn't need it to render first

### Caching

- Set real expiry times on static resources instead of leaving defaults in place
- Use a service worker for offline caching where it makes sense for the site

### Server response time

- Confirm the host itself is fast. No amount of front-end optimization fixes a slow server
- Add a CDN if one isn't already in place, especially for a site with visitors outside one region

### Compression

- Enable Gzip or Brotli compression for text-based files sitewide

### Rendering path

- Eliminate render-blocking resources where possible
- Inline critical CSS and defer everything that isn't needed for the first paint
- Prioritize whatever's above the fold. That's what a visitor is actually looking at first

### Redirects

- Cut unnecessary redirect chains and link directly to the final URL

### Mobile

- Confirm the site is genuinely responsive, not just technically viewable, on a real phone

### Test and repeat

- Run Google PageSpeed Insights, GTmetrix or WebPageTest after every meaningful change, not just once at the end

<div class="callout">
<p><strong>Start with images.</strong> On most sites I've looked at, oversized and uncompressed images account for more of the slowdown than every other item on this list combined. It's also the fastest win: a few minutes of compression can outperform an afternoon of code cleanup.</p>
</div>
