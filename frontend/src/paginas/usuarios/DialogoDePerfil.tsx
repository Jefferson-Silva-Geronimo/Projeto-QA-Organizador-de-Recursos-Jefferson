import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import estilos from '@/paginas/catalogo/DialogoDeCadastro.module.css';
import { PERFIS, ROTULO_DO_PERFIL } from '@/paginas/usuarios/rotulos';
import type { Usuario } from '@/usuarios/consulta';
import { useTrocarPerfil, type PerfilDoUsuario } from '@/usuarios/gestao';
import { Botao } from '@/ui/Botao';
import { Campo } from '@/ui/Campo';
import { Dialogo } from '@/ui/Dialogo';
import { ErroDaApi } from '@/ui/ErroDaApi';

interface Props {
  usuario: Usuario;
  aoFechar: () => void;
  aoTrocado: (texto: string) => void;
  retorno: RefObject<HTMLElement | null>;
  alternativa: RefObject<HTMLElement | null>;
}

/**
 * Troca do perfil de um usuário (T11, RF-15). Quando a troca deixaria menos de dois Responsáveis ativos, o servidor
 * recusa (`MINIMO_DE_RESPONSAVEIS`) e a tela mostra a mensagem da tabela de erros: ela não conta Responsáveis (ADR-004).
 */
export function DialogoDePerfil({ usuario, aoFechar, aoTrocado, retorno, alternativa }: Props) {
  const [perfil, setPerfil] = useState<PerfilDoUsuario>(usuario.perfil);
  const trocar = useTrocarPerfil(usuario.id);
  const alerta = useRef<HTMLDivElement>(null);

  // Depois de uma recusa o foco vai para a mensagem: o teclado e o leitor de tela vão até ela.
  useEffect(() => {
    if (trocar.isError) {
      alerta.current?.focus();
    }
  }, [trocar.isError, trocar.submittedAt]);

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (trocar.isPending) {
      return;
    }
    trocar.mutate(perfil, {
      onSuccess: () => aoTrocado(`Perfil de "${usuario.nome}" agora é ${ROTULO_DO_PERFIL[perfil]}.`),
    });
  };

  return (
    <Dialogo
      titulo="Trocar perfil"
      descricao={`Escolha o novo perfil de "${usuario.nome}". Cada usuário tem um único perfil.`}
      aoFechar={aoFechar}
      ocupado={trocar.isPending}
      retorno={retorno}
      alternativa={alternativa}
    >
      <form onSubmit={enviar} noValidate className={estilos.formulario}>
        {trocar.isError && <ErroDaApi erro={trocar.error} ref={alerta} />}
        <Campo rotulo="Perfil">
          {(c) => (
            <select {...c} value={perfil} onChange={(e) => setPerfil(e.target.value as PerfilDoUsuario)}>
              {PERFIS.map((p) => (
                <option key={p} value={p}>
                  {ROTULO_DO_PERFIL[p]}
                </option>
              ))}
            </select>
          )}
        </Campo>
        <div className={estilos.acoes}>
          <Botao type="submit" carregando={trocar.isPending} textoCarregando="Salvando…">
            Salvar perfil
          </Botao>
          <Botao variante="secundario" onClick={aoFechar} disabled={trocar.isPending}>
            Voltar
          </Botao>
        </div>
      </form>
    </Dialogo>
  );
}
