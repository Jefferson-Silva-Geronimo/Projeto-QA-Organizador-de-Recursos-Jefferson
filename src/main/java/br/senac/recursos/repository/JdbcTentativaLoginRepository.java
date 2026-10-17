package br.senac.recursos.repository;

import java.time.Instant;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JdbcTentativaLoginRepository implements TentativaLoginRepository {

    private final JdbcClient jdbc;

    JdbcTentativaLoginRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Instant> falhasDepoisDe(String email, Instant depoisDe) {
        return jdbc.sql("select ocorrida_em from tentativas_login where email = :email and ocorrida_em > :desde "
                        + "order by ocorrida_em desc")
                .param("email", email)
                .param("desde", JdbcSessaoRepository.utc(depoisDe))
                .query((rs, n) -> rs.getObject("ocorrida_em", java.time.OffsetDateTime.class).toInstant())
                .list();
    }

    @Override
    public void registrarFalha(String email, Instant quando) {
        jdbc.sql("insert into tentativas_login (email, ocorrida_em) values (:email, :quando)")
                .param("email", email)
                .param("quando", JdbcSessaoRepository.utc(quando))
                .update();
    }

    @Override
    public void limpar(String email) {
        jdbc.sql("delete from tentativas_login where email = :email").param("email", email).update();
    }

    @Override
    public void removerAteInclusive(Instant limite) {
        jdbc.sql("delete from tentativas_login where ocorrida_em <= :limite")
                .param("limite", JdbcSessaoRepository.utc(limite))
                .update();
    }
}
