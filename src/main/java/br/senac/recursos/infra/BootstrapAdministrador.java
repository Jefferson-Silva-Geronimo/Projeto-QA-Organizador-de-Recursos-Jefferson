package br.senac.recursos.infra;

import br.senac.recursos.aplicacao.UsuarioServico;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Cria o primeiro Administrador na subida, se as variáveis de ambiente existirem e não houver usuário.
 * Sem valor padrão: a senha nunca é escrita no repositório nem em log (RNF-12).
 */
@Component
class BootstrapAdministrador implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(BootstrapAdministrador.class);

    private final UsuarioServico usuarios;
    private final String email;
    private final String senha;

    BootstrapAdministrador(UsuarioServico usuarios,
                           @Value("${app.bootstrap.admin.email:}") String email,
                           @Value("${app.bootstrap.admin.senha:}") String senha) {
        this.usuarios = usuarios;
        this.email = email;
        this.senha = senha;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (email.isBlank() || senha.isBlank()) {
            return;
        }
        if (usuarios.semearPrimeiroAdministrador("Administrador inicial", email, senha)) {
            LOG.info("Primeiro Administrador criado a partir da configuração de ambiente.");
        }
    }
}
