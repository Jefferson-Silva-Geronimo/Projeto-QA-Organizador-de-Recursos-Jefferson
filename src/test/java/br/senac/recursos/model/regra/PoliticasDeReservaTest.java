package br.senac.recursos.model.regra;

import static br.senac.recursos.exception.CodigoErro.ACESSO_NEGADO;
import static br.senac.recursos.exception.CodigoErro.MOTIVO_OBRIGATORIO;
import static br.senac.recursos.exception.CodigoErro.RESERVA_JA_INICIADA;
import static br.senac.recursos.exception.CodigoErro.TRANSICAO_PROIBIDA;
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
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.exception.ErroDeNegocio;
import br.senac.recursos.model.EstadoReserva;
import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.Periodo;
import java.time.Instant;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/** Políticas puras de criação, alteração e cancelamento (RN-18, RN-19, D10, D16). CT-039, CT-051 a CT-053. */
class PoliticasDeReservaTest {

    private static final Instant INICIO = Instant.parse("2026-10-20T17:00:00Z");     // 14:00 locais
    private static final Instant ANTES = INICIO.minusSeconds(3600);                    // 13:00 locais

    private static Periodo periodoComInicio(Instant inicio) {
        return new Periodo(inicio, inicio.plusSeconds(7200));
    }

    // ---- D16: início no passado, em trinca

    @ParameterizedTest(name = "início {0}, agora 14:00:00 -> recusado={1}")
    @MethodSource("iniciosEmTrinca")
    void ct039_inicioNoPassadoOuNoInstanteAtualEhRecusado(Instant inicio, boolean recusado) {
        Instant agora = Instant.parse("2026-10-20T17:00:00Z");

        if (recusado) {
            assertThatThrownBy(() -> RegrasDeReserva.exigirInicioFuturo(periodoComInicio(inicio), agora))
                    .isInstanceOfSatisfying(ErroDeNegocio.class,
                            e -> assertThat(e.codigo()).isEqualTo(CodigoErro.INICIO_NO_PASSADO));
        } else {
            assertThatCode(() -> RegrasDeReserva.exigirInicioFuturo(periodoComInicio(inicio), agora))
                    .doesNotThrowAnyException();
        }
    }

    static Stream<Arguments> iniciosEmTrinca() {
        Instant agora = Instant.parse("2026-10-20T17:00:00Z");
        return Stream.of(
                Arguments.of(agora.minusMillis(1), true),
                Arguments.of(agora, true),
                Arguments.of(agora.plusMillis(1), false));
    }

    // ---- D10: "até o início" é antes do instante de início

    @ParameterizedTest(name = "agora = início {0} ms -> permitido={1}")
    @MethodSource("instantesAoRedorDoInicio")
    void ct051_alteracaoPeloDonoSoAteOInicio(long deslocamentoMs, boolean permitido) {
        Instant agora = INICIO.plusMillis(deslocamentoMs);

        Optional<CodigoErro> recusa = PoliticaDeAlteracao.avaliar(APROVADA, true, agora, INICIO);

        assertThat(recusa.isEmpty()).isEqualTo(permitido);
        recusa.ifPresent(c -> assertThat(c).isEqualTo(RESERVA_JA_INICIADA));
    }

    @ParameterizedTest(name = "agora = início {0} ms -> permitido={1}")
    @MethodSource("instantesAoRedorDoInicio")
    void ct053_cancelamentoPeloDonoSoAteOInicio(long deslocamentoMs, boolean permitido) {
        Instant agora = INICIO.plusMillis(deslocamentoMs);

        Optional<CodigoErro> recusa = PoliticaDeCancelamento.avaliar(APROVADA, SOLICITANTE, true, agora, INICIO, false);

        assertThat(recusa.isEmpty()).isEqualTo(permitido);
        recusa.ifPresent(c -> assertThat(c).isEqualTo(RESERVA_JA_INICIADA));
    }

