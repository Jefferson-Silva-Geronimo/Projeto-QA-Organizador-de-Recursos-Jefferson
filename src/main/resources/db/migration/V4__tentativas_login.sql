-- Falhas de login por conta (SEC-01, P5-10, OWASP A07). Janela deslizante: linhas mais antigas que a janela são
-- apagadas a cada nova falha. Guarda o e-mail normalizado durante a janela (dado pessoal de vida curta; lacuna D9).
CREATE TABLE tentativas_login (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email        varchar(254) NOT NULL,
    ocorrida_em  timestamptz  NOT NULL
);
CREATE INDEX tentativas_login_email_idx ON tentativas_login (email, ocorrida_em);
CREATE INDEX tentativas_login_tempo_idx ON tentativas_login (ocorrida_em);
