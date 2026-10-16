package br.senac.recursos.model.regra;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.exception.ErroDeNegocio;
import br.senac.recursos.model.EstadoReserva;
import static br.senac.recursos.model.EstadoReserva.APROVADA;
import static br.senac.recursos.model.EstadoReserva.CANCELADA;
import static br.senac.recursos.model.EstadoReserva.CONCLUIDA;
import static br.senac.recursos.model.EstadoReserva.EM_USO;
import static br.senac.recursos.model.EstadoReserva.NAO_COMPARECEU;
import static br.senac.recursos.model.EstadoReserva.REJEITADA;
import static br.senac.recursos.model.EstadoReserva.SOLICITADA;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * Tabela de transição de estados (RN-05). CT-075. Cobre as 49 combinações de origem e destino:
 * as permitidas da seção 3.1 de regras-negocio.md e todas as proibidas da seção 3.2.
 */
class MaquinaDeEstadosTest {

    /** Transições permitidas (seção 3.1). APROVADA para SOLICITADA é a alteração que exige reaprovação. */
    private static final Set<String> PERMITIDAS = Set.of(
            "SOLICITADA>APROVADA", "SOLICITADA>REJEITADA", "SOLICITADA>CANCELADA",
            "APROVADA>SOLICITADA", "APROVADA>EM_USO", "APROVADA>CANCELADA", "APROVADA>NAO_COMPARECEU",
            "EM_USO>CONCLUIDA");

    static Stream<Arguments> todasAsCombinacoes() {
        Stream.Builder<Arguments> b = Stream.builder();
        for (EstadoReserva origem : EstadoReserva.values()) {
            for (EstadoReserva destino : EstadoReserva.values()) {
                b.add(Arguments.of(origem, destino, PERMITIDAS.contains(origem + ">" + destino)));
            }
        }
        return b.build();
    }

    @ParameterizedTest(name = "{0} para {1} permitida={2}")
    @MethodSource("todasAsCombinacoes")
    void ct075_transicaoPermitidaSoQuandoPrevista(EstadoReserva origem, EstadoReserva destino, boolean permitida) {
        assertThat(MaquinaDeEstados.permitida(origem, destino)).isEqualTo(permitida);

        if (permitida) {
            assertThatCode(() -> MaquinaDeEstados.exigir(origem, destino)).doesNotThrowAnyException();
        } else {
            assertThatThrownBy(() -> MaquinaDeEstados.exigir(origem, destino))
                    .isInstanceOfSatisfying(ErroDeNegocio.class,
                            e -> assertThat(e.codigo()).isEqualTo(CodigoErro.TRANSICAO_PROIBIDA));
        }
    }

    @ParameterizedTest(name = "terminal {0} não tem destino")
    @MethodSource("terminais")
    void estadosTerminaisNaoTemDestino(EstadoReserva terminal) {
        assertThat(MaquinaDeEstados.destinosPermitidos(terminal)).isEmpty();
        assertThat(terminal.terminal()).isTrue();
    }

    static Stream<EstadoReserva> terminais() {
        return Stream.of(CONCLUIDA, REJEITADA, CANCELADA, NAO_COMPARECEU);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("naoTerminais")
    void estadosNaoTerminaisTemDestino(EstadoReserva origem) {
        assertThat(MaquinaDeEstados.destinosPermitidos(origem)).isNotEmpty();
    }

    static Stream<EstadoReserva> naoTerminais() {
        return Stream.of(SOLICITADA, APROVADA, EM_USO);
    }
}
