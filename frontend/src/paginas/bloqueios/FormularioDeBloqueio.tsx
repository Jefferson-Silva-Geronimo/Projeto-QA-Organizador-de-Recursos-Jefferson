import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ErroDeApi } from '@/api/cliente';
import { useCriarBloqueio, type Bloqueio } from '@/bloqueios/consulta';
import { FUSO_DO_CAMPUS, localParaIsoComOffset } from '@/datas/fuso';
import estilos from '@/paginas/bloqueios/FormularioDeBloqueio.module.css';
import type { Recurso } from '@/recursos/consulta';
import { Botao } from '@/ui/Botao';
import { Campo } from '@/ui/Campo';
import { ErroDaApi } from '@/ui/ErroDaApi';

interface Props {
  recursos: readonly Recurso[];
  /** Anuncia o bloqueio criado. */
  aoCriado: (texto: string) => void;
}

interface Valores {
  recursoId: string;
  inicio: string;
  fim: string;
  motivo: string;
}

type Erros = Partial<Record<keyof Valores, string>>;

const VAZIO: Valores = { recursoId: '', inicio: '', fim: '', motivo: '' };
const CONFIRA = 'Confira este campo.';

/** O que falta preencher. A regra do período e do motivo é do servidor. */
function faltas(v: Valores): Erros {
  const erros: Erros = {};
  if (!v.recursoId) erros.recursoId = 'Escolha o recurso.';
  if (!localParaIsoComOffset(v.inicio, FUSO_DO_CAMPUS)) erros.inicio = 'Informe o início.';
  if (!localParaIsoComOffset(v.fim, FUSO_DO_CAMPUS)) erros.fim = 'Informe o fim.';
  if (!v.motivo.trim()) erros.motivo = 'Informe o motivo.';
  return erros;
}

/** Campos que o servidor recusou, para marcar na tela. O texto da recusa vem da tabela de erros. */
function camposRecusados(erro: unknown): Erros {
  if (!(erro instanceof ErroDeApi)) return {};
  const { code, campos } = erro.problema;
  if (code === 'VALIDACAO_FALHOU') return Object.fromEntries(campos.map((c) => [c, CONFIRA])) as Erros;
  if (code === 'MOTIVO_OBRIGATORIO') return { motivo: CONFIRA };
  if (code === 'PERIODO_INVALIDO') return { fim: CONFIRA };
  if (code === 'NAO_ENCONTRADO') return { recursoId: CONFIRA };
  return {};
}

function textoDoSucesso(nome: string, criado: Bloqueio): string {
  const base = `Bloqueio de "${nome}" criado.`;
  return criado.reservasCanceladas.length > 0
    ? `${base} Reservas canceladas: ${criado.reservasCanceladas.map((id) => `nº ${id}`).join(', ')}.`
    : base;
}

/**
 * Novo bloqueio em duas etapas (T08, RN-22). O primeiro envio pode voltar `BLOQUEIO_PENDE_CONFIRMACAO` com as reservas
 * afetadas; se o Administrador confirmar, a tela reenvia os mesmos dados com essas reservas. Se a lista mudou, o servidor
 * responde `BLOQUEIO_LISTA_DESATUALIZADA` e o ciclo recomeça no formulário. Com reserva em uso o servidor recusa, e a
 * tela não oferece forçar. A tela nunca decide quais reservas são afetadas: repete o que o servidor mostrou.
 */
