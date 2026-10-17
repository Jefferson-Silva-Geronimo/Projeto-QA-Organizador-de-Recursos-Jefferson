# Teste de mutação (PIT), Fase 4

Relatório apenas. Não há gate de mutação: o PIT não roda no `verify` e nenhuma meta de pontuação foi fixada
(a especificação, nas seções lidas para o plano, não exige mutation testing; medir é decisão da equipe, a validar com o professor).

## Como executar

```bash
./mvnw -B test-compile org.pitest:pitest-maven:mutationCoverage
```

Relatório em `target/pit-reports/index.html` (não versionado). Configuração no `pom.xml`: `pitest-maven` 1.29.10
com `pitest-junit5-plugin` 1.2.3.

## Alcance

| Item | Valor | Motivo |
| --- | --- | --- |
| Classes mutadas | `br.senac.recursos.model.*` (inclui `model.regra`) | Domínio e regras de período, sobreposição, estados, política de alteração e cancelamento, janela e horas de funcionamento |
| Testes usados | `br.senac.recursos.model.*` | Testes de unidade rápidos e sem banco. Os `*IT` (banco real) ficam de fora porque o PIT repete a suíte por mutante |
| Nenhuma classe do alcance foi excluída | | A exclusão de classe relevante para subir o número é proibida |

Limite do alcance: a regra de sobreposição de **concorrência** vive na constraint de exclusão do PostgreSQL
(ADR-003) e é provada pelos testes de integração (CT-060 a CT-065), que o PIT não alcança. O PIT mede a regra de
sobreposição em código, `Periodo.sobrepoe`.

## Números (execução de 17/10/2026)

| Execução | Mutantes | Mortos | Sobreviventes | Sem cobertura | Pontuação |
| --- | --- | --- | --- | --- | --- |
| Antes dos testes novos | 61 | 45 | 0 | 16 | 74% |
| Depois dos testes novos e da remoção de código morto | 78 | 60 | 0 | 18 | 77% |

A cobertura de linha das classes mutadas passou de 67% (68/101) para 85% (90/106). A "força do teste" (mortos
sobre cobertos) é de 100% nas duas execuções: **nenhum mutante coberto sobreviveu**.

O total de mutantes subiu de 61 para 78 porque `ReservaTest` e os demais testes novos passaram a cobrir classes
antes não alcançadas, e o PIT só gera mutantes em código coberto.

### Por classe (depois)

| Classe | Mutantes | Mortos | Sem cobertura |
| --- | --- | --- | --- |
| `EstadoReserva` | 6 | 6 | 0 |
| `EventoAuditoria` | 4 | 4 | 0 |
| `Periodo` | 7 | 7 | 0 |
| `regra.HorasDeFuncionamento` | 6 | 6 | 0 |
| `regra.MaquinaDeEstados` | 4 | 4 | 0 |
| `regra.PoliticaDeAlteracao` | 7 | 7 | 0 |
| `regra.PoliticaDeCancelamento` | 20 | 20 | 0 |
| `regra.RegrasDeReserva` | 1 | 1 | 0 |
| `regra.JanelaDeFuncionamento` | 7 | 4 | 3 |
| `Reserva` | 12 | 1 | 11 |
| `NovaReserva` | 4 | 0 | 4 |

## Classificação dos 16 mutantes iniciais sem cobertura

Nenhum mutante sobreviveu; os 16 não eram exercidos por teste de unidade.

| Mutante | Classificação | Ação |
| --- | --- | --- |
| `HorasDeFuncionamento.calcular` (6 mutantes: condições de dia e de janela, e retorno) | **Lacuna de risco.** Define o denominador da utilização (RN-31, R-11) e só tinha cobertura pelo teste de integração CT-110 | `HorasDeFuncionamentoTest`: trinca na abertura e no fechamento, dias úteis e fim de semana, fim exclusivo na meia-noite, fuso da sala em vez de UTC, sem dias de funcionamento |
| `EventoAuditoria.deUsuario`, `deSistema`, `transicaoDeUsuario`, `transicaoDoSistema` | **Lacuna de risco.** Montam o evento de auditoria de RN-08 (ator USUARIO com identificador, SISTEMA sem identificador, estados da transição) | `EventoAuditoriaTest`: um teste por fábrica, com asserção de cada campo |
| `Reserva.periodo` | **Lacuna de risco baixa.** Alimenta a comparação de período na alteração | `ReservaTest` |
| `EstadoReserva.ocupaRecurso` (4 mutantes) | **Código morto.** Nenhum uso em `src/main`; a ocupação é decidida pela coluna `ativa` e pela constraint (ADR-003) | Removido em commit `refactor`, com `verify` verde antes e depois |
| `Periodo.duracao` | **Código morto.** Nenhum uso em `src/main` (o `duracao()` de `SegurancaConfig` é outro tipo) | Removido no mesmo commit |

## Classificação dos 18 sem cobertura que restam

Todos são acessores gerados de `record` (`Reserva`, `NovaReserva`, `JanelaDeFuncionamento`). Não contêm regra:
o compilador os gera e a mutação troca o retorno por `null`, `0` ou vazio. Os testes de integração os exercem em
produção. **Classificação: cosmética.** Escrever teste só para chamar acessor subiria o número sem proteger
comportamento, o que a regra do plano proíbe (seção 8.1, item 6). Eles aparecem agora, e não antes, porque as
classes passaram a ser cobertas por teste de unidade.

## Limites desta evidência

- Os testes novos foram escritos **depois** do código e passaram de primeira. Não são vermelhos de TDD e não
  constam em `evidencia-tdd.md` como tal; entram aqui como testes de caracterização de comportamento.
- A pontuação de 77% mede só o pacote `model`. Não mede `service`, `controller` nem `repository`.
- Não há meta de mutação definida; os números servem de referência para a Fase 5.
