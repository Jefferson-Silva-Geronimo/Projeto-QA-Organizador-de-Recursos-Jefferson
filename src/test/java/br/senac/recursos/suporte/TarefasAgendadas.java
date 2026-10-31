package br.senac.recursos.suporte;

import java.util.ArrayList;
import java.util.List;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.config.ScheduledTask;
import org.springframework.scheduling.config.ScheduledTaskHolder;

/**
 * Lista as tarefas {@code @Scheduled} que o contexto realmente agendou, no formato {@code Classe#metodo}.
 * Sem {@code @EnableScheduling} não existe quem agende, e a lista fica vazia. O nome vem da representação
 * textual do {@code Runnable} da tarefa (classe declarante e método), que o Spring mantém mesmo quando embrulha
 * o {@code Runnable} para acompanhar o resultado.
 */
public final class TarefasAgendadas {

    private TarefasAgendadas() {
    }

    public static List<String> de(ApplicationContext contexto) {
        List<String> tarefas = new ArrayList<>();
        for (ScheduledTaskHolder titular : contexto.getBeansOfType(ScheduledTaskHolder.class).values()) {
            for (ScheduledTask tarefa : titular.getScheduledTasks()) {
                tarefas.add(simplificar(tarefa.getTask().getRunnable().toString()));
            }
        }
        return tarefas;
    }

    /** "br.senac.recursos.config.AgendadorDeTransicoes.cancelarSemDecisao" vira "AgendadorDeTransicoes#cancelarSemDecisao". */
    static String simplificar(String nomeCompleto) {
        String[] partes = nomeCompleto.split("\\.");
        if (partes.length < 2) {
            return nomeCompleto;
        }
        return partes[partes.length - 2] + "#" + partes[partes.length - 1];
    }
}
