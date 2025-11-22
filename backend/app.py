from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import random
import requests
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

# Отладочная информация при запуске
print("=" * 50)
print("Проверка переменных окружения:")
bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
chat_id = os.getenv('TELEGRAM_CHAT_ID')
print(f"TELEGRAM_BOT_TOKEN загружен: {'Да' if bot_token else 'Нет'}")
print(f"TELEGRAM_CHAT_ID загружен: {'Да' if chat_id else 'Нет'}")
if bot_token:
    print(f"Токен начинается с: {bot_token[:10]}...")
if chat_id:
    print(f"Chat ID: {chat_id}")
print("=" * 50)

app = Flask(__name__)
CORS(app)

# Подключение к MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['diary_db']
entries_collection = db['entries']
users_collection = db['users']
habits_collection = db['habits']

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
            return jsonify({'error': 'Имя пользователя и пароль обязательны'}), 400
        
        # Проверяем, существует ли пользователь
        if users_collection.find_one({'username': username}):
            return jsonify({'error': 'Пользователь с таким именем уже существует'}), 400
        
        # Создаем пользователя (пароль в открытом виде - учебный пример!)
        user = {
            'username': username,
            'password': password,  # В реальном проекте нужно хешировать!
            'created_at': datetime.now().isoformat()
        }
        
        result = users_collection.insert_one(user)
        user_id = str(result.inserted_id)
        
        return jsonify({
            'message': 'Пользователь успешно создан',
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
            return jsonify({'error': 'Имя пользователя и пароль обязательны'}), 400
        
        # Находим пользователя
        user = users_collection.find_one({'username': username})
        
        if not user:
            return jsonify({'error': 'Неверное имя пользователя или пароль'}), 401
        
        # Проверяем пароль (простое сравнение - учебный пример!)
        if user['password'] != password:
            return jsonify({'error': 'Неверное имя пользователя или пароль'}), 401
        
        return jsonify({
            'message': 'Вход выполнен успешно',
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
            return jsonify({'error': 'Требуется авторизация'}), 401
        
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
            return jsonify({'error': 'Требуется авторизация'}), 401
        
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
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        # Проверяем, что запись принадлежит пользователю
        entry = entries_collection.find_one({'_id': ObjectId(entry_id), 'user_id': user_id})
        if not entry:
            return jsonify({'error': 'Запись не найдена'}), 404
        
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
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        result = entries_collection.delete_one({'_id': ObjectId(entry_id), 'user_id': user_id})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Запись не найдена'}), 404
        
        return jsonify({'message': 'Запись успешно удалена'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Проверка здоровья сервера
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Сервер работает'}), 200

# Отправка обратной связи в Telegram
@app.route('/api/feedback', methods=['POST'])
def send_feedback():
    try:
        data = request.json
        name = data.get('name', 'Аноним')
        email = data.get('email', 'Не указан')
        message = data.get('message', '')
        
        if not message:
            return jsonify({'error': 'Сообщение не может быть пустым'}), 400
        
        # Получаем токен и chat_id из переменных окружения
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        chat_id = os.getenv('TELEGRAM_CHAT_ID')
        
        if not bot_token or not chat_id:
            return jsonify({'error': 'Telegram бот не настроен. Обратитесь к администратору.'}), 500
        
        # Формируем текст сообщения
        telegram_message = f"""
🔔 <b>Новое сообщение обратной связи</b>

👤 <b>Имя:</b> {name}
📧 <b>Email:</b> {email}

💬 <b>Сообщение:</b>
{message}

⏰ <b>Время:</b> {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}
"""
        
        # Отправляем сообщение в Telegram
        telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
        telegram_data = {
            'chat_id': chat_id,
            'text': telegram_message,
            'parse_mode': 'HTML'
        }
        
        response = requests.post(telegram_url, json=telegram_data, timeout=10)
        
        if response.status_code != 200:
            print(f"Telegram API error: {response.text}")
            return jsonify({'error': 'Не удалось отправить сообщение. Попробуйте позже.'}), 500
        
        return jsonify({
            'message': 'Сообщение успешно отправлено',
            'success': True
        }), 200
        
    except requests.exceptions.RequestException as e:
        print(f"Network error: {str(e)}")
        return jsonify({'error': 'Ошибка сети. Проверьте подключение к интернету.'}), 500
    except Exception as e:
        print(f"Error sending feedback: {str(e)}")
        return jsonify({'error': 'Произошла ошибка при отправке сообщения.'}), 500

# ===== HABITS ENDPOINTS =====

# Получить все привычки пользователя
@app.route('/api/habits', methods=['GET'])
def get_habits():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        habits = list(habits_collection.find({'user_id': user_id}))
        
        for habit in habits:
            habit['_id'] = str(habit['_id'])
        
        return jsonify(habits), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Создать новую привычку
@app.route('/api/habits', methods=['POST'])
def create_habit():
    try:
        data = request.json
        user_id = data.get('user_id')
        name = data.get('name')
        
        if not user_id or not name:
            return jsonify({'error': 'Требуется название привычки'}), 400
        
        new_habit = {
            'user_id': user_id,
            'name': name,
            'completed_dates': [],
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = habits_collection.insert_one(new_habit)
        new_habit['_id'] = str(result.inserted_id)
        
        return jsonify(new_habit), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Переключить выполнение привычки (добавить/удалить дату)
@app.route('/api/habits/<habit_id>/toggle', methods=['POST'])
def toggle_habit(habit_id):
    try:
        data = request.json
        user_id = data.get('user_id')
        date = data.get('date')  # формат: YYYY-MM-DD
        
        if not user_id or not date:
            return jsonify({'error': 'Требуется дата'}), 400
        
        habit = habits_collection.find_one({
            '_id': ObjectId(habit_id),
            'user_id': user_id
        })
        
        if not habit:
            return jsonify({'error': 'Привычка не найдена'}), 404
        
        completed_dates = habit.get('completed_dates', [])
        
        if date in completed_dates:
            # Удаляем дату (снимаем галочку)
            completed_dates.remove(date)
        else:
            # Добавляем дату (ставим галочку)
            completed_dates.append(date)
        
        habits_collection.update_one(
            {'_id': ObjectId(habit_id)},
            {'$set': {'completed_dates': completed_dates}}
        )
        
        updated_habit = habits_collection.find_one({'_id': ObjectId(habit_id)})
        updated_habit['_id'] = str(updated_habit['_id'])
        
        return jsonify(updated_habit), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Удалить привычку
@app.route('/api/habits/<habit_id>', methods=['DELETE'])
def delete_habit(habit_id):
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        result = habits_collection.delete_one({
            '_id': ObjectId(habit_id),
            'user_id': user_id
        })
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Привычка не найдена'}), 404
        
        return jsonify({'message': 'Привычка успешно удалена'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===== NEWS ENDPOINTS =====

# Получить новости по категории
@app.route('/api/news', methods=['GET'])
def get_news():
    try:
        category = request.args.get('category', 'technology')
        
        # Получаем API ключ из переменных окружения
        news_api_key = os.getenv('NEWS_API_KEY')
        
        if not news_api_key:
            # Если нет API ключа, возвращаем демо-новости
            return jsonify({
                'articles': [
                    {
                        'title': 'Настройте API ключ для получения новостей',
                        'description': 'Добавьте NEWS_API_KEY в файл .env для получения реальных новостей. Зарегистрируйтесь на newsapi.org',
                        'url': 'https://newsapi.org',
                        'urlToImage': None,
                        'publishedAt': datetime.now().isoformat(),
                        'source': {'name': 'Настройка'}
                    }
                ]
            }), 200
        
        # Формируем запрос к NewsAPI
        # Для русского языка используем эндпоинт 'everything' с поисковым запросом
        category_keywords = {
            'technology': 'технологии OR гаджеты OR IT',
            'business': 'бизнес OR экономика OR финансы',
            'science': 'наука OR исследования',
            'health': 'здоровье OR медицина',
            'sports': 'спорт OR футбол OR хоккей',
            'entertainment': 'развлечения OR кино OR музыка',
            'general': 'новости OR события'
        }
        
        keyword = category_keywords.get(category, 'новости')
        
        news_url = 'https://newsapi.org/v2/everything'
        params = {
            'apiKey': news_api_key,
            'q': keyword,
            'language': 'ru',
            'sortBy': 'publishedAt',
            'pageSize': 12
        }
        
        response = requests.get(news_url, params=params, timeout=10)
        
        if response.status_code != 200:
            print(f"NewsAPI error: {response.text}")
            return jsonify({'error': 'Не удалось загрузить новости'}), 500
        
        data = response.json()
        
        return jsonify({
            'articles': data.get('articles', [])
        }), 200
        
    except requests.exceptions.RequestException as e:
        print(f"Network error: {str(e)}")
        return jsonify({'error': 'Ошибка подключения к сервису новостей'}), 500
    except Exception as e:
        print(f"Error fetching news: {str(e)}")
        return jsonify({'error': 'Произошла ошибка при загрузке новостей'}), 500

# Получить предпочтения пользователя
@app.route('/api/user/preferences', methods=['GET'])
def get_user_preferences():
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        preferences = {
            'news_category': user.get('news_category', 'technology')
        }
        
        return jsonify(preferences), 200
        
    except Exception as e:
        print(f"Error getting preferences: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Сохранить предпочтения пользователя
@app.route('/api/user/preferences', methods=['POST'])
def save_user_preferences():
    try:
        data = request.json
        user_id = data.get('user_id')
        news_category = data.get('news_category')
        
        if not user_id:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'news_category': news_category}}
        )
        
        return jsonify({
            'message': 'Предпочтения сохранены',
            'news_category': news_category
        }), 200
        
    except Exception as e:
        print(f"Error saving preferences: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Flask server...")
    print("MongoDB connected to: diary_db")
    app.run(debug=True, port=5000, host='0.0.0.0')

