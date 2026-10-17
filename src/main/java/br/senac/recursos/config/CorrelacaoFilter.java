package br.senac.recursos.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Identificador de correlação por requisição (RNF-12). É sempre gerado no servidor: um valor enviado pelo
 * cliente é ignorado, para que ninguém injete texto no log. Vai ao MDC (linha de log) e ao cabeçalho
 * {@code X-Correlation-Id} da resposta, inclusive nas respostas de erro da cadeia de segurança.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class CorrelacaoFilter extends OncePerRequestFilter {

    static final String CABECALHO = "X-Correlation-Id";
    static final String CHAVE_MDC = "correlacao";

    @Override
    protected void doFilterInternal(HttpServletRequest requisicao, HttpServletResponse resposta, FilterChain cadeia)
            throws ServletException, IOException {
        String id = UUID.randomUUID().toString();
        MDC.put(CHAVE_MDC, id);
        resposta.setHeader(CABECALHO, id);
        try {
            cadeia.doFilter(requisicao, resposta);
        } finally {
            MDC.remove(CHAVE_MDC);
        }
    }
}
