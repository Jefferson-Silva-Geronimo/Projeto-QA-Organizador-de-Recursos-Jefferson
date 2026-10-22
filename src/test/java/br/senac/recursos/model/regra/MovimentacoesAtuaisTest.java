package br.senac.recursos.model.regra;

import static br.senac.recursos.model.TipoMovimentacao.DEVOLUCAO;
import static br.senac.recursos.model.TipoMovimentacao.RETIRADA;
import static org.assertj.core.api.Assertions.assertThat;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.model.Movimentacao;
import br.senac.recursos.model.TipoMovimentacao;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * A movimentação atual de cada material: a mais recente prevalece (RF-09). É a mesma regra com que o servidor recusa
 * a retirada de unidade já retirada (MATERIAL_JA_RETIRADO) e a devolução de unidade não retirada
 * (DEVOLUCAO_SEM_RETIRADA). CT-151.
 */
class MovimentacoesAtuaisTest {

    private static final Instant T0 = Instant.parse("2026-10-21T17:00:00Z");
    private static final long NOTEBOOK = 100L;
    private static final long PROJETOR = 200L;

    private static Movimentacao mov(long id, long material, TipoMovimentacao tipo) {
        return new Movimentacao(id, 1L, material, tipo, 7L, "Carlos Lima", T0.plusSeconds(id));
    }

    @Test
    void ct151_retiradaSozinhaEAAtual() {
        Map<Long, Movimentacao> atuais = MovimentacoesAtuais.ultimaPorMaterial(List.of(mov(1, NOTEBOOK, RETIRADA)));

        assertThat(atuais).containsOnlyKeys(NOTEBOOK);
        assertThat(atuais).extractingByKey(NOTEBOOK).extracting(Movimentacao::id).isEqualTo(1L);
        assertThat(atuais).extractingByKey(NOTEBOOK).extracting(Movimentacao::tipo).isEqualTo(RETIRADA);
    }

    @Test
    void ct151_devolucaoSubstituiARetirada() {
        Map<Long, Movimentacao> atuais = MovimentacoesAtuais.ultimaPorMaterial(
                List.of(mov(1, NOTEBOOK, RETIRADA), mov(2, NOTEBOOK, DEVOLUCAO)));

        assertThat(atuais).extractingByKey(NOTEBOOK).extracting(Movimentacao::id).isEqualTo(2L);
        assertThat(atuais).extractingByKey(NOTEBOOK).extracting(Movimentacao::tipo).isEqualTo(DEVOLUCAO);
    }

    @Test
    void ct151_novaRetiradaDoMesmoMaterialEAAtual() {
        Map<Long, Movimentacao> atuais = MovimentacoesAtuais.ultimaPorMaterial(
                List.of(mov(1, NOTEBOOK, RETIRADA), mov(2, NOTEBOOK, DEVOLUCAO), mov(3, NOTEBOOK, RETIRADA)));

        assertThat(atuais).extractingByKey(NOTEBOOK).extracting(Movimentacao::id).isEqualTo(3L);
        assertThat(atuais).extractingByKey(NOTEBOOK).extracting(Movimentacao::tipo).isEqualTo(RETIRADA);
    }

    @Test
    void ct151_materialNuncaMovimentadoNaoTemMovimentacaoAtual() {
        Map<Long, Movimentacao> atuais = MovimentacoesAtuais.ultimaPorMaterial(List.of(mov(1, NOTEBOOK, RETIRADA)));

        assertThat(atuais).doesNotContainKey(PROJETOR);
        assertThat(MovimentacoesAtuais.ultimaPorMaterial(List.of())).isEmpty();
    }

    @Test
    void ct151_variosMateriaisIntercaladosTemCadaUmASuaMovimentacaoAtual() {
        Map<Long, Movimentacao> atuais = MovimentacoesAtuais.ultimaPorMaterial(List.of(
                mov(1, NOTEBOOK, RETIRADA), mov(2, PROJETOR, RETIRADA), mov(3, NOTEBOOK, DEVOLUCAO),
                mov(4, PROJETOR, DEVOLUCAO), mov(5, PROJETOR, RETIRADA)));

        assertThat(atuais).containsOnlyKeys(NOTEBOOK, PROJETOR);
        assertThat(atuais).extractingByKey(NOTEBOOK).extracting(Movimentacao::id).isEqualTo(3L);
        assertThat(atuais).extractingByKey(PROJETOR).extracting(Movimentacao::id).isEqualTo(5L);
        assertThat(atuais).extractingByKey(PROJETOR).extracting(Movimentacao::tipo).isEqualTo(RETIRADA);
    }

    @Test
    void ct151_aMaisRecentePrevalecePeloIdMesmoComAListaForaDeOrdem() {
        Map<Long, Movimentacao> atuais = MovimentacoesAtuais.ultimaPorMaterial(
                List.of(mov(3, NOTEBOOK, RETIRADA), mov(1, NOTEBOOK, RETIRADA), mov(2, NOTEBOOK, DEVOLUCAO)));

        assertThat(atuais).extractingByKey(NOTEBOOK).extracting(Movimentacao::id).isEqualTo(3L);
    }

    @ParameterizedTest(name = "movimentação atual {0}: retirar -> {1}; devolver -> {2}")
    @CsvSource(value = {
            "RETIRADA, MATERIAL_JA_RETIRADO, ''",
            "DEVOLUCAO, '', DEVOLUCAO_SEM_RETIRADA",
            "NENHUMA, '', DEVOLUCAO_SEM_RETIRADA"})
    void ct151_aMesmaRegraRecusaRetiradaEDevolucao(String atual, String recusaDaRetirada, String recusaDaDevolucao) {
        TipoMovimentacao ultima = "NENHUMA".equals(atual) ? null : TipoMovimentacao.valueOf(atual);

        Optional<CodigoErro> retirada = PoliticaDeUso.avaliarRetirada(ultima);
        Optional<CodigoErro> devolucao = PoliticaDeUso.avaliarDevolucao(ultima);

        assertThat(retirada.map(Enum::name).orElse("")).isEqualTo(recusaDaRetirada);
        assertThat(devolucao.map(Enum::name).orElse("")).isEqualTo(recusaDaDevolucao);
    }
}
