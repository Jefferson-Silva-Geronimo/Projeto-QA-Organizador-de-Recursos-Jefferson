import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { ErroDeApi } from '@/api/cliente';
import estilos from '@/paginas/catalogo/DialogoDeCadastro.module.css';
import { useCadastrarRecurso, type NovoRecurso } from '@/recursos/gestao';
import { useUsuarios } from '@/usuarios/consulta';
import { Botao } from '@/ui/Botao';
import { Campo } from '@/ui/Campo';
import campo from '@/ui/Campo.module.css';
import { Dialogo } from '@/ui/Dialogo';
import { ErroDaApi } from '@/ui/ErroDaApi';

export type TipoDeCadastro = 'SALA' | 'PROFESSOR' | 'MATERIAL';

interface Props {
  tipo: TipoDeCadastro;
  aoFechar: () => void;
  aoCadastrado: (texto: string) => void;
  retorno: RefObject<HTMLElement | null>;
  alternativa: RefObject<HTMLElement | null>;
}

const TITULO: Record<TipoDeCadastro, string> = { SALA: 'Nova sala', PROFESSOR: 'Novo professor', MATERIAL: 'Novo material' };
const RESULTADO: Record<TipoDeCadastro, (nome: string) => string> = {
  SALA: (n) => `Sala "${n}" cadastrada.`,
  PROFESSOR: (n) => `Professor "${n}" cadastrado.`,
  MATERIAL: (n) => `Material "${n}" cadastrado.`,
};
const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'] as const;
const ROTULO_DO_PERFIL = { SOLICITANTE: 'Solicitante', RESPONSAVEL: 'Responsável', ADMINISTRADOR: 'Administrador' } as const;
const CONFIRA = 'Confira este campo.';

interface Valores {
  nome: string;
  capacidade: string;
  localizacao: string;
  tipoSala: string;
  horaAbertura: string;
  horaFechamento: string;
  dias: number[];
  competencias: string;
  usuarioId: string;
  codigoPatrimonio: string;
  descricao: string;
  restrito: boolean;
}

const VAZIO: Valores = {
  nome: '',
  capacidade: '',
  localizacao: '',
  tipoSala: '',
  horaAbertura: '',
  horaFechamento: '',
  dias: [],
  competencias: '',
  usuarioId: '',
  codigoPatrimonio: '',
  descricao: '',
  restrito: false,
};

type Erros = Partial<Record<keyof Valores, string>>;

/** O que falta preencher. A validação de regra (capacidade, janela, duplicidade) é do servidor. */
function faltas(tipo: TipoDeCadastro, v: Valores): Erros {
  const erros: Erros = {};
  if (!v.nome.trim()) erros.nome = 'Informe o nome.';
  if (tipo === 'SALA') {
    if (!v.capacidade.trim()) erros.capacidade = 'Informe a capacidade.';
    if (!v.localizacao.trim()) erros.localizacao = 'Informe a localização.';
    if (!v.horaAbertura) erros.horaAbertura = 'Informe a hora de abertura.';
    if (!v.horaFechamento) erros.horaFechamento = 'Informe a hora de fechamento.';
    if (v.dias.length === 0) erros.dias = 'Marque ao menos um dia.';
  }
  if (tipo === 'MATERIAL' && !v.codigoPatrimonio.trim()) erros.codigoPatrimonio = 'Informe o código de patrimônio.';
  return erros;
}

function paraEnviar(tipo: TipoDeCadastro, v: Valores): NovoRecurso {
  const nome = v.nome.trim();
  if (tipo === 'SALA') {
    return {
      tipo,
      corpo: {
        nome,
        capacidade: Number(v.capacidade),
        localizacao: v.localizacao.trim(),
        ...(v.tipoSala.trim() ? { tipoSala: v.tipoSala.trim() } : {}),
        horaAbertura: v.horaAbertura,
        horaFechamento: v.horaFechamento,
        diasFuncionamento: [...v.dias].sort((a, b) => a - b),
        restrito: v.restrito,
      },
    };
  }
  if (tipo === 'PROFESSOR') {
    return {
      tipo,
      corpo: {
        nome,
        competencias: v.competencias.split(',').map((c) => c.trim()).filter(Boolean),
        ...(v.usuarioId ? { usuarioId: Number(v.usuarioId) } : {}),
        restrito: v.restrito,
      },
    };
  }
  return {
    tipo,
    corpo: {
      nome,
      codigoPatrimonio: v.codigoPatrimonio.trim(),
      ...(v.descricao.trim() ? { descricao: v.descricao.trim() } : {}),
      restrito: v.restrito,
    },
  };
}

/** Campos que o servidor recusou, para marcar na tela. O texto da recusa vem da tabela de erros. */
function camposRecusados(erro: unknown): Erros {
  if (!(erro instanceof ErroDeApi)) return {};
  const { code, campos } = erro.problema;
  if (code === 'VALIDACAO_FALHOU') {
    return Object.fromEntries(campos.map((c) => [c, CONFIRA])) as Erros;
  }
  if (code === 'PATRIMONIO_JA_EXISTE') return { codigoPatrimonio: CONFIRA };
  if (code === 'VINCULO_JA_EXISTE') return { usuarioId: CONFIRA };
  return {};
}

/**
 * Cadastro de sala, professor ou material (T07, RF-02). Só o Administrador chega aqui. A tela só confere o que falta
 * preencher; o servidor valida e recusa pelo código estável (ADR-004), e a mensagem vem da tabela de erros.
 */
