# Roteiro de verificação em navegador real

Verifica as telas construídas **no navegador de verdade**, com o front de produção falando com a **API real** e um
PostgreSQL descartável, usando só dados fictícios. Existe porque os testes de componente (jsdom, API simulada) não
reproduzem o foco entre telas, o foco em pseudo-elementos internos do navegador nem o refazer da consulta depois de uma
reserva: BUG-010 a BUG-014 só apareceram aqui ([defeitos](../../defeitos/README.md)).

O roteiro é **manual** hoje. No 6.D ele vira teste E2E na CI (Playwright com `docker compose`), e este arquivo é a base
dele. Nada aqui contém segredo: as credenciais são geradas na hora, ficam em `local/` e o Git as ignora.

## O que ele faz

| Parte | O que cobre |
| --- | --- |
| `semear.py` | Cria pela API 4 usuários, 4 salas, 3 materiais, 2 professores e 1 reserva existente (dados fictícios, e-mails `@exemplo.test`) |
| `prototipo.cjs visual` | Busca e Nova reserva em 360 px e 1280 px, nos temas claro e escuro, em 12 estados cada: lista, horários ocupados, filtros, erro de campo, recursos livres, validação recusada, formulário preenchido, conflito de verdade (outra pessoa reserva antes), lista refeita, aprovada, recurso restrito e enviada para aprovação. Em cada estado: captura, auditoria axe (WCAG 2.0, 2.1 e 2.2 AA e boas práticas, com contraste) e conferência de rolagem horizontal |
| `prototipo.cjs teclado` | Fluxo completo **sem mouse**: pular para o conteúdo, filtros, Buscar, Reservar, formulário, envio e confirmação. Registra cada parada de Tab e se o foco é visível |

| `prototipo.cjs login` | Tela de Login **sem sessão injetada**, em 360 e 1280 px, nos dois temas: tela, campos em branco, senha visível, credencial inválida (recusa sem dizer o campo, foco na mensagem, senha apagada), entrar como Solicitante e Responsável (destino e foco), volta à tela de origem com filtros e sessão terminada (token recusado pela API). Mais um fluxo só com teclado |

| `prototipo.cjs reservas` | Reservas (T04) e alteração, **pela interface, com a API real**, em 360 e 1280 px, nos dois temas: lista (estados, motivo, nomes dos recursos), diálogo de cancelamento (foco entra, Tab preso, Escape devolve o foco), cancelar com motivo, alterar (dados atuais, recurso da própria reserva marcado, confirmação), alterar com conflito de horário, Administrador sem Alterar e com `MOTIVO_OBRIGATORIO`, e uma reserva que **já começou** (RN-07: cancelar e alterar são recusados com `RESERVA_JA_INICIADA`) e outra **em uso** (sem ações). Mais um fluxo só com teclado. As duas reservas "de agora" começam 4 a 5 minutos depois do início do script, que espera por elas: a rodada leva cerca de 8 minutos e só funciona em dia útil, entre 07:00 e 22:00 no campus |

| `prototipo.cjs aprovacoes` | Fila de aprovações (T05) **pela interface, com a API real**, em 360 e 1280 px, nos dois temas: lista (solicitante pelo nome, sem e-mail, recursos), mensagem do item sem ação (a própria solicitação do Responsável), diálogo de aprovação (foco entra, Tab preso, Escape devolve o foco), aprovar com motivo, rejeitar sem motivo (nada é enviado, campo inválido, foco no campo) e com motivo, pedido que já começou (só Rejeitar), defesa do servidor pela API (`ACESSO_NEGADO` ao aprovar a própria reserva e `APROVACAO_APOS_INICIO`), outro Responsável podendo decidir, e Solicitante e Administrador com acesso negado, sem o item do menu e sem consultar a fila. Mais um fluxo só com teclado. Como no modo `reservas`, o pedido "já iniciado" começa 4 a 5 minutos depois do início do script, que espera por ele: a rodada leva cerca de 8 minutos, só funciona em dia útil entre 07:00 e 22:00 no campus e precisa de banco limpo |

Saída: capturas (`.jpg` da janela e `-completa.png` da página) e `relatorio.json` (violações do axe, verificações
incompletas, paradas de Tab e conferências).

## Pré-requisitos

