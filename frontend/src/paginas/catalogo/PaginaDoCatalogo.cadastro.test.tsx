import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { MENSAGEM_DE_REDE, mensagemPara } from '@/erros/mensagens';
import { montarCatalogo, recusa } from '@/test/catalogo';

async function abrir(botao: string, aba?: string) {
  if (aba) {
    await userEvent.click(screen.getByRole('tab', { name: aba }));
  }
  const abridor = await screen.findByRole('button', { name: botao });
  await userEvent.click(abridor);
  return { abridor, dialogo: await screen.findByRole('dialog') };
}

async function preencherSala(dialogo: HTMLElement, nome = 'Sala 305') {
  await userEvent.type(within(dialogo).getByLabelText(/^Nome/), nome);
  await userEvent.type(within(dialogo).getByLabelText(/^Capacidade/), '35');
  await userEvent.type(within(dialogo).getByLabelText(/^Localização/), 'Bloco C, 3º andar');
  await userEvent.type(within(dialogo).getByLabelText(/^Tipo de sala/), 'AULA');
  await userEvent.type(within(dialogo).getByLabelText(/^Abre às/), '07:30');
  await userEvent.type(within(dialogo).getByLabelText(/^Fecha às/), '21:00');
  await userEvent.click(within(dialogo).getByRole('checkbox', { name: 'Segunda' }));
  await userEvent.click(within(dialogo).getByRole('checkbox', { name: 'Quarta' }));
}

describe('PaginaDoCatalogo: diálogo de cadastro', () => {
  it('Nova sala abre um diálogo modal com os campos da sala e o foco no primeiro', async () => {
    montarCatalogo();

    const { dialogo } = await abrir('Nova sala');

    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleName('Nova sala');
    for (const campo of ['Nome', 'Capacidade', 'Localização', 'Abre às', 'Fecha às']) {
      expect(within(dialogo).getByLabelText(new RegExp(`^${campo}`))).toBeInTheDocument();
    }
    expect(within(dialogo).getByRole('group', { name: 'Dias de funcionamento' })).toBeInTheDocument();
    expect(within(dialogo).getAllByRole('checkbox', { name: /^(Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo)$/ })).toHaveLength(7);
    expect(within(dialogo).getByRole('checkbox', { name: /^Restrito/ })).not.toBeChecked();
    expect(within(dialogo).getByLabelText(/^Nome/)).toHaveFocus();
  });

  it('Novo professor e Novo material trazem os campos de cada tipo', async () => {
    montarCatalogo();

    const professor = (await abrir('Novo professor', 'Professores')).dialogo;
    expect(within(professor).getByLabelText(/^Nome/)).toBeInTheDocument();
    expect(within(professor).getByLabelText(/^Competências/)).toBeInTheDocument();
    expect(within(professor).getByLabelText(/^Usuário vinculado/)).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');

    const material = (await abrir('Novo material', 'Materiais')).dialogo;
    expect(within(material).getByLabelText(/^Nome/)).toBeInTheDocument();
    expect(within(material).getByLabelText(/^Código de patrimônio/)).toBeInTheDocument();
    expect(within(material).getByLabelText(/^Descrição/)).toBeInTheDocument();
  });

  it('Escape fecha o diálogo, devolve o foco ao botão e não envia nada', async () => {
    const { estado } = montarCatalogo();
    const { abridor } = await abrir('Nova sala');

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abridor).toHaveFocus();
    expect(estado.chamadas).toHaveLength(0);
  });

  it('Voltar fecha o diálogo, e o que foi digitado se perde: um novo diálogo abre vazio', async () => {
    montarCatalogo();
    const { dialogo } = await abrir('Nova sala');
    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), 'rascunho');

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Voltar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Nova sala' }));

    expect(within(await screen.findByRole('dialog')).getByLabelText(/^Nome/)).toHaveValue('');
  });

  it('o Tab não sai do diálogo: do último elemento volta ao primeiro', async () => {
    montarCatalogo();
    const { dialogo } = await abrir('Nova sala');
    const nome = within(dialogo).getByLabelText(/^Nome/);
    const voltar = within(dialogo).getByRole('button', { name: 'Voltar' });

    voltar.focus();
    await userEvent.tab();
    expect(nome).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(voltar).toHaveFocus();
  });
});

