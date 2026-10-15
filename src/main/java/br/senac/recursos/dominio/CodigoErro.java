package br.senac.recursos.dominio;

/**
 * Códigos estáveis de recusa (ADR-008). O front end e os testes dependem do código, nunca do texto.
 * Cada código tem uma categoria; a camada de API traduz a categoria em status HTTP.
 */
public enum CodigoErro {

    CREDENCIAIS_INVALIDAS(Categoria.NAO_AUTENTICADO, "E-mail ou senha inválidos."),
    NAO_AUTENTICADO(Categoria.NAO_AUTENTICADO, "Autenticação necessária ou sessão expirada."),
    ACESSO_NEGADO(Categoria.PROIBIDO, "Seu perfil não permite esta operação."),
    VALIDACAO_FALHOU(Categoria.VALIDACAO, "Os dados informados são inválidos."),
    NAO_ENCONTRADO(Categoria.NAO_ENCONTRADO, "O recurso solicitado não foi encontrado."),
    USUARIO_JA_EXISTE(Categoria.CONFLITO, "Já existe um usuário com este e-mail."),
    MINIMO_DE_RESPONSAVEIS(Categoria.CONFLITO,
            "A desativação deixaria menos de dois Responsáveis ativos."),
    USUARIO_COM_RESERVA_FUTURA(Categoria.CONFLITO,
            "O usuário tem reservas futuras e não pode ser desativado."),
    PATRIMONIO_JA_EXISTE(Categoria.CONFLITO, "Já existe um material com este código de patrimônio."),
    VINCULO_JA_EXISTE(Categoria.CONFLITO, "O usuário já está vinculado a outro professor."),
    RECURSO_COM_RESERVA_FUTURA(Categoria.CONFLITO,
            "O recurso tem reservas futuras e não pode ser desativado."),
    ERRO_INTERNO(Categoria.INTERNO, "Não foi possível concluir a operação. Tente novamente mais tarde.");

    /** Categoria de recusa, independente de protocolo. */
    public enum Categoria {
        VALIDACAO,
        NAO_AUTENTICADO,
        PROIBIDO,
        NAO_ENCONTRADO,
        CONFLITO,
        INTERNO
    }

    private final Categoria categoria;
    private final String mensagemPadrao;

    CodigoErro(Categoria categoria, String mensagemPadrao) {
        this.categoria = categoria;
        this.mensagemPadrao = mensagemPadrao;
    }

    public Categoria categoria() {
        return categoria;
    }

    public String mensagemPadrao() {
        return mensagemPadrao;
    }
}
