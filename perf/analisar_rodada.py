"""Analisa uma rodada de carga: percentis por operação (rodada inteira e só o regime), 409 separado de erro real e
resumo das métricas da aplicação. Uso: python perf/analisar_rodada.py <rodada.jtl> [metricas.csv]

Regime = depois dos primeiros 35 s (ramp-up de 30 s mais folga)."""
import collections
import csv
import sys

ARRANQUE_MS = 35000


def percentil(valores, q):
    v = sorted(valores)
    k = (len(v) - 1) * q
    f = int(k)
    c = min(f + 1, len(v) - 1)
    return v[f] + (v[c] - v[f]) * (k - f)


def linha(rotulo, v, duracao):
    return (f"{rotulo:26s} n={len(v):6d} p50={percentil(v, .5):6.0f} p95={percentil(v, .95):6.0f} "
            f"p99={percentil(v, .99):6.0f} max={max(v):6d} vazao={len(v) / duracao:6.1f}/s")


def principal():
    jtl = sys.argv[1]
    linhas = list(csv.DictReader(open(jtl, encoding='utf-8')))
    t0 = min(int(r['timeStamp']) for r in linhas)
    duracao = (max(int(r['timeStamp']) for r in linhas) - t0) / 1000
    print(f"amostras: {len(linhas)} | duração observada: {duracao:.1f} s")
    inteira = collections.defaultdict(list)
    regime = collections.defaultdict(list)
    codigos = collections.defaultdict(collections.Counter)
    for r in linhas:
        inteira[r['label']].append(int(r['elapsed']))
        codigos[r['label']][r['responseCode']] += 1
        if int(r['timeStamp']) - t0 >= ARRANQUE_MS and r['label'] != 'login':
            regime[r['label']].append(int(r['elapsed']))
    print("\nRODADA INTEIRA")
    for rotulo, v in sorted(inteira.items()):
        print(" ", linha(rotulo, v, duracao), dict(codigos[rotulo]))
    print("\nSÓ O REGIME")
    for rotulo, v in sorted(regime.items()):
        print(" ", linha(rotulo, v, duracao - ARRANQUE_MS / 1000))
    erros = sum(1 for r in linhas if (r['label'] == 'consulta-disponibilidade' and r['responseCode'] != '200')
                or (r['label'] == 'criar-reserva' and r['responseCode'] not in ('201', '409'))
                or (r['label'] == 'login' and r['responseCode'] != '200'))
    print(f"\nerros reais: {erros} de {len(linhas)} | respostas 500: {sum(1 for r in linhas if r['responseCode'] == '500')}")
    por_min = collections.defaultdict(list)
    for r in linhas:
        if r['label'] == 'criar-reserva':
            por_min[(int(r['timeStamp']) - t0) // 60000].append(int(r['elapsed']))
    print("p95 da criação por minuto:", {k: round(percentil(v, .95)) for k, v in sorted(por_min.items())})
    if len(sys.argv) > 2:
        todas = list(csv.DictReader(open(sys.argv[2], encoding='utf-8')))
        # linhas incompletas (coletor órfão com token inválido, linha misturada) são descartadas e contadas
        m = [x for x in todas if None not in x and all(v not in ('', None) for v in x.values())
             and len(x['instante_utc']) == 20]
        print(f"\nMÉTRICAS DA APLICAÇÃO (amostras a cada 5 s; {len(m)} válidas, {len(todas) - len(m)} descartadas)")
        for nome in m[0].keys():
            if nome == 'instante_utc':
                continue
            vals = [float(x[nome]) for x in m if x[nome] not in ('', None)]
            if vals:
                print(f"  {nome:30s} média={sum(vals) / len(vals):12.3f} máx={max(vals):12.3f} (n={len(vals)})")


if __name__ == '__main__':
    principal()
