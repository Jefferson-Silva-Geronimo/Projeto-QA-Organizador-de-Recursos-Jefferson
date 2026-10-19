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
 * O que o usuário pode fazer com a reserva, por estado, perfil, posse e instante (RN-18, RN-19, RN-07, RN-20, D10).
 * CT-144. A tabela vem das regras escritas, não da implementação das políticas.
 * O motivo conta como informado: quem precisa dele para cancelar (Responsável e Administrador) o informa.
 */
class PermissoesDaReservaTest {

    private static final Instant INICIO = Instant.parse("2026-10-20T17:00:00Z");     // 14:00 locais
    private static final Instant ANTES = INICIO.minusMillis(1);                       // 13:59:59,999
    private static final Instant NO_INICIO = INICIO;                                  // 14:00:00,000 (já começou, D10)
    private static final Instant DEPOIS = INICIO.plusMillis(1);
    private static final long DONO = 10L;
    private static final long OUTRA_PESSOA = 11L;

    private static Reserva reserva(EstadoReserva estado) {
        return new Reserva(1L, DONO, "Aula", null, INICIO, INICIO.plusSeconds(7200), estado, false, null, List.of(1L));
    }

    private static Arguments caso(EstadoReserva estado, Perfil perfil, boolean dono, Instant agora, boolean alterar, boolean cancelar) {
        return Arguments.of(estado, perfil, dono, agora, alterar, cancelar);
    }

    static Stream<Arguments> tabela() {
        return Stream.of(
                // dono Solicitante, SOLICITADA: altera até o início; cancela sem limite de horário (RN-18)
                caso(SOLICITADA, SOLICITANTE, true, ANTES, true, true),
                caso(SOLICITADA, SOLICITANTE, true, NO_INICIO, false, true),
                caso(SOLICITADA, SOLICITANTE, true, DEPOIS, false, true),
                // dono Solicitante, APROVADA: altera e cancela só antes do instante de início (D10)
                caso(APROVADA, SOLICITANTE, true, ANTES, true, true),
                caso(APROVADA, SOLICITANTE, true, NO_INICIO, false, false),
                caso(APROVADA, SOLICITANTE, true, DEPOIS, false, false),
                // dono Responsável, APROVADA: depois do início só cancela, com motivo (RN-18)
                caso(APROVADA, RESPONSAVEL, true, ANTES, true, true),
                caso(APROVADA, RESPONSAVEL, true, NO_INICIO, false, true),
                caso(APROVADA, RESPONSAVEL, true, DEPOIS, false, true),
                caso(SOLICITADA, RESPONSAVEL, true, ANTES, true, true),
                // outro Solicitante: nada, em nenhum estado
                caso(SOLICITADA, SOLICITANTE, false, ANTES, false, false),
                caso(APROVADA, SOLICITANTE, false, ANTES, false, false),
                // Responsável que não é o dono: só cancela APROVADA, com motivo, a qualquer hora (RN-18)
                caso(SOLICITADA, RESPONSAVEL, false, ANTES, false, false),
                caso(APROVADA, RESPONSAVEL, false, ANTES, false, true),
                caso(APROVADA, RESPONSAVEL, false, DEPOIS, false, true),
                // Administrador: cancela SOLICITADA e APROVADA, com motivo; nunca altera (RN-17, RN-19)
                caso(SOLICITADA, ADMINISTRADOR, false, ANTES, false, true),
                caso(APROVADA, ADMINISTRADOR, false, ANTES, false, true),
                caso(APROVADA, ADMINISTRADOR, false, DEPOIS, false, true),
                // EM_USO e estados terminais: ninguém altera nem cancela (RN-07, RN-18, RN-19, RN-20)
                caso(EM_USO, SOLICITANTE, true, ANTES, false, false),
                caso(EM_USO, RESPONSAVEL, false, DEPOIS, false, false),
                caso(EM_USO, ADMINISTRADOR, false, DEPOIS, false, false),
                caso(CONCLUIDA, SOLICITANTE, true, ANTES, false, false),
                caso(REJEITADA, SOLICITANTE, true, ANTES, false, false),
                caso(CANCELADA, RESPONSAVEL, true, ANTES, false, false),
                caso(CANCELADA, ADMINISTRADOR, false, ANTES, false, false),
                caso(NAO_COMPARECEU, SOLICITANTE, true, DEPOIS, false, false));
    }

    @ParameterizedTest(name = "{0}, {1}, dono={2}, agora={3} -> altera={4}, cancela={5}")
    @MethodSource("tabela")
    void ct144_permissoesPorEstadoPerfilPosseEInstante(EstadoReserva estado, Perfil perfil, boolean dono, Instant agora,
                                                       boolean alterar, boolean cancelar) {
        long ator = dono ? DONO : OUTRA_PESSOA;

        PermissoesDaReserva permissoes = PermissoesDaReserva.de(reserva(estado), perfil, ator, agora);

        assertThat(permissoes.podeAlterar()).as("pode alterar").isEqualTo(alterar);
        assertThat(permissoes.podeCancelar()).as("pode cancelar").isEqualTo(cancelar);
    }
}
