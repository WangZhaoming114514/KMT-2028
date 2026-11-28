import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {build, defineConfig, type Plugin} from 'vite';

/**
 * Bundles the entire app into a single self-contained HTML file (`dist/index.html`)
 * by inlining all CSS and ES module JS bundles directly into HTML, and removes leftover chunks.
 */
function inlineSingleFilePlugin(): Plugin {
  return {
    name: 'inline-singlefile-html',
    apply: 'build',
    closeBundle(error?: Error): void {
      if (error) return;
      const distDir = path.resolve(__dirname, 'dist');
      const indexHtmlPath = path.join(distDir, 'index.html');
      if (!fs.existsSync(indexHtmlPath)) return;

      let html = fs.readFileSync(indexHtmlPath, 'utf8');
      const filesToDelete = new Set<string>();

      // Inline external stylesheets
      html = html.replace(
        /<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
        (match, href: string) => {
          const cleanRel = href.replace(/^\//, '').split('?')[0];
          const cssPath = path.join(distDir, cleanRel);
          if (!fs.existsSync(cssPath)) return match;
          const css = fs.readFileSync(cssPath, 'utf8');
          filesToDelete.add(cssPath);
          return `<style>\n${css}\n</style>`;
        }
      );

      // Remove modulepreload hints for external chunks that are being inlined
      html = html.replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*>\s*/gi, '');

      // Inline bundled module scripts cleanly at the end of <body>
      const scriptBlocks: string[] = [];
      html = html.replace(
        /<script\b([^>]*)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi,
        (match, _pre: string, src: string) => {
          const cleanRel = src.replace(/^\//, '').split('?')[0];
          const jsPath = path.join(distDir, cleanRel);
          if (!fs.existsSync(jsPath)) return match;
          const js = fs
            .readFileSync(jsPath, 'utf8')
            .replace(/<\/script>/gi, '<\\/script>');
          filesToDelete.add(jsPath);
          scriptBlocks.push(`<script type="module">\n${js}\n</script>`);
          return '';
        }
      );

      if (scriptBlocks.length > 0) {
        html = html.replace('</body>', () => `${scriptBlocks.join('\n')}\n</body>`);
      }

      fs.writeFileSync(indexHtmlPath, html, 'utf8');
      fs.writeFileSync(path.join(distDir, 'kuomintang-2028.html'), html, 'utf8');

      for (const filePath of filesToDelete) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      const assetsDir = path.join(distDir, 'assets');
      if (fs.existsSync(assetsDir) && fs.readdirSync(assetsDir).length === 0) {
        fs.rmdirSync(assetsDir);
      }
    },
  };
}

/**
 * Allows downloading the packaged standalone single-file HTML directly from the dev server
 * via `/kuomintang-2028-standalone.html`.
 */
function standaloneHtmlDownloadMiddleware(): Plugin {
  return {
    name: 'standalone-html-download',
    configureServer(server) {
      server.middlewares.use('/kuomintang-2028-standalone.html', async (_req, res) => {
        try {
          const distIndex = path.resolve(__dirname, 'dist', 'index.html');
          if (!fs.existsSync(distIndex)) {
            await build({configFile: path.resolve(__dirname, 'vite.config.ts')});
          }
          const html = fs.readFileSync(distIndex, 'utf8');
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader(
            'Content-Disposition',
            'attachment; filename="kuomintang-2028-standalone.html"'
          );
          res.end(html);
        } catch (err) {
          res.statusCode = 500;
          res.end(`Failed to package standalone HTML: ${String(err)}`);
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      inlineSingleFilePlugin(),
      standaloneHtmlDownloadMiddleware(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    build: {
      cssCodeSplit: false,
      assetsInlineLimit: 100_000_000,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