describe('PaginaDoCatalogo: cadastrar sala', () => {
  it('envia os dados da sala, o diálogo fecha, a lista é refeita e o resultado é anunciado com o foco', async () => {
    const { estado } = montarCatalogo();
    const { dialogo } = await abrir('Nova sala');
    await preencherSala(dialogo);

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    const texto = await screen.findByText('Sala "Sala 305" cadastrada.');
    const aviso = texto.closest('[role="status"]');
    await waitFor(() => expect(aviso).toHaveFocus());
    expect(estado.chamadas).toEqual([
      {
        rota: 'salas',
        corpo: {
          nome: 'Sala 305',
          capacidade: 35,
          localizacao: 'Bloco C, 3º andar',
          tipoSala: 'AULA',
          horaAbertura: '07:30',
          horaFechamento: '21:00',
          diasFuncionamento: [1, 3],
          restrito: false,
        },
      },
    ]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByRole('article', { name: 'Sala 305' })).toBeInTheDocument();
  });

  it('o tipo de sala é opcional: em branco, o campo não é enviado; restrito marcado é enviado verdadeiro', async () => {
    const { estado } = montarCatalogo();
    const { dialogo } = await abrir('Nova sala');
    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), 'Auditório 2');
    await userEvent.type(within(dialogo).getByLabelText(/^Capacidade/), '120');
    await userEvent.type(within(dialogo).getByLabelText(/^Localização/), 'Bloco A');
    await userEvent.type(within(dialogo).getByLabelText(/^Abre às/), '08:00');
    await userEvent.type(within(dialogo).getByLabelText(/^Fecha às/), '18:00');
    await userEvent.click(within(dialogo).getByRole('checkbox', { name: 'Sexta' }));
    await userEvent.click(within(dialogo).getByRole('checkbox', { name: /^Restrito/ }));

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => expect(estado.chamadas).toHaveLength(1));
    expect(estado.chamadas[0]?.corpo).toEqual({
      nome: 'Auditório 2',
      capacidade: 120,
      localizacao: 'Bloco A',
      horaAbertura: '08:00',
      horaFechamento: '18:00',
      diasFuncionamento: [5],
      restrito: true,
    });
  });

  it('com campos em branco, não envia nada e diz o que falta, com o foco no primeiro campo com problema', async () => {
    const { estado } = montarCatalogo();
    const { dialogo } = await abrir('Nova sala');

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    expect(within(dialogo).getByText('Informe o nome.')).toBeVisible();
    expect(within(dialogo).getByText('Informe a capacidade.')).toBeVisible();
    expect(within(dialogo).getByText('Informe a localização.')).toBeVisible();
    expect(within(dialogo).getByText('Informe a hora de abertura.')).toBeVisible();
    expect(within(dialogo).getByText('Informe a hora de fechamento.')).toBeVisible();
    expect(within(dialogo).getByText('Marque ao menos um dia.')).toBeVisible();
    expect(within(dialogo).getByLabelText(/^Nome/)).toBeInvalid();
    expect(within(dialogo).getByLabelText(/^Nome/)).toHaveFocus();
    expect(estado.chamadas).toHaveLength(0);
  });

  it('VALIDACAO_FALHOU marca os campos que o servidor apontou e mantém o que foi digitado', async () => {
    montarCatalogo({ responder: () => recusa(400, 'VALIDACAO_FALHOU', { campos: ['capacidade', 'horaFechamento'] }) });
    const { dialogo } = await abrir('Nova sala');
    await preencherSala(dialogo);

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    const alerta = await within(screen.getByRole('dialog')).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara('VALIDACAO_FALHOU').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('VALIDACAO_FALHOU').acao);
    expect(within(screen.getByRole('dialog')).getByLabelText(/^Capacidade/)).toBeInvalid();
    expect(within(screen.getByRole('dialog')).getByLabelText(/^Fecha às/)).toBeInvalid();
    expect(within(screen.getByRole('dialog')).getByLabelText(/^Nome/)).toHaveValue('Sala 305');
    expect(within(screen.getByRole('dialog')).getByLabelText(/^Nome/)).not.toBeInvalid();
    expect(alerta).toHaveFocus();
  });

  it.each([
    [403, 'ACESSO_NEGADO'],
    [500, 'ERRO_INTERNO'],
  ])('%i %s: a mensagem e a ação da tabela de erros aparecem no diálogo, que continua aberto', async (status, code) => {
    montarCatalogo({ responder: () => recusa(status, code) });
    const { dialogo } = await abrir('Nova sala');
    await preencherSala(dialogo);

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    const alerta = await within(screen.getByRole('dialog')).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara(code).mensagem);
    expect(alerta).toHaveFocus();
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cadastrar' })).toBeEnabled();
  });

  it('falha de rede: mensagem própria de conexão', async () => {
    montarCatalogo({
      responder: () => {
        throw new TypeError('Failed to fetch');
      },
    });
    const { dialogo } = await abrir('Nova sala');
    await preencherSala(dialogo);

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent(MENSAGEM_DE_REDE.mensagem);
  });

  it('clique duplo em Cadastrar envia um único pedido e, enquanto envia, o botão mostra Cadastrando…', async () => {
    const { estado } = montarCatalogo({ responder: () => new Promise<Response>(() => {}) });
    const { dialogo } = await abrir('Nova sala');
    await preencherSala(dialogo);

    await userEvent.dblClick(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    expect(estado.chamadas).toHaveLength(1);
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cadastrando…' })).toBeDisabled();
  });
});

