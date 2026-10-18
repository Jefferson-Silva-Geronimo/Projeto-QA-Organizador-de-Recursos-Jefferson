import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { Campo } from '@/ui/Campo';

function montar(props: { erro?: string; ajuda?: string; obrigatorio?: boolean } = {}) {
  return render(
    <Campo rotulo="Título" {...props}>
      {(controle) => <input type="text" {...controle} />}
    </Campo>,
  );
}

describe('Campo', () => {
  it('liga o rótulo ao controle: clicar no rótulo leva o foco ao campo', async () => {
    montar();

    await userEvent.click(screen.getByText('Título'));

    expect(screen.getByLabelText('Título')).toHaveFocus();
  });

  it('campo obrigatório diz "obrigatório" em texto e marca o controle como required', () => {
    montar({ obrigatorio: true });

    expect(screen.getByText('(obrigatório)')).toBeInTheDocument();
    expect(screen.getByLabelText(/Título/)).toBeRequired();
  });

  it('campo opcional não é required e não mostra "obrigatório"', () => {
    montar();

    expect(screen.queryByText('(obrigatório)')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Título')).not.toBeRequired();
  });

  it('erro marca o controle como inválido e é lido junto com ele (aria-describedby)', () => {
    montar({ erro: 'Informe o título.' });

    const campo = screen.getByLabelText('Título');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('Informe o título.');
  });

  it('ajuda e erro juntos são lidos em ordem', () => {
    montar({ ajuda: 'Até 100 caracteres.', erro: 'Informe o título.' });

    expect(screen.getByLabelText('Título')).toHaveAccessibleDescription('Até 100 caracteres. Informe o título.');
  });

  it('sem erro o controle não é marcado como inválido', () => {
    montar({ ajuda: 'Até 100 caracteres.' });

    expect(screen.getByLabelText('Título')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText('Título')).toHaveAccessibleDescription('Até 100 caracteres.');
  });

  it.each([
    ['sem erro', {}],
    ['com erro', { erro: 'Informe o título.' }],
    ['obrigatório com ajuda', { obrigatorio: true, ajuda: 'Até 100 caracteres.' }],
  ])('%s: nenhuma violação de acessibilidade (axe)', async (_nome, props) => {
    const { container } = montar(props);

    expect(await axe(container)).toHaveNoViolations();
  });
});
