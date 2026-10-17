package br.senac.recursos.integration;

import br.senac.recursos.config.NotificacaoProperties;
import br.senac.recursos.model.Notificacao;
import br.senac.recursos.service.NotificadorExterno;
import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Adaptador HTTP do provedor de notificação (A5, C6, ADR-007). Envia POST em JSON com o conteúdo mínimo e
 * a chave de idempotência. O corpo da resposta do provedor nunca é lido: ele pode conter dado sensível,
 * como o próprio token (CEN-09). Só o status, classificado, volta ao serviço.
 */
@Component
@EnableConfigurationProperties(NotificacaoProperties.class)
class WebhookNotificador implements NotificadorExterno {

    private static final Logger LOG = LoggerFactory.getLogger(WebhookNotificador.class);

    private final NotificacaoProperties propriedades;
    private final RestClient cliente;

    WebhookNotificador(NotificacaoProperties propriedades) {
        this.propriedades = propriedades;
        Duration conexao = propriedades.timeoutConexao() != null ? propriedades.timeoutConexao()
                : Duration.ofMillis(500);
        Duration leitura = propriedades.timeoutLeitura() != null ? propriedades.timeoutLeitura()
                : Duration.ofMillis(1500);
        // HTTP/1.1 explícito: o cliente do JDK tenta atualizar para h2c em texto claro, o que alguns
        // provedores e servidores de teste recusam.
        HttpClient http = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(conexao).build();
        JdkClientHttpRequestFactory fabrica = new JdkClientHttpRequestFactory(http);
        fabrica.setReadTimeout(leitura);
        this.cliente = RestClient.builder().requestFactory(fabrica).build();
    }

    @Override
    public boolean disponivel() {
        return propriedades.configurado();
    }

    @Override
    public Resultado enviar(Notificacao notificacao, Instant instante) {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("evento", notificacao.evento().name());
        corpo.put("reservaId", notificacao.reservaId());
        corpo.put("destinatarioId", notificacao.destinatarioId());
        corpo.put("instante", instante.toString());
        corpo.put("chaveIdempotencia", notificacao.chaveIdempotencia());
        try {
            int status = cliente.post()
                    .uri(propriedades.url())
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(h -> {
                        h.set("Idempotency-Key", notificacao.chaveIdempotencia());
                        if (propriedades.token() != null && !propriedades.token().isBlank()) {
                            h.set(HttpHeaders.AUTHORIZATION, "Bearer " + propriedades.token());
                        }
                    })
                    .body(corpo)
                    .exchange((requisicao, resposta) -> resposta.getStatusCode().value());
            return classificar(notificacao, status);
        } catch (RuntimeException e) {
            // Só o tipo da falha vai ao log: a mensagem pode carregar detalhe do destino ou da resposta.
            LOG.warn("Falha ao enviar a notificação {}: {}", notificacao.id(), e.getClass().getSimpleName());
            return Resultado.FALHA_TEMPORARIA;
        }
    }

    private static Resultado classificar(Notificacao notificacao, int status) {
        if (status >= 200 && status < 300) {
            return Resultado.ENVIADA;
        }
        LOG.warn("Provedor respondeu {} para a notificação {}", status, notificacao.id());
        return status >= 400 && status < 500 ? Resultado.RECUSADA : Resultado.FALHA_TEMPORARIA;
    }
}
