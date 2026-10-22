package br.senac.recursos.model.regra;

import static br.senac.recursos.model.EstadoReserva.APROVADA;
import static br.senac.recursos.model.EstadoReserva.CANCELADA;
import static br.senac.recursos.model.EstadoReserva.CONCLUIDA;
import static br.senac.recursos.model.EstadoReserva.EM_USO;
import static br.senac.recursos.model.EstadoReserva.NAO_COMPARECEU;
import static br.senac.recursos.model.EstadoReserva.REJEITADA;
import static br.senac.recursos.model.EstadoReserva.SOLICITADA;
import static br.senac.recursos.model.Perfil.ADMINISTRADOR;
import static br.senac.recursos.model.Perfil.RESPONSAVEL;
import static br.senac.recursos.model.Perfil.SOLICITANTE;
import static org.assertj.core.api.Assertions.assertThat;

import br.senac.recursos.model.EstadoReserva;
import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.Reserva;
import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * O que o usuário pode decidir na fila, por estado, perfil, posse e instante (RF-07, RN-06, RN-16, RN-24, RN-33, D2,
 * D10). CT-146. A tabela vem das regras escritas, não da implementação do serviço. Aprovar exige a reserva
 * Solicitada e o instante anterior ao início; rejeitar exige só a reserva Solicitada (o serviço não limita por horário).
 * O motivo da rejeição conta como informado: o servidor segue exigindo-o.
 */
class PermissoesDeDecisaoTest {

    private static final Instant INICIO = Instant.parse("2026-10-20T17:00:00Z");     // 14:00 locais
    private static final Instant ANTES = INICIO.minusMillis(1);                       // 13:59:59,999
    private static final Instant NO_INICIO = INICIO;                                  // 14:00:00,000 (já começou, D10)
    private static final Instant DEPOIS = INICIO.plusMillis(1);
    private static final long DONO = 10L;
    private static final long OUTRA_PESSOA = 11L;

    private static Reserva reserva(EstadoReserva estado) {
        return new Reserva(1L, DONO, "Aula", null, INICIO, INICIO.plusSeconds(7200), estado, true, null, List.of(1L));
    }

    private static Arguments caso(EstadoReserva estado, Perfil perfil, boolean dono, Instant agora, boolean aprovar, boolean rejeitar) {
        return Arguments.of(estado, perfil, dono, agora, aprovar, rejeitar);
    }

    static Stream<Arguments> tabela() {
        return Stream.of(
                // Responsável que não é o dono, SOLICITADA: aprova até o início (D10); rejeita sem limite de horário
                caso(SOLICITADA, RESPONSAVEL, false, ANTES, true, true),
                caso(SOLICITADA, RESPONSAVEL, false, NO_INICIO, false, true),
                caso(SOLICITADA, RESPONSAVEL, false, DEPOIS, false, true),
                // Responsável dono: não decide a própria reserva (RN-16, RN-33), em nenhum instante
                caso(SOLICITADA, RESPONSAVEL, true, ANTES, false, false),
                caso(SOLICITADA, RESPONSAVEL, true, NO_INICIO, false, false),
                caso(SOLICITADA, RESPONSAVEL, true, DEPOIS, false, false),
                // Solicitante e Administrador não decidem (RN-06), sejam donos ou não
                caso(SOLICITADA, SOLICITANTE, false, ANTES, false, false),
                caso(SOLICITADA, SOLICITANTE, true, ANTES, false, false),
                caso(SOLICITADA, ADMINISTRADOR, false, ANTES, false, false),
                caso(SOLICITADA, ADMINISTRADOR, false, DEPOIS, false, false),
                // Fora de SOLICITADA ninguém decide: a transição não existe (RN-05)
                caso(APROVADA, RESPONSAVEL, false, ANTES, false, false),
                caso(APROVADA, RESPONSAVEL, false, DEPOIS, false, false),
                caso(EM_USO, RESPONSAVEL, false, DEPOIS, false, false),
                caso(CONCLUIDA, RESPONSAVEL, false, DEPOIS, false, false),
                caso(REJEITADA, RESPONSAVEL, false, ANTES, false, false),
                caso(CANCELADA, RESPONSAVEL, false, ANTES, false, false),
                caso(NAO_COMPARECEU, RESPONSAVEL, false, DEPOIS, false, false));
    }

    @ParameterizedTest(name = "{0}, {1}, dono={2}, agora={3} -> aprova={4}, rejeita={5}")
    @MethodSource("tabela")
    void ct146_permissoesDeDecisaoPorEstadoPerfilPosseEInstante(EstadoReserva estado, Perfil perfil, boolean dono,
                                                                Instant agora, boolean aprovar, boolean rejeitar) {
        long ator = dono ? DONO : OUTRA_PESSOA;

        PermissoesDeDecisao permissoes = PermissoesDeDecisao.de(reserva(estado), perfil, ator, agora);

        assertThat(permissoes.podeAprovar()).as("pode aprovar").isEqualTo(aprovar);
        assertThat(permissoes.podeRejeitar()).as("pode rejeitar").isEqualTo(rejeitar);
    }
}
