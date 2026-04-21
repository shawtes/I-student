import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../../services/api';
import { GSU_COURSES } from '../../data/gsuCourses';
import GoogleCalendarCard from '../GoogleCalendarCard';

const localizer = momentLocalizer(moment);

const TYPE_COLORS = {
  study: '#2d5be3',
  tutoring: '#16a34a',
  exam: '#dc2626',
  assignment: '#ea580c',
  other: '#7c3aed',
};

function Schedule() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [form, setForm] = useState({
    title: '', description: '', folder: 'root',
    startTime: '', endTime: '', type: 'study', color: ''
  });
  const [alert, setAlert] = useState({ text: '', type: '' });

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    try {
      const res = await api.get('/scheduling/sessions');
      setEvents(res.data.map(e => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      })));
    } catch {}
  };

  const handleSelectSlot = useCallback(({ start, end }) => {
    setSelectedEvent(null);
    setForm({
      title: '', description: '', folder: 'root',
      startTime: moment(start).format('YYYY-MM-DDTHH:mm'),
      endTime: moment(end).format('YYYY-MM-DDTHH:mm'),
      type: 'study', color: ''
    });
    setShowForm(true);
  }, []);

  const handleSelectEvent = useCallback((event) => {
    if (event.source === 'booking') {
      setSelectedEvent(event);
      setShowForm(false);
      return;
    }
    setSelectedEvent(event);
    setForm({
      title: event.title,
      description: event.description || '',
      folder: event.folder || 'root',
      startTime: moment(event.start).format('YYYY-MM-DDTHH:mm'),
      endTime: moment(event.end).format('YYYY-MM-DDTHH:mm'),
      type: event.type || 'study',
      color: event.color || ''
    });
    setShowForm(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ text: '', type: '' });
    try {
      const body = { ...form, color: form.color || TYPE_COLORS[form.type] || '#2d5be3' };
      if (selectedEvent && selectedEvent.source === 'session') {
        await api.put('/scheduling/sessions/' + selectedEvent.id, body);
        setAlert({ text: 'Updated', type: 'success' });
      } else {
        await api.post('/scheduling/sessions', body);
        setAlert({ text: 'Added to calendar', type: 'success' });
      }
      setShowForm(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Failed', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent || selectedEvent.source !== 'session') return;
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.delete('/scheduling/sessions/' + selectedEvent.id);
      setShowForm(false);
      setSelectedEvent(null);
      loadEvents();
    } catch {}
  };

  const eventStyleGetter = useCallback((event) => ({
    style: {
      backgroundColor: event.color || TYPE_COLORS[event.type] || '#2d5be3',
      borderRadius: '4px', border: 'none', color: '#fff',
      fontSize: '0.82rem', padding: '2px 6px',
    }
  }), []);

  const calStyle = useMemo(() => ({ height: 'calc(100vh - 180px)', minHeight: '500px' }), []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Schedule</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>Study blocks, tutoring sessions, and deadlines</p>
        </div>
        <button onClick={() => {
          setSelectedEvent(null);
          setForm({ title: '', description: '', folder: 'root', startTime: '', endTime: '', type: 'study', color: '' });
          setShowForm(true);
        }} style={S.addBtn}>+ Add event</button>
      </div>

      {alert.text && <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>{alert.text}</div>}

      <GoogleCalendarCard />

      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ textTransform: 'capitalize' }}>{type}</span>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={calStyle}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
          popup
          step={30}
          timeslots={2}
        />
      </div>

      {showForm && (
        <div style={S.overlay} onClick={() => setShowForm(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>{selectedEvent ? 'Edit event' : 'New event'}</h2>
              <button onClick={() => setShowForm(false)} style={S.closeBtn}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={S.label}>Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  required placeholder="e.g. Calc II Review" style={S.input} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={S.label}>Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={S.input}>
                    <option value="study">Study block</option>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment due</option>
                    <option value="tutoring">Tutoring</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Course</label>
                  <select value={form.folder} onChange={e => setForm({ ...form, folder: e.target.value })} style={S.input}>
                    <option value="root">None</option>
                    {GSU_COURSES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={S.label}>Start</label>
                  <input type="datetime-local" value={form.startTime}
                    onChange={e => setForm({ ...form, startTime: e.target.value })} required style={S.input} />
                </div>
                <div>
                  <label style={S.label}>End</label>
                  <input type="datetime-local" value={form.endTime}
                    onChange={e => setForm({ ...form, endTime: e.target.value })} required style={S.input} />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={S.label}>Notes</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows="3" placeholder="What to focus on..." style={{ ...S.input, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={S.primaryBtn}>{selectedEvent ? 'Save changes' : 'Add to calendar'}</button>
                {selectedEvent && selectedEvent.source === 'session' && (
                  <button type="button" onClick={handleDelete} style={S.dangerBtn}>Delete</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedEvent && !showForm && selectedEvent.source === 'booking' && (
        <div style={S.overlay} onClick={() => setSelectedEvent(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ margin: 0 }}>{selectedEvent.title}</h2>
              <button onClick={() => setSelectedEvent(null)} style={S.closeBtn}>&times;</button>
            </div>
            <p>{selectedEvent.description}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {moment(selectedEvent.start).format('ddd MMM D, h:mm A')} &mdash; {moment(selectedEvent.end).format('h:mm A')}
            </p>
            <span style={{ fontSize: '0.8rem', padding: '3px 10px', background: 'var(--green-light)', color: 'var(--green)', borderRadius: '10px' }}>
              Tutoring session
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  addBtn: { padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 4px' },
  label: { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' },
  input: { width: '100%', padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box' },
  primaryBtn: { padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  dangerBtn: { padding: '8px 20px', background: '#fff', color: 'var(--red)', border: '1.5px solid var(--red)', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
};

export default Schedule;
