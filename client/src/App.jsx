import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, CheckCheck, Circle, CircleCheck, ClipboardList, LoaderCircle, Pencil, Plus, RotateCcw, Sparkles, Trash2, X } from 'lucide-react';

const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Could not complete that action.');
  }
  return response.status === 204 ? null : response.json();
}

function App() {
  const [todos, setTodos] = useState([]);
  const [name, setName] = useState('');
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([request('/api/todos'), fetch(`${apiBase}/name`).then((r) => r.text())])
      .then(([items, developer]) => {
        setTodos(items);
        setName(developer.replace(/^Developer Name:\s*/, ''));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const visibleTodos = useMemo(() => todos.filter((todo) => filter === 'all' || (filter === 'active' ? !todo.completed : todo.completed)), [todos, filter]);
  const completedCount = todos.filter((todo) => todo.completed).length;
  const remaining = todos.length - completedCount;
  const progress = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;

  async function addTodo(event) {
    event.preventDefault();
    if (!draft.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      const todo = await request('/api/todos', { method: 'POST', body: JSON.stringify({ title: draft.trim() }) });
      setTodos((current) => [todo, ...current]);
      setDraft('');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function toggleTodo(todo) {
    setError('');
    try {
      const updated = await request(`/api/todos/${todo._id}`, { method: 'PATCH', body: JSON.stringify({ completed: !todo.completed }) });
      setTodos((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (err) { setError(err.message); }
  }

  async function saveEdit(todo) {
    if (!editText.trim()) return;
    setError('');
    try {
      const updated = await request(`/api/todos/${todo._id}`, { method: 'PATCH', body: JSON.stringify({ title: editText.trim() }) });
      setTodos((current) => current.map((item) => item._id === updated._id ? updated : item));
      setEditingId(null);
    } catch (err) { setError(err.message); }
  }

  async function deleteTodo(id) {
    setError('');
    try {
      await request(`/api/todos/${id}`, { method: 'DELETE' });
      setTodos((current) => current.filter((todo) => todo._id !== id));
    } catch (err) { setError(err.message); }
  }

  async function clearCompleted() {
    setError('');
    try {
      await Promise.all(todos.filter((todo) => todo.completed).map((todo) => request(`/api/todos/${todo._id}`, { method: 'DELETE' })));
      setTodos((current) => current.filter((todo) => !todo.completed));
    } catch (err) { setError(err.message); }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Daymark home"><span className="brand-mark"><Check size={17} strokeWidth={2.8} /></span><span>daymark<span className="brand-dot">.</span></span></a>
        <div className="top-note"><span className="online-dot" /> A little more clarity, every day</div>
        <a className="name-chip" href={`${apiBase}/name`} target="_blank" rel="noreferrer"><span className="avatar">{name ? name.charAt(0).toUpperCase() : 'A'}</span><span>{name || 'Abin Mathew'}</span></a>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span className="eyebrow-line" /> YOUR SPACE, YOUR PACE <Sparkles size={13} /></div>
        <h1>Make room for<br /><span>what matters.</span></h1>
        <p className="hero-copy">A clear mind starts with a clear list.<br className="desktop-break" /> One thing at a time is plenty.</p>
        <div className="date-stamp"><span className="date-icon"><ClipboardList size={15} /></span><span>YOUR DAILY CHECK-IN</span><span className="date-divider" />{new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</div>
      </section>

      <section className="todo-card" aria-label="Todo list">
        <div className="list-heading">
          <div><div className="section-kicker">THE LIST</div><h2>Today <span className="count-pill">{todos.length}</span></h2></div>
          <div className="progress-wrap"><div className="progress-label"><span>YOUR PROGRESS</span><span>{progress}%</span></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>
        </div>

        <form className="add-form" onSubmit={addTodo}>
          <Plus size={19} className="add-icon" />
          <input aria-label="New todo" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="What would you like to get done?" maxLength={200} />
          <button className="add-button" type="submit" disabled={!draft.trim() || saving}>{saving ? <LoaderCircle size={16} className="spin" /> : <>Add task <ArrowUp size={15} /></>}</button>
        </form>

        {error && <div className="error-message" role="alert">{error}</div>}

        <div className="list-toolbar"><div className="filters" role="tablist" aria-label="Filter todos">{[['all', 'All'], ['active', 'To do'], ['completed', 'Done']].map(([key, label]) => <button type="button" role="tab" aria-selected={filter === key} className={filter === key ? 'filter active' : 'filter'} onClick={() => setFilter(key)} key={key}>{label}{key === 'active' && remaining > 0 && <span className="filter-count">{remaining}</span>}</button>)}</div><span className="sort-label">LATEST FIRST <ArrowDown size={12} /></span></div>

        <div className="todo-list">
          {loading ? <div className="state-message"><LoaderCircle size={18} className="spin" /> Getting things ready…</div> : visibleTodos.length === 0 ? <div className="empty-state"><span className="empty-icon">{filter === 'completed' ? <CircleCheck size={23} /> : <ClipboardList size={23} />}</span><strong>{todos.length === 0 ? 'A fresh page.' : filter === 'completed' ? 'Nothing checked off yet.' : 'All caught up.'}</strong><span>{todos.length === 0 ? 'Add your first task above and take it from there.' : filter === 'completed' ? 'Your completed tasks will find a home here.' : 'Enjoy the breathing room. You’ve earned it.'}</span></div> : visibleTodos.map((todo, index) => <article className={`todo-row ${todo.completed ? 'is-complete' : ''}`} key={todo._id} style={{ '--row-index': index }}>
            <button className="check-button" type="button" onClick={() => toggleTodo(todo)} aria-label={todo.completed ? 'Mark as active' : 'Mark as complete'}>{todo.completed ? <CircleCheck size={22} strokeWidth={1.8} /> : <Circle size={22} strokeWidth={1.6} />}</button>
            <div className="todo-content">{editingId === todo._id ? <form className="edit-form" onSubmit={(event) => { event.preventDefault(); saveEdit(todo); }}><input autoFocus value={editText} onChange={(event) => setEditText(event.target.value)} maxLength={200} /><button aria-label="Save edit"><Check size={17} /></button><button type="button" aria-label="Cancel edit" onClick={() => setEditingId(null)}><X size={17} /></button></form> : <><div className="todo-title">{todo.title}</div><div className="todo-meta"><span className={todo.completed ? 'status-tag done-tag' : 'status-tag'}><span />{todo.completed ? 'COMPLETED' : 'IN PROGRESS'}</span><span className="meta-separator">·</span><span>Added {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(todo.createdAt))}</span></div></>}</div>
            {editingId !== todo._id && <div className="row-actions"><button type="button" aria-label="Edit todo" onClick={() => { setEditingId(todo._id); setEditText(todo.title); }}><Pencil size={15} /></button><button type="button" aria-label="Delete todo" onClick={() => deleteTodo(todo._id)}><Trash2 size={16} /></button></div>}
          </article>)}
        </div>

        {!loading && todos.length > 0 && <footer className="list-footer"><span><span className="footer-sparkle"><Sparkles size={13} /></span>{remaining === 0 ? 'Everything is checked off. Nice work.' : <>{remaining} {remaining === 1 ? 'thing' : 'things'} left to focus on</>}</span>{completedCount > 0 && <button type="button" className="clear-button" onClick={clearCompleted}><RotateCcw size={13} /> Clear completed</button>}</footer>}
      </section>

      <footer className="page-footer"><span>MADE FOR THE MOMENT YOU’RE IN</span><span className="footer-divider" /><span>SMALL STEPS COUNT <span className="heart">✳</span></span></footer>
    </main>
  );
}

export default App;
