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
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * O que o usuário pode fazer no uso da reserva, por estado, perfil, material pendente, tolerância e instante
 * (RN-05, RN-20, RN-21, RN-23, D1, D13). CT-150. A tabela vem das regras escritas, não da implementação do serviço.
 * A tolerância de 30 minutos existe só neste teste (D1 é lacuna): o limite é o início mais a tolerância, e no instante
 * exato o não comparecimento já é aceito. O servidor não limita o início do uso por horário.
 */
class PermissoesDeUsoTest {

    private static final Instant INICIO = Instant.parse("2026-10-20T17:00:00Z");     // 14:00 locais
    private static final Optional<Duration> TOLERANCIA = Optional.of(Duration.ofMinutes(30));
    private static final Optional<Duration> SEM_TOLERANCIA = Optional.empty();
    private static final Instant ANTES_DO_INICIO = INICIO.minusSeconds(3600);
    private static final Instant ANTES_DO_LIMITE = INICIO.plus(Duration.ofMinutes(30)).minusMillis(1);
    private static final Instant NO_LIMITE = INICIO.plus(Duration.ofMinutes(30));
    private static final Instant DEPOIS_DO_LIMITE = NO_LIMITE.plusMillis(1);
    private static final long DONO = 10L;

    private static Reserva reserva(EstadoReserva estado) {
        return new Reserva(1L, DONO, "Aula", null, INICIO, INICIO.plusSeconds(7200), estado, false, null, List.of(1L));
    }

    private static Arguments caso(EstadoReserva estado, Perfil perfil, boolean pendente, Optional<Duration> tolerancia,
                                  Instant agora, boolean iniciar, boolean concluir, boolean naoCompareceu) {
        return Arguments.of(estado, perfil, pendente, tolerancia, agora, iniciar, concluir, naoCompareceu);
    }

    static Stream<Arguments> tabela() {
        return Stream.of(
                // APROVADA, Responsável: inicia a qualquer hora; só marca não comparecimento a partir de início + tolerância
                caso(APROVADA, RESPONSAVEL, false, TOLERANCIA, ANTES_DO_INICIO, true, false, false),
                caso(APROVADA, RESPONSAVEL, false, TOLERANCIA, INICIO, true, false, false),
                caso(APROVADA, RESPONSAVEL, false, TOLERANCIA, ANTES_DO_LIMITE, true, false, false),
                caso(APROVADA, RESPONSAVEL, false, TOLERANCIA, NO_LIMITE, true, false, true),
                caso(APROVADA, RESPONSAVEL, false, TOLERANCIA, DEPOIS_DO_LIMITE, true, false, true),
                // tolerância não configurada (D1): não comparecimento nunca é oferecido; o início continua
                caso(APROVADA, RESPONSAVEL, false, SEM_TOLERANCIA, DEPOIS_DO_LIMITE.plusSeconds(86_400), true, false, false),
                // EM_USO: conclui sem material pendente (RN-23); nunca inicia nem marca não comparecimento
                caso(EM_USO, RESPONSAVEL, false, TOLERANCIA, ANTES_DO_LIMITE, false, true, false),
                caso(EM_USO, RESPONSAVEL, false, TOLERANCIA, DEPOIS_DO_LIMITE, false, true, false),
                caso(EM_USO, RESPONSAVEL, true, TOLERANCIA, DEPOIS_DO_LIMITE, false, false, false),
                caso(EM_USO, RESPONSAVEL, true, SEM_TOLERANCIA, INICIO, false, false, false),
                // material pendente só importa para quem está em uso; fora disso nada é oferecido
                caso(APROVADA, RESPONSAVEL, true, TOLERANCIA, DEPOIS_DO_LIMITE, true, false, true),
                // estados em que ninguém inicia, conclui nem marca não comparecimento
                caso(SOLICITADA, RESPONSAVEL, false, TOLERANCIA, DEPOIS_DO_LIMITE, false, false, false),
                caso(CONCLUIDA, RESPONSAVEL, false, TOLERANCIA, DEPOIS_DO_LIMITE, false, false, false),
                caso(CANCELADA, RESPONSAVEL, false, TOLERANCIA, DEPOIS_DO_LIMITE, false, false, false),
                caso(REJEITADA, RESPONSAVEL, false, TOLERANCIA, DEPOIS_DO_LIMITE, false, false, false),
                caso(NAO_COMPARECEU, RESPONSAVEL, false, TOLERANCIA, DEPOIS_DO_LIMITE, false, false, false),
                // só o Responsável registra o uso (RN-20): Solicitante e Administrador não recebem ação alguma
                caso(APROVADA, SOLICITANTE, false, TOLERANCIA, DEPOIS_DO_LIMITE, false, false, false),
                caso(EM_USO, SOLICITANTE, false, TOLERANCIA, DEPOIS_DO_LIMITE, false, false, false),
                caso(APROVADA, ADMINISTRADOR, false, TOLERANCIA, DEPOIS_DO_LIMITE, false, false, false),
                caso(EM_USO, ADMINISTRADOR, false, TOLERANCIA, DEPOIS_DO_LIMITE, false, false, false));
    }

    @ParameterizedTest(name = "{0}, {1}, pendente={2}, tolerância={3}, agora={4} -> inicia={5}, conclui={6}, não compareceu={7}")
    @MethodSource("tabela")
    void ct150_permissoesDeUsoPorEstadoPerfilPendenciaToleranciaEInstante(EstadoReserva estado, Perfil perfil,
            boolean pendente, Optional<Duration> tolerancia, Instant agora, boolean iniciar, boolean concluir,
            boolean naoCompareceu) {
        PermissoesDeUso permissoes = PermissoesDeUso.de(reserva(estado), perfil, pendente, tolerancia, agora);

        assertThat(permissoes.podeIniciar()).as("pode iniciar").isEqualTo(iniciar);
        assertThat(permissoes.podeConcluir()).as("pode concluir").isEqualTo(concluir);
        assertThat(permissoes.podeMarcarNaoComparecimento()).as("pode marcar não comparecimento").isEqualTo(naoCompareceu);
    }
}
