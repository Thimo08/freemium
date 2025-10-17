import os
import json
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- ROTAS DE CONTEÚDO FREEMIUM (POR TEMA) ---

@app.route('/conteudo/<string:theme>/flashcards', methods=['GET'])
def get_flashcards(theme):
    """Lê e retorna o conteúdo de flashcards para um tema específico."""
    # Validação de segurança para garantir que apenas as pastas permitidas sejam acessadas
    if theme not in ['filosofia', 'sociologia']:
        return jsonify({"error": "Tema inválido."}), 400

    file_path = os.path.join('conteudo', theme, 'flashcards.json')
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return jsonify(data), 200
    except FileNotFoundError:
        return jsonify({"error": f"Arquivo de flashcards para '{theme}' não encontrado."}), 404
    except Exception as e:
        return jsonify({"error": f"Erro ao processar o arquivo: {str(e)}"}), 500

@app.route('/conteudo/<string:theme>/quiz', methods=['GET'])
def get_quiz(theme):
    """Lê e retorna o conteúdo do quiz para um tema específico."""
    if theme not in ['filosofia', 'sociologia']:
        return jsonify({"error": "Tema inválido."}), 400
        
    file_path = os.path.join('conteudo', theme, 'quiz.json')
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return jsonify(data), 200
    except FileNotFoundError:
        return jsonify({"error": f"Arquivo de quiz para '{theme}' não encontrado."}), 404
    except Exception as e:
        return jsonify({"error": f"Erro ao processar o arquivo: {str(e)}"}), 500

@app.route('/')
def index():
    return 'API Freemium RePensei - ON', 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)