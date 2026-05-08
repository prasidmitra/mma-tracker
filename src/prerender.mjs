import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');
const SERVER_BUNDLE = path.join(DIST, 'server', 'entry-server.js');
const TEMPLATE = path.join(DIST, 'index.html');
const BASE = '/mma-tracker';

const CREATOR_SLUGS = [
  'mma_guru', 'mma_joey', 'sneaky_mma', 'brendan_schaub',
  'luke_thomas', 'the_weasel', 'bedtime_mma', 'lucas_tracy_mma',
];
const ROUTES = ['/', '/about', ...CREATOR_SLUGS.map(s => `/creator/${s}`)];

if (!fs.existsSync(SERVER_BUNDLE)) {
  console.error('SSR bundle not found — skipping prerender.');
  process.exit(0);
}

const template = fs.readFileSync(TEMPLATE, 'utf-8');
const { render } = await import(SERVER_BUNDLE);

/**
 * React 19 hoists <title>, <meta>, <link>, <script type="ld+json"> to the
 * start of renderToString output (before any <div>/<nav> etc).
 * We split there and inject the head tags into the HTML template's <head>.
 */
function extractHeadContent(appHtml) {
  const firstBodyTag = appHtml.search(/<(?:div|nav|main|section|article|header|footer|span|p\b|h[1-6])/);
  if (firstBodyTag === -1) return { headTags: '', bodyContent: appHtml };
  return {
    headTags: appHtml.slice(0, firstBodyTag).trim(),
    bodyContent: appHtml.slice(firstBodyTag),
  };
}

for (const route of ROUTES) {
  const { html: appHtml } = render(route, BASE);
  const { headTags, bodyContent } = extractHeadContent(appHtml);

  let html = template;

  if (headTags) {
    // Remove the static fallback <title> — the prerendered one takes priority
    html = html.replace(/<title>[^<]*<\/title>/, '');
    html = html.replace('</head>', `    ${headTags}\n  </head>`);
  }

  // Inject rendered body content into root div
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyContent}</div>`);

  const filePath = route === '/'
    ? path.join(DIST, 'index.html')
    : path.join(DIST, route.slice(1), 'index.html');

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html);
  console.log(`Prerendered: ${route}`);
}

console.log(`\nPrerendering complete — ${ROUTES.length} routes.`);
