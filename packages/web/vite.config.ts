import { cpSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const MATHJAX_SRE_SOURCE = fileURLToPath(new URL('../../node_modules/mathjax/sre', import.meta.url));

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'copy-mathjax-sre-assets',
      writeBundle(outputOptions) {
        if (!outputOptions.dir) {
          return;
        }

        cpSync(MATHJAX_SRE_SOURCE, resolve(outputOptions.dir, 'assets', 'sre'), { recursive: true });
      },
    },
  ],
});
