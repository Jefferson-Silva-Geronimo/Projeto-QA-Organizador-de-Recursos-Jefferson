package br.senac.recursos.config;

import static org.assertj.core.api.Assertions.assertThat;

import br.senac.recursos.suporte.BancoRealIT;
import br.senac.recursos.suporte.TarefasAgendadas;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;

/**
 * BUG-028: sem nenhuma propriedade {@code app.jobs.*} (o padrão do {@code application.yml}) os dois agendadores
 * não existem e nada é agendado. A correção do agendamento não pode ligar nada por padrão.
 */
class AgendamentoDesligadoIT extends BancoRealIT {

    @Autowired
    private ApplicationContext contexto;

    @Test
    void ct170_semPropriedadesNenhumAgendadorExisteENadaEhAgendado() {
        assertThat(contexto.containsBean("agendadorDeNotificacoes")).isFalse();
        assertThat(contexto.containsBean("agendadorDeTransicoes")).isFalse();
        assertThat(TarefasAgendadas.de(contexto)).isEmpty();
    }
}
