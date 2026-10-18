/**
 * Datas no fuso do campus (ADR-005, plano mestre 10.3 item 6): a pessoa escolhe a hora do campus, o servidor recebe
 * ISO-8601 com offset e tudo o que volta é exibido de novo na hora do campus, nunca na do navegador.
 */

const PADRAO_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/** Fuso do campus. Decisão A6; muda por variável de ambiente, sem alterar código. */
export const FUSO_DO_CAMPUS: string = import.meta.env.VITE_FUSO_CAMPUS ?? 'America/Sao_Paulo';

/** Deslocamento do fuso em relação ao UTC, em minutos, no instante dado. */
function deslocamentoEmMinutos(instante: number, fuso: string): number {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: fuso, timeZoneName: 'longOffset' }).formatToParts(
    new Date(instante),
  );
  const nome = partes.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = /GMT(?:([+-])(\d{2}):(\d{2}))?/.exec(nome);
  if (!m || !m[1]) {
    return 0;
  }
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

function formatarOffset(minutos: number): string {
  const sinal = minutos < 0 ? '-' : '+';
  const absoluto = Math.abs(minutos);
  return `${sinal}${String(Math.floor(absoluto / 60)).padStart(2, '0')}:${String(absoluto % 60).padStart(2, '0')}`;
}

/** "2026-10-21T14:00" na hora do fuso vira "2026-10-21T14:00:00-03:00". Texto que não é data e hora vira null. */
export function localParaIsoComOffset(local: string, fuso: string): string | null {
  const m = PADRAO_LOCAL.exec(local);
  if (!m) {
    return null;
  }
  const [, ano, mes, dia, hora, minuto, segundo = '00'] = m;
  const numeros = [ano, mes, dia, hora, minuto, segundo].map(Number) as [number, number, number, number, number, number];
  const [a, mo, d, h, mi, s] = numeros;
  const comoUtc = Date.UTC(a, mo - 1, d, h, mi, s);
  const conferido = new Date(comoUtc);
  if (conferido.getUTCMonth() !== mo - 1 || conferido.getUTCDate() !== d || h > 23 || mi > 59 || s > 59) {
    return null;
  }
  // Duas passadas: o deslocamento é o do instante resultante, o que acerta a virada do horário de verão.
  let deslocamento = deslocamentoEmMinutos(comoUtc, fuso);
  deslocamento = deslocamentoEmMinutos(comoUtc - deslocamento * 60_000, fuso);
  return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}${formatarOffset(deslocamento)}`;
}

function partesNoFuso(instante: Date, fuso: string) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instante);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return { ano: valor('year'), mes: valor('month'), dia: valor('day'), hora: valor('hour'), minuto: valor('minute') };
}

/** Instante ISO na hora do fuso, no formato do campo de data e hora ("2026-10-21T14:00"). */
export function isoParaLocal(iso: string, fuso: string): string {
  const { ano, mes, dia, hora, minuto } = partesNoFuso(new Date(iso), fuso);
  return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
}

/** Texto legível do intervalo, sempre na hora do campus. */
export function formatarIntervalo(inicioIso: string, fimIso: string, fuso: string): string {
  const inicio = new Date(inicioIso);
  const fim = new Date(fimIso);
  const dia = new Intl.DateTimeFormat('pt-BR', { timeZone: fuso, weekday: 'short', day: '2-digit', month: '2-digit' });
  const hora = new Intl.DateTimeFormat('pt-BR', { timeZone: fuso, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const mesmoDia = dia.format(inicio) === dia.format(fim);
  return mesmoDia
    ? `${dia.format(inicio)}, ${hora.format(inicio)} às ${hora.format(fim)}`
    : `${dia.format(inicio)}, ${hora.format(inicio)} até ${dia.format(fim)}, ${hora.format(fim)}`;
}
