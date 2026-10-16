package br.senac.recursos.security;

import br.senac.recursos.config.SessaoProperties;
import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.service.AutenticacaoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.time.Clock;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Postura de segurança (ADR-004). Nada é acessível sem autenticação, exceto o login e a saúde.
 * A sessão é um token opaco com revogação, sem estado no servidor além da tabela {@code sessoes}.
 * Não existe usuário padrão: nenhuma senha gerada aparece em log (RNF-12).
 */
@Configuration
@EnableMethodSecurity
@EnableConfigurationProperties(SessaoProperties.class)
class SegurancaConfig {

    @Bean
    SecurityFilterChain filtroDeSeguranca(HttpSecurity http, AutenticacaoService autenticacao,
                                          ObjectMapper json) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**").permitAll()
                        // Camada 1 da autorização (ADR-004): o perfil é decidido antes de o corpo ser lido e
                        // validado, para o perfil sem permissão sempre receber 403, nunca 400.
                        .requestMatchers("/api/usuarios", "/api/usuarios/**").hasRole("ADMINISTRADOR")
                        .requestMatchers(HttpMethod.POST, "/api/salas", "/api/professores", "/api/materiais")
                                .hasRole("ADMINISTRADOR")
                        .requestMatchers(HttpMethod.PUT, "/api/recursos/*/restrito").hasRole("ADMINISTRADOR")
                        .requestMatchers(HttpMethod.POST, "/api/recursos/*/desativacao").hasRole("ADMINISTRADOR")
                        .requestMatchers("/api/bloqueios", "/api/bloqueios/**").hasRole("ADMINISTRADOR")
                        .requestMatchers(HttpMethod.GET, "/api/auditoria").hasRole("ADMINISTRADOR")
                        .requestMatchers(HttpMethod.POST, "/api/reservas").hasAnyRole("SOLICITANTE", "RESPONSAVEL")
                        .requestMatchers(HttpMethod.PUT, "/api/reservas/*").hasAnyRole("SOLICITANTE", "RESPONSAVEL")
                        .requestMatchers(HttpMethod.POST, "/api/reservas/*/aprovacao", "/api/reservas/*/rejeicao",
                                "/api/reservas/*/inicio", "/api/reservas/*/retiradas",
                                "/api/reservas/*/devolucoes", "/api/reservas/*/conclusao",
                                "/api/reservas/*/nao-comparecimento").hasRole("RESPONSAVEL")
                        .requestMatchers(HttpMethod.GET, "/api/reservas/fila").hasRole("RESPONSAVEL")
                        .requestMatchers("/api/relatorios", "/api/relatorios/**")
                                .hasAnyRole("RESPONSAVEL", "ADMINISTRADOR")
                        .anyRequest().authenticated())
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(naoAutenticado(json))
                        .accessDeniedHandler(acessoNegado(json)))
                .addFilterBefore(new TokenFilter(autenticacao), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    PasswordEncoder codificadorDeSenha() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    UserDetailsService usuariosVazios() {
        return new InMemoryUserDetailsManager();
    }

    @Bean
    AutenticacaoService autenticacaoServico(br.senac.recursos.repository.UsuarioRepository usuarios,
                                            br.senac.recursos.repository.SessaoRepository sessoes,
                                            PasswordEncoder codificador, Clock relogio, SessaoProperties sessao) {
        return new AutenticacaoService(usuarios, sessoes, codificador, relogio, sessao.duracao());
    }

    private static AuthenticationEntryPoint naoAutenticado(ObjectMapper json) {
        return (request, response, ex) -> escrever(json, response, HttpStatus.UNAUTHORIZED, CodigoErro.NAO_AUTENTICADO);
    }

    private static AccessDeniedHandler acessoNegado(ObjectMapper json) {
        return (request, response, ex) -> escrever(json, response, HttpStatus.FORBIDDEN, CodigoErro.ACESSO_NEGADO);
    }

    private static void escrever(ObjectMapper json, jakarta.servlet.http.HttpServletResponse response,
                                 HttpStatus status, CodigoErro codigo) throws IOException {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(status, codigo.mensagemPadrao());
        problema.setTitle(status.getReasonPhrase());
        problema.setProperty("code", codigo.name());
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        json.writeValue(response.getOutputStream(), problema);
    }
}
