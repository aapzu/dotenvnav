import type { Options } from 'tsup';

export const tsup: Options = {
  clean: true,
  dts: true,
  format: ['esm'],
  entryPoints: ['src/index.ts'],
  target: 'es2022',
  outDir: 'dist',
  splitting: false,
  entry: ['src', '!src/**/__tests__', '!src/testUtils'],
};
