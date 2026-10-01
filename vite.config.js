import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Ensures assets load correctly on GitHub Pages, Vercel, Netlify, or subfolders
});
