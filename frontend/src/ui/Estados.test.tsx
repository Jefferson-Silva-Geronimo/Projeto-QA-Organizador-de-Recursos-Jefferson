import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Carregando, EstadoVazio } from '@/ui/Estados';

describe('Carregando', () => {
  it('anuncia o texto como status, sem interromper a leitura', () => {
    render(<Carregando texto="Buscando recursos…" />);

    expect(screen.getByRole('status')).toHaveTextContent('Buscando recursos…');
  });

  it('tem um texto padrão', () => {
    render(<Carregando />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
  });
});

describe('EstadoVazio', () => {
  it('diz o que aconteceu e o que fazer, sem parecer erro', () => {
    render(<EstadoVazio titulo="Nenhum recurso encontrado">Tente outro horário ou tire um filtro.</EstadoVazio>);

    expect(screen.getByText('Nenhum recurso encontrado')).toBeInTheDocument();
    expect(screen.getByText('Tente outro horário ou tire um filtro.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('nenhuma violação de acessibilidade (axe), em ambos os estados', async () => {
    const { container } = render(
      <>
        <Carregando />
        <EstadoVazio titulo="Nenhum recurso encontrado">Tente outro horário.</EstadoVazio>
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
