import { useMutation, useQueryClient } from '@tanstack/react-query';
import { executar } from '@/api/cliente';
import type { components } from '@/api/schema';
import { useSessao } from '@/autenticacao/useSessao';

export type NovaSala = components['schemas']['NovaSalaRequisicao'];
export type NovoProfessor = components['schemas']['NovoProfessorRequisicao'];
export type NovoMaterial = components['schemas']['NovoMaterialRequisicao'];

export type NovoRecurso =
  | { tipo: 'SALA'; corpo: NovaSala }
  | { tipo: 'PROFESSOR'; corpo: NovoProfessor }
  | { tipo: 'MATERIAL'; corpo: NovoMaterial };

/**
 * Cadastra sala, professor ou material (RF-02). Só o Administrador cadastra, e quem valida e recusa é o servidor
 * (ADR-004): o front envia os dados e mostra a resposta.
 */
export function useCadastrarRecurso() {
  const { cliente } = useSessao();
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: (novo: NovoRecurso) => {
      switch (novo.tipo) {
        case 'SALA':
          return executar(cliente.POST('/api/salas', { body: novo.corpo }));
        case 'PROFESSOR':
          return executar(cliente.POST('/api/professores', { body: novo.corpo }));
        case 'MATERIAL':
          return executar(cliente.POST('/api/materiais', { body: novo.corpo }));
      }
    },
    // Só termina depois de a lista ser refeita: quando o aviso aparece, o recurso novo já está na lista.
    onSuccess: () => consultas.invalidateQueries({ queryKey: ['recursos'] }),
  });
}

/** Marca ou desmarca "restrito". Não muda as reservas que já existem (RF-02, critério 4). */
export function useAlterarRestrito(id: number) {
  const { cliente } = useSessao();
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: (restrito: boolean) =>
      executar(cliente.PUT('/api/recursos/{id}/restrito', { params: { path: { id } }, body: { restrito } })),
    onSuccess: () => consultas.invalidateQueries({ queryKey: ['recursos'] }),
  });
}

/** Desativa o recurso. O servidor recusa com a lista de reservas futuras quando houver (RF-02). */
export function useDesativarRecurso(id: number) {
  const { cliente } = useSessao();
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: () => executar(cliente.POST('/api/recursos/{id}/desativacao', { params: { path: { id } } })),
    // O recurso some das buscas e a disponibilidade muda: as outras consultas também ficam velhas.
    onSuccess: () => consultas.invalidateQueries(),
  });
}
