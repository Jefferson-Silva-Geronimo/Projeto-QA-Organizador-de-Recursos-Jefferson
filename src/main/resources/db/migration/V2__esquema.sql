-- Esquema do sistema, a partir de docs/prd/modelo-dados.dbml (18 tabelas).
-- Nenhum valor sem origem: tolerância, reenvio e duração da sessão ficam nulos ou em configuração (D1, D3, D17).
-- Todo instante é timestamptz, gravado em UTC (RN-15, ADR-005).

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ---------------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------------
CREATE TYPE perfil_usuario AS ENUM ('SOLICITANTE', 'RESPONSAVEL', 'ADMINISTRADOR');
CREATE TYPE tipo_recurso AS ENUM ('SALA', 'PROFESSOR', 'MATERIAL');
CREATE TYPE estado_reserva AS ENUM
    ('SOLICITADA', 'APROVADA', 'EM_USO', 'CONCLUIDA', 'REJEITADA', 'CANCELADA', 'NAO_COMPARECEU');
CREATE TYPE motivo_sistema AS ENUM ('MANUTENCAO', 'SEM_DECISAO');
CREATE TYPE decisao_aprovacao AS ENUM ('APROVADA', 'REJEITADA');
CREATE TYPE tipo_movimentacao AS ENUM ('RETIRADA', 'DEVOLUCAO');
CREATE TYPE tipo_ator AS ENUM ('USUARIO', 'SISTEMA');
CREATE TYPE entidade_auditada AS ENUM ('RESERVA', 'RECURSO', 'USUARIO', 'BLOQUEIO', 'CONFIGURACAO');
CREATE TYPE motivo_conflito AS ENUM ('SOBREPOSICAO', 'CONCORRENCIA', 'MANUTENCAO');
CREATE TYPE evento_notificacao AS ENUM
    ('SOLICITACAO_PENDENTE', 'RESERVA_APROVADA', 'RESERVA_REJEITADA', 'RESERVA_CANCELADA');
CREATE TYPE status_notificacao AS ENUM ('PENDENTE', 'ENVIADA', 'FALHA');

-- ---------------------------------------------------------------------------
-- Acesso
-- ---------------------------------------------------------------------------
CREATE TABLE usuarios (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome        varchar     NOT NULL,
    email       varchar     NOT NULL UNIQUE,
    senha_hash  varchar     NOT NULL,
    perfil      perfil_usuario NOT NULL,           -- uma coluna, um perfil (RN-17)
    ativo       boolean     NOT NULL DEFAULT true, -- desativação em vez de exclusão (RF-15, C7)
    criado_em   timestamptz NOT NULL
);

-- Token opaco com revogação (ADR-004). Guarda só o hash do token.
CREATE TABLE sessoes (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id   bigint      NOT NULL REFERENCES usuarios (id),
    token_hash   varchar     NOT NULL UNIQUE,
    criada_em    timestamptz NOT NULL,
    expira_em    timestamptz NOT NULL,
    revogada_em  timestamptz
);
CREATE INDEX sessoes_usuario_idx ON sessoes (usuario_id);

-- ---------------------------------------------------------------------------
-- Recursos (supertipo com chave composta para o tipo, ADR-002)
-- ---------------------------------------------------------------------------
CREATE TABLE recursos (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo       tipo_recurso NOT NULL,
    nome       varchar      NOT NULL,
    restrito   boolean      NOT NULL DEFAULT false,
    ativo      boolean      NOT NULL DEFAULT true,
    criado_em  timestamptz  NOT NULL,
    UNIQUE (id, tipo)
);

CREATE TABLE salas (
    recurso_id       bigint PRIMARY KEY,
    tipo             tipo_recurso NOT NULL DEFAULT 'SALA' CHECK (tipo = 'SALA'),
    capacidade       integer      NOT NULL CHECK (capacidade > 0),
    localizacao      varchar      NOT NULL,
    tipo_sala        varchar      NOT NULL,
    hora_abertura    time         NOT NULL,
    hora_fechamento  time         NOT NULL,
    CHECK (hora_fechamento > hora_abertura),       -- não cruza a meia-noite (S3, RN-14)
    FOREIGN KEY (recurso_id, tipo) REFERENCES recursos (id, tipo)
);

