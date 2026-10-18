import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * No Chromium cada campo de data e hora tem uma parada de Tab no ícone do calendário, que fica dentro do campo.
 * O :focus-visible do campo não vale nele, e sem uma regra própria o foco ali fica invisível (WCAG 2.4.7).
 * O jsdom não calcula estilo de pseudo-elemento interno; a verificação visual é feita no navegador real (Playwright).
 */
describe('foco do ícone do calendário nos campos de data e hora', () => {
  const css = readFileSync(resolve(__dirname, 'Campo.module.css'), 'utf-8').replace(/\r\n/g, '\n');

  it('tem uma regra própria de foco para o ícone do calendário', () => {
    expect(css).toMatch(/::-webkit-calendar-picker-indicator:focus/);
  });

  it('a regra desenha contorno com a cor de foco do tema, não uma cor fixa', () => {
    const regra = /::-webkit-calendar-picker-indicator:focus[^{]*\{([^}]*)\}/.exec(css)?.[1] ?? '';

    expect(regra).toMatch(/outline:\s*3px solid var\(--cor-foco\)/);
  });
});
