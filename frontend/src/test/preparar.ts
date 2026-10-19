import '@testing-library/jest-dom/vitest';
import * as matchersDoAxe from 'vitest-axe/matchers';
import { cleanup, configure } from '@testing-library/react';
import { limparSessao } from '@/sessao/armazenamento';
import { afterEach, expect } from 'vitest';

expect.extend(matchersDoAxe);

// Esperas assíncronas (findBy e waitFor) com folga: a primeira renderização de um arquivo e uma máquina sob carga
// passam de 1 s sem que haja defeito. Nenhuma asserção é afrouxada: só o tempo máximo de espera.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  cleanup();
  limparSessao();
  window.sessionStorage.clear();
  window.localStorage.clear();
});
