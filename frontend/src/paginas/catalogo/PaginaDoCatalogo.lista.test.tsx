import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { MENSAGEM_DE_REDE, mensagemPara } from '@/erros/mensagens';
import { PaginaDoCatalogo } from '@/paginas/catalogo/PaginaDoCatalogo';
import { montarCatalogo } from '@/test/catalogo';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { LABORATORIO, PROFESSORA, SALA_101 } from '@/test/recursos';

describe('PaginaDoCatalogo: abas e lista', () => {
  it('tem o título Catálogo e as abas Salas, Professores e Materiais', () => {
    montarCatalogo();

    expect(screen.getByRole('heading', { level: 1, name: 'Catálogo' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((a) => a.textContent)).toEqual(['Salas', 'Professores', 'Materiais']);
  });

  it('abre em Salas, com a aba marcada e só as salas consultadas', async () => {
    const { estado } = montarCatalogo();

    expect(screen.getByRole('tab', { name: 'Salas' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('article', { name: 'Sala 101' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Laboratório de Informática 3' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Profa. Helena Costa' })).not.toBeInTheDocument();
    expect(estado.consultas).toEqual(['SALA']);
  });

  it('trocar de aba consulta o tipo escolhido e mostra os recursos dele', async () => {
    const { estado } = montarCatalogo();
    await screen.findByRole('article', { name: 'Sala 101' });

    await userEvent.click(screen.getByRole('tab', { name: 'Professores' }));

    expect(await screen.findByRole('article', { name: 'Profa. Helena Costa' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Professores' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Salas' })).toHaveAttribute('aria-selected', 'false');
    expect(estado.consultas).toContain('PROFESSOR');
    await userEvent.click(screen.getByRole('tab', { name: 'Materiais' }));
    expect(await screen.findByRole('article', { name: 'Projetor P-007' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Notebook N-001' })).toBeInTheDocument();
  });

  it('as abas funcionam pelo teclado: seta para a direita e para a esquerda, Home e End', async () => {
    montarCatalogo();
    await screen.findByRole('article', { name: 'Sala 101' });
    screen.getByRole('tab', { name: 'Salas' }).focus();

    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Professores' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Professores' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Materiais' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Salas' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Materiais' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Salas' })).toHaveFocus();
  });

  it('só a aba escolhida entra na ordem do Tab, e o painel é ligado à aba (WCAG 4.1.2)', async () => {
    montarCatalogo();
    await screen.findByRole('article', { name: 'Sala 101' });

    expect(screen.getByRole('tab', { name: 'Salas' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Professores' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Salas');
  });

  it('sala: capacidade, local, funcionamento e se exige aprovação', async () => {
    montarCatalogo();

    const sala = await screen.findByRole('article', { name: 'Sala 101' });
    const laboratorio = screen.getByRole('article', { name: 'Laboratório de Informática 3' });

    expect(within(sala).getByText('40 pessoas')).toBeInTheDocument();
    expect(within(sala).getByText('Bloco A, 1º andar')).toBeInTheDocument();
    expect(within(sala).getByText('07:00 às 22:00, de segunda a sexta')).toBeInTheDocument();
    expect(within(sala).getByText('Sem restrição')).toBeInTheDocument();
    expect(within(laboratorio).getByText('Exige aprovação')).toBeInTheDocument();
  });

  it('professor: competências e o vínculo com usuário, sem mostrar número', async () => {
    montarCatalogo({ recursos: [PROFESSORA, { ...PROFESSORA, id: 6, nome: 'Prof. Ricardo Alves', competencias: ['Redes'], usuarioId: 9 }] });
    await userEvent.click(screen.getByRole('tab', { name: 'Professores' }));

    const helena = await screen.findByRole('article', { name: 'Profa. Helena Costa' });
    const ricardo = screen.getByRole('article', { name: 'Prof. Ricardo Alves' });

    expect(within(helena).getByText('Matemática')).toBeInTheDocument();
    expect(within(helena).getByText('Estatística')).toBeInTheDocument();
    expect(within(helena).getByText('Sem vínculo com usuário')).toBeInTheDocument();
    expect(within(ricardo).getByText('Com vínculo a um usuário')).toBeInTheDocument();
    expect(ricardo.textContent).not.toMatch(/\b9\b/);
  });

  it('material: código de patrimônio e descrição', async () => {
    montarCatalogo();
    await userEvent.click(screen.getByRole('tab', { name: 'Materiais' }));

    const projetor = await screen.findByRole('article', { name: 'Projetor P-007' });

    expect(within(projetor).getByText('PAT-P007')).toBeInTheDocument();
    expect(within(projetor).getByText('Projetor Full HD com cabo HDMI')).toBeInTheDocument();
    expect(within(projetor).getByText('Exige aprovação')).toBeInTheDocument();
  });

  it('diz quantos recursos há na aba, no plural e no singular', async () => {
    montarCatalogo();

    expect(await screen.findByText('2 salas')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Professores' }));
    expect(await screen.findByText('1 professor')).toBeInTheDocument();
  });

  it('aba sem recursos diz que não há nada cadastrado, sem erro e sem alerta', async () => {
    montarCatalogo({ recursos: [SALA_101] });
    await screen.findByRole('article', { name: 'Sala 101' });

    await userEvent.click(screen.getByRole('tab', { name: 'Professores' }));

    expect(await screen.findByText('Nada cadastrado')).toBeInTheDocument();
    expect(screen.getByText('Nenhum professor cadastrado.')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('enquanto o servidor não responde, anuncia que está carregando', () => {
    montarPagina({
      rota: '/catalogo',
      caminho: '/catalogo',
      elemento: <PaginaDoCatalogo />,
      perfil: 'SOLICITANTE',
      fetch: rotearFetch({ 'GET /api/recursos': () => new Promise<Response>(() => {}) }),
    });

    expect(screen.getByRole('status')).toHaveTextContent('Carregando recursos…');
  });

  it('recusa do servidor mostra a mensagem da tabela de erros, com a ação sugerida', async () => {
    montarPagina({
      rota: '/catalogo',
      caminho: '/catalogo',
      elemento: <PaginaDoCatalogo />,
      perfil: 'SOLICITANTE',
      fetch: rotearFetch({ 'GET /api/recursos': () => resposta(403, { status: 403, code: 'ACESSO_NEGADO' }) }),
    });

    const alerta = await screen.findByRole('alert');

    expect(alerta).toHaveTextContent(mensagemPara('ACESSO_NEGADO').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('ACESSO_NEGADO').acao);
  });

  it('falha de rede mostra a mensagem de rede e Tentar de novo consulta de novo', async () => {
    let chamadas = 0;
    montarPagina({
      rota: '/catalogo',
      caminho: '/catalogo',
      elemento: <PaginaDoCatalogo />,
      perfil: 'SOLICITANTE',
      fetch: rotearFetch({
        'GET /api/recursos': () => {
          chamadas++;
          if (chamadas === 1) throw new TypeError('Failed to fetch');
          return resposta(200, [LABORATORIO]);
        },
      }),
    });

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(MENSAGEM_DE_REDE.mensagem);
    await userEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));

    await waitFor(() => expect(screen.getByRole('article', { name: 'Laboratório de Informática 3' })).toBeInTheDocument());
  });

  it('a lista não tem violação de acessibilidade (axe)', async () => {
    const { container } = montarCatalogo();
    await screen.findByRole('article', { name: 'Sala 101' });

    expect(await axe(container)).toHaveNoViolations();
  });
});
