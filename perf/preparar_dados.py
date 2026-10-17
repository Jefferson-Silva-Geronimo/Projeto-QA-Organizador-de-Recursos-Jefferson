"""Prepara o banco local para a rodada de carga e gera os CSV do JMeter.

Cria 5 salas e 50 Solicitantes fictícios pela API e grava perf/alvos.csv (100 pares sala x janela de 1 hora, em
dias úteis futuros dentro do funcionamento da sala). Só roda contra a aplicação LOCAL.

Variáveis de ambiente (nenhuma é versionada):
  ADMIN_EMAIL, ADMIN_SENHA  Administrador já existente (o mesmo do BOOTSTRAP_ADMIN_*)
  CARGA_SENHA               senha dos 50 usuários fictícios (mínimo de 8 caracteres)
  BASE_URL                  padrão http://localhost:8080
"""
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta, timezone

BASE = os.environ.get("BASE_URL", "http://localhost:8080")
if not BASE.startswith(("http://localhost", "http://127.0.0.1")):
    sys.exit("Recusado: a carga só roda contra a aplicação local.")

USUARIOS = 50
SALAS = 5
DIAS = 4
HORAS = [8, 9, 10, 11, 12]          # janelas de 1 hora, horário local
UTC_MENOS_3 = timezone(timedelta(hours=-3))   # America/Sao_Paulo, sem horário de verão desde 2019


def chamar(metodo, caminho, corpo=None, token=None):
    cabecalhos = {"Content-Type": "application/json"}
    if token:
        cabecalhos["Authorization"] = "Bearer " + token
    dados = json.dumps(corpo).encode("utf-8") if corpo is not None else None
    req = urllib.request.Request(BASE + caminho, data=dados, method=metodo, headers=cabecalhos)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            texto = resp.read().decode("utf-8")
            return resp.status, (json.loads(texto) if texto else None)
    except urllib.error.HTTPError as erro:
        return erro.code, None


def principal():
    email, senha, senha_carga = (os.environ.get(n) for n in ("ADMIN_EMAIL", "ADMIN_SENHA", "CARGA_SENHA"))
    if not (email and senha and senha_carga):
        sys.exit("Defina ADMIN_EMAIL, ADMIN_SENHA e CARGA_SENHA no ambiente.")
    if len(senha_carga) < 8:
        sys.exit("CARGA_SENHA precisa de ao menos 8 caracteres.")

    status, login = chamar("POST", "/api/auth/login", {"email": email, "senha": senha})
    if status != 200:
        sys.exit(f"Login do administrador falhou (HTTP {status}).")
    token = login["token"]

    salas = []
    for n in range(1, SALAS + 1):
        status, sala = chamar("POST", "/api/salas", {
            "nome": f"Sala de carga {n}", "capacidade": 30, "localizacao": "Bloco de carga",
            "tipoSala": "AULA", "horaAbertura": "07:00", "horaFechamento": "22:00",
            "diasFuncionamento": [1, 2, 3, 4, 5], "restrito": False}, token)
        if status not in (200, 201):
            sys.exit(f"Criação da sala {n} falhou (HTTP {status}). O banco já foi preparado?")
        salas.append(sala["id"])

    emails = []
    for n in range(1, USUARIOS + 1):
        em = f"carga{n:02d}@exemplo.test"
        status, _ = chamar("POST", "/api/usuarios", {
            "nome": f"Usuário de carga {n:02d}", "email": em, "senha": senha_carga, "perfil": "SOLICITANTE"}, token)
        if status not in (200, 201):
            sys.exit(f"Criação do usuário {em} falhou (HTTP {status}).")
        emails.append(em)

    with open(os.path.join("perf", "usuarios.csv"), "w", encoding="utf-8", newline="\n") as f:
        f.write("email\n" + "\n".join(emails) + "\n")

    hoje = date.today()
    primeiro = hoje + timedelta(days=(7 - hoje.weekday()) % 7 or 7)   # próxima segunda-feira
    linhas = ["salaId,inicio,fim"]
    for d in range(DIAS):
        dia = primeiro + timedelta(days=d)
        for h in HORAS:
            ini = datetime(dia.year, dia.month, dia.day, h, 0, tzinfo=UTC_MENOS_3).astimezone(timezone.utc)
            fim = ini + timedelta(hours=1)
            for sala in salas:
                linhas.append(f"{sala},{ini:%Y-%m-%dT%H:%M:%SZ},{fim:%Y-%m-%dT%H:%M:%SZ}")
    with open(os.path.join("perf", "alvos.csv"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(linhas) + "\n")
    print(f"{len(salas)} salas, {len(emails)} usuários e {len(linhas) - 1} alvos preparados.")


if __name__ == "__main__":
    principal()
