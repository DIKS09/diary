import React, { useState } from 'react';
import './DiaryEntry.css';
import { getIconByKey } from '../utils/icons';
import { FaPen, FaTrash } from 'react-icons/fa';

function DiaryEntry({ entry, onDelete, onEdit }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('ru-RU', options);
  };

  const getPreview = (text) => {
    if (text.length <= 150) return text;
    return text.substring(0, 150) + '...';
  };

  const IconComponent = getIconByKey(entry.icon || entry.emoji);

  return (
    <div className="diary-entry">
      <div className="entry-header">
        <div className="entry-info">
          <div className="entry-icon">
            <IconComponent />
          </div>
          <div>
            <h3 className="entry-title">{entry.title}</h3>
            <p className="entry-date">{formatDate(entry.date)}</p>
          </div>
        </div>
        <div className="entry-actions">
          <button 
            className="edit-button"
            onClick={() => onEdit(entry)}
            title="Редактировать запись"
          >
            <FaPen />
          </button>
          <button 
            className="delete-button"
            onClick={() => onDelete(entry._id)}
            title="Удалить запись"
          >
            <FaTrash />
          </button>
        </div>
      </div>
      
      <div className="entry-content">
        <p className="entry-text">
          {isExpanded ? entry.content : getPreview(entry.content)}
        </p>
        {entry.content.length > 150 && (
          <button 
            className="expand-button"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Свернуть' : 'Читать полностью'}
          </button>
        )}
      </div>
    </div>
  );
}

export default DiaryEntry;

