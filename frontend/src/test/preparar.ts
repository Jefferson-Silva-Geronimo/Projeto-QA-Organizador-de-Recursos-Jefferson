import '@testing-library/jest-dom/vitest';
import * as matchersDoAxe from 'vitest-axe/matchers';
import { cleanup } from '@testing-library/react';
import { limparSessao } from '@/sessao/armazenamento';
import { afterEach, expect } from 'vitest';

expect.extend(matchersDoAxe);

afterEach(() => {
  cleanup();
  limparSessao();
  window.sessionStorage.clear();
  window.localStorage.clear();
});
