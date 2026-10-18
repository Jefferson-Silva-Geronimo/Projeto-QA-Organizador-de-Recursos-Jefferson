import { FUSO_DO_CAMPUS, formatarIntervalo } from '@/datas/fuso';
import { useOcupacoes } from '@/recursos/consulta';
import { ErroDaApi } from '@/ui/ErroDaApi';
import { Carregando } from '@/ui/Estados';
import estilos from '@/paginas/busca/HorariosOcupados.module.css';

interface Props {
  id: string;
  recursoId: number;
  /** Instantes ISO-8601 com offset: o período da busca ou, sem ele, os próximos dias. */
  inicio: string;
  fim: string;
}

/** Intervalos ocupados do recurso. Mostra só os horários, nunca quem reservou (B3, RF-03). */
export function HorariosOcupados({ id, recursoId, inicio, fim }: Props) {
  const consulta = useOcupacoes(recursoId, inicio, fim, true);
  return (
    <div id={id} className={estilos.caixa}>
      {consulta.isPending && <Carregando texto="Buscando horários…" />}
      {consulta.isError && <ErroDaApi erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />}
      {consulta.isSuccess && consulta.data.length === 0 && (
        <p className={estilos.vazio}>Nenhum horário ocupado neste período.</p>
      )}
      {consulta.isSuccess && consulta.data.length > 0 && (
        <ul aria-label="Horários ocupados" className={estilos.lista}>
          {consulta.data.map((i) => (
            <li key={`${i.inicio}-${i.fim}`}>{formatarIntervalo(i.inicio, i.fim, FUSO_DO_CAMPUS)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
