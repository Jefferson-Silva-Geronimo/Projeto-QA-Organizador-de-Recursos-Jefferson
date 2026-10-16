package br.senac.recursos.service;

import br.senac.recursos.model.EventoNotificacao;
import br.senac.recursos.repository.NotificacaoRepository;
import br.senac.recursos.repository.UsuarioRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Agenda notificações na caixa de saída (RN-28, C6). Chamado dentro da transação da mudança de estado:
 * se a transação falha, nenhuma notificação existe. O envio acontece depois, em outro componente.
 *
 * <p>Destinatários: os Responsáveis ativos para solicitação pendente, exceto o dono (ninguém aprova a
 * própria reserva, RN-16), e o Solicitante dono para aprovada, rejeitada e cancelada.
 */
@Service
public class NotificacaoService {

    private final NotificacaoRepository notificacoes;
    private final UsuarioRepository usuarios;
    private final Clock relogio;

    public NotificacaoService(NotificacaoRepository notificacoes, UsuarioRepository usuarios, Clock relogio) {
        this.notificacoes = notificacoes;
        this.usuarios = usuarios;
        this.relogio = relogio;
    }

    /** Avisa os Responsáveis, exceto o dono, que há uma solicitação a decidir. */
    public void solicitacaoPendente(long reservaId, long donoId) {
        Instant agora = relogio.instant();
        for (Long responsavel : usuarios.idsDeResponsaveisAtivos()) {
            if (responsavel != donoId) {
                agendar(reservaId, EventoNotificacao.SOLICITACAO_PENDENTE, responsavel, agora);
            }
        }
    }

    /** Avisa o dono da reserva de uma decisão ou de um cancelamento. */
    public void aoSolicitante(long reservaId, long donoId, EventoNotificacao evento) {
        agendar(reservaId, evento, donoId, relogio.instant());
    }

    private void agendar(long reservaId, EventoNotificacao evento, long destinatarioId, Instant agora) {
        // A chave é gerada uma vez e acompanha a notificação em todo reenvio (C6).
        notificacoes.inserir(reservaId, evento, destinatarioId, UUID.randomUUID().toString(), agora);
    }
}
