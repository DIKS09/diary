from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import random

app = Flask(__name__)
CORS(app)

# Подключение к MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['diary_db']
entries_collection = db['entries']
users_collection = db['users']

# Список иконок для случайного выбора (ключи)
ICON_KEYS = [
    'pen', 'book', 'heart', 'star', 'lightbulb', 
    'feather', 'quote', 'bookOpen', 'scroll', 'clock',
    'nature', 'sunny', 'night', 'cloud', 'flower',
    'journal', 'iobook', 'create', 'pencil', 'bibookopen'
]

def get_random_icon_key():
    return random.choice(ICON_KEYS)

# Регистрация пользователя (простая, без хеширования - учебный пример)
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Проверяем, существует ли пользователь
        if users_collection.find_one({'username': username}):
            return jsonify({'error': 'Username already exists'}), 400
        
        # Создаем пользователя (пароль в открытом виде - учебный пример!)
        user = {
            'username': username,
            'password': password,  # В реальном проекте нужно хешировать!
            'created_at': datetime.now().isoformat()
        }
        
        result = users_collection.insert_one(user)
        user_id = str(result.inserted_id)
        
        return jsonify({
            'message': 'User created successfully',
            'user_id': user_id,
            'username': username
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Вход пользователя
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Находим пользователя
        user = users_collection.find_one({'username': username})
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Проверяем пароль (простое сравнение - учебный пример!)
        if user['password'] != password:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        return jsonify({
            'message': 'Login successful',
            'user_id': str(user['_id']),
            'username': username
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Получить все записи текущего пользователя
@app.route('/api/entries', methods=['GET'])
def get_entries():
    try:
        # Получаем user_id из параметров запроса
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401
        
        entries = list(entries_collection.find({'user_id': user_id}).sort('date', -1))
        # Конвертируем ObjectId в строку для JSON
        for entry in entries:
            entry['_id'] = str(entry['_id'])
        return jsonify(entries), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Создать новую запись
@app.route('/api/entries', methods=['POST'])
def create_entry():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401
        
        new_entry = {
            'user_id': user_id,
            'title': data.get('title'),
            'content': data.get('content'),
            'date': datetime.now().isoformat(),
            'icon': get_random_icon_key()
        }
        
        result = entries_collection.insert_one(new_entry)
        new_entry['_id'] = str(result.inserted_id)
        
        return jsonify(new_entry), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Обновить запись
@app.route('/api/entries/<entry_id>', methods=['PUT'])
def update_entry(entry_id):
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401
        
        # Проверяем, что запись принадлежит пользователю
        entry = entries_collection.find_one({'_id': ObjectId(entry_id), 'user_id': user_id})
        if not entry:
            return jsonify({'error': 'Entry not found'}), 404
        
        update_data = {
            'title': data.get('title'),
            'content': data.get('content'),
        }
        
        result = entries_collection.update_one(
            {'_id': ObjectId(entry_id), 'user_id': user_id},
            {'$set': update_data}
        )
        
        # Получаем обновленную запись
        updated_entry = entries_collection.find_one({'_id': ObjectId(entry_id)})
        updated_entry['_id'] = str(updated_entry['_id'])
        
        return jsonify(updated_entry), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Удалить запись
@app.route('/api/entries/<entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401
        
        result = entries_collection.delete_one({'_id': ObjectId(entry_id), 'user_id': user_id})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Entry not found'}), 404
        
        return jsonify({'message': 'Entry deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Проверка здоровья сервера
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Server is running'}), 200

if __name__ == '__main__':
    print("Starting Flask server...")
    print("MongoDB connected to: diary_db")
    app.run(debug=True, port=5000, host='0.0.0.0')

