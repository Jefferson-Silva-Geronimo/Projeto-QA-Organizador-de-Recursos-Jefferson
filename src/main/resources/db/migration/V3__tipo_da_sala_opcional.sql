-- RF-02 não lista o tipo da sala entre os campos obrigatórios (capacidade, localização, abertura,
-- fechamento e dia de funcionamento). O tipo passa a ser opcional.
ALTER TABLE salas ALTER COLUMN tipo_sala DROP NOT NULL;
