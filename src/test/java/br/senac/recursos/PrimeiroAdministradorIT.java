package br.senac.recursos;

import static org.assertj.core.api.Assertions.assertThat;

import br.senac.recursos.aplicacao.UsuarioServico;
import br.senac.recursos.suporte.BancoRealIT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Primeiro Administrador (CT-122). Sem ele ninguém consegue cadastrar usuários.
 * Decisão sem requisito da especificação, registrada em ADR-004: o valor vem de variável de ambiente
 * e só vale com a tabela de usuários vazia.
 */
class PrimeiroAdministradorIT extends BancoRealIT {

    @Autowired
    private UsuarioServico usuarios;

    @BeforeEach
    void limpa() {
        limparBanco();
    }

    @Test
    void ct122_criaOPrimeiroAdministradorComAtorSistemaEApenasUmaVez() {
        boolean primeira = usuarios.semearPrimeiroAdministrador("Administrador inicial", "Admin@Exemplo.test",
                "senha-de-teste-1");
        boolean segunda = usuarios.semearPrimeiroAdministrador("Outro", "outro@exemplo.test", "senha-de-teste-1");

        assertThat(primeira).isTrue();
        assertThat(segunda).isFalse();
        assertThat(jdbc.queryForObject("select count(*) from usuarios", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject(
                "select count(*) from usuarios where email = 'admin@exemplo.test' and perfil = 'ADMINISTRADOR'",
                Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject(
                "select count(*) from auditoria_eventos where acao = 'USUARIO_CRIADO' and ator_tipo = 'SISTEMA' "
                        + "and ator_id is null", Integer.class)).isEqualTo(1);
    }
}
