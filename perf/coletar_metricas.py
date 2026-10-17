"""Coleta métricas da aplicação local durante uma rodada de carga (rodada 02 em diante).

Consulta o endpoint /actuator/metrics a cada INTERVALO segundos e grava um CSV. Só roda contra a aplicação LOCAL.
A aplicação precisa ter sido iniciada com MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,metrics (variável de ambiente
só da rodada; o application.yml continua expondo apenas health).

Variáveis de ambiente: BASE_URL, ADMIN_EMAIL, ADMIN_SENHA. Argumentos: arquivo de saída e duração em segundos.
"""
import csv
import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone

BASE = os.environ.get("BASE_URL", "http://127.0.0.1:18080")
if not BASE.startswith(("http://localhost", "http://127.0.0.1")):
    sys.exit("Recusado: a coleta só roda contra a aplicação local.")
INTERVALO = 5
METRICAS = [
    "system.cpu.usage",              # CPU da máquina inteira (JMeter, Docker e aplicação juntos)
    "process.cpu.usage",             # CPU só da JVM da aplicação
    "hikaricp.connections.active",   # conexões do pool em uso
    "hikaricp.connections.pending",  # threads esperando uma conexão do pool
    "hikaricp.connections.max",      # tamanho máximo do pool
    "jvm.threads.live",
    "jvm.memory.used",
]


def chamar(caminho, corpo=None, token=None):
    cab = {"Content-Type": "application/json"}
    if token:
        cab["Authorization"] = "Bearer " + token
    req = urllib.request.Request(BASE + caminho, data=json.dumps(corpo).encode() if corpo else None,
                                 method="POST" if corpo else "GET", headers=cab)
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode())


def valor(token, nome):
    try:
        medidas = chamar("/actuator/metrics/" + nome, token=token)["measurements"]
        return next((m["value"] for m in medidas if m["statistic"] in ("VALUE", "COUNT")), "")
    except Exception:
        return ""


def principal():
    saida, duracao = sys.argv[1], int(sys.argv[2])
    token = chamar("/api/auth/login", {"email": os.environ["ADMIN_EMAIL"], "senha": os.environ["ADMIN_SENHA"]})["token"]
    fim = time.time() + duracao
    with open(saida, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["instante_utc"] + METRICAS)
        while time.time() < fim:
            w.writerow([datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")] + [valor(token, m) for m in METRICAS])
            f.flush()
            time.sleep(INTERVALO)


if __name__ == "__main__":
    principal()