-- Dias da semana de funcionamento. Convenção ISO: 1 segunda a 7 domingo.
CREATE TABLE sala_dias_funcionamento (
    sala_id     bigint   NOT NULL REFERENCES salas (recurso_id),
    dia_semana  smallint NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    PRIMARY KEY (sala_id, dia_semana)
);

CREATE TABLE professores (
    recurso_id  bigint PRIMARY KEY,
    tipo        tipo_recurso NOT NULL DEFAULT 'PROFESSOR' CHECK (tipo = 'PROFESSOR'),
    usuario_id  bigint UNIQUE REFERENCES usuarios (id),   -- vínculo opcional, não concede perfil (A4, C8)
    FOREIGN KEY (recurso_id, tipo) REFERENCES recursos (id, tipo)
);

CREATE TABLE competencias (
    id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome  varchar NOT NULL UNIQUE
);

CREATE TABLE professor_competencias (
    professor_id    bigint NOT NULL REFERENCES professores (recurso_id),
    competencia_id  bigint NOT NULL REFERENCES competencias (id),
    PRIMARY KEY (professor_id, competencia_id)
);

CREATE TABLE materiais (
    recurso_id         bigint PRIMARY KEY,
    tipo               tipo_recurso NOT NULL DEFAULT 'MATERIAL' CHECK (tipo = 'MATERIAL'),
    codigo_patrimonio  varchar NOT NULL UNIQUE,   -- identifica uma unidade (A3, RN-12)
    descricao          varchar,
    FOREIGN KEY (recurso_id, tipo) REFERENCES recursos (id, tipo)
);

-- ---------------------------------------------------------------------------
-- Reservas e ocupações
-- ---------------------------------------------------------------------------
CREATE TABLE reservas (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitante_id   bigint         NOT NULL REFERENCES usuarios (id),
    titulo           varchar        NOT NULL,
    descricao        text,
    inicio           timestamptz    NOT NULL,
    fim              timestamptz    NOT NULL,
    estado           estado_reserva NOT NULL,
    exige_aprovacao  boolean        NOT NULL,
    motivo_sistema   motivo_sistema,
    motivo_texto     text,
    criada_em        timestamptz    NOT NULL,
    atualizada_em    timestamptz    NOT NULL,
    CHECK (fim > inicio),                                              -- RN-01
    CHECK (motivo_sistema IS NULL OR estado = 'CANCELADA'),
    CHECK (estado <> 'REJEITADA' OR motivo_texto IS NOT NULL)          -- RN-24
);
CREATE INDEX reservas_solicitante_estado_idx ON reservas (solicitante_id, estado);
CREATE INDEX reservas_estado_inicio_idx ON reservas (estado, inicio);

CREATE TABLE bloqueios_manutencao (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recurso_id     bigint      NOT NULL REFERENCES recursos (id),
    inicio         timestamptz NOT NULL,
    fim            timestamptz NOT NULL,
    motivo         text        NOT NULL,
    criado_por_id  bigint      NOT NULL REFERENCES usuarios (id),
    criado_em      timestamptz NOT NULL,
    ativo          boolean     NOT NULL DEFAULT true,
    CHECK (fim > inicio)
);

CREATE TABLE ocupacoes (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recurso_id   bigint    NOT NULL REFERENCES recursos (id),
    periodo      tstzrange NOT NULL,
    reserva_id   bigint    REFERENCES reservas (id),
    bloqueio_id  bigint    REFERENCES bloqueios_manutencao (id),
    ativa        boolean   NOT NULL DEFAULT true,
    CHECK (num_nonnulls(reserva_id, bloqueio_id) = 1),                 -- exatamente uma origem
    CHECK (NOT isempty(periodo) AND lower(periodo) < upper(periodo)),  -- RN-01
    -- Dupla reserva barrada no banco, para reserva e bloqueio (ADR-003, RN-03, RN-04).
    CONSTRAINT ocupacoes_sem_sobreposicao
        EXCLUDE USING gist (recurso_id WITH =, periodo WITH &&) WHERE (ativa)
);
CREATE INDEX ocupacoes_reserva_idx ON ocupacoes (reserva_id);
CREATE INDEX ocupacoes_bloqueio_idx ON ocupacoes (bloqueio_id);

