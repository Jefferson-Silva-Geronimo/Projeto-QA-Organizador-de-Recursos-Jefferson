package br.senac.recursos.controller;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.exception.ErroDeNegocio;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Erros padronizados (ADR-008, RF-13, RNF-07). Toda resposta de erro tem um {@code code} estável e uma
 * mensagem compreensível. Nenhuma pilha, nome de tabela ou valor de entrada é devolvido.
 */
@RestControllerAdvice
class TratadorDeErros extends ResponseEntityExceptionHandler {

    private static final Logger LOG = LoggerFactory.getLogger(TratadorDeErros.class);

    @ExceptionHandler(ErroDeNegocio.class)
    ResponseEntity<ProblemDetail> negocio(ErroDeNegocio ex) {
        HttpStatus status = statusDa(ex.codigo().categoria());
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(status, ex.getMessage());
        problema.setTitle(status.getReasonPhrase());
        problema.setProperty("code", ex.codigo().name());
        if (!ex.itens().isEmpty()) {
            problema.setProperty("itens", ex.itens());
        }
        return ResponseEntity.status(status).body(problema);
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ProblemDetail> acessoNegado(AccessDeniedException ex) {
        return negocio(new ErroDeNegocio(CodigoErro.ACESSO_NEGADO));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ProblemDetail> inesperado(Exception ex) {
        // O detalhe fica só no log do servidor. A resposta é genérica.
        LOG.error("Falha interna não tratada", ex);
        return negocio(new ErroDeNegocio(CodigoErro.ERRO_INTERNO));
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  HttpHeaders headers, HttpStatusCode status,
                                                                  WebRequest request) {
        List<String> campos = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField()).distinct().sorted().toList();
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "Os dados informados são inválidos. Verifique os campos: " + String.join(", ", campos) + ".");
        problema.setTitle(HttpStatus.BAD_REQUEST.getReasonPhrase());
        problema.setProperty("code", CodigoErro.VALIDACAO_FALHOU.name());
        problema.setProperty("campos", campos);
        return ResponseEntity.badRequest().body(problema);
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object corpo, HttpHeaders headers,
                                                             HttpStatusCode status, WebRequest request) {
        ProblemDetail problema = corpo instanceof ProblemDetail p ? p : ProblemDetail.forStatus(status);
        problema.setProperty("code", codigoPara(status).name());
        problema.setDetail(mensagemPara(status));
        return ResponseEntity.status(status).headers(headers).body(problema);
    }

    private static HttpStatus statusDa(CodigoErro.Categoria categoria) {
        return switch (categoria) {
            case VALIDACAO -> HttpStatus.BAD_REQUEST;
            case NAO_AUTENTICADO -> HttpStatus.UNAUTHORIZED;
            case PROIBIDO -> HttpStatus.FORBIDDEN;
            case NAO_ENCONTRADO -> HttpStatus.NOT_FOUND;
            case CONFLITO -> HttpStatus.CONFLICT;
            case INTERNO -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
    }

    private static CodigoErro codigoPara(HttpStatusCode status) {
        if (status.value() == 404) {
            return CodigoErro.NAO_ENCONTRADO;
        }
        if (status.value() == 405) {
            return CodigoErro.METODO_NAO_PERMITIDO;
        }
        if (status.is4xxClientError()) {
            return CodigoErro.VALIDACAO_FALHOU;
        }
        return CodigoErro.ERRO_INTERNO;
    }

    private static String mensagemPara(HttpStatusCode status) {
        return codigoPara(status).mensagemPadrao();
    }
}
