package br.senac.recursos.service;

import br.senac.recursos.model.Notificacao;
import br.senac.recursos.model.StatusNotificacao;
import br.senac.recursos.repository.ConfiguracaoRepository;
import br.senac.recursos.repository.NotificacaoRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Envia as notificações pendentes depois do commit (RN-28, ADR-007). A falha do provedor nunca desfaz
 * a reserva: ela só altera o status da notificação.
 *
 * <p>Reenvio com intervalo crescente (C6). O número de tentativas e o intervalo inicial são
 * configuração e não têm valor padrão (lacuna D3): sem eles, a notificação fica PENDENTE e não é
 * reenviada automaticamente.
 */
@Service
public class DespachoDeNotificacoesService {

    /** Quantidade de notificações por execução. Limite de implementação, sem origem em requisito. */
    static final int LOTE = 50;

    private final NotificacaoRepository notificacoes;
    private final ConfiguracaoRepository configuracao;
    private final NotificadorExterno provedor;
    private final TransactionTemplate transacao;
    private final Clock relogio;

    public DespachoDeNotificacoesService(NotificacaoRepository notificacoes, ConfiguracaoRepository configuracao,
                                         NotificadorExterno provedor, TransactionTemplate transacao,
                                         Clock relogio) {
        this.notificacoes = notificacoes;
        this.configuracao = configuracao;
        this.provedor = provedor;
        this.transacao = transacao;
        this.relogio = relogio;
    }

    /** Envia as notificações prontas. Devolve quantas o provedor aceitou. */
    public int despachar() {
        if (!provedor.disponivel()) {
            return 0;                                   // provedor não configurado: nada é consumido
        }
        Integer enviadas = transacao.execute(status -> {
            Instant agora = relogio.instant();
            Optional<Integer> maximo = configuracao.tentativasReenvio();
            Optional<Duration> intervalo = configuracao.intervaloReenvioInicial();
            List<Notificacao> prontas = notificacoes.buscarParaEnvio(agora, LOTE);
            int aceitas = 0;
            for (Notificacao n : prontas) {
                int tentativas = n.tentativas() + 1;
                switch (provedor.enviar(n, agora)) {
                    case ENVIADA -> {
                        notificacoes.atualizar(n.id(), StatusNotificacao.ENVIADA, tentativas, null, agora);
                        aceitas++;
                    }
                    case RECUSADA -> notificacoes.atualizar(n.id(), StatusNotificacao.FALHA, tentativas, null, null);
                    case FALHA_TEMPORARIA -> {
                        if (maximo.isPresent() && tentativas >= maximo.get()) {
                            notificacoes.atualizar(n.id(), StatusNotificacao.FALHA, tentativas, null, null);
                        } else {
                            Instant proxima = intervalo.map(i -> agora.plus(i.multipliedBy(1L << (tentativas - 1))))
                                    .orElse(null);
                            notificacoes.atualizar(n.id(), StatusNotificacao.PENDENTE, tentativas, proxima, null);
                        }
                    }
                }
            }
            return aceitas;
        });
        return enviadas == null ? 0 : enviadas;
    }
}
