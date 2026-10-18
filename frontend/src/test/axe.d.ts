import 'vitest';
import type { AxeMatchers } from 'vitest-axe/matchers';

declare module 'vitest' {
  interface Assertion<T = unknown> extends AxeMatchers {
    _axe?: T;
  }
}
