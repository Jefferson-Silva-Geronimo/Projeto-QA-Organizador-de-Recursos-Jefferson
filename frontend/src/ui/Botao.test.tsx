import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { axe } from 'vitest-axe';
import { Botao } from '@/ui/Botao';

describe('Botao', () => {
  it('é type="button" por padrão, para não enviar formulário sem querer', () => {
    render(<Botao>Buscar</Botao>);

    expect(screen.getByRole('button', { name: 'Buscar' })).toHaveAttribute('type', 'button');
  });

  it('aceita type="submit" e dispara o clique', async () => {
    const aoClicar = vi.fn();
    render(
      <Botao type="submit" onClick={aoClicar}>
        Reservar
      </Botao>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }));

    expect(aoClicar).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Reservar' })).toHaveAttribute('type', 'submit');
  });

  it('enquanto envia, mostra o texto de envio, fica ocupado e ignora cliques (sem envio duplo)', async () => {
    const aoClicar = vi.fn();
    render(
      <Botao carregando textoCarregando="Enviando…" onClick={aoClicar}>
        Reservar
      </Botao>,
    );

    const botao = screen.getByRole('button', { name: 'Enviando…' });
    await userEvent.click(botao);

    expect(botao).toHaveAttribute('aria-busy', 'true');
    expect(botao).toBeDisabled();
    expect(aoClicar).not.toHaveBeenCalled();
  });

  it('sem carregando não está ocupado', () => {
    render(<Botao>Reservar</Botao>);

    expect(screen.getByRole('button', { name: 'Reservar' })).not.toHaveAttribute('aria-busy');
  });

  it.each(['primario', 'secundario'] as const)('variante %s: nenhuma violação de acessibilidade (axe)', async (variante) => {
    const { container } = render(<Botao variante={variante}>Reservar</Botao>);

    expect(await axe(container)).toHaveNoViolations();
  });
});
