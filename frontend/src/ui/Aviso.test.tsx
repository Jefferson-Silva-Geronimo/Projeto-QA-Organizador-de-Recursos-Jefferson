import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { axe } from 'vitest-axe';
import { Aviso, type TipoDeAviso } from '@/ui/Aviso';

const TIPOS: [TipoDeAviso, string, 'alert' | 'status'][] = [
  ['erro', 'Erro', 'alert'],
  ['atencao', 'Atenção', 'alert'],
  ['sucesso', 'Sucesso', 'status'],
  ['info', 'Informação', 'status'],
];

describe('Aviso', () => {
  it.each(TIPOS)('%s: começa pelo rótulo "%s" e usa o papel %s', (tipo, rotulo, papel) => {
    render(<Aviso tipo={tipo}>Mensagem de teste.</Aviso>);

    const aviso = screen.getByRole(papel);
    expect(aviso).toHaveTextContent(`${rotulo}:`);
    expect(aviso).toHaveTextContent('Mensagem de teste.');
  });

  it('mostra o título quando existe', () => {
    render(
      <Aviso tipo="erro" titulo="Não foi possível reservar">
        Escolha outro horário.
      </Aviso>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível reservar');
  });

  it('pode receber foco por código, para levar o teclado até a mensagem', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Aviso tipo="erro" ref={ref}>
        Algo deu errado.
      </Aviso>,
    );

    ref.current?.focus();

    expect(screen.getByRole('alert')).toHaveFocus();
  });

  it('não entra na ordem do Tab (só recebe foco por código)', () => {
    render(<Aviso tipo="erro">Algo deu errado.</Aviso>);

    expect(screen.getByRole('alert')).toHaveAttribute('tabindex', '-1');
  });

  it.each(TIPOS)('%s não tem violação de acessibilidade (axe)', async (tipo) => {
    const { container } = render(
      <Aviso tipo={tipo} titulo="Título">
        Mensagem de teste.
      </Aviso>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