export function FormularioDeBloqueio({ recursos, aoCriado }: Props) {
  const [valores, setValores] = useState<Valores>(VAZIO);
  const [locais, setLocais] = useState<Erros>({});
  const [doServidor, setDoServidor] = useState<Erros>({});
  const [pendente, setPendente] = useState<{ itens: string[]; erro: unknown } | null>(null);
  const criar = useCriarBloqueio();
  const formulario = useRef<HTMLFormElement>(null);
  const alerta = useRef<HTMLDivElement>(null);

  // Depois de uma recusa ou de um pedido de confirmação o foco vai para a mensagem.
  useEffect(() => {
    if (criar.isError || pendente) {
      alerta.current?.focus();
    }
  }, [criar.isError, criar.submittedAt, pendente]);

  // Faltou preencher: o foco vai para o primeiro campo com problema.
  useEffect(() => {
    if (Object.keys(locais).length > 0) {
      formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [locais]);

  const travado = pendente !== null || criar.isPending;
  const erro = (nome: keyof Valores): string | undefined => locais[nome] ?? doServidor[nome];
  const mudar = <K extends keyof Valores>(nome: K, valor: Valores[K]) => {
    setValores((v) => ({ ...v, [nome]: valor }));
    setLocais(({ [nome]: _apagado, ...resto }) => resto);
    setDoServidor(({ [nome]: _apagado, ...resto }) => resto);
  };

  const nomeDoRecurso = recursos.find((r) => String(r.id) === valores.recursoId)?.nome ?? `Recurso nº ${valores.recursoId}`;

  const enviar = (confirmadas?: number[]) => {
    const inicio = localParaIsoComOffset(valores.inicio, FUSO_DO_CAMPUS);
    const fim = localParaIsoComOffset(valores.fim, FUSO_DO_CAMPUS);
    if (!inicio || !fim) {
      return;
    }
    setDoServidor({});
    criar.mutate(
      {
        recursoId: Number(valores.recursoId),
        inicio,
        fim,
        motivo: valores.motivo.trim(),
        ...(confirmadas ? { reservasConfirmadas: confirmadas } : {}),
      },
      {
        onSuccess: (criado) => {
          setPendente(null);
          setValores(VAZIO);
          aoCriado(textoDoSucesso(nomeDoRecurso, criado));
        },
        onError: (e) => {
          if (e instanceof ErroDeApi && e.problema.code === 'BLOQUEIO_PENDE_CONFIRMACAO') {
            setPendente({ itens: e.problema.itens, erro: e });
            return;
          }
          // Lista desatualizada: o ciclo recomeça no formulário. Outra recusa durante a confirmação mantém a confirmação.
          if (e instanceof ErroDeApi && e.problema.code === 'BLOQUEIO_LISTA_DESATUALIZADA') {
            setPendente(null);
          }
          setDoServidor(camposRecusados(e));
        },
      },
    );
  };

  const submeter = (evento: FormEvent) => {
    evento.preventDefault();
    if (travado) {
      return;
    }
    const faltando = faltas(valores);
    setLocais(faltando);
    if (Object.keys(faltando).length > 0) {
      return;
    }
    enviar();
  };

  const confirmar = () => {
    if (criar.isPending || !pendente) {
      return;
    }
    enviar(pendente.itens.map(Number));
  };

  // Voltar descarta o pedido de confirmação e a mensagem dele: o formulário volta limpo de aviso, com os dados digitados.
  const voltar = () => {
    setPendente(null);
    criar.reset();
  };

  const mensagem = criar.error ?? pendente?.erro;

  return (
    <form ref={formulario} aria-label="Novo bloqueio" onSubmit={submeter} noValidate className={estilos.formulario}>
      <Campo rotulo="Recurso" obrigatorio erro={erro('recursoId')}>
        {(c) => (
          <select {...c} value={valores.recursoId} disabled={travado} onChange={(e) => mudar('recursoId', e.target.value)}>
            <option value="">Escolha um recurso</option>
            {recursos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
        )}
      </Campo>
      <Campo rotulo="Início" obrigatorio erro={erro('inicio')}>
        {(c) => <input {...c} type="datetime-local" value={valores.inicio} disabled={travado} onChange={(e) => mudar('inicio', e.target.value)} />}
      </Campo>
      <Campo rotulo="Fim" obrigatorio erro={erro('fim')}>
        {(c) => <input {...c} type="datetime-local" value={valores.fim} disabled={travado} onChange={(e) => mudar('fim', e.target.value)} />}
      </Campo>
      <Campo rotulo="Motivo" obrigatorio erro={erro('motivo')}>
        {(c) => <input {...c} type="text" value={valores.motivo} disabled={travado} onChange={(e) => mudar('motivo', e.target.value)} />}
      </Campo>
      {mensagem !== null && mensagem !== undefined && (
        <div className={estilos.mensagem}>
          <ErroDaApi erro={mensagem} ref={alerta} />
          {pendente && <p className={estilos.afetadas}>Reservas afetadas: {pendente.itens.map((id) => `nº ${id}`).join(', ')}</p>}
        </div>
      )}
      <div className={estilos.acoes}>
        {pendente ? (
          <>
            <Botao onClick={confirmar} carregando={criar.isPending} textoCarregando="Cancelando reservas…">
              Confirmar e cancelar
            </Botao>
            <Botao variante="secundario" onClick={voltar} disabled={criar.isPending}>
              Voltar
            </Botao>
          </>
        ) : (
          <Botao type="submit" carregando={criar.isPending} textoCarregando="Bloqueando…">
            Bloquear
          </Botao>
        )}
      </div>
    </form>
  );
}
