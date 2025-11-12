from pymongo import MongoClient
import random

# Подключение к MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['diary_db']
entries_collection = db['entries']

# Список иконок
ICON_KEYS = [
    'pen', 'book', 'heart', 'star', 'lightbulb', 
    'feather', 'quote', 'bookOpen', 'scroll', 'clock',
    'nature', 'sunny', 'night', 'cloud', 'flower',
    'journal', 'iobook', 'create', 'pencil', 'bibookopen'
]

def migrate_emoji_to_icons():
    # Найти все записи без поля icon
    entries_without_icon = entries_collection.find({'icon': {'$exists': False}})
    
    count = 0
    for entry in entries_without_icon:
        # Добавить случайную иконку
        random_icon = random.choice(ICON_KEYS)
        entries_collection.update_one(
            {'_id': entry['_id']},
            {'$set': {'icon': random_icon}}
        )
        count += 1
    
    print(f"Обновлено записей: {count}")
    print("Миграция завершена!")

if __name__ == '__main__':
    migrate_emoji_to_icons()

