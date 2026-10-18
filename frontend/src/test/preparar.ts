import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { limparSessao } from '@/sessao/armazenamento';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  limparSessao();
  window.sessionStorage.clear();
  window.localStorage.clear();
});
