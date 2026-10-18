import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ErroDeApi } from '@/api/cliente';
import { useSessao } from '@/autenticacao/useSessao';
import { SeletorDeTema } from '@/layout/SeletorDeTema';
import estilos from '@/paginas/entrada/PaginaDeEntrada.module.css';
import { Botao } from '@/ui/Botao';
import { Campo } from '@/ui/Campo';
import { ErroDaApi } from '@/ui/ErroDaApi';

interface ErrosDeCampo {
  email?: string;
  senha?: string;
}

/**
 * Entrar (T01, RF-01). Mostra só e-mail e senha; quem decide se a credencial vale é o servidor.
 * Nada além do token opaco da sessão é guardado, e ele só pelo módulo de sessão (ADR-015).
 * A recusa por credencial não diz qual campo errou, para não ajudar a descobrir contas.
 */
export function PaginaDeEntrada() {
  const { entrar } = useSessao();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState<ErrosDeCampo>({});
  const campoEmail = useRef<HTMLInputElement>(null);
  const campoSenha = useRef<HTMLInputElement>(null);
  const alerta = useRef<HTMLDivElement>(null);

  const tentativa = useMutation({
    mutationFn: ({ email: e, senha: s }: { email: string; senha: string }) => entrar(e, s),
    // Em qualquer recusa a senha sai da tela e volta escondida; o e-mail fica para a pessoa tentar de novo.
    onError: () => {
      setSenha('');
      setMostrarSenha(false);
    },
  });

  // Depois de uma recusa o foco vai para a mensagem: o teclado e o leitor de tela vão até ela.
  useEffect(() => {
    if (tentativa.isError) {
      alerta.current?.focus();
    }
  }, [tentativa.isError, tentativa.submittedAt]);

  const recusados =
    tentativa.error instanceof ErroDeApi && tentativa.error.problema.code === 'VALIDACAO_FALHOU'
      ? new Set(tentativa.error.problema.campos)
      : new Set<string>();
  const erroDoCampo = (campo: 'email' | 'senha'): string | undefined => {
    if (erros[campo]) return erros[campo];
    if (!recusados.has(campo)) return undefined;
    return campo === 'email' ? 'Informe um e-mail válido.' : 'Informe a senha.';
  };

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (tentativa.isPending) {
      return;
    }
    const faltando: ErrosDeCampo = {};
    if (email.trim() === '') faltando.email = 'Informe o e-mail.';
    if (senha === '') faltando.senha = 'Informe a senha.';
    setErros(faltando);
    if (faltando.email) {
      campoEmail.current?.focus();
      return;
    }
    if (faltando.senha) {
      campoSenha.current?.focus();
      return;
    }
    tentativa.mutate({ email: email.trim(), senha });
  };

  return (
    <div className={estilos.fundo}>
      <header className={estilos.topo}>
        <span className={estilos.marca}>Organização de Recursos</span>
        <SeletorDeTema />
      </header>
      <main className={estilos.principal}>
        <section className={estilos.cartao}>
          <h1 id="titulo-da-tela">Entrar</h1>
          {tentativa.isError && <ErroDaApi erro={tentativa.error} ref={alerta} />}
          <form aria-labelledby="titulo-da-tela" onSubmit={enviar} noValidate className={estilos.formulario}>
            <Campo rotulo="E-mail" obrigatorio erro={erroDoCampo('email')}>
              {(c) => (
                <input
                  {...c}
                  ref={campoEmail}
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </Campo>
            <Campo rotulo="Senha" obrigatorio erro={erroDoCampo('senha')}>
              {(c) => (
                <div className={estilos.senha}>
                  <input
                    {...c}
                    ref={campoSenha}
                    type={mostrarSenha ? 'text' : 'password'}
                    autoComplete="current-password"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                  <button
                    type="button"
                    className={estilos.alternar}
                    aria-pressed={mostrarSenha}
                    onClick={() => setMostrarSenha((m) => !m)}
                  >
                    Mostrar senha
                  </button>
                </div>
              )}
            </Campo>
            <Botao type="submit" carregando={tentativa.isPending} textoCarregando="Entrando…">
              Entrar
            </Botao>
          </form>
        </section>
      </main>
    </div>
  );
}
