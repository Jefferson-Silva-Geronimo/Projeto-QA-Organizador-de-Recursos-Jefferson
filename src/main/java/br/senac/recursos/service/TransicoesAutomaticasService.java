package br.senac.recursos.service;

import br.senac.recursos.model.EstadoReserva;
import br.senac.recursos.model.EventoAuditoria;
import br.senac.recursos.repository.AuditoriaRepository;
import br.senac.recursos.repository.ReservaRepository;
import java.time.Clock;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Transições dirigidas pelo tempo, com ator SISTEMA (RN-25, D2). Só existe o cancelamento por
 * SEM_DECISAO: a marcação de não compareceu continua manual (RN-21).
 *
 * <p>A execução é idempotente (atualização condicional ao estado SOLICITADA) e protegida por trava
 * consultiva do banco, para que duas instâncias não executem ao mesmo tempo.
 */
@Service
public class TransicoesAutomaticasService {

    /** Chave arbitrária e fixa da trava consultiva do job de SEM_DECISAO. */
    static final long CHAVE_DA_TRAVA = 7_204_025_001L;

    private final ReservaRepository reservas;
    private final AuditoriaRepository auditoria;
    private final TransactionTemplate transacao;
    private final Clock relogio;

    public TransicoesAutomaticasService(ReservaRepository reservas, AuditoriaRepository auditoria,
                                        TransactionTemplate transacao, Clock relogio) {
        this.reservas = reservas;
        this.auditoria = auditoria;
        this.transacao = transacao;
        this.relogio = relogio;
    }

    /** Cancela as reservas SOLICITADA cujo início chegou sem decisão. Devolve quantas cancelou. */
    public int cancelarSemDecisao() {
        Integer cancelados = transacao.execute(status -> {
            if (!reservas.tentarTravarJob(CHAVE_DA_TRAVA)) {
                return 0;                                  // outra execução está em andamento
            }
            Instant agora = relogio.instant();
            int total = 0;
            for (Long id : reservas.idsSemDecisao(agora)) {
                if (reservas.cancelarPeloSistema(id, EstadoReserva.SOLICITADA, "SEM_DECISAO", agora)) {
                    reservas.inativarOcupacoes(id);
                    auditoria.registrar(EventoAuditoria.transicaoDoSistema(agora, id, "RESERVA_CANCELADA",
                            EstadoReserva.SOLICITADA.name(), EstadoReserva.CANCELADA.name(), "SEM_DECISAO"));
                    total++;
                }
            }
            return total;
        });
        return cancelados == null ? 0 : cancelados;
    }
}