export function DialogoDeCadastro({ tipo, aoFechar, aoCadastrado, retorno, alternativa }: Props) {
  const [valores, setValores] = useState<Valores>(VAZIO);
  const [locais, setLocais] = useState<Erros>({});
  const [doServidor, setDoServidor] = useState<Erros>({});
  const cadastrar = useCadastrarRecurso();
  const usuarios = useUsuarios(tipo === 'PROFESSOR');
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
    const faltando = faltas(tipo, valores);
    setLocais(faltando);
    if (Object.keys(faltando).length > 0) {
      return;
    }
    setDoServidor({});
    cadastrar.mutate(paraEnviar(tipo, valores), {
      onSuccess: () => aoCadastrado(RESULTADO[tipo](valores.nome.trim())),
      onError: (e) => setDoServidor(camposRecusados(e)),
    });
  };

  const usuariosAtivos = (usuarios.data ?? []).filter((u) => u.ativo);

  return (
    <Dialogo
      titulo={TITULO[tipo]}
      descricao="Preencha os dados e confirme. Os campos obrigatórios estão indicados."
      aoFechar={aoFechar}
      ocupado={cadastrar.isPending}
      retorno={retorno}
      alternativa={alternativa}
    >
      <form ref={formulario} onSubmit={enviar} noValidate className={estilos.formulario}>
        {cadastrar.isError && <ErroDaApi erro={cadastrar.error} ref={alerta} />}
        <Campo rotulo="Nome" obrigatorio erro={erro('nome')}>
          {(c) => <input {...c} type="text" value={valores.nome} onChange={(e) => mudar('nome', e.target.value)} />}
        </Campo>
        {tipo === 'SALA' && (
          <>
            <Campo rotulo="Capacidade" obrigatorio erro={erro('capacidade')}>
              {(c) => (
                <input {...c} type="number" inputMode="numeric" min={1} value={valores.capacidade} onChange={(e) => mudar('capacidade', e.target.value)} />
              )}
            </Campo>
            <Campo rotulo="Localização" obrigatorio erro={erro('localizacao')}>
              {(c) => <input {...c} type="text" value={valores.localizacao} onChange={(e) => mudar('localizacao', e.target.value)} />}
            </Campo>
            <Campo rotulo="Tipo de sala (opcional)" erro={erro('tipoSala')}>
              {(c) => <input {...c} type="text" value={valores.tipoSala} onChange={(e) => mudar('tipoSala', e.target.value)} />}
            </Campo>
            <div className={estilos.duplo}>
              <Campo rotulo="Abre às" obrigatorio erro={erro('horaAbertura')}>
                {(c) => <input {...c} type="time" value={valores.horaAbertura} onChange={(e) => mudar('horaAbertura', e.target.value)} />}
              </Campo>
              <Campo rotulo="Fecha às" obrigatorio erro={erro('horaFechamento')}>
                {(c) => <input {...c} type="time" value={valores.horaFechamento} onChange={(e) => mudar('horaFechamento', e.target.value)} />}
              </Campo>
            </div>
            <fieldset className={estilos.grupo} aria-describedby={erro('dias') ? 'erro-dos-dias' : undefined}>
              <legend className={estilos.legenda}>Dias de funcionamento</legend>
              <div className={estilos.dias}>
                {DIAS.map((nome, posicao) => {
                  const dia = posicao + 1;
                  return (
                    <label key={nome} className={estilos.marcador}>
                      <input
                        type="checkbox"
                        checked={valores.dias.includes(dia)}
                        aria-invalid={erro('dias') && posicao === 0 ? true : undefined}
                        onChange={(e) => mudar('dias', e.target.checked ? [...valores.dias, dia] : valores.dias.filter((d) => d !== dia))}
                      />
                      <span>{nome}</span>
                    </label>
                  );
                })}
              </div>
              {erro('dias') && (
                <p id="erro-dos-dias" className={campo.erro}>
                  {erro('dias')}
                </p>
              )}
            </fieldset>
          </>
        )}
        {tipo === 'PROFESSOR' && (
          <>
            <Campo rotulo="Competências (separadas por vírgula)" erro={erro('competencias')}>
              {(c) => <input {...c} type="text" value={valores.competencias} onChange={(e) => mudar('competencias', e.target.value)} />}
            </Campo>
            <Campo rotulo="Usuário vinculado (opcional)" erro={erro('usuarioId')}>
              {(c) => (
                <select {...c} value={valores.usuarioId} onChange={(e) => mudar('usuarioId', e.target.value)}>
                  <option value="">Sem vínculo</option>
                  {usuariosAtivos.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({ROTULO_DO_PERFIL[u.perfil]})
                    </option>
                  ))}
                </select>
              )}
            </Campo>
          </>
        )}
        {tipo === 'MATERIAL' && (
          <>
            <Campo rotulo="Código de patrimônio" obrigatorio erro={erro('codigoPatrimonio')}>
              {(c) => <input {...c} type="text" value={valores.codigoPatrimonio} onChange={(e) => mudar('codigoPatrimonio', e.target.value)} />}
            </Campo>
            <Campo rotulo="Descrição (opcional)" erro={erro('descricao')}>
              {(c) => <input {...c} type="text" value={valores.descricao} onChange={(e) => mudar('descricao', e.target.value)} />}
            </Campo>
          </>
        )}
        <label className={estilos.marcador}>
          <input type="checkbox" checked={valores.restrito} onChange={(e) => mudar('restrito', e.target.checked)} />
          <span>Restrito (exige aprovação)</span>
        </label>
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
