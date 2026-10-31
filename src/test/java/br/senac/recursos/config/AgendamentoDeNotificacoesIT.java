package br.senac.recursos.config;

import static org.assertj.core.api.Assertions.assertThat;

import br.senac.recursos.suporte.BancoRealIT;
import br.senac.recursos.suporte.TarefasAgendadas;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.TestPropertySource;

/**
 * BUG-028 (RF-11, RN-28): ligar só o despacho de notificações precisa agendar o despacho, sem depender do job de
 * SEM_DECISAO. O teste olha as tarefas que o contexto agendou, e não o método {@code despachar()} chamado direto.
 */
@TestPropertySource(properties = {
        "app.jobs.notificacoes.habilitado=true",
        "app.jobs.notificacoes.intervalo=PT1H"
})
class AgendamentoDeNotificacoesIT extends BancoRealIT {

    @Autowired
    private ApplicationContext contexto;

    @Test
    void ct168_soComOAgendadorDeNotificacoesLigadoODespachoFicaAgendado() {
        assertThat(TarefasAgendadas.de(contexto)).contains("AgendadorDeNotificacoes#despachar");
    }

    @Test
    void ct168_soComOAgendadorDeNotificacoesLigadoOJobDeSemDecisaoNaoExiste() {
        assertThat(contexto.containsBean("agendadorDeTransicoes")).isFalse();
        assertThat(TarefasAgendadas.de(contexto)).doesNotContain("AgendadorDeTransicoes#cancelarSemDecisao");
    }
}
