# Backend для Diary Site

Backend API на Flask для работы с MongoDB.

## Установка

1. Создайте виртуальное окружение:
```bash
python -m venv venv
```

2. Активируйте виртуальное окружение:

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

3. Установите зависимости:
```bash
pip install -r requirements.txt
```

4. Убедитесь, что MongoDB запущена локально на порту 27017

## Запуск

```bash
python app.py
```

Сервер запустится на `http://localhost:5000`

## API Endpoints

### GET /api/entries
Получить все записи

### POST /api/entries
Создать новую запись
```json
{
  "title": "Заголовок",
  "content": "Содержание записи"
}
```

### PUT /api/entries/:id
Обновить запись по ID
```json
{
  "title": "Новый заголовок",
  "content": "Новое содержание"
}
```

### DELETE /api/entries/:id
Удалить запись по ID

### GET /api/health
Проверка работы сервера

