import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MENSAGEM_DE_REDE, mensagemPara } from '@/erros/mensagens';
import { PaginaDeEntrada } from '@/paginas/entrada/PaginaDeEntrada';
import { lerSessao } from '@/sessao/armazenamento';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';

const LOGIN_OK = { token: 'token-novo', perfil: 'SOLICITANTE', expiraEm: '2999-01-01T00:00:00Z' };

function montar(entrar: (pedido: Request) => Response | Promise<Response>) {
  const falso = rotearFetch({ 'POST /api/auth/login': entrar });
  montarPagina({ rota: '/entrar', caminho: '/entrar', elemento: <PaginaDeEntrada />, fetch: falso, perfil: null });
  return falso;
}

async function preencher(email = 'maria.souza@exemplo.test', senha = 'senha-de-teste-123') {
  if (email) await userEvent.type(screen.getByLabelText(/E-mail/), email);
  if (senha) await userEvent.type(screen.getByLabelText(/Senha/), senha);
}

const pedidos = (falso: ReturnType<typeof montar>) => falso.mock.calls.map(([e]) => e as Request);

describe('PaginaDeEntrada: envio', () => {
  it('envia e-mail (sem espaços nas pontas) e senha (exatamente como digitada) ao servidor', async () => {
    const falso = montar(() => resposta(200, LOGIN_OK));

    await preencher('  maria.souza@exemplo.test  ', '  senha com espaços  ');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(pedidos(falso)).toHaveLength(1));
    const pedido = pedidos(falso)[0] as Request;
    expect(new URL(pedido.url).pathname).toBe('/api/auth/login');
    expect(pedido.method).toBe('POST');
    expect(await pedido.clone().json()).toEqual({ email: 'maria.souza@exemplo.test', senha: '  senha com espaços  ' });
    expect(pedido.headers.has('Authorization')).toBe(false);
  });

  it('com a credencial aceita guarda a sessão e só ela', async () => {
    montar(() => resposta(200, LOGIN_OK));

    await preencher();
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(lerSessao()).toEqual(LOGIN_OK));
    expect(window.sessionStorage.length).toBe(1);
    expect(window.localStorage.length).toBe(0);
  });

  it('Enter no campo de senha envia o formulário', async () => {
    const falso = montar(() => resposta(200, LOGIN_OK));
    await preencher();

    await userEvent.type(screen.getByLabelText(/Senha/), '{Enter}');

    await waitFor(() => expect(pedidos(falso)).toHaveLength(1));
  });

  it('enquanto envia: botão ocupado e dois envios geram um só pedido', async () => {
    let liberar: (r: Response) => void = () => {};
    const falso = montar(() => new Promise<Response>((resolver) => (liberar = resolver)));
    await preencher();

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    const ocupado = await screen.findByRole('button', { name: 'Entrando…' });
    await userEvent.click(ocupado);
    await userEvent.type(screen.getByLabelText(/Senha/), '{Enter}');

    expect(ocupado).toBeDisabled();
    expect(ocupado).toHaveAttribute('aria-busy', 'true');
    expect(pedidos(falso)).toHaveLength(1);
    liberar(resposta(200, LOGIN_OK));
    await waitFor(() => expect(lerSessao()).not.toBeNull());
  });
});

describe('PaginaDeEntrada: campos em branco', () => {
  it('sem e-mail e sem senha: marca os dois campos, diz o que falta e não consulta o servidor', async () => {
    const falso = montar(() => resposta(200, LOGIN_OK));

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByLabelText(/E-mail/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/E-mail/)).toHaveAccessibleDescription('Informe o e-mail.');
    expect(screen.getByLabelText(/Senha/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/Senha/)).toHaveAccessibleDescription('Informe a senha.');
    expect(pedidos(falso)).toHaveLength(0);
  });

  it('o foco vai para o primeiro campo que falta', async () => {
    montar(() => resposta(200, LOGIN_OK));
    await preencher('maria.souza@exemplo.test', '');

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByLabelText(/Senha/)).toHaveFocus();
  });

  it('e-mail só com espaços conta como em branco', async () => {
    const falso = montar(() => resposta(200, LOGIN_OK));
    await preencher('   ', 'senha-de-teste-123');

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByLabelText(/E-mail/)).toHaveAccessibleDescription('Informe o e-mail.');
    expect(pedidos(falso)).toHaveLength(0);
  });

  it('o aviso some depois de corrigir e enviar', async () => {
    montar(() => resposta(200, LOGIN_OK));
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await preencher();

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(lerSessao()).not.toBeNull());
    expect(screen.queryByText('Informe o e-mail.')).not.toBeInTheDocument();
  });
});

