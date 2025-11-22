import React, { useState } from 'react';
import './Feedback.css';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';

const API_URL = 'http://localhost:5000/api';

function Feedback({ onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Пожалуйста, введите сообщение');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim() || 'Аноним',
          email: email.trim(),
          message: message.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка отправки сообщения');
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
      
      // Автоматически закрыть через 3 секунды
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      setError(err.message || 'Не удалось отправить сообщение. Попробуйте позже.');
      console.error('Error sending feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose} title="Закрыть">
          <FaTimes />
        </button>
        
        <div className="feedback-header">
          <h2>Обратная связь</h2>
          <p>Напишите нам свои вопросы, предложения или отзывы</p>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Сообщение отправлено!</h3>
            <p>Спасибо за ваш отзыв. Мы свяжемся с вами в ближайшее время.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="form-group">
              <label htmlFor="name">Имя (необязательно)</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email (необязательно)</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Сообщение *</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Напишите ваше сообщение..."
                rows="6"
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Отправка...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Отправить
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Feedback;

