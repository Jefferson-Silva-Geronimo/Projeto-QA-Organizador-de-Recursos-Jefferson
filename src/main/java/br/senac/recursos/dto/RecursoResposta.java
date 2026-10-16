package br.senac.recursos.dto;

import br.senac.recursos.model.Recurso;
import br.senac.recursos.model.TipoRecurso;
import java.time.format.DateTimeFormatter;
import java.util.List;

public record RecursoResposta(long id, TipoRecurso tipo, String nome, boolean restrito, boolean ativo,
                       Integer capacidade, String localizacao, String tipoSala,
                       String horaAbertura, String horaFechamento, List<Integer> diasFuncionamento,
                       String codigoPatrimonio, String descricao, Long usuarioId, List<String> competencias) {
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    public static RecursoResposta de(Recurso d) {
        return new RecursoResposta(d.id(), d.tipo(), d.nome(), d.restrito(), d.ativo(), d.capacidade(),
                d.localizacao(), d.tipoSala(),
                d.horaAbertura() == null ? null : d.horaAbertura().format(HORA),
                d.horaFechamento() == null ? null : d.horaFechamento().format(HORA),
                d.diasFuncionamento(), d.codigoPatrimonio(), d.descricao(), d.usuarioId(), d.competencias());
    }
}