describe('PaginaDeEntrada: recusas do servidor', () => {
  const recusa = (status: number, code: string, extra: Record<string, unknown> = {}) => resposta(status, { status, code, ...extra });

  it('credencial inválida: mensagem e ação da tabela de erros, no alerta que recebe o foco', async () => {
    montar(() => recusa(401, 'CREDENCIAIS_INVALIDAS'));
    await preencher();

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara('CREDENCIAIS_INVALIDAS').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('CREDENCIAIS_INVALIDAS').acao);
    await waitFor(() => expect(alerta).toHaveFocus());
    expect(lerSessao()).toBeNull();
  });

  it('não diz qual dos dois campos errou (não ajuda a descobrir contas)', async () => {
    montar(() => recusa(401, 'CREDENCIAIS_INVALIDAS'));
    await preencher();

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByRole('alert');

    expect(screen.getByLabelText(/E-mail/)).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText(/Senha/)).not.toHaveAttribute('aria-invalid');
  });

  it('mantém o e-mail e apaga a senha, e esconde a senha de novo', async () => {
    montar(() => recusa(401, 'CREDENCIAIS_INVALIDAS'));
    await preencher();
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByRole('alert');

    expect(screen.getByLabelText(/E-mail/)).toHaveValue('maria.souza@exemplo.test');
    expect(screen.getByLabelText(/Senha/)).toHaveValue('');
    expect(screen.getByLabelText(/Senha/)).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });

  it.each([
    [500, 'ERRO_INTERNO'],
    [403, 'ACESSO_NEGADO'],
  ])('%i %s: mostra a mensagem da tabela', async (status, code) => {
    montar(() => recusa(status, code));
    await preencher();

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagemPara(code).mensagem);
  });

  it('falha de rede: mensagem de conexão', async () => {
    montar(() => {
      throw new TypeError('Failed to fetch');
    });
    await preencher();

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAGEM_DE_REDE.mensagem);
  });

  it('nunca mostra o texto cru do servidor', async () => {
    montar(() => recusa(401, 'CREDENCIAIS_INVALIDAS', { detail: 'Bad credentials for user maria.souza@exemplo.test (hash bcrypt)' }));
    await preencher();

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByRole('alert');

    expect(screen.queryByText(/bcrypt/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bad credentials/)).not.toBeInTheDocument();
  });

  it('campos que o servidor recusou ganham a mensagem do campo', async () => {
    montar(() => recusa(400, 'VALIDACAO_FALHOU', { campos: ['email', 'senha'] }));
    await preencher();

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByRole('alert');

    expect(screen.getByLabelText(/E-mail/)).toHaveAccessibleDescription('Informe um e-mail válido.');
    expect(screen.getByLabelText(/Senha/)).toHaveAccessibleDescription('Informe a senha.');
  });

  it('depois da recusa a pessoa tenta de novo e entra', async () => {
    let chamadas = 0;
    montar(() => (++chamadas === 1 ? recusa(401, 'CREDENCIAIS_INVALIDAS') : resposta(200, LOGIN_OK)));
    await preencher();
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByRole('alert');

    await userEvent.type(screen.getByLabelText(/Senha/), 'senha-correta-456');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(lerSessao()).toEqual(LOGIN_OK));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
