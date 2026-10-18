import { useState } from 'react';
import estilos from '@/layout/SeletorDeTema.module.css';
import { escolherTema, lerEscolhaDeTema, type EscolhaDeTema } from '@/estilo/tema';

const OPCOES: { valor: EscolhaDeTema; rotulo: string }[] = [
  { valor: 'sistema', rotulo: 'Sistema' },
  { valor: 'claro', rotulo: 'Claro' },
  { valor: 'escuro', rotulo: 'Escuro' },
];

/** Troca manual do tema (F6-09). Só a escolha fica no navegador; sem escolha vale o tema do sistema. */
export function SeletorDeTema() {
  const [escolha, setEscolha] = useState<EscolhaDeTema>(() => lerEscolhaDeTema());

  return (
    <div role="group" aria-label="Tema" className={estilos.grupo}>
      {OPCOES.map(({ valor, rotulo }) => (
        <button
          key={valor}
          type="button"
          className={estilos.opcao}
          aria-pressed={escolha === valor}
          onClick={() => {
            escolherTema(valor);
            setEscolha(valor);
          }}
        >
          {rotulo}
        </button>
      ))}
    </div>
  );
}
