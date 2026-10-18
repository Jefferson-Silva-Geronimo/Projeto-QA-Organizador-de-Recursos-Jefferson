"""Semeia dados fictícios pela API real para o roteiro de navegador real (etapa 6.C).

As credenciais vêm de local/proto.env, que é gerado na hora e ignorado pelo Git (ver README.md desta pasta).
"""
import datetime
import json
import os
import sys
import urllib.error
import urllib.request

BASE = 'http://localhost:8080'
LOCAL = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'local')
env = dict(l.strip().split('=', 1) for l in open(os.path.join(LOCAL, 'proto.env'), encoding='utf-8') if '=' in l)


def chamar(metodo, caminho, corpo=None, token=None):
    dados = json.dumps(corpo).encode('utf-8') if corpo is not None else None
    req = urllib.request.Request(BASE + caminho, data=dados, method=metodo)
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', 'Bearer ' + token)
    try:
        with urllib.request.urlopen(req) as r:
            texto = r.read().decode('utf-8')
            return r.status, (json.loads(texto) if texto else None)
    except urllib.error.HTTPError as e:
        texto = e.read().decode('utf-8')
        return e.code, (json.loads(texto) if texto else None)


def entrar(email, senha):
    status, corpo = chamar('POST', '/api/auth/login', {'email': email, 'senha': senha})
    assert status == 200, (email, status, corpo)
    return corpo['token']


def exigir(status, corpo, esperado, o_que):
    assert status == esperado, f'{o_que}: {status} {corpo}'
    return corpo


adm = entrar(env['ADMIN_EMAIL'], env['ADMIN_SENHA'])
ids = {'usuarios': {}, 'recursos': {}, 'reservas': {}}

for chave, nome, email, perfil, senha in [
    ('solicitante', 'Maria Souza', 'maria.souza@exemplo.test', 'SOLICITANTE', env['SOL_SENHA']),
    ('solicitante2', 'João Pereira', 'joao.pereira@exemplo.test', 'SOLICITANTE', env['SOL_SENHA']),
    ('responsavel', 'Carlos Lima', 'carlos.lima@exemplo.test', 'RESPONSAVEL', env['RESP_SENHA']),
    ('responsavel2', 'Ana Prado', 'ana.prado@exemplo.test', 'RESPONSAVEL', env['RESP_SENHA']),
]:
    corpo = exigir(*chamar('POST', '/api/usuarios', {'nome': nome, 'email': email, 'senha': senha, 'perfil': perfil}, adm),
                   201, 'usuario ' + email)
    ids['usuarios'][chave] = {'id': corpo['id'], 'email': email}

DIAS = [1, 2, 3, 4, 5]
for chave, nome, cap, local, tipo, restrito in [
    ('sala101', 'Sala 101', 40, 'Bloco A, 1º andar', 'AULA', False),
    ('sala203', 'Sala 203', 30, 'Bloco B, 2º andar', 'AULA', False),
    ('lab3', 'Laboratório de Informática 3', 24, 'Bloco C, térreo', 'LABORATORIO', True),
    ('auditorio', 'Auditório Central', 120, 'Bloco A, térreo', 'AUDITORIO', True),
]:
    corpo = exigir(*chamar('POST', '/api/salas', {
        'nome': nome, 'capacidade': cap, 'localizacao': local, 'tipoSala': tipo,
        'horaAbertura': '07:00', 'horaFechamento': '22:00', 'diasFuncionamento': DIAS, 'restrito': restrito}, adm),
        201, 'sala ' + nome)
    ids['recursos'][chave] = corpo['id']

for chave, nome, patrimonio, desc, restrito in [
    ('projetor', 'Projetor P-007', 'PAT-P007', 'Projetor Full HD com cabo HDMI', True),
    ('notebook', 'Notebook N-001', 'PAT-N001', 'Notebook com carregador', False),
    ('caixa', 'Caixa de som S-02', 'PAT-S002', 'Caixa de som portátil com microfone', False),
]:
    corpo = exigir(*chamar('POST', '/api/materiais', {
        'nome': nome, 'codigoPatrimonio': patrimonio, 'descricao': desc, 'restrito': restrito}, adm),
        201, 'material ' + nome)
    ids['recursos'][chave] = corpo['id']

for chave, nome, comp in [
    ('helena', 'Profa. Helena Costa', ['Matemática', 'Estatística']),
    ('ricardo', 'Prof. Ricardo Alves', ['Redes', 'Segurança da informação']),
]:
    corpo = exigir(*chamar('POST', '/api/professores', {'nome': nome, 'competencias': comp, 'restrito': False}, adm),
                   201, 'professor ' + nome)
    ids['recursos'][chave] = corpo['id']

# Uma reserva já existente da outra Solicitante, para mostrar horários ocupados: o terceiro dia útil a partir de hoje,
# das 14:00 às 16:00, na Sala 101 (hora do campus, -03:00).
def dia_util_adiante(n):
    d = datetime.date.today()
    while n > 0:
        d += datetime.timedelta(days=1)
        if d.weekday() < 5:
            n -= 1
    return d.isoformat()


OCUPADO = dia_util_adiante(3)
joao = entrar(ids['usuarios']['solicitante2']['email'], env['SOL_SENHA'])
corpo = exigir(*chamar('POST', '/api/reservas', {
    'titulo': 'Reunião de coordenação', 'inicio': OCUPADO + 'T14:00:00-03:00', 'fim': OCUPADO + 'T16:00:00-03:00',
    'recursoIds': [ids['recursos']['sala101']]}, joao), 201, 'reserva existente')
ids['reservas']['existente'] = corpo['id']

os.makedirs(LOCAL, exist_ok=True)
json.dump(ids, open(os.path.join(LOCAL, 'semente.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('semeado:', {k: len(v) for k, v in ids.items()})
