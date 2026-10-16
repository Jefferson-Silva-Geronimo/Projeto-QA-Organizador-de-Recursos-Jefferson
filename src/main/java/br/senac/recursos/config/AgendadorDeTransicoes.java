package br.senac.recursos.config;

import br.senac.recursos.service.TransicoesAutomaticasService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * Agenda o job de SEM_DECISAO (D2). Só liga com {@code app.jobs.sem-decisao.habilitado=true} e exige a
 * frequência em {@code app.jobs.sem-decisao.intervalo} (ISO-8601). A frequência não tem valor padrão:
 * é configuração, sem origem na especificação.
 */
@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "app.jobs.sem-decisao.habilitado", havingValue = "true")
class AgendadorDeTransicoes {

    private static final Logger LOG = LoggerFactory.getLogger(AgendadorDeTransicoes.class);

    private final TransicoesAutomaticasService transicoes;

    AgendadorDeTransicoes(TransicoesAutomaticasService transicoes) {
        this.transicoes = transicoes;
    }

    @Scheduled(fixedDelayString = "${app.jobs.sem-decisao.intervalo}")
    void cancelarSemDecisao() {
        int cancelados = transicoes.cancelarSemDecisao();
        if (cancelados > 0) {
            LOG.info("Job de SEM_DECISAO cancelou {} reserva(s).", cancelados);
        }
    }
}
