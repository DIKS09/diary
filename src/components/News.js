import React, { useState, useEffect } from 'react';
import './News.css';
import { FaNewspaper, FaSync, FaCog, FaExternalLinkAlt } from 'react-icons/fa';

const API_URL = 'http://localhost:5000/api';

const NEWS_CATEGORIES = [
  { value: 'technology', label: 'Технологии', emoji: '💻' },
  { value: 'business', label: 'Бизнес', emoji: '💼' },
  { value: 'science', label: 'Наука', emoji: '🔬' },
  { value: 'health', label: 'Здоровье', emoji: '🏥' },
  { value: 'sports', label: 'Спорт', emoji: '⚽' },
  { value: 'entertainment', label: 'Развлечения', emoji: '🎬' },
  { value: 'general', label: 'Общие', emoji: '📰' }
];

function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('technology');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchNews();
    }
  }, [selectedCategory]);

  const loadUserPreferences = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(`${API_URL}/user/preferences?user_id=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.news_category) {
          setSelectedCategory(data.news_category);
        }
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const saveUserPreferences = async (category) => {
    try {
      const userId = localStorage.getItem('user_id');
      await fetch(`${API_URL}/user/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          news_category: category
        }),
      });
    } catch (err) {
      console.error('Error saving preferences:', err);
    }
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/news?category=${selectedCategory}`);
      const data = await response.json();
      
      // Если пришли статьи (даже инструкция по настройке), показываем их
      if (data.articles && data.articles.length > 0) {
        setNews(data.articles);
      } else if (!response.ok) {
        throw new Error('Не удалось загрузить новости');
      } else {
        setNews([]);
      }
    } catch (err) {
      setError(err.message || 'Ошибка при загрузке новостей');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    saveUserPreferences(category);
    setShowSettings(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Только что';
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const currentCategoryLabel = NEWS_CATEGORIES.find(cat => cat.value === selectedCategory)?.label || 'Новости';
  const currentCategoryEmoji = NEWS_CATEGORIES.find(cat => cat.value === selectedCategory)?.emoji || '📰';

  return (
    <div className="news-container">
      <div className="news-header">
        <div className="news-header-left">
          <FaNewspaper className="news-icon" />
          <div>
            <h2>Новости дня</h2>
            <p className="news-subtitle">
              {currentCategoryEmoji} {currentCategoryLabel}
            </p>
          </div>
        </div>
        <div className="news-header-actions">
          <button 
            className="news-refresh-button"
            onClick={fetchNews}
            disabled={loading}
            title="Обновить"
          >
            <FaSync className={loading ? 'spinning' : ''} />
          </button>
          <button 
            className="news-settings-button"
            onClick={() => setShowSettings(!showSettings)}
            title="Настройки"
          >
            <FaCog />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="news-settings">
          <h3>Выберите категорию новостей:</h3>
          <div className="news-categories">
            {NEWS_CATEGORIES.map(category => (
              <button
                key={category.value}
                className={`category-button ${selectedCategory === category.value ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category.value)}
              >
                <span className="category-emoji">{category.emoji}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="news-error">
          <span className="error-icon">⚠️</span>
          <div>
            <strong>Ошибка загрузки новостей</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="news-loading">
          <div className="spinner"></div>
          <p>Загрузка новостей...</p>
        </div>
      ) : news.length === 0 ? (
        <div className="news-empty">
          <FaNewspaper className="empty-icon" />
          <h3>Новостей не найдено</h3>
          <p>Попробуйте выбрать другую категорию</p>
        </div>
      ) : (
        <div className="news-grid">
          {news.map((article, index) => {
            const isSetupInstruction = article.source?.name === 'Инструкция по настройке';
            return (
              <article key={index} className={`news-card ${isSetupInstruction ? 'setup-instruction' : ''}`}>
                {article.urlToImage && (
                  <div className="news-image">
                    <img src={article.urlToImage} alt={article.title} />
                  </div>
                )}
                <div className="news-content">
                  <div className="news-meta">
                    <span className="news-source">{article.source?.name}</span>
                    <span className="news-date">{formatDate(article.publishedAt)}</span>
                  </div>
                  <h3 className="news-title">{article.title}</h3>
                  <p className="news-description" style={{whiteSpace: 'pre-line'}}>
                    {article.description}
                  </p>
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="news-link"
                  >
                    {isSetupInstruction ? 'Получить API ключ' : 'Читать полностью'} <FaExternalLinkAlt />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default News;

