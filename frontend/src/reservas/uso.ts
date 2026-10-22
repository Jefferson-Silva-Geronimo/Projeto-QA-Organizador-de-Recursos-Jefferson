import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ErroDeApi, executar } from '@/api/cliente';
import { useSessao } from '@/autenticacao/useSessao';

/** Um registro de uso da reserva (RF-09, RF-16). Retirar e devolver levam o material; os outros não levam nada. */
export type RegistroDeUso =
  | { acao: 'inicio' | 'conclusao' | 'nao-comparecimento' }
  | { acao: 'retiradas' | 'devolucoes'; materialId: number };

/**
 * Recusas que indicam que a tela já não está como o servidor tem (estado, tolerância, material): as consultas de
 * reservas e de movimentações são refeitas, e os campos "pode..." chegam atualizados.
 */
const CODIGOS_QUE_MUDAM_A_TELA: ReadonlySet<string> = new Set([
  'TRANSICAO_PROIBIDA',
  'NAO_ENCONTRADO',
  'TOLERANCIA_NAO_ENCERRADA',
  'TOLERANCIA_NAO_CONFIGURADA',
  'MATERIAL_PENDENTE',
  'MATERIAL_JA_RETIRADO',
  'DEVOLUCAO_SEM_RETIRADA',
]);

/**
 * Registra o uso da reserva. Quem pode, em que momento e com que material é decisão do servidor (RN-20, RN-21, RN-23,
 * D1): o front envia o pedido e mostra a resposta.
 */
export function useRegistrarUso(id: number) {
  const { cliente } = useSessao();
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: (registro: RegistroDeUso) => {
      const params = { params: { path: { id } } };
      switch (registro.acao) {
        case 'inicio':
          return executar(cliente.POST('/api/reservas/{id}/inicio', params));
        case 'conclusao':
          return executar(cliente.POST('/api/reservas/{id}/conclusao', params));
        case 'nao-comparecimento':
          return executar(cliente.POST('/api/reservas/{id}/nao-comparecimento', params));
        case 'retiradas':
          return executar(cliente.POST('/api/reservas/{id}/retiradas', { ...params, body: { materialId: registro.materialId } }));
        case 'devolucoes':
          return executar(cliente.POST('/api/reservas/{id}/devolucoes', { ...params, body: { materialId: registro.materialId } }));
      }
    },
    // Só termina depois de as consultas serem refeitas: quando o aviso aparece, a tela já mostra o que o servidor tem.
    onSuccess: () => consultas.invalidateQueries(),
    onError: (erro) => {
      if (erro instanceof ErroDeApi && CODIGOS_QUE_MUDAM_A_TELA.has(erro.problema.code)) {
        void consultas.invalidateQueries({ queryKey: ['reservas'] });
      }
    },
  });
}
