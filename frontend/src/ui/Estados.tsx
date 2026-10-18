import type { ReactNode } from 'react';
import estilos from '@/ui/Estados.module.css';

/** Anuncia a espera como status, sem interromper a leitura em curso. */
export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div role="status" className={estilos.carregando}>
      <span className={estilos.giro} aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}

/** Estado vazio: diz o que aconteceu e o que fazer. Não é erro e não usa o papel de alerta. */
export function EstadoVazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className={estilos.vazio}>
      <p className={estilos.tituloVazio}>{titulo}</p>
      {children && <p className={estilos.textoVazio}>{children}</p>}
    </div>
  );
}
