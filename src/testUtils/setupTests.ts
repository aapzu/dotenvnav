import 'vitest'; // This import is required to extend the global `expect` object
import { type CustomMatchers, matchers } from './customMatchers';

expect.extend(matchers);

declare module 'vitest' {
  // biome-ignore lint/suspicious/noExplicitAny: from vitest docs
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
