import { useQuery } from '@tanstack/react-query';
import { executar } from '@/api/cliente';
import type { components } from '@/api/schema';
import { useSessao } from '@/autenticacao/useSessao';

export type Usuario = components['schemas']['UsuarioResposta'];

/** Usuários (só o Administrador consulta, ADR-004). O servidor decide quem pode; o front só mostra o que vem. */
export function useUsuarios(habilitado = true) {
  const { cliente } = useSessao();
  return useQuery({
    queryKey: ['usuarios'],
    enabled: habilitado,
    queryFn: () => executar(cliente.GET('/api/usuarios')),
  });
}