describe('PaginaDoCatalogo: cadastrar professor', () => {
  it('envia o nome, as competências sem espaços nas pontas, o usuário escolhido e restrito', async () => {
    const { estado } = montarCatalogo();
    const { dialogo } = await abrir('Novo professor', 'Professores');
    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), 'Prof. Paulo Mendes');
    await userEvent.type(within(dialogo).getByLabelText(/^Competências/), ' Redes , Segurança da informação ,, ');
    await within(dialogo).findByRole('option', { name: 'Carlos Lima (Responsável)' });
    await userEvent.selectOptions(within(dialogo).getByLabelText(/^Usuário vinculado/), 'Carlos Lima (Responsável)');

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('Professor "Prof. Paulo Mendes" cadastrado.')).toBeInTheDocument();
    expect(estado.chamadas).toEqual([
      {
        rota: 'professores',
        corpo: { nome: 'Prof. Paulo Mendes', competencias: ['Redes', 'Segurança da informação'], usuarioId: 9, restrito: false },
      },
    ]);
  });

  it('o vínculo é opcional: sem escolher, o usuário não é enviado; as opções mostram só nome e perfil, nunca o e-mail', async () => {
    const { estado } = montarCatalogo();
    const { dialogo } = await abrir('Novo professor', 'Professores');
    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), 'Prof. Paulo Mendes');
    const opcoes = within(within(dialogo).getByLabelText(/^Usuário vinculado/)).getAllByRole('option').map((o) => o.textContent);

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    expect(opcoes).toEqual(['Sem vínculo', 'Carlos Lima (Responsável)', 'Maria Souza (Solicitante)']);
    await waitFor(() => expect(estado.chamadas).toHaveLength(1));
    expect(estado.chamadas[0]?.corpo).toEqual({ nome: 'Prof. Paulo Mendes', competencias: [], restrito: false });
    expect(document.body.textContent).not.toContain('@');
  });

  it('nome em branco: não envia e diz o que falta', async () => {
    const { estado } = montarCatalogo();
    const { dialogo } = await abrir('Novo professor', 'Professores');

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    expect(within(dialogo).getByText('Informe o nome.')).toBeVisible();
    expect(estado.chamadas).toHaveLength(0);
  });

  it('VINCULO_JA_EXISTE: a mensagem da tabela aparece e o campo do usuário é marcado', async () => {
    montarCatalogo({ responder: () => recusa(409, 'VINCULO_JA_EXISTE') });
    const { dialogo } = await abrir('Novo professor', 'Professores');
    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), 'Prof. Paulo Mendes');
    await within(dialogo).findByRole('option', { name: 'Carlos Lima (Responsável)' });
    await userEvent.selectOptions(within(dialogo).getByLabelText(/^Usuário vinculado/), 'Carlos Lima (Responsável)');

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    const alerta = await within(screen.getByRole('dialog')).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara('VINCULO_JA_EXISTE').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('VINCULO_JA_EXISTE').acao);
    expect(within(screen.getByRole('dialog')).getByLabelText(/^Usuário vinculado/)).toBeInvalid();
  });
});