Java 21, Docker, Node 22.12 ou mais novo, Python 3 e o Chromium do Playwright
(`cd frontend && npm ci --ignore-scripts && npx playwright install chromium`).

## Passo a passo (Git Bash, na raiz do repositório)

```bash
R=docs/testes/roteiro-navegador-real
mkdir -p $R/local

# 1. Credenciais descartáveis, só nesta pasta local (ignorada pelo Git)
python -c "
import secrets
v = {'PGDB': 'roteiro', 'PGUSER': 'roteiro', 'PGPASS': secrets.token_urlsafe(18),
     'ADMIN_EMAIL': 'admin@exemplo.test', 'ADMIN_SENHA': secrets.token_urlsafe(18) + 'Aa1',
     'SOL_SENHA': secrets.token_urlsafe(18) + 'Aa1', 'RESP_SENHA': secrets.token_urlsafe(18) + 'Aa1'}
open('$R/local/proto.env', 'w').write(''.join(f'{k}={x}\n' for k, x in v.items()))
"

# 2. PostgreSQL descartável (mesma imagem fixada no compose.yaml), porta própria, sem volume
set -a; . $R/local/proto.env; set +a
docker run -d --name pg-roteiro -p 127.0.0.1:55432:5432 \
  -e POSTGRES_DB=$PGDB -e POSTGRES_USER=$PGUSER -e POSTGRES_PASSWORD=$PGPASS \
  postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3

# 3. API real, com CORS liberado para a origem do front de prévia
export DB_URL=jdbc:postgresql://localhost:55432/$PGDB DB_USER=$PGUSER DB_PASSWORD=$PGPASS \
  SESSAO_DURACAO=PT3H LOGIN_TENTATIVAS=5 LOGIN_JANELA=PT10M CORS_ORIGENS=http://localhost:4173 \
  BOOTSTRAP_ADMIN_EMAIL=$ADMIN_EMAIL BOOTSTRAP_ADMIN_SENHA=$ADMIN_SENHA
./mvnw -B -ntp clean spring-boot:run        # deixe rodando; espere GET http://localhost:8080/actuator/health = UP

# 4. Front de produção apontando para a API (em outro terminal)
cd frontend && VITE_API_URL=http://localhost:8080 npm run build \
  && npx vite preview --port 4173 --strictPort --host 127.0.0.1   # use http://localhost:4173, não 127.0.0.1 (CORS)

# 5. Dados fictícios e roteiro (em outro terminal, na raiz)
python docs/testes/roteiro-navegador-real/semear.py
DESLOCAMENTO=7 node docs/testes/roteiro-navegador-real/prototipo.cjs /tmp/saida-roteiro tudo
```

Modo só do Login: `node docs/testes/roteiro-navegador-real/prototipo.cjs <pasta-de-saida-absoluta> login`. O e-mail da recusa é inexistente, para não gastar as 5 tentativas de uma conta real.

Se o `docker run` recusar a porta 55432 ("permissões de acesso"), o Windows a reservou: veja `netsh interface ipv4 show excludedportrange protocol=tcp` e use outra, como 35432 (ajuste `DB_URL`).

Para repetir no mesmo banco, troque `DESLOCAMENTO` (o roteiro cria reservas de verdade), ou apague o contêiner e
recomece no passo 2.

## Como encerrar sem derrubar nada que não seja seu

Não use `taskkill /IM node.exe` nem equivalentes: eles derrubam todos os processos da máquina. Encerre só o que você
subiu, pelo PID dono da porta (`netstat -ano | grep :4173`, `:8080`) e remova o contêiner (`docker rm -f pg-roteiro`).

## Resultado da última execução

Registrado na [RTM](../../../RTM.md), execução E-6: 48 estados auditados pelo axe com 0 violações; 24 verificações de
`color-contrast` incompletas, todas no glifo decorativo do aviso (`aria-hidden`); 47 paradas de Tab sem mouse, com foco
visível em todas (as 4 no ícone do calendário usam o anel do navegador, conferido por captura); nenhuma rolagem
horizontal. O controle positivo do axe (uma página com contraste ruim de propósito) foi acusado, o que mostra que a
auditoria enxerga o problema.

## Limites

- Manual, e não roda na CI (6.D).
- Os dados são fictícios e descartáveis; nenhum dado pessoal real.
- O foco no ícone do calendário é o anel do navegador: o roteiro o confere por captura, não por estilo calculado.