    static Stream<Arguments> instantesAoRedorDoInicio() {
        return Stream.of(Arguments.of(-1L, true), Arguments.of(0L, false), Arguments.of(1L, false));
    }

    @Test
    void ct051_alteracaoSoNosEstadosSolicitadaEAprovadaEPeloDono() {
        assertThat(PoliticaDeAlteracao.avaliar(SOLICITADA, true, ANTES, INICIO)).isEmpty();
        assertThat(PoliticaDeAlteracao.avaliar(APROVADA, true, ANTES, INICIO)).isEmpty();
        assertThat(PoliticaDeAlteracao.avaliar(APROVADA, false, ANTES, INICIO)).contains(ACESSO_NEGADO);
        for (EstadoReserva estado : new EstadoReserva[] {EM_USO, CONCLUIDA, REJEITADA, CANCELADA, NAO_COMPARECEU}) {
            assertThat(PoliticaDeAlteracao.avaliar(estado, true, ANTES, INICIO))
                    .as("alteração em %s", estado).contains(TRANSICAO_PROIBIDA);
        }
    }

    // ---- RN-18: matriz de cancelamento por estado e perfil

    @ParameterizedTest(name = "{0} por {1} dono={2} motivo={3} -> {4}")
    @MethodSource("matrizDeCancelamento")
    void ct052_cancelamentoPorEstadoEPerfil(EstadoReserva estado, Perfil ator, boolean dono, boolean motivo,
                                            CodigoErro esperado) {
        Optional<CodigoErro> recusa = PoliticaDeCancelamento.avaliar(estado, ator, dono, ANTES, INICIO, motivo);

        assertThat(recusa).isEqualTo(Optional.ofNullable(esperado));
    }

    static Stream<Arguments> matrizDeCancelamento() {
        return Stream.of(
                // SOLICITADA: dono cancela sem motivo; Administrador exige motivo; outros não cancelam
                Arguments.of(SOLICITADA, SOLICITANTE, true, false, null),
                Arguments.of(SOLICITADA, RESPONSAVEL, true, false, null),
                Arguments.of(SOLICITADA, ADMINISTRADOR, false, false, MOTIVO_OBRIGATORIO),
                Arguments.of(SOLICITADA, ADMINISTRADOR, false, true, null),
                Arguments.of(SOLICITADA, RESPONSAVEL, false, true, ACESSO_NEGADO),
                Arguments.of(SOLICITADA, SOLICITANTE, false, true, ACESSO_NEGADO),
                // APROVADA: dono até o início; Responsável e Administrador com motivo
                Arguments.of(APROVADA, SOLICITANTE, true, false, null),
                Arguments.of(APROVADA, SOLICITANTE, false, true, ACESSO_NEGADO),
                Arguments.of(APROVADA, RESPONSAVEL, false, false, MOTIVO_OBRIGATORIO),
                Arguments.of(APROVADA, RESPONSAVEL, false, true, null),
                Arguments.of(APROVADA, ADMINISTRADOR, false, false, MOTIVO_OBRIGATORIO),
                Arguments.of(APROVADA, ADMINISTRADOR, false, true, null),
                // EM_USO e terminais: ninguém cancela
                Arguments.of(EM_USO, SOLICITANTE, true, true, TRANSICAO_PROIBIDA),
                Arguments.of(EM_USO, RESPONSAVEL, false, true, TRANSICAO_PROIBIDA),
                Arguments.of(EM_USO, ADMINISTRADOR, false, true, TRANSICAO_PROIBIDA),
                Arguments.of(CONCLUIDA, ADMINISTRADOR, false, true, TRANSICAO_PROIBIDA),
                Arguments.of(REJEITADA, SOLICITANTE, true, true, TRANSICAO_PROIBIDA),
                Arguments.of(CANCELADA, SOLICITANTE, true, true, TRANSICAO_PROIBIDA),
                Arguments.of(NAO_COMPARECEU, RESPONSAVEL, false, true, TRANSICAO_PROIBIDA));
    }
}
