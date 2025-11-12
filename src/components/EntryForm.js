import React, { useState, useEffect } from 'react';
import './EntryForm.css';
import { FaPen } from 'react-icons/fa';

function EntryForm({ onSubmit, onCancel, initialData, isEditing }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onSubmit(title, content);
      setTitle('');
      setContent('');
    }
  };

  return (
    <div className="entry-form-container">
      <form className="entry-form" onSubmit={handleSubmit}>
        {isEditing && (
          <div className="form-header">
            <span className="edit-badge">
              <FaPen /> Редактирование
            </span>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="title">Заголовок</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название вашей записи..."
            required
            autoFocus
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Содержание</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Что у вас на душе сегодня?..."
            rows="8"
            required
          />
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button"
            onClick={onCancel}
          >
            Отмена
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={!title.trim() || !content.trim()}
          >
            {isEditing ? 'Обновить запись' : 'Сохранить запись'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EntryForm;

