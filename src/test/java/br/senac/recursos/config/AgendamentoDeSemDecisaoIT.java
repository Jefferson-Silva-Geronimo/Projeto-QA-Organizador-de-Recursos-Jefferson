package br.senac.recursos.config;

import static org.assertj.core.api.Assertions.assertThat;

import br.senac.recursos.suporte.BancoRealIT;
import br.senac.recursos.suporte.TarefasAgendadas;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.TestPropertySource;

/**
 * BUG-028 (RN-25, D2): ligar só o job de SEM_DECISAO agenda só esse job; o despacho de notificações continua
 * desligado. Guarda da outra direção da correção do agendamento.
 */
@TestPropertySource(properties = {
        "app.jobs.sem-decisao.habilitado=true",
        "app.jobs.sem-decisao.intervalo=PT1H"
})
class AgendamentoDeSemDecisaoIT extends BancoRealIT {

    @Autowired
    private ApplicationContext contexto;

    @Test
    void ct167_soComOJobDeSemDecisaoLigadoEleFicaAgendado() {
        assertThat(TarefasAgendadas.de(contexto)).contains("AgendadorDeTransicoes#cancelarSemDecisao");
    }

    @Test
    void ct167_soComOJobDeSemDecisaoLigadoOdespachoDeNotificacoesNaoExiste() {
        assertThat(contexto.containsBean("agendadorDeNotificacoes")).isFalse();
        assertThat(TarefasAgendadas.de(contexto)).doesNotContain("AgendadorDeNotificacoes#despachar");
    }
}
