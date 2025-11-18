import React, { useState, useEffect } from 'react';
import './Habits.css';
import { FaPlus, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

function Habits() {
  const [habits, setHabits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [loading, setLoading] = useState(true);
  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(`${API_URL}/habits?user_id=${userId}`);
      const data = await response.json();
      setHabits(data);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки привычек:', error);
      setLoading(false);
    }
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) return;

    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(`${API_URL}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: newHabitName
        })
      });
      const newHabit = await response.json();
      setHabits([...habits, newHabit]);
      setNewHabitName('');
      setShowForm(false);
    } catch (error) {
      console.error('Ошибка добавления привычки:', error);
    }
  };

  const deleteHabit = async (habitId) => {
    try {
      const userId = localStorage.getItem('user_id');
      await fetch(`${API_URL}/habits/${habitId}?user_id=${userId}`, {
        method: 'DELETE'
      });
      setHabits(habits.filter(h => h._id !== habitId));
    } catch (error) {
      console.error('Ошибка удаления привычки:', error);
    }
  };

  const toggleHabitToday = async (habitId) => {
    try {
      const userId = localStorage.getItem('user_id');
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${API_URL}/habits/${habitId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          date: today
        })
      });
      
      const updatedHabit = await response.json();
      setHabits(habits.map(h => h._id === habitId ? updatedHabit : h));
    } catch (error) {
      console.error('Ошибка обновления привычки:', error);
    }
  };

  const isCompletedToday = (habit) => {
    const today = new Date().toISOString().split('T')[0];
    return habit.completed_dates && habit.completed_dates.includes(today);
  };

  const calculateCompletionRate = (habit) => {
    if (!habit.completed_dates || habit.completed_dates.length === 0) return 0;
    
    const createdDate = new Date(habit.created_at);
    const today = new Date();
    const daysPassed = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.round((habit.completed_dates.length / daysPassed) * 100);
  };

  const getTotalCompletionRate = () => {
    if (habits.length === 0) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter(h => 
      h.completed_dates && h.completed_dates.includes(today)
    ).length;
    
    return Math.round((completedToday / habits.length) * 100);
  };

  return (
    <div className="habits-container">
      <div className="habits-header">
        <div className="habits-title-section">
          <h2 className="habits-title">Трекер привычек</h2>
          <p className="habits-subtitle">Отслеживайте свои ежедневные дела</p>
        </div>
        
        {habits.length > 0 && (
          <div className="completion-widget">
            <div className="completion-circle">
              <svg viewBox="0 0 120 120" className="progress-ring">
                <circle
                  className="progress-ring-bg"
                  cx="60"
                  cy="60"
                  r="54"
                />
                <circle
                  className="progress-ring-fill"
                  cx="60"
                  cy="60"
                  r="54"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - getTotalCompletionRate() / 100)}`}
                />
              </svg>
              <div className="completion-text">
                <span className="completion-percent">{getTotalCompletionRate()}%</span>
                <span className="completion-label">сегодня</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <button 
        className="add-habit-button"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? <><FaTimes /> Отмена</> : <><FaPlus /> Добавить привычку</>}
      </button>

      {showForm && (
        <div className="habit-form">
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="Название привычки..."
            className="habit-input"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && addHabit()}
          />
          <button onClick={addHabit} className="save-habit-button">
            <FaCheck /> Сохранить
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-habits">
          <div className="spinner"></div>
          <p>Загрузка привычек...</p>
        </div>
      ) : habits.length === 0 ? (
        <div className="empty-habits">
          <div className="empty-habits-icon">✓</div>
          <h3>Нет привычек</h3>
          <p>Создайте свою первую привычку для отслеживания</p>
        </div>
      ) : (
        <div className="habits-list">
          {habits.map(habit => (
            <div key={habit._id} className="habit-card">
              <div className="habit-checkbox-container">
                <button
                  className={`habit-checkbox ${isCompletedToday(habit) ? 'checked' : ''}`}
                  onClick={() => toggleHabitToday(habit._id)}
                >
                  {isCompletedToday(habit) && <FaCheck />}
                </button>
              </div>
              
              <div className="habit-info">
                <h3 className={`habit-name ${isCompletedToday(habit) ? 'completed' : ''}`}>
                  {habit.name}
                </h3>
                <div className="habit-stats">
                  <span className="habit-streak">
                    🔥 {habit.completed_dates ? habit.completed_dates.length : 0} дней
                  </span>
                  <span className="habit-rate">
                    {calculateCompletionRate(habit)}% завершено
                  </span>
                </div>
              </div>

              <button
                className="delete-habit-button"
                onClick={() => deleteHabit(habit._id)}
                title="Удалить привычку"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Habits;

