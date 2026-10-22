import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { montarRelatorios, PERIODO } from '@/test/relatorio';

const formulario = () => within(screen.getByRole('search', { name: 'Filtros do relatório' }));

function preencherPeriodo() {
  fireEvent.change(formulario().getByLabelText('Início'), { target: { value: '2026-10-20T08:00' } });
  fireEvent.change(formulario().getByLabelText('Fim'), { target: { value: '2026-10-27T18:00' } });
}

describe('PaginaDeRelatorios: filtros', () => {
  it('tem o título Relatórios e os filtros de período, tipo e recurso', () => {
    montarRelatorios();

    expect(screen.getByRole('heading', { level: 1, name: 'Relatórios' })).toBeInTheDocument();
    for (const rotulo of ['Início', 'Fim', 'Tipo', 'Recurso']) {
      expect(formulario().getByLabelText(rotulo)).toBeInTheDocument();
    }
    expect(formulario().getByRole('button', { name: 'Gerar relatório' })).toBeInTheDocument();
    expect(formulario().getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
  });

  it('sem período no endereço, pede o período e não consulta o relatório, sem erro e sem alerta', () => {
    const { estado } = montarRelatorios();

    expect(screen.getByText('Informe o período')).toBeInTheDocument();
    expect(screen.getByText('Escolha o início e o fim para gerar o relatório.')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(estado.consultas).toHaveLength(0);
  });

  it('gerar sem período diz o que falta, marca os campos, leva o foco ao primeiro e não consulta', async () => {
    const { estado } = montarRelatorios();

    await userEvent.click(formulario().getByRole('button', { name: 'Gerar relatório' }));

    expect(formulario().getByText('Informe o início do período.')).toBeVisible();
    expect(formulario().getByText('Informe o fim do período.')).toBeVisible();
    expect(formulario().getByLabelText('Início')).toBeInvalid();
    expect(formulario().getByLabelText('Início')).toHaveFocus();
    expect(estado.consultas).toHaveLength(0);
  });

  it('só o início: pede o fim e não marca o início', async () => {
    const { estado } = montarRelatorios();
    fireEvent.change(formulario().getByLabelText('Início'), { target: { value: '2026-10-20T08:00' } });

    await userEvent.click(formulario().getByRole('button', { name: 'Gerar relatório' }));

    expect(formulario().getByText('Informe o fim do período.')).toBeVisible();
    expect(formulario().queryByText('Informe o início do período.')).not.toBeInTheDocument();
    expect(formulario().getByLabelText('Fim')).toBeInvalid();
    expect(estado.consultas).toHaveLength(0);
  });

  it('com período, consulta com início e fim em ISO-8601 com o offset do campus, tamanho de página e página zero', async () => {
    const { estado } = montarRelatorios();
    preencherPeriodo();

    await userEvent.click(formulario().getByRole('button', { name: 'Gerar relatório' }));

    await waitFor(() => expect(estado.consultas).toHaveLength(1));
    const consulta = estado.consultas[0] as URLSearchParams;
    expect(consulta.get('inicio')).toBe('2026-10-20T08:00:00-03:00');
    expect(consulta.get('fim')).toBe('2026-10-27T18:00:00-03:00');
    expect(consulta.get('tamanho')).toBe('20');
    expect(consulta.get('pagina')).toBe('0');
    expect(consulta.has('tipo')).toBe(false);
    expect(consulta.has('recursoId')).toBe(false);
  });

  it('os filtros passam a morar no endereço, para voltar, recarregar e compartilhar o link', async () => {
    montarRelatorios();
    preencherPeriodo();

    await userEvent.click(formulario().getByRole('button', { name: 'Gerar relatório' }));

    const endereco = screen.getByLabelText('endereço atual').textContent;
    expect(endereco).toContain('inicio=2026-10-20T08%3A00');
    expect(endereco).toContain('fim=2026-10-27T18%3A00');
  });

  it('com filtros no endereço de entrada, preenche os campos e consulta sem precisar clicar', async () => {
    const { estado } = montarRelatorios({ rota: `/relatorios?${PERIODO}&tipo=SALA` });

    await waitFor(() => expect(estado.consultas).toHaveLength(1));
    expect(formulario().getByLabelText('Início')).toHaveValue('2026-10-20T08:00');
    expect(formulario().getByLabelText('Fim')).toHaveValue('2026-10-27T18:00');
    expect(formulario().getByLabelText('Tipo')).toHaveValue('SALA');
    expect(estado.consultas[0]?.get('tipo')).toBe('SALA');
  });

  it('valor de tipo desconhecido no endereço é ignorado e nunca enviado ao servidor', async () => {
    const { estado } = montarRelatorios({ rota: `/relatorios?${PERIODO}&tipo=SALAO` });

    await waitFor(() => expect(estado.consultas).toHaveLength(1));
    expect(estado.consultas[0]?.has('tipo')).toBe(false);
    expect(formulario().getByLabelText('Tipo')).toHaveValue('');
  });

  it('o recurso escolhido vai junto, e a lista de recursos acompanha o tipo', async () => {
    const { estado } = montarRelatorios();
    preencherPeriodo();
    await userEvent.selectOptions(formulario().getByLabelText('Tipo'), 'Sala');

    await within(formulario().getByLabelText('Recurso')).findByRole('option', { name: 'Sala 101' });
    const opcoes = within(formulario().getByLabelText('Recurso')).getAllByRole('option').map((o) => o.textContent);
    await userEvent.selectOptions(formulario().getByLabelText('Recurso'), 'Sala 101');
    await userEvent.click(formulario().getByRole('button', { name: 'Gerar relatório' }));

    expect(opcoes).toEqual(['Todos os recursos', 'Sala 101', 'Laboratório de Informática 3']);
    expect(estado.consultasDeRecursos).toContain('SALA');
    await waitFor(() => expect(estado.consultas).toHaveLength(1));
    expect(estado.consultas[0]?.get('tipo')).toBe('SALA');
    expect(estado.consultas[0]?.get('recursoId')).toBe('1');
  });

  it('sem tipo, a lista de recursos traz todos', async () => {
    montarRelatorios();

    const opcoes = await within(formulario().getByLabelText('Recurso')).findAllByRole('option');

    expect(opcoes.map((o) => o.textContent)).toEqual([
      'Todos os recursos',
      'Sala 101',
      'Laboratório de Informática 3',
      'Profa. Helena Costa',
      'Projetor P-007',
    ]);
  });

  it('trocar o tipo desfaz o recurso escolhido, que podia ser de outro tipo', async () => {
    montarRelatorios();
    await within(formulario().getByLabelText('Recurso')).findByRole('option', { name: 'Projetor P-007' });
    await userEvent.selectOptions(formulario().getByLabelText('Recurso'), 'Projetor P-007');

    await userEvent.selectOptions(formulario().getByLabelText('Tipo'), 'Sala');

    expect(formulario().getByLabelText('Recurso')).toHaveValue('');
  });

  it('Limpar filtros esvazia os campos, volta o endereço e pede o período de novo', async () => {
    montarRelatorios({ rota: `/relatorios?${PERIODO}&tipo=SALA` });
    await screen.findByRole('table');

    await userEvent.click(formulario().getByRole('button', { name: 'Limpar filtros' }));

    expect(formulario().getByLabelText('Início')).toHaveValue('');
    expect(formulario().getByLabelText('Tipo')).toHaveValue('');
    expect(screen.getByLabelText('endereço atual').textContent).toBe('/relatorios');
    expect(screen.getByText('Informe o período')).toBeInTheDocument();
  });
});
