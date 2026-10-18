import { useState, type FormEvent } from 'react';
import estilos from '@/paginas/entrada/PaginaDeEntrada.module.css';
import { SeletorDeTema } from '@/layout/SeletorDeTema';
import { Botao } from '@/ui/Botao';
import { Campo } from '@/ui/Campo';

/**
 * Entrar (T01, RF-01). Mostra só e-mail e senha; quem decide se a credencial vale é o servidor.
 * Nada além do token opaco da sessão é guardado, e ele só pelo módulo de sessão (ADR-015).
 */
export function PaginaDeEntrada() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
  };

  return (
    <div className={estilos.fundo}>
      <header className={estilos.topo}>
        <span className={estilos.marca}>Organização de Recursos</span>
        <SeletorDeTema />
      </header>
      <main className={estilos.principal}>
        <section className={estilos.cartao}>
          <h1 id="titulo-da-tela">Entrar</h1>
          <form aria-labelledby="titulo-da-tela" onSubmit={enviar} noValidate className={estilos.formulario}>
            <Campo rotulo="E-mail" obrigatorio>
              {(c) => (
                <input
                  {...c}
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </Campo>
            <Campo rotulo="Senha" obrigatorio>
              {(c) => (
                <div className={estilos.senha}>
                  <input
                    {...c}
                    type={mostrarSenha ? 'text' : 'password'}
                    autoComplete="current-password"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                  <button
                    type="button"
                    className={estilos.alternar}
                    aria-pressed={mostrarSenha}
                    onClick={() => setMostrarSenha((m) => !m)}
                  >
                    Mostrar senha
                  </button>
                </div>
              )}
            </Campo>
            <Botao type="submit">Entrar</Botao>
          </form>
        </section>
      </main>
    </div>
  );
}
