import { screen, within } from '@testing-library/react';
import { PaginaDeBusca } from '@/paginas/busca/PaginaDeBusca';
import { LABORATORIO, PROFESSORA, PROJETOR, SALA_101, TODOS } from '@/test/recursos';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';

function montar(rota = '/buscar', recursos = TODOS) {
  const falso = rotearFetch({ 'GET /api/recursos': () => resposta(200, recursos) });
  montarPagina({ rota, caminho: '/buscar', elemento: <PaginaDeBusca />, fetch: falso });
  return falso;
}

describe('PaginaDeBusca: resultados', () => {
  it('ao abrir, anuncia a espera e depois lista todos os recursos com a contagem', async () => {
    montar();

    expect(screen.getByRole('status')).toHaveTextContent('Buscando recursos…');
    expect(await screen.findByText('4 recursos encontrados')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Buscar' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(4);
  });

  it('a contagem fica numa região que o leitor de tela anuncia ao mudar', async () => {
    montar();

    const contagem = await screen.findByText('4 recursos encontrados');

    expect(contagem).toHaveAttribute('aria-live', 'polite');
  });

  it('a contagem no singular', async () => {
    montar('/buscar', [SALA_101]);

    expect(await screen.findByText('1 recurso encontrado')).toBeInTheDocument();
  });

  it('sala: capacidade, local, funcionamento e dias', async () => {
    montar('/buscar', [SALA_101]);

    const cartao = within(await screen.findByRole('article', { name: /Sala 101/ }));

    expect(cartao.getByText('Sala')).toBeInTheDocument();
    expect(cartao.getByText('40 pessoas')).toBeInTheDocument();
    expect(cartao.getByText('Bloco A, 1º andar')).toBeInTheDocument();
    expect(cartao.getByText('07:00 às 22:00, de segunda a sexta')).toBeInTheDocument();
  });

  it('professor: as competências, uma por item', async () => {
    montar('/buscar', [PROFESSORA]);

    const cartao = within(await screen.findByRole('article', { name: /Helena Costa/ }));

    expect(cartao.getByText('Professor')).toBeInTheDocument();
    expect(cartao.getAllByRole('listitem').map((i) => i.textContent)).toEqual(['Matemática', 'Estatística']);
  });

  it('material: código de patrimônio e descrição', async () => {
    montar('/buscar', [PROJETOR]);

    const cartao = within(await screen.findByRole('article', { name: /Projetor P-007/ }));

    expect(cartao.getByText('Material')).toBeInTheDocument();
    expect(cartao.getByText('PAT-P007')).toBeInTheDocument();
    expect(cartao.getByText('Projetor Full HD com cabo HDMI')).toBeInTheDocument();
  });

  it('recurso restrito avisa em texto que a reserva exige aprovação; o livre não avisa', async () => {
    montar('/buscar', [SALA_101, LABORATORIO]);

    const livre = within(await screen.findByRole('article', { name: /Sala 101/ }));
    const restrito = within(screen.getByRole('article', { name: /Laboratório de Informática 3/ }));

    expect(restrito.getByText('Exige aprovação')).toBeInTheDocument();
    expect(livre.queryByText('Exige aprovação')).not.toBeInTheDocument();
  });
});
