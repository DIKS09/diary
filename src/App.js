import React, { useState, useEffect } from 'react';
import './App.css';
import DiaryEntry from './components/DiaryEntry';
import EntryForm from './components/EntryForm';
import Auth from './components/Auth';
import { FaSignOutAlt } from 'react-icons/fa';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username'));

  // Загрузка записей из базы данных
  useEffect(() => {
    if (token) {
      fetchEntries();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('user_id');
      const response = await fetch(`${API_URL}/entries?user_id=${userId}`);
      if (!response.ok) {
        throw new Error('Ошибка загрузки записей');
      }
      const data = await response.json();
      setEntries(data);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить записи. Убедитесь, что backend запущен.');
      console.error('Error fetching entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (title, content) => {
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(`${API_URL}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title, 
          content,
          user_id: userId
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка создания записи');
      }

      const newEntry = await response.json();
      setEntries([newEntry, ...entries]);
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError('Не удалось создать запись');
      console.error('Error creating entry:', err);
    }
  };

  const updateEntry = async (id, title, content) => {
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(`${API_URL}/entries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title, 
          content,
          user_id: userId
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка обновления записи');
      }

      const updatedEntry = await response.json();
      setEntries(entries.map(entry => 
        entry._id === id ? updatedEntry : entry
      ));
      setEditingEntry(null);
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError('Не удалось обновить запись');
      console.error('Error updating entry:', err);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setShowForm(false);
  };

  const deleteEntry = async (id) => {
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(`${API_URL}/entries/${id}?user_id=${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Ошибка удаления записи');
      }

      setEntries(entries.filter(entry => entry._id !== id));
      setError(null);
    } catch (err) {
      setError('Не удалось удалить запись');
      console.error('Error deleting entry:', err);
    }
  };

  const handleLogin = (userId, newUsername) => {
    localStorage.setItem('user_id', userId);
    localStorage.setItem('username', newUsername);
    setToken(userId);  // используем как флаг авторизации
    setUsername(newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
    setEntries([]);
  };

  // Если нет токена, показываем форму авторизации
  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <div className="header-left">
            <h1 className="title">Дневник</h1>
            <span className="username-badge">{username}</span>
          </div>
          <div className="header-actions">
            <button 
              className="add-button"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '✕ Закрыть' : '+ Новая запись'}
            </button>
            <button 
              className="logout-button"
              onClick={handleLogout}
              title="Выйти"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </header>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {showForm && (
          <EntryForm 
            onSubmit={editingEntry ? 
              (title, content) => updateEntry(editingEntry._id, title, content) : 
              addEntry
            }
            onCancel={handleCancelEdit}
            initialData={editingEntry}
            isEditing={!!editingEntry}
          />
        )}

        <div className="entries-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Загрузка записей...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h2>Начните писать свою историю</h2>
              <p>Создайте первую запись в своем дневнике</p>
            </div>
          ) : (
            entries.map(entry => (
              <DiaryEntry 
                key={entry._id}
                entry={entry}
                onDelete={deleteEntry}
                onEdit={handleEdit}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

