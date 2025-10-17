import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import jwt
from datetime import datetime, timedelta
import mysql.connector
from mysql.connector.errors import IntegrityError

# --- CONFIGURAÇÃO INICIAL ---
app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = "sua-chave-secreta-muito-forte-para-jwt"

# --- CONEXÃO COM O BANCO DE DADOS ---
# (Lembre-se de criar um arquivo config.py para a conexão ou colocar os dados aqui)
try:
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='senai', # Coloque sua senha do MySQL aqui
        database='edutech'
    )
    cursor = conn.cursor(dictionary=True)
    print(">>> Conexão com o banco de dados estabelecida com sucesso!")
except mysql.connector.Error as err:
    print(f">>> ERRO ao conectar com o banco: {err}")
    conn, cursor = None, None

# --- DECORATORS (MIDDLEWARES) DE AUTENTICAÇÃO ---
def admin_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('x-access-token')
        if not token:
            return jsonify({'message': 'Token de administrador é necessário!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            if data.get('role') != 'admin':
                return jsonify({'message': 'Permissão de administrador necessária!'}), 403
            # Passa os dados do admin para a função da rota
            current_admin = {'id_instituicao': data['id_instituicao']}
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return jsonify({'message': 'Token inválido ou expirado!'}), 401
        return f(current_admin, *args, **kwargs)
    return decorated

# --- ROTAS FREEMIUM (NÃO PRECISAM DE LOGIN) ---
@app.route('/conteudo/<string:theme>/<string:content_type>', methods=['GET'])
def get_freemium_content(theme, content_type):
    if theme not in ['filosofia', 'sociologia'] or content_type not in ['flashcards', 'quiz']:
        return jsonify({"error": "Caminho inválido."}), 400
    file_path = os.path.join('conteudo', theme, f'{content_type}.json')
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return jsonify(data), 200
    except FileNotFoundError:
        return jsonify({"error": f"Arquivo não encontrado."}), 404

# --- ROTAS DE ADMINISTRADOR (INSTITUIÇÃO) ---

@app.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    email, senha = data.get('email'), data.get('senha')
    if not email or not senha:
        return jsonify({'error': 'Email e senha são obrigatórios.'}), 400

    cursor.execute('SELECT id_instituicao, nome_instituicao FROM Instituicao WHERE email_contato = %s AND senha = %s', (email, senha))
    instituicao = cursor.fetchone()

    if not instituicao:
        return jsonify({'error': 'Credenciais de administrador inválidas.'}), 401

    token = jwt.encode({
        'id_instituicao': instituicao['id_instituicao'],
        'role': 'admin',
        'exp': datetime.utcnow() + timedelta(hours=8)
    }, app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({'message': 'Login de administrador bem-sucedido!', 'token': token, 'instituicao': instituicao}), 200

@app.route('/admin/alunos', methods=['GET'])
@admin_token_required
def listar_alunos(current_admin):
    id_instituicao = current_admin['id_instituicao']
    cursor.execute("SELECT id_usuario, nome, email, tipo_plano FROM Usuario WHERE id_instituicao = %s", (id_instituicao,))
    alunos = cursor.fetchall()
    return jsonify(alunos), 200

@app.route('/admin/alunos', methods=['POST'])
@admin_token_required
def cadastrar_aluno(current_admin):
    id_instituicao = current_admin['id_instituicao']
    data = request.get_json()
    nome, email, senha, tipo_plano = data.get('nome'), data.get('email'), data.get('senha'), data.get('tipo_plano', 'premium')
    if not all([nome, email, senha]):
        return jsonify({'error': 'Nome, email e senha são obrigatórios.'}), 400
    try:
        cursor.execute('INSERT INTO Usuario (nome, email, senha, tipo_plano, id_instituicao) VALUES (%s, %s, %s, %s, %s)',
                       (nome, email, senha, tipo_plano, id_instituicao))
        conn.commit()
        return jsonify({'message': f'Aluno {nome} cadastrado com sucesso.'}), 201
    except IntegrityError:
        return jsonify({'error': 'Este email já está cadastrado.'}), 409

@app.route('/admin/alunos/<int:id_usuario>', methods=['DELETE'])
@admin_token_required
def excluir_aluno(current_admin, id_usuario):
    id_instituicao = current_admin['id_instituicao']
    # Garante que o admin só pode deletar alunos da sua própria instituição
    cursor.execute('DELETE FROM Usuario WHERE id_usuario = %s AND id_instituicao = %s', (id_usuario, id_instituicao))
    conn.commit()
    if cursor.rowcount == 0:
        return jsonify({'error': 'Aluno não encontrado ou não pertence a esta instituição.'}), 404
    return jsonify({'message': 'Aluno excluído com sucesso.'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)