describe('PaginaDoCatalogo: cadastrar material', () => {
  it('envia o nome, o código de patrimônio e a descrição', async () => {
    const { estado } = montarCatalogo();
    const { dialogo } = await abrir('Novo material', 'Materiais');
    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), 'Caixa de som S-02');
    await userEvent.type(within(dialogo).getByLabelText(/^Código de patrimônio/), 'PAT-S002');
    await userEvent.type(within(dialogo).getByLabelText(/^Descrição/), 'Caixa de som portátil');

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('Material "Caixa de som S-02" cadastrado.')).toBeInTheDocument();
    expect(estado.chamadas).toEqual([
      { rota: 'materiais', corpo: { nome: 'Caixa de som S-02', codigoPatrimonio: 'PAT-S002', descricao: 'Caixa de som portátil', restrito: false } },
    ]);
  });

  it('nome e código em branco: não envia e diz o que falta', async () => {
    const { estado } = montarCatalogo();
    const { dialogo } = await abrir('Novo material', 'Materiais');

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    expect(within(dialogo).getByText('Informe o nome.')).toBeVisible();
    expect(within(dialogo).getByText('Informe o código de patrimônio.')).toBeVisible();
    expect(estado.chamadas).toHaveLength(0);
  });

  it('PATRIMONIO_JA_EXISTE: a mensagem da tabela aparece e o campo do código é marcado', async () => {
    montarCatalogo({ responder: () => recusa(409, 'PATRIMONIO_JA_EXISTE') });
    const { dialogo } = await abrir('Novo material', 'Materiais');
    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), 'Caixa de som S-02');
    await userEvent.type(within(dialogo).getByLabelText(/^Código de patrimônio/), 'PAT-P007');

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    const alerta = await within(screen.getByRole('dialog')).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara('PATRIMONIO_JA_EXISTE').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('PATRIMONIO_JA_EXISTE').acao);
    expect(within(screen.getByRole('dialog')).getByLabelText(/^Código de patrimônio/)).toBeInvalid();
    expect(within(screen.getByRole('dialog')).getByLabelText(/^Nome/)).toHaveValue('Caixa de som S-02');
  });
});

describe('PaginaDoCatalogo: acessibilidade do cadastro', () => {
  it('a página com o diálogo de sala aberto e os avisos de campo não tem violação (axe)', async () => {
    montarCatalogo();
    const { dialogo } = await abrir('Nova sala');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));
    await within(screen.getByRole('dialog')).findByText('Informe o nome.');

    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('a página com o diálogo de professor aberto não tem violação (axe)', async () => {
    montarCatalogo();
    await abrir('Novo professor', 'Professores');
    await within(screen.getByRole('dialog')).findByRole('option', { name: 'Carlos Lima (Responsável)' });

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
