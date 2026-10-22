import { useEffect, useRef, useState } from 'react';
import { CartaoDoUsuario } from '@/paginas/usuarios/CartaoDoUsuario';
import { DialogoDeDesativacaoDoUsuario } from '@/paginas/usuarios/DialogoDeDesativacaoDoUsuario';
import { DialogoDeNovoUsuario } from '@/paginas/usuarios/DialogoDeNovoUsuario';
import { DialogoDePerfil } from '@/paginas/usuarios/DialogoDePerfil';
import estilos from '@/paginas/catalogo/PaginaDoCatalogo.module.css';
import estilosDaLista from '@/paginas/reservas/PaginaDeReservas.module.css';
import { useUsuarios, type Usuario } from '@/usuarios/consulta';
import { Aviso } from '@/ui/Aviso';
import { Botao } from '@/ui/Botao';
import { ErroDaApi } from '@/ui/ErroDaApi';
import { Carregando, EstadoVazio } from '@/ui/Estados';

type Aberto = { tipo: 'novo' } | { tipo: 'perfil'; usuario: Usuario } | { tipo: 'desativar'; usuario: Usuario };

function contagem(total: number): string {
  return total === 1 ? '1 usuário' : `${total} usuários`;
}

/**
 * Usuários e perfis (T11, RF-15). Só o Administrador chega aqui (matriz de telas), e o servidor recusa os outros com
 * 403 (ADR-004). Os diálogos vivem na página, e não no cartão, porque a lista é refeita depois de cada mudança: a
 * mensagem de uma recusa não pode sumir junto com o cartão.
 */
export function PaginaDeUsuarios() {
  const usuarios = useUsuarios();
  const [aberto, setAberto] = useState<Aberto | null>(null);
  const [resultado, setResultado] = useState<{ texto: string; numero: number } | null>(null);
  const contador = useRef(0);
  const titulo = useRef<HTMLHeadingElement>(null);
  const aviso = useRef<HTMLDivElement>(null);
  const abridor = useRef<HTMLElement | null>(null);

  // O botão que o Administrador usou pode deixar de existir (o usuário passa a Desativado): o foco vai para a confirmação.
  useEffect(() => {
    if (resultado) {
      aviso.current?.focus();
    }
  }, [resultado]);

  const anunciar = (texto: string) => {
    contador.current += 1;
    setResultado({ texto, numero: contador.current });
    setAberto(null);
  };

  const abrir = (novo: Aberto, botao: HTMLElement) => {
    abridor.current = botao;
    setResultado(null);
    setAberto(novo);
  };

  const lista = usuarios.data;
  const fechar = () => setAberto(null);

  return (
    <section aria-labelledby="titulo-da-tela" className={estilosDaLista.pagina}>
      <h1 id="titulo-da-tela" ref={titulo} tabIndex={-1}>
        Usuários
      </h1>
      {resultado && (
        <Aviso tipo="sucesso" ref={aviso}>
          {resultado.texto}
        </Aviso>
      )}
      <div className={estilos.barra}>
        {lista && <p className={estilosDaLista.contagem}>{contagem(lista.length)}</p>}
        <Botao onClick={(e) => abrir({ tipo: 'novo' }, e.currentTarget)}>Novo usuário</Botao>
      </div>
      {usuarios.isPending && <Carregando texto="Carregando usuários…" />}
      {usuarios.isError && <ErroDaApi erro={usuarios.error} aoTentarDeNovo={() => void usuarios.refetch()} />}
      {lista &&
        (lista.length === 0 ? (
          <EstadoVazio titulo="Nada cadastrado">Nenhum usuário cadastrado.</EstadoVazio>
        ) : (
          <div className={estilosDaLista.grade}>
            {lista.map((usuario) => (
              <CartaoDoUsuario
                key={usuario.id}
                usuario={usuario}
                aoTrocarPerfil={(u, botao) => abrir({ tipo: 'perfil', usuario: u }, botao)}
                aoDesativar={(u, botao) => abrir({ tipo: 'desativar', usuario: u }, botao)}
              />
            ))}
          </div>
        ))}
      {aberto?.tipo === 'novo' && (
        <DialogoDeNovoUsuario aoFechar={fechar} aoCadastrado={anunciar} retorno={abridor} alternativa={titulo} />
      )}
      {aberto?.tipo === 'perfil' && (
        <DialogoDePerfil usuario={aberto.usuario} aoFechar={fechar} aoTrocado={anunciar} retorno={abridor} alternativa={titulo} />
      )}
      {aberto?.tipo === 'desativar' && (
        <DialogoDeDesativacaoDoUsuario usuario={aberto.usuario} aoFechar={fechar} aoDesativado={anunciar} retorno={abridor} alternativa={titulo} />
      )}
    </section>
  );
}
