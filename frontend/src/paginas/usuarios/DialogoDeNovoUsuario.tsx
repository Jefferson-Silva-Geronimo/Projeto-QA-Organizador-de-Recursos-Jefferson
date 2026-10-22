import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { ErroDeApi } from '@/api/cliente';
import estilos from '@/paginas/catalogo/DialogoDeCadastro.module.css';
import { PERFIS, ROTULO_DO_PERFIL } from '@/paginas/usuarios/rotulos';
import { useCadastrarUsuario, type PerfilDoUsuario } from '@/usuarios/gestao';
import { Botao } from '@/ui/Botao';
import { Campo } from '@/ui/Campo';
import { Dialogo } from '@/ui/Dialogo';
import { ErroDaApi } from '@/ui/ErroDaApi';

interface Props {
  aoFechar: () => void;
  aoCadastrado: (texto: string) => void;
  retorno: RefObject<HTMLElement | null>;
  alternativa: RefObject<HTMLElement | null>;
}

interface Valores {
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilDoUsuario;
}

type Erros = Partial<Record<keyof Valores, string>>;

const CONFIRA = 'Confira este campo.';
const VAZIO: Valores = { nome: '', email: '', senha: '', perfil: 'SOLICITANTE' };

/** O que falta preencher. A validação de regra (formato do e-mail, tamanho da senha, duplicidade) é do servidor. */
function faltas(v: Valores): Erros {
  const erros: Erros = {};
  if (!v.nome.trim()) erros.nome = 'Informe o nome.';
  if (!v.email.trim()) erros.email = 'Informe o e-mail.';
  if (!v.senha) erros.senha = 'Informe a senha.';
  return erros;
}

/** Campos que o servidor recusou, para marcar na tela. O texto da recusa vem da tabela de erros. */
function camposRecusados(erro: unknown): Erros {
  if (!(erro instanceof ErroDeApi)) return {};
  const { code, campos } = erro.problema;
  if (code === 'VALIDACAO_FALHOU') {
    return Object.fromEntries(campos.map((c) => [c, CONFIRA])) as Erros;
  }
  if (code === 'USUARIO_JA_EXISTE') return { email: CONFIRA };
  return {};
}

/**
 * Cadastro de usuário (T11, RF-15). Só o Administrador chega aqui. A tela confere só o que falta preencher; o
 * servidor valida e recusa pelo código estável (ADR-004). A senha só vive neste diálogo: some quando ele fecha.
 */
export function DialogoDeNovoUsuario({ aoFechar, aoCadastrado, retorno, alternativa }: Props) {
  const [valores, setValores] = useState<Valores>(VAZIO);
  const [locais, setLocais] = useState<Erros>({});
  const [doServidor, setDoServidor] = useState<Erros>({});
  const cadastrar = useCadastrarUsuario();
  const formulario = useRef<HTMLFormElement>(null);
  const alerta = useRef<HTMLDivElement>(null);

  // Depois de uma recusa o foco vai para a mensagem: o teclado e o leitor de tela vão até ela.
  useEffect(() => {
    if (cadastrar.isError) {
      alerta.current?.focus();
    }
  }, [cadastrar.isError, cadastrar.submittedAt]);

  // Faltou preencher: o foco vai para o primeiro campo com problema.
  useEffect(() => {
    if (Object.keys(locais).length > 0) {
      formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [locais]);

  const erro = (nome: keyof Valores): string | undefined => locais[nome] ?? doServidor[nome];
  const mudar = <K extends keyof Valores>(nome: K, valor: Valores[K]) => {
    setValores((v) => ({ ...v, [nome]: valor }));
    setLocais(({ [nome]: _apagado, ...resto }) => resto);
    setDoServidor(({ [nome]: _apagado, ...resto }) => resto);
  };

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (cadastrar.isPending) {
      return;
    }
    const faltando = faltas(valores);
    setLocais(faltando);
    if (Object.keys(faltando).length > 0) {
      return;
    }
    setDoServidor({});
    const nome = valores.nome.trim();
    cadastrar.mutate(
      { nome, email: valores.email.trim(), senha: valores.senha, perfil: valores.perfil },
      {
        onSuccess: () => aoCadastrado(`Usuário "${nome}" cadastrado.`),
        onError: (e) => setDoServidor(camposRecusados(e)),
      },
    );
  };

  return (
    <Dialogo
      titulo="Novo usuário"
      descricao="Preencha os dados e confirme. Os campos obrigatórios estão indicados."
      aoFechar={aoFechar}
      ocupado={cadastrar.isPending}
      retorno={retorno}
      alternativa={alternativa}
    >
      <form ref={formulario} onSubmit={enviar} noValidate className={estilos.formulario}>
        {cadastrar.isError && <ErroDaApi erro={cadastrar.error} ref={alerta} />}
        <Campo rotulo="Nome" obrigatorio erro={erro('nome')}>
          {(c) => <input {...c} type="text" autoComplete="off" value={valores.nome} onChange={(e) => mudar('nome', e.target.value)} />}
        </Campo>
        <Campo rotulo="E-mail" obrigatorio erro={erro('email')}>
          {(c) => <input {...c} type="email" autoComplete="off" value={valores.email} onChange={(e) => mudar('email', e.target.value)} />}
        </Campo>
        <Campo rotulo="Senha" obrigatorio erro={erro('senha')}>
          {(c) => <input {...c} type="password" autoComplete="new-password" value={valores.senha} onChange={(e) => mudar('senha', e.target.value)} />}
        </Campo>
        <Campo rotulo="Perfil" erro={erro('perfil')}>
          {(c) => (
            <select {...c} value={valores.perfil} onChange={(e) => mudar('perfil', e.target.value as PerfilDoUsuario)}>
              {PERFIS.map((p) => (
                <option key={p} value={p}>
                  {ROTULO_DO_PERFIL[p]}
                </option>
              ))}
            </select>
          )}
        </Campo>
        <div className={estilos.acoes}>
          <Botao type="submit" carregando={cadastrar.isPending} textoCarregando="Cadastrando…">
            Cadastrar
          </Botao>
          <Botao variante="secundario" onClick={aoFechar} disabled={cadastrar.isPending}>
            Voltar
          </Botao>
        </div>
      </form>
    </Dialogo>
  );
}
