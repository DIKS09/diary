import React, { useState, useEffect } from 'react';
import './Calendar.css';
import { getIconByKey } from '../utils/icons';
import { FaPlus, FaCheckCircle } from 'react-icons/fa';

const API_URL = 'http://localhost:5000/api';

function Calendar({ entries, onEdit, onCreateForDate, onViewList }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [habits, setHabits] = useState([]);

  // Получить название месяца и год
  const getMonthYear = () => {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  // Получить дни месяца
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Пустые ячейки до первого дня месяца
    for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
      days.push(null);
    }
    
    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  // Получить записи для конкретной даты
  const getEntriesForDate = (day) => {
    if (!day) return [];
    
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toDateString();
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.date).toDateString();
      return entryDate === dateStr;
    });
  };

  // Переключение месяца
  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  // Загрузка привычек
  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(`${API_URL}/habits?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setHabits(data);
      }
    } catch (err) {
      console.error('Error fetching habits:', err);
    }
  };

  // Выбор даты
  const handleDateClick = (day) => {
    if (!day) return;
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toDateString();
    setSelectedDate(dateStr);
  };

  // Получить процент выполнения привычек за день
  const getHabitsCompletionForDate = (day) => {
    if (!day || habits.length === 0) return 0;
    
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toISOString().split('T')[0];
    
    const completedCount = habits.filter(habit => 
      habit.completed_dates && habit.completed_dates.includes(dateStr)
    ).length;
    
    return habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
  };

  // Переключить выполнение привычки
  const toggleHabit = async (habitId, dateStr) => {
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(`${API_URL}/habits/${habitId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          date: dateStr
        }),
      });

      if (response.ok) {
        fetchHabits(); // Перезагрузить привычки
      }
    } catch (err) {
      console.error('Error toggling habit:', err);
    }
  };

  const selectedEntries = selectedDate 
    ? entries.filter(entry => new Date(entry.date).toDateString() === selectedDate)
    : [];

  const days = getDaysInMonth();
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="month-nav" onClick={() => changeMonth(-1)}>
          ‹
        </button>
        <h2 className="month-title">{getMonthYear()}</h2>
        <button className="month-nav" onClick={() => changeMonth(1)}>
          ›
        </button>
      </div>

      <div className="calendar-grid">
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        
        {days.map((day, index) => {
          const dayEntries = getEntriesForDate(day);
          const completion = getHabitsCompletionForDate(day);
          const isSelected = day && selectedDate === new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
          ).toDateString();
          const isToday = day && new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
          ).toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`calendar-day ${!day ? 'empty' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => handleDateClick(day)}
            >
              {day && (
                <>
                  <span className="day-number">{day}</span>
                  {completion > 0 && (
                    <div className="habit-completion-circle">
                      {completion}%
                    </div>
                  )}
                  {dayEntries.length > 0 && (
                    <div className="day-indicators">
                      {dayEntries.slice(0, 2).map((entry, i) => {
                        const IconComponent = getIconByKey(entry.icon);
                        return (
                          <div key={i} className="day-indicator">
                            <IconComponent />
                          </div>
                        );
                      })}
                      {dayEntries.length > 2 && (
                        <span className="more-indicator">+{dayEntries.length - 2}</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className="selected-date-entries">
          <div className="entries-header">
            <h3 className="entries-title">
              {new Date(selectedDate).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </h3>
            <button 
              className="create-entry-btn"
              onClick={() => onCreateForDate(new Date(selectedDate))}
              title="Создать запись для этой даты"
            >
              <FaPlus /> Новая запись
            </button>
          </div>

          {/* Привычки за день */}
          {habits.length > 0 && (
            <div className="day-habits-section">
              <h4 className="section-title">Привычки</h4>
              <div className="habits-grid">
                {habits.map(habit => {
                  const dateStr = new Date(selectedDate).toISOString().split('T')[0];
                  const isCompleted = habit.completed_dates && habit.completed_dates.includes(dateStr);
                  
                  return (
                    <div 
                      key={habit._id} 
                      className={`habit-item ${isCompleted ? 'completed' : ''}`}
                      onClick={() => toggleHabit(habit._id, dateStr)}
                    >
                      <div className="habit-checkbox">
                        {isCompleted && <FaCheckCircle />}
                      </div>
                      <span className="habit-name">{habit.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Записи за день */}
          <div className="day-entries-section">
            <h4 className="section-title">Записи в дневнике</h4>
            {selectedEntries.length === 0 ? (
              <div className="no-entries-box">
                <p className="no-entries">Нет записей за этот день</p>
                <button 
                  className="create-first-entry-btn"
                  onClick={() => onCreateForDate(new Date(selectedDate))}
                >
                  <FaPlus /> Создать запись
                </button>
              </div>
            ) : (
              <div className="entries-list">
                {selectedEntries.map(entry => {
                  const IconComponent = getIconByKey(entry.icon);
                  return (
                    <div 
                      key={entry._id} 
                      className="calendar-entry"
                      onClick={() => onEdit(entry)}
                      title="Нажмите, чтобы редактировать"
                    >
                      <div className="calendar-entry-icon">
                        <IconComponent />
                      </div>
                      <div className="calendar-entry-content">
                        <h4>{entry.title}</h4>
                        <p>{entry.content.substring(0, 100)}{entry.content.length > 100 ? '...' : ''}</p>
                        <span className="entry-time">
                          {new Date(entry.date).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;

