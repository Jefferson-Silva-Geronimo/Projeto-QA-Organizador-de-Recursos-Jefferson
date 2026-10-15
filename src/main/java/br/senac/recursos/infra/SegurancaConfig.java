package br.senac.recursos.infra;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Postura inicial: nada é acessível sem autenticação, exceto a verificação de saúde.
 * A autenticação real por token opaco com revogação entra na Fase 4 (ADR-004).
 *
 * <p>Não existe usuário padrão: o repositório de usuários em memória é vazio, para que
 * nenhuma senha gerada apareça em log (RNF-12).
 */
@Configuration
class SegurancaConfig {

    @Bean
    SecurityFilterChain filtroDeSeguranca(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**").permitAll()
                        .anyRequest().authenticated())
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .headers(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    UserDetailsService usuariosVazios() {
        return new InMemoryUserDetailsManager();
    }
}
