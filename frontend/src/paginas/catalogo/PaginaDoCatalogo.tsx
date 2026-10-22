import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useSessao } from '@/autenticacao/useSessao';
import { CartaoDoCatalogo } from '@/paginas/catalogo/CartaoDoCatalogo';
import { DialogoDeCadastro, type TipoDeCadastro } from '@/paginas/catalogo/DialogoDeCadastro';
import { DialogoDeDesativacao } from '@/paginas/catalogo/DialogoDeDesativacao';
import estilos from '@/paginas/catalogo/PaginaDoCatalogo.module.css';
import estilosDaLista from '@/paginas/reservas/PaginaDeReservas.module.css';
import { useRecursos, type Recurso } from '@/recursos/consulta';
import { Aviso } from '@/ui/Aviso';
import { Botao } from '@/ui/Botao';
import { ErroDaApi } from '@/ui/ErroDaApi';
import { Carregando, EstadoVazio } from '@/ui/Estados';

const ABAS: readonly { tipo: TipoDeCadastro; rotulo: string; novo: string; vazio: string }[] = [
  { tipo: 'SALA', rotulo: 'Salas', novo: 'Nova sala', vazio: 'Nenhuma sala cadastrada.' },
  { tipo: 'PROFESSOR', rotulo: 'Professores', novo: 'Novo professor', vazio: 'Nenhum professor cadastrado.' },
  { tipo: 'MATERIAL', rotulo: 'Materiais', novo: 'Novo material', vazio: 'Nenhum material cadastrado.' },
];

const CONTAGEM: Record<TipoDeCadastro, [string, string]> = {
  SALA: ['sala', 'salas'],
  PROFESSOR: ['professor', 'professores'],
  MATERIAL: ['material', 'materiais'],
};

function contagem(tipo: TipoDeCadastro, total: number): string {
  const [singular, plural] = CONTAGEM[tipo];
  return `${total} ${total === 1 ? singular : plural}`;
}

/**
 * Catálogo de recursos (T07, RF-02). Todos consultam; só o Administrador cadastra, marca "restrito" e desativa, e o
 * servidor recusa os outros com 403 (ADR-004). Os diálogos vivem na página, e não no cartão, porque o recurso
 * desativado sai da lista: a mensagem de uma recusa não pode sumir junto com o cartão.
 */
export function PaginaDoCatalogo() {
  const { sessao } = useSessao();
  const administrador = sessao?.perfil === 'ADMINISTRADOR';
  const [indice, setIndice] = useState(0);
  const aba = ABAS[indice] ?? (ABAS[0] as (typeof ABAS)[number]);
  const recursos = useRecursos({ tipo: aba.tipo });
  const [cadastrando, setCadastrando] = useState(false);
  const [desativando, setDesativando] = useState<Recurso | null>(null);
  const [resultado, setResultado] = useState<{ texto: string; numero: number } | null>(null);
  const contador = useRef(0);
  const idDasAbas = useId();
  const abas = useRef<(HTMLButtonElement | null)[]>([]);
  const titulo = useRef<HTMLHeadingElement>(null);
  const aviso = useRef<HTMLDivElement>(null);
  const abridor = useRef<HTMLElement | null>(null);

  // O botão que o Administrador usou pode deixar de existir (o recurso sai da lista): o foco vai para a confirmação.
  useEffect(() => {
    if (resultado) {
      aviso.current?.focus();
    }
  }, [resultado]);

  const anunciar = (texto: string) => {
    contador.current += 1;
    setResultado({ texto, numero: contador.current });
  };

  const irParaAba = (novo: number) => {
    const alvo = (novo + ABAS.length) % ABAS.length;
    setIndice(alvo);
    abas.current[alvo]?.focus();
  };

  const teclar = (evento: KeyboardEvent) => {
    if (evento.key === 'ArrowRight') irParaAba(indice + 1);
    else if (evento.key === 'ArrowLeft') irParaAba(indice - 1);
    else if (evento.key === 'Home') irParaAba(0);
    else if (evento.key === 'End') irParaAba(ABAS.length - 1);
    else return;
    evento.preventDefault();
  };

  const abrirCadastro = (botao: HTMLButtonElement) => {
    abridor.current = botao;
    setResultado(null);
    setCadastrando(true);
  };

  const abrirDesativacao = (recurso: Recurso, botao: HTMLButtonElement) => {
    abridor.current = botao;
    setResultado(null);
    setDesativando(recurso);
  };

  const lista = recursos.data;

  return (
    <section aria-labelledby="titulo-da-tela" className={estilosDaLista.pagina}>
      <h1 id="titulo-da-tela" ref={titulo} tabIndex={-1}>
        Catálogo
      </h1>
      {resultado && (
        <Aviso tipo="sucesso" ref={aviso}>
          {resultado.texto}
        </Aviso>
      )}
      <div className={estilos.barra}>
        <div role="tablist" aria-label="Tipo de recurso" className={estilos.abas}>
          {ABAS.map((a, posicao) => (
            <button
              key={a.tipo}
              ref={(el) => {
                abas.current[posicao] = el;
              }}
              id={`${idDasAbas}-${a.tipo}`}
              type="button"
              role="tab"
              aria-selected={posicao === indice}
              aria-controls={`${idDasAbas}-painel`}
              tabIndex={posicao === indice ? 0 : -1}
              className={estilos.aba}
              onClick={() => setIndice(posicao)}
              onKeyDown={teclar}
            >
              {a.rotulo}
            </button>
          ))}
        </div>
        {administrador && <Botao onClick={(e) => abrirCadastro(e.currentTarget)}>{aba.novo}</Botao>}
      </div>
      {administrador && (
        <p className={estilos.nota}>Mudar "restrito" vale só para as próximas reservas: as reservas que já existem não mudam.</p>
      )}
      <div role="tabpanel" id={`${idDasAbas}-painel`} aria-labelledby={`${idDasAbas}-${aba.tipo}`} className={estilosDaLista.pagina}>
        {recursos.isPending && <Carregando texto="Carregando recursos…" />}
        {recursos.isError && <ErroDaApi erro={recursos.error} aoTentarDeNovo={() => void recursos.refetch()} />}
        {lista && (
          <>
            <p className={estilosDaLista.contagem}>{contagem(aba.tipo, lista.length)}</p>
            {lista.length === 0 ? (
              <EstadoVazio titulo="Nada cadastrado">{aba.vazio}</EstadoVazio>
            ) : (
              <div className={estilosDaLista.grade}>
                {lista.map((recurso) => (
                  <CartaoDoCatalogo
                    key={recurso.id}
                    recurso={recurso}
                    administrador={administrador}
                    aoAnunciar={anunciar}
                    aoDesativar={abrirDesativacao}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {cadastrando && (
        <DialogoDeCadastro
          tipo={aba.tipo}
          aoFechar={() => setCadastrando(false)}
          aoCadastrado={(texto) => {
            anunciar(texto);
            setCadastrando(false);
          }}
          retorno={abridor}
          alternativa={titulo}
        />
      )}
      {desativando && (
        <DialogoDeDesativacao
          recurso={desativando}
          aoFechar={() => setDesativando(null)}
          aoDesativado={(texto) => {
            anunciar(texto);
            setDesativando(null);
          }}
          retorno={abridor}
          alternativa={titulo}
        />
      )}
    </section>
  );
}
