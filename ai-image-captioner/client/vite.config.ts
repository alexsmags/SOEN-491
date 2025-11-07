import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/src/session/**/*',
      '**/src/data/**/*',
      '**/src/constants/**/*',
      '**/src/icons/**/*',
      '**/src/types/**/*',
      'src/components/Auth/**/*',
      'src/app.tsx',
      'src/main.tsx',
      'src/components/Upload/types.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}', '!src/session/**/*', '!src/types/**/*', '!src/icons/**/*', '!src/data/**/*', '!src/constants/**/*', '!src/components/Auth/**/*', '!src/app.tsx', '!src/main.tsx', '!src/components/Upload/types.ts', "!src/pages/EditorPage.tsx", "!src/lib/axios.ts"],
    },
  },
});
