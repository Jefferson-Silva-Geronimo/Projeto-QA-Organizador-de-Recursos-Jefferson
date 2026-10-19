import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import estilos from '@/paginas/reserva/PaginaDeNovaReserva.module.css';
import { Formulario, VAZIO, type Inicial } from '@/paginas/reserva/FormularioDeReserva';

function inicialDoEndereco(params: URLSearchParams): Inicial {
  return {
    inicio: params.get('inicio') ?? '',
    fim: params.get('fim') ?? '',
    recursos: params.getAll('recursos').map(Number).filter(Number.isInteger),
  };
}

/**
 * Nova reserva (T03, RF-04, RF-05). O front junta os dados e envia; sobreposição, janela de funcionamento,
 * manutenção e aprovação são decididas pelo servidor, e o resultado volta como mensagem compreensível.
 */
export function PaginaDeNovaReserva() {
  const [params, setParams] = useSearchParams();
  const [inicial, setInicial] = useState<Inicial>(() => inicialDoEndereco(params));
  const [rodada, setRodada] = useState(0);

  const fazerOutra = () => {
    setInicial(VAZIO);
    setParams(new URLSearchParams(), { replace: true });
    setRodada((n) => n + 1);
  };

  return (
    <section aria-labelledby="titulo-da-tela" className={estilos.pagina}>
      <h1 id="titulo-da-tela">Nova reserva</h1>
      <Formulario key={rodada} inicial={inicial} aoFazerOutra={fazerOutra} />
    </section>
  );
}
