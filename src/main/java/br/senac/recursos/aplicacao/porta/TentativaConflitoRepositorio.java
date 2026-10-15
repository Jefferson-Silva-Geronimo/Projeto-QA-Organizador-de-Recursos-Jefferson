package br.senac.recursos.aplicacao.porta;

import br.senac.recursos.dominio.Periodo;
import java.time.Instant;

/**
 * Porta das tentativas de conflito (RN-30). A gravação acontece em transação própria, depois do
 * desfazer da transação da reserva recusada (ADR-003).
 */
public interface TentativaConflitoRepositorio {

    enum Motivo { SOBREPOSICAO, CONCORRENCIA, MANUTENCAO }

    void registrar(long recursoId, Periodo periodo, long solicitanteId, Motivo motivo, Instant ocorridaEm);
}
