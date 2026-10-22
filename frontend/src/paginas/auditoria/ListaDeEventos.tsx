import estilos from '@/paginas/auditoria/ListaDeEventos.module.css';
import { ROTULO_DA_ACAO, ROTULO_DA_ENTIDADE } from '@/paginas/auditoria/rotulos';
import estilosDoCartao from '@/paginas/busca/CartaoDeRecurso.module.css';
import type { EntidadeAuditada, EventoDeAuditoria } from '@/auditoria/consulta';
import { FUSO_DO_CAMPUS, formatarDataHora } from '@/datas/fuso';
import { ROTULO_DO_ESTADO, textoDoMotivo } from '@/reservas/rotulos';

function estado(codigo: string): string {
  return (ROTULO_DO_ESTADO as Record<string, string>)[codigo] ?? codigo;
}

function quem(evento: EventoDeAuditoria): string {
  if (evento.atorNome) {
    return evento.atorNome;
  }
  // O sistema não tem nome (L-10). Quem não é o sistema e veio sem nome não é inventado.
  return evento.atorTipo === 'SISTEMA' ? 'SISTEMA' : 'Não identificado';
}

function mudanca(evento: EventoDeAuditoria): string | null {
  if (evento.estadoAnterior && evento.estadoNovo) {
    return `De ${estado(evento.estadoAnterior)} para ${estado(evento.estadoNovo)}`;
  }
  return evento.estadoNovo ? `Estado: ${estado(evento.estadoNovo)}` : null;
}

function Linha({ nome, children }: { nome: string; children: string }) {
  return (
    <div className={estilosDoCartao.detalhe}>
      <dt>{nome}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/**
 * Eventos da auditoria (T09, RF-10), só leitura: não existe edição nem exclusão de evento. Na ordem em que o servidor os
 * devolve. O ator aparece pelo nome, nunca pelo e-mail nem pelo número, e o conteúdo bruto de antes e depois não é mostrado.
 */
export function ListaDeEventos({ eventos }: { eventos: readonly EventoDeAuditoria[] }) {
  return (
    <ol className={estilos.lista}>
      {eventos.map((evento) => {
        const alteracao = mudanca(evento);
        const entidade = ROTULO_DA_ENTIDADE[evento.entidade as EntidadeAuditada] ?? evento.entidade;
        return (
          <li key={evento.id} className={estilosDoCartao.cartao}>
            <h2 className={estilosDoCartao.nome}>{ROTULO_DA_ACAO[evento.acao] ?? evento.acao}</h2>
            <dl className={estilosDoCartao.detalhes}>
              <Linha nome="Quando">{formatarDataHora(evento.ocorridoEm, FUSO_DO_CAMPUS)}</Linha>
              <Linha nome="Quem">{quem(evento)}</Linha>
              <Linha nome="Sobre">{`${entidade} nº ${evento.entidadeId}`}</Linha>
              {alteracao && <Linha nome="Mudança">{alteracao}</Linha>}
              {evento.motivo && <Linha nome="Motivo">{textoDoMotivo(evento.motivo)}</Linha>}
            </dl>
          </li>
        );
      })}
    </ol>
  );
}
