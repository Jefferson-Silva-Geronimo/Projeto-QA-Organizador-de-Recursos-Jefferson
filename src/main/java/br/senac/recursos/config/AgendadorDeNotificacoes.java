package br.senac.recursos.config;

import br.senac.recursos.service.DespachoDeNotificacoesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * Agenda o despacho de notificações. Só liga com {@code app.jobs.notificacoes.habilitado=true} e exige a
 * frequência em {@code app.jobs.notificacoes.intervalo} (ISO-8601), sem valor padrão (lacuna D3).
 */
@Configuration
@ConditionalOnProperty(name = "app.jobs.notificacoes.habilitado", havingValue = "true")
class AgendadorDeNotificacoes {

    private static final Logger LOG = LoggerFactory.getLogger(AgendadorDeNotificacoes.class);

    private final DespachoDeNotificacoesService despacho;

    AgendadorDeNotificacoes(DespachoDeNotificacoesService despacho) {
        this.despacho = despacho;
    }

    @Scheduled(fixedDelayString = "${app.jobs.notificacoes.intervalo}")
    void despachar() {
        int enviadas = despacho.despachar();
        if (enviadas > 0) {
            LOG.info("Despacho enviou {} notificação(ões).", enviadas);
        }
    }
}
