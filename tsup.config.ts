import type { Options } from 'tsup';

export const tsup: Options = {
  clean: true,
  dts: true,
  format: ['esm'],
  bundle: true,
  skipNodeModulesBundle: true,
  entryPoints: ['src/index.ts'],
  target: 'es2020',
  outDir: 'dist',
  entry: ['src/**/*.ts'], //include all files under src
};
