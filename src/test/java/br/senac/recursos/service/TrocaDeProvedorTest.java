package br.senac.recursos.service;

import static org.assertj.core.api.Assertions.assertThat;

import br.senac.recursos.model.EventoNotificacao;
import br.senac.recursos.model.Notificacao;
import br.senac.recursos.model.StatusNotificacao;
import br.senac.recursos.repository.ConfiguracaoRepository;
import br.senac.recursos.repository.NotificacaoRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Troca do provedor de notificação (CT-106, CEN-08): o serviço de despacho depende só da interface
 * {@link NotificadorExterno}. Substituir o adaptador não exige mudar o serviço nem o contrato.
 */
class TrocaDeProvedorTest {

    private static final Instant AGORA = Instant.parse("2026-10-20T17:00:00Z");

    /** Segundo adaptador, diferente do webhook: registra a chave de idempotência em memória e aceita tudo. */
    private static final class AdaptadorEmMemoria implements NotificadorExterno {
        final List<String> chavesRecebidas = new ArrayList<>();

        @Override
        public boolean disponivel() {
            return true;
        }

        @Override
        public Resultado enviar(Notificacao notificacao, Instant instante) {
            chavesRecebidas.add(notificacao.chaveIdempotencia());
            return Resultado.ENVIADA;
        }
    }

    private static final class CaixaDeSaidaEmMemoria implements NotificacaoRepository {
        final List<Notificacao> guardadas = new ArrayList<>();

        @Override
        public void inserir(long reservaId, EventoNotificacao evento, long destinatarioId, String chave, Instant agora) {
            throw new UnsupportedOperationException("o despacho não insere notificações");
        }

        @Override
        public List<Notificacao> buscarParaEnvio(Instant agora, int limite) {
            return guardadas.stream().filter(n -> n.status() == StatusNotificacao.PENDENTE).toList();
        }

        @Override
        public void atualizar(long id, StatusNotificacao status, int tentativas, Instant proxima, Instant enviadaEm) {
            for (int i = 0; i < guardadas.size(); i++) {
                Notificacao n = guardadas.get(i);
                if (n.id() == id) {
                    guardadas.set(i, new Notificacao(n.id(), n.reservaId(), n.evento(), n.destinatarioId(), status,
                            tentativas, n.chaveIdempotencia(), proxima));
                }
            }
        }
    }

    /** Reenvio sem configuração: as lacunas D3 ficam vazias, como no esquema. */
    private static final class ConfiguracaoSemReenvio implements ConfiguracaoRepository {
        @Override
        public ZoneId fuso() {
            return ZoneId.of("America/Sao_Paulo");
        }

        @Override
        public Optional<Duration> toleranciaNaoComparecimento() {
            return Optional.empty();
        }

        @Override
        public Optional<Integer> tentativasReenvio() {
            return Optional.empty();
        }

        @Override
        public Optional<Duration> intervaloReenvioInicial() {
            return Optional.empty();
        }
    }

    /** Sem banco: a transação do teste só executa o bloco. */
    private static final class SemTransacao implements PlatformTransactionManager {
        @Override
        public TransactionStatus getTransaction(TransactionDefinition definicao) {
            return new SimpleTransactionStatus();
        }

        @Override
        public void commit(TransactionStatus status) {
        }

        @Override
        public void rollback(TransactionStatus status) {
        }
    }

    private static Notificacao pendente(long id) {
        return new Notificacao(id, 42L, EventoNotificacao.RESERVA_APROVADA, 7L, StatusNotificacao.PENDENTE, 0,
                "chave-" + id, null);
    }

    private static DespachoDeNotificacoesService servicoCom(NotificadorExterno adaptador, CaixaDeSaidaEmMemoria caixa) {
        return new DespachoDeNotificacoesService(caixa, new ConfiguracaoSemReenvio(), adaptador,
                new TransactionTemplate(new SemTransacao()), Clock.fixed(AGORA, ZoneOffset.UTC));
    }

    @Test
    void adaptadorAlternativoQueAceitaMarcaANotificacaoComoEnviada() {
        CaixaDeSaidaEmMemoria caixa = new CaixaDeSaidaEmMemoria();
        caixa.guardadas.add(pendente(1L));
        AdaptadorEmMemoria alternativo = new AdaptadorEmMemoria();

        int aceitas = servicoCom(alternativo, caixa).despachar();

        assertThat(aceitas).isEqualTo(1);
        assertThat(caixa.guardadas).singleElement().satisfies(n -> {
            assertThat(n.status()).isEqualTo(StatusNotificacao.ENVIADA);
            assertThat(n.tentativas()).isEqualTo(1);
        });
        assertThat(alternativo.chavesRecebidas).containsExactly("chave-1");
    }
}
