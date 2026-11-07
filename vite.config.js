import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Zwei Build-Arten:
//  - normal (npm run build): installierbare Web-App (PWA) für GitHub Pages oder jeden anderen Webspeicher
//  - "vorschau" (npm run build:vorschau): eine einzige HTML-Datei mit Beispieldaten,
//    zum schnellen Anschauen ohne Server
export default defineConfig(({ mode }) => {
  const vorschau = mode === 'vorschau'

  return {
    // Relative Pfade: Der Inhalt von dist/ läuft auf GitHub Pages genauso wie auf jedem anderen
    // Webspeicher, egal in welchem Ordner. (BASE_PATH nur setzen, wenn ein fester Pfad nötig ist.)
    base: vorschau ? './' : process.env.BASE_PATH || './',
    plugins: [
      react(),
      tailwindcss(),
      vorschau
        ? viteSingleFile()
        : VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
            manifest: {
              name: 'NvF Finanzen',
              short_name: 'NvF Finanzen',
              description: 'Einnahmen und Ausgaben von NvF Digital erfassen',
              lang: 'de',
              display: 'standalone',
              orientation: 'portrait',
              background_color: '#f4f5f8',
              theme_color: '#f4f5f8',
              start_url: '.',
              scope: '.',
              icons: [
                { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
          }),
    ],
    build: vorschau ? { outDir: 'dist-vorschau' } : undefined,
    test: {
      environment: 'node',
      include: ['src/**/*.test.js'],
    },
  }
})
