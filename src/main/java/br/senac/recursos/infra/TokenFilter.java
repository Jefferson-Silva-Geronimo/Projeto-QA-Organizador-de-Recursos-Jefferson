package br.senac.recursos.infra;

import br.senac.recursos.aplicacao.AutenticacaoServico;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Identifica o usuário pelo cabeçalho {@code Authorization: Bearer <token>}.
 * Sem cabeçalho ou com token inválido, expirado ou revogado, a requisição segue anônima e a regra de
 * autorização responde 401.
 */
class TokenFilter extends OncePerRequestFilter {

    private static final String PREFIXO = "Bearer ";

    private final AutenticacaoServico autenticacao;

    TokenFilter(AutenticacaoServico autenticacao) {
        this.autenticacao = autenticacao;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String cabecalho = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (cabecalho != null && cabecalho.startsWith(PREFIXO)) {
            autenticacao.identificar(cabecalho.substring(PREFIXO.length()).trim()).ifPresent(usuario -> {
                var autenticacaoDoContexto = new UsernamePasswordAuthenticationToken(
                        usuario, null, List.of(new SimpleGrantedAuthority("ROLE_" + usuario.perfil().name())));
                SecurityContextHolder.getContext().setAuthentication(autenticacaoDoContexto);
            });
        }
        chain.doFilter(request, response);
    }
}
