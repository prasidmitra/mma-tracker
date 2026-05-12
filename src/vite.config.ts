import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

const SITE_URL = 'https://octascore.xyz';
const CREATOR_SLUGS = [
  'mma_guru', 'mma_joey', 'sneaky_mma', 'brendan_schaub',
  'luke_thomas', 'the_weasel', 'bedtime_mma', 'lucas_tracy_mma',
];
const STATIC_ROUTES = ['/', '/about', '/contact', ...CREATOR_SLUGS.map(s => `/creator/${s}`)];

function copyDirRecursive(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function sitemapPlugin() {
  return {
    name: 'sitemap',
    closeBundle() {
      if (process.env.NODE_ENV !== 'production') return;
      const today = new Date().toISOString().split('T')[0];
      const urls = STATIC_ROUTES.map(route => {
        const loc = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`;
        const priority = route === '/' ? '1.0' : route.startsWith('/creator/') ? '0.8' : '0.5';
        return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`;
      }).join('\n');
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
      const distDir = path.resolve(__dirname, 'dist');
      if (fs.existsSync(distDir)) fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml);
    }
  };
}

function dataPlugin() {
  return {
    name: 'serve-data',
    configureServer(server: any) {
      server.middlewares.use('/data', (req: any, res: any, next: any) => {
        const filePath = path.resolve(__dirname, '..', 'data', (req.url || '').replace(/^\//, ''));
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.setHeader('Content-Type', 'application/json');
          res.end(fs.readFileSync(filePath));
        } else {
          next();
        }
      });
    },
    closeBundle() {
      const dataDir = path.resolve(__dirname, '..', 'data');
      const distDataDir = path.resolve(__dirname, 'dist', 'data');
      if (fs.existsSync(dataDir)) copyDirRecursive(dataDir, distDataDir);
    }
  };
}

const isSSR = process.env.BUILD_MODE === 'ssr';

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss(), dataPlugin(), sitemapPlugin()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    fs: { allow: ['..'] }
  },
  ...(isSSR && {
    build: {
      ssr: 'src/entry-server.tsx',
      outDir: 'dist/server',
      rollupOptions: { output: { format: 'es' } },
    },
    ssr: { noExternal: ['react-helmet-async'] },
  }),
})
