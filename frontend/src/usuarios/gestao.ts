import { useMutation, useQueryClient } from '@tanstack/react-query';
import { executar } from '@/api/cliente';
import type { components } from '@/api/schema';
import { useSessao } from '@/autenticacao/useSessao';

export type NovoUsuario = components['schemas']['NovoUsuarioRequisicao'];
export type PerfilDoUsuario = components['schemas']['NovoPerfilRequisicao']['perfil'];

/**
 * Cadastra um usuário com um único perfil (RF-15). Só o Administrador cadastra, e quem valida e recusa é o servidor
 * (ADR-004). A senha segue só no pedido: a tela não a guarda depois de enviar.
 */
export function useCadastrarUsuario() {
  const { cliente } = useSessao();
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: (novo: NovoUsuario) => executar(cliente.POST('/api/usuarios', { body: novo })),
    // Só termina depois de a lista ser refeita: quando o aviso aparece, o usuário novo já está na lista.
    onSuccess: () => consultas.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

/** Troca o perfil do usuário. O servidor recusa quando a troca deixaria menos de dois Responsáveis ativos. */
export function useTrocarPerfil(id: number) {
  const { cliente } = useSessao();
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: (perfil: PerfilDoUsuario) =>
      executar(cliente.PUT('/api/usuarios/{id}/perfil', { params: { path: { id } }, body: { perfil } })),
    onSuccess: () => consultas.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

/** Desativa o usuário e revoga as sessões dele. O servidor recusa com a lista de reservas futuras quando houver. */
export function useDesativarUsuario(id: number) {
  const { cliente } = useSessao();
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: () => executar(cliente.POST('/api/usuarios/{id}/desativacao', { params: { path: { id } } })),
    // O vínculo do professor e as reservas dele também mudam: as outras consultas ficam velhas.
    onSuccess: () => consultas.invalidateQueries(),
  });
}