-- ---------------------------------------------------------------------------
-- Decisão, uso e conflito
-- ---------------------------------------------------------------------------
CREATE TABLE aprovacoes (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reserva_id      bigint            NOT NULL REFERENCES reservas (id),
    responsavel_id  bigint            NOT NULL REFERENCES usuarios (id),
    decisao         decisao_aprovacao NOT NULL,
    motivo          text,
    decidida_em     timestamptz       NOT NULL,
    CHECK (decisao <> 'REJEITADA' OR motivo IS NOT NULL)               -- RN-24
);

CREATE TABLE movimentacoes_material (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reserva_id        bigint            NOT NULL REFERENCES reservas (id),
    material_id       bigint            NOT NULL REFERENCES materiais (recurso_id),
    tipo              tipo_movimentacao NOT NULL,
    registrado_por_id bigint            NOT NULL REFERENCES usuarios (id),
    registrado_em     timestamptz       NOT NULL
);
CREATE INDEX movimentacoes_reserva_idx ON movimentacoes_material (reserva_id);

CREATE TABLE tentativas_conflito (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recurso_id      bigint          NOT NULL REFERENCES recursos (id),
    periodo         tstzrange       NOT NULL,
    solicitante_id  bigint          NOT NULL REFERENCES usuarios (id),
    motivo          motivo_conflito NOT NULL,
    ocorrida_em     timestamptz     NOT NULL
);
CREATE INDEX tentativas_recurso_idx ON tentativas_conflito (recurso_id, ocorrida_em);
CREATE INDEX tentativas_solicitante_idx ON tentativas_conflito (solicitante_id, ocorrida_em);

-- ---------------------------------------------------------------------------
-- Auditoria, notificação e configuração
-- ---------------------------------------------------------------------------
CREATE TABLE auditoria_eventos (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ocorrido_em      timestamptz       NOT NULL,
    ator_tipo        tipo_ator         NOT NULL,
    ator_id          bigint            REFERENCES usuarios (id),
    entidade         entidade_auditada NOT NULL,
    entidade_id      bigint            NOT NULL,
    acao             varchar           NOT NULL,
    estado_anterior  varchar,
    estado_novo      varchar,
    valores_antes    jsonb,
    valores_depois   jsonb,
    motivo           text,
    correlacao_id    uuid,
    CHECK ((ator_tipo = 'SISTEMA' AND ator_id IS NULL) OR (ator_tipo = 'USUARIO' AND ator_id IS NOT NULL))
);
CREATE INDEX auditoria_entidade_idx ON auditoria_eventos (entidade, entidade_id, ocorrido_em);

-- Somente inserção (ADR-006, RN-08): nenhuma atualização, exclusão ou truncamento.
CREATE FUNCTION auditoria_somente_insercao() RETURNS trigger
    LANGUAGE plpgsql AS
$$
BEGIN
    RAISE EXCEPTION 'auditoria_eventos é somente inserção';
END;
$$;

CREATE TRIGGER auditoria_sem_alteracao
    BEFORE UPDATE OR DELETE ON auditoria_eventos
    FOR EACH ROW EXECUTE FUNCTION auditoria_somente_insercao();

CREATE TRIGGER auditoria_sem_truncamento
    BEFORE TRUNCATE ON auditoria_eventos
    FOR EACH STATEMENT EXECUTE FUNCTION auditoria_somente_insercao();

CREATE TABLE notificacoes (
    id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reserva_id            bigint             NOT NULL REFERENCES reservas (id),
    evento                evento_notificacao NOT NULL,
    destinatario_id       bigint             NOT NULL REFERENCES usuarios (id),
    status                status_notificacao NOT NULL DEFAULT 'PENDENTE',
    tentativas            integer            NOT NULL DEFAULT 0,
    chave_idempotencia    varchar            NOT NULL UNIQUE,
    proxima_tentativa_em  timestamptz,
    criada_em             timestamptz        NOT NULL,
    enviada_em            timestamptz
);
CREATE INDEX notificacoes_pendentes_idx ON notificacoes (status, proxima_tentativa_em);

-- Linha única. Os valores nulos são lacunas: nenhum valor foi inventado (D1, D3).
CREATE TABLE configuracao (
    id                             smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    fuso                           varchar  NOT NULL DEFAULT 'America/Sao_Paulo',   -- A6
    tolerancia_nao_comparecimento  interval,                                        -- D1
    tentativas_reenvio             integer,                                         -- D3
    intervalo_reenvio_inicial      interval                                         -- D3
);
INSERT INTO configuracao (id) VALUES (1);
