package br.senac.recursos.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Habilita o processamento de {@code @Scheduled}, de forma incondicional e independente dos agendadores. Cada
 * agendador (notificações e SEM_DECISAO) liga pela sua própria propriedade {@code app.jobs.*}, que vem desligada
 * por padrão; sem agendador ligado, nada é agendado.
 */
@Configuration
@EnableScheduling
class AgendamentoConfig {
}
