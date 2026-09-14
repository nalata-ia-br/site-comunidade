import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nalata.ia.br',
  output: 'static',
  compressHTML: true,
  devToolbar: { enabled: false },
  build: { format: 'directory' },
});
