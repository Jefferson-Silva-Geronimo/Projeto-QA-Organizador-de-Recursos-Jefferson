package br.senac.recursos.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuração do webhook de notificação (A5, C6). Endereço e token vêm de variável de ambiente, nunca do
 * repositório. Os limites de tempo iniciais (500 ms de conexão e 1500 ms de leitura) vêm do plano da
 * equipe e estão **a validar**: a especificação não define valores.
 *
 * @param url endereço do provedor. Vazio desliga o envio e deixa as notificações PENDENTE
 * @param token credencial enviada ao provedor como Bearer. Nunca registrada em log
 */
@ConfigurationProperties(prefix = "app.notificacao")
public record NotificacaoProperties(String url, String token, Duration timeoutConexao, Duration timeoutLeitura) {

    public boolean configurado() {
        return url != null && !url.isBlank();
    }
}
