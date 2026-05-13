import { useState, useEffect, useMemo } from 'react';
import './App.css';

const TodoItem = ({ task, onToggle, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState(task.text);

  return (
    <div className={`task-card ${task.completed ? 'is-done' : ''}`}>
      <div className="task-content">
        <div className="checkbox-ring" onClick={() => onToggle(task.id)}>
          <div className={`dot ${task.completed ? 'active' : ''}`}></div>
        </div>

        {isEditing ? (
          <input 
            className="edit-field"
            value={tempText}
            onChange={(e) => setTempText(e.target.value)}
            onBlur={() => { onEdit(task.id, tempText); setIsEditing(false); }}
            onKeyDown={(e) => e.key === 'Enter' && (onEdit(task.id, tempText) || setIsEditing(false))}
            autoFocus
          />
        ) : (
          <div className="task-text-group">
            <span className="task-title">{task.text}</span>
            <span className="task-tag">{task.category}</span>
          </div>
        )}
      </div>

      <div className="task-actions">
        <button onClick={() => setIsEditing(!isEditing)} className="btn-action edit">✏️</button>
        <button onClick={() => onDelete(task.id)} className="btn-action delete">🗑️</button>
      </div>
    </div>
  );
};

export default function App() {
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem("cyber-todo-v3")) || []);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [category, setCategory] = useState('Навчання');

  useEffect(() => {
    localStorage.setItem("cyber-todo-v3", JSON.stringify(tasks));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => filter === 'active' ? !t.completed : filter === 'completed' ? t.completed : true)
      .filter(t => t.text.toLowerCase().includes(search.toLowerCase()));
  }, [tasks, filter, search]);

  const stats = tasks.length ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0;

  return (
    <div className="cyber-app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo-icon">T</div>
          <h2>TaskMaster <span>Pro</span></h2>
        </div>

        <div className="progress-section">
          <div className="progress-circle" style={{ '--p': stats }}>
            <span className="p-val">{stats}%</span>
          </div>
          <p>Денна ціль</p>
        </div>

        <nav className="nav-menu">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>💎 Усі</button>
          <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>🔥 Активні</button>
          <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>✅ Готові</button>
        </nav>

        <button className="btn-clear-ghost" onClick={() => setTasks(tasks.filter(t => !t.completed))}>
          Очистити виконані
        </button>
      </aside>

      <main className="main">
        <div className="search-container">
          <input 
            className="neon-search" 
            placeholder="Пошук завдань..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <form className="add-box" onSubmit={(e) => {
          e.preventDefault();
          if (inputValue.trim()) {
            setTasks([{ id: Date.now(), text: inputValue, completed: false, category }, ...tasks]);
            setInputValue('');
          }
        }}>
          <input 
            className="add-input" 
            placeholder="Що на черзі?" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <select className="category-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Навчання</option>
            <option>Робота</option>
            <option>Особисте</option>
          </select>
          <button type="submit" className="btn-glow">Додати</button>
        </form>

        <div className="tasks-scroll">
          {filteredTasks.map(t => (
            <TodoItem 
              key={t.id} 
              task={t} 
              onToggle={(id) => setTasks(tasks.map(x => x.id === id ? {...x, completed: !x.completed} : x))}
              onDelete={(id) => setTasks(tasks.filter(x => x.id !== id))}
              onEdit={(id, text) => setTasks(tasks.map(x => x.id === id ? {...x, text} : x))}
            />
          ))}
          {filteredTasks.length === 0 && <div className="no-data">Тут поки порожньо... 🌌</div>}
        </div>
      </main>
    </div>
  );
}