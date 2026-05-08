import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

function copyDirRecursive(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
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

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/mma-tracker/' : '/',
  plugins: [react(), tailwindcss(), dataPlugin()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    fs: { allow: ['..'] }
  }
})
