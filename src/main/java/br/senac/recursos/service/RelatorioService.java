package br.senac.recursos.service;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.exception.ErroDeNegocio;
import br.senac.recursos.model.ItemDeRelatorio;
import br.senac.recursos.model.LinhaDeRelatorio;
import br.senac.recursos.model.PaginaDeRelatorio;
import br.senac.recursos.model.Periodo;
import br.senac.recursos.model.Recurso;
import br.senac.recursos.model.TipoRecurso;
import br.senac.recursos.model.regra.HorasDeFuncionamento;
import br.senac.recursos.repository.ConfiguracaoRepository;
import br.senac.recursos.repository.RecursoRepository;
import br.senac.recursos.repository.RelatorioRepository;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Relatório de utilização por recurso, carga horária e conflitos evitados (RF-12, RN-31, B4, C5).
 * Responsável e Administrador leem; o perfil é verificado na camada de API (D5).
 */
@Service
public class RelatorioService {

    private static final double SEGUNDOS_POR_HORA = 3600.0;

    private final RelatorioRepository relatorio;
    private final RecursoRepository recursos;
    private final ConfiguracaoRepository configuracao;

    public RelatorioService(RelatorioRepository relatorio, RecursoRepository recursos,
                            ConfiguracaoRepository configuracao) {
        this.relatorio = relatorio;
        this.recursos = recursos;
        this.configuracao = configuracao;
    }

    @Transactional(readOnly = true)
    public PaginaDeRelatorio utilizacao(Periodo periodo, TipoRecurso tipo, Long recursoId, int pagina, int tamanho) {
        if (pagina < 0 || tamanho < 1) {
            throw new ErroDeNegocio(CodigoErro.VALIDACAO_FALHOU, "Informe uma página e um tamanho válidos.");
        }
        ZoneId fuso = configuracao.fuso();
        List<LinhaDeRelatorio> linhas = relatorio.linhas(periodo.inicio(), periodo.fim(), tipo, recursoId,
                tamanho, pagina * tamanho);
        List<ItemDeRelatorio> itens = linhas.stream().map(l -> item(l, periodo, fuso)).toList();
        return new PaginaDeRelatorio(itens, pagina, tamanho, relatorio.contar(tipo, recursoId));
    }

    private ItemDeRelatorio item(LinhaDeRelatorio l, Periodo periodo, ZoneId fuso) {
        double horas = l.segundosAlocados() / SEGUNDOS_POR_HORA;
        Double utilizacao = null;
        if (l.tipo() == TipoRecurso.SALA) {
            Recurso sala = recursos.buscarPorId(l.recursoId()).orElseThrow();
            Duration funcionamento = HorasDeFuncionamento.calcular(sala.horaAbertura(), sala.horaFechamento(),
                    sala.diasFuncionamento().stream().map(DayOfWeek::of).collect(Collectors.toSet()),
                    periodo, fuso);
            if (!funcionamento.isZero()) {
                utilizacao = l.segundosAlocados() / (double) funcionamento.toSeconds();
            }
        }
        return new ItemDeRelatorio(l.recursoId(), l.nome(), l.tipo(), horas, utilizacao,
                l.conflitosEvitados(), l.solicitantesDistintos());
    }
}
