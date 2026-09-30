import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: funciona igual en Vercel, Netlify o GitHub Pages (subcarpeta)
export default defineConfig({
  base: './',
  plugins: [react()],
});
