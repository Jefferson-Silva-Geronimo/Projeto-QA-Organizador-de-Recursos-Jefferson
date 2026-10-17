package br.senac.recursos.dominio;

/**
 * Camada de domínio: regras de negócio sem dependência de Spring nem de JPA (ADR-001).
 *
 * <p>Esta classe só existe para que a regra de arquitetura tenha o que verificar desde a Fase 3.
 * Deve ser removida quando a primeira classe de regra de domínio entrar, na Fase 4.
 */
public final class MarcadorDominio {

    private MarcadorDominio() {
    }
}
