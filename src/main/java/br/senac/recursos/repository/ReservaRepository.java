package br.senac.recursos.repository;

import br.senac.recursos.model.EstadoReserva;
import br.senac.recursos.model.OcupacaoConflitante;
import br.senac.recursos.model.Periodo;
import br.senac.recursos.model.Reserva;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/** Porta de persistência de reservas e ocupações (ADR-002, ADR-003). Nenhuma reserva é apagada (RN-27). */
public interface ReservaRepository {

    long inserir(long solicitanteId, String titulo, String descricao, Periodo periodo, EstadoReserva estado,
                 boolean exigeAprovacao, Instant agora);

    /**
     * Insere a ocupação ativa. A constraint de exclusão é a garantia contra dupla reserva (ADR-003):
     * a violação sobe como {@code DataIntegrityViolationException} com SQLState 23P01.
     */
    void inserirOcupacao(long reservaId, long recursoId, Periodo periodo);

    Optional<Reserva> buscar(long id);

    /** Mesma busca, travando a linha da reserva até o fim da transação. */
    Optional<Reserva> buscarTravando(long id);

    List<Reserva> listar(Long solicitanteId);

    Optional<OcupacaoConflitante> buscarConflito(long recursoId, Periodo periodo, Long ignorarReservaId);

    void atualizar(long id, String titulo, String descricao, Periodo periodo, EstadoReserva estado,
                   boolean exigeAprovacao, String motivo, Instant agora);

    /** Fila de aprovações: reservas SOLICITADA que exigem aprovação (RF-07). */
    List<Reserva> listarFila();

    /** Registra a decisão humana de aprovar ou rejeitar (tabela aprovacoes). */
    void registrarDecisao(long reservaId, long responsavelId, boolean aprovada, String motivo, Instant agora);

    /**
     * Reservas SOLICITADA, APROVADA ou EM_USO com ocupação ativa do recurso que toca o período,
     * travadas até o fim da transação e ordenadas por identificador.
     */
    List<Reserva> reservasAtivasQueTocam(long recursoId, Periodo periodo);

    /** Cancela pelo SISTEMA com motivo MANUTENCAO ou SEM_DECISAO, só se ainda estiver no estado esperado. */
    boolean cancelarPeloSistema(long id, EstadoReserva esperado, String motivoSistema, Instant agora);

    /** Reservas SOLICITADA que exigem aprovação e cujo início chegou, sem decisão, ordenadas por id. */
    List<Long> idsSemDecisao(Instant agora);

    /** Trava consultiva de transação: impede duas execuções simultâneas do job. Falso se já travada. */
    boolean tentarTravarJob(long chave);

    /** Remove as ocupações da reserva para recriá-las na mesma transação (alteração atômica, RN-19). */
    void removerOcupacoes(long reservaId);

    /** Libera o período mantendo o registro da ocupação (cancelamento, RN-27). */
    void inativarOcupacoes(long reservaId);
}
