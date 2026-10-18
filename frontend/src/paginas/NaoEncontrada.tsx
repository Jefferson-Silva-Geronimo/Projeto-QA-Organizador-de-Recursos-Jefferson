import { Link } from 'react-router-dom';
import { useSessao } from '@/autenticacao/useSessao';
import { rotaInicial } from '@/rotas/navegacao';

export function NaoEncontrada() {
  const { sessao } = useSessao();
  const inicio = sessao ? rotaInicial(sessao.perfil) : '/entrar';
  return (
    <section aria-labelledby="titulo-da-tela">
      <h1 id="titulo-da-tela">Página não encontrada</h1>
      <p>O endereço que você abriu não existe.</p>
      <Link to={inicio}>Voltar ao início</Link>
    </section>
  );
}
