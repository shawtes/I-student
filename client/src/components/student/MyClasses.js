import { useState, useEffect } from 'react';
import api from '../../services/api';
import { byDept, findByCode } from '../../data/gsuCourses';

function MyClasses() {
  const [myCourses, setMyCourses] = useState([]);
  const [fileCounts, setFileCounts] = useState({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ text: '', type: '' });

  const groups = byDept();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const user = await api.get('/auth/me');
      setMyCourses(user.data.courses || []);
    } catch {}
    try {
      const files = await api.get('/files');
      const counts = {};
      for (const f of files.data) {
        const folder = f.folder || 'root';
        counts[folder] = (counts[folder] || 0) + 1;
      }
      setFileCounts(counts);
    } catch {}
  };

  const toggle = (code) => {
    setMyCourses(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', { courses: myCourses });
      setAlert({ text: 'Classes saved', type: 'success' });
    } catch {
      setAlert({ text: 'Failed to save', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const matches = (c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.code.toLowerCase().includes(s) || c.name.toLowerCase().includes(s);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>My Classes</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Select your current GSU courses. Files and study tools will organize around these.
          </p>
        </div>
        <button onClick={save} disabled={saving} style={S.saveBtn}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {alert.text && <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>{alert.text}</div>}

      {/* Currently enrolled */}
      {myCourses.length > 0 && (
        <div style={S.card}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}>
            Enrolled ({myCourses.length})
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {myCourses.map(code => {
              const c = findByCode(code);
              return (
                <div key={code} style={S.enrolledChip}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{code}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c?.name || ''}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {fileCounts[code] > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {fileCounts[code]} file{fileCounts[code] !== 1 ? 's' : ''}
                      </span>
                    )}
                    <button onClick={() => toggle(code)} style={S.removeBtn} title="Remove">&times;</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Course catalog */}
      <div style={S.card}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}>GSU Course Catalog</h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by code or name (e.g. CSC, Calculus, Biology)"
          style={S.search}
        />

        <div style={{ maxHeight: '450px', overflowY: 'auto', marginTop: '12px' }}>
          {Object.keys(groups).map(dept => {
            const visible = groups[dept].filter(matches);
            if (visible.length === 0) return null;
            return (
              <div key={dept} style={{ marginBottom: '16px' }}>
                <div style={S.deptHeader}>{dept}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px' }}>
                  {visible.map(c => {
                    const enrolled = myCourses.includes(c.code);
                    return (
                      <div key={c.code} onClick={() => toggle(c.code)} style={{
                        ...S.courseRow,
                        background: enrolled ? 'var(--accent-light)' : '#fff',
                        borderColor: enrolled ? 'var(--accent)' : 'var(--border)',
                      }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600,
                            color: enrolled ? 'var(--accent)' : 'var(--text)' }}>
                            {c.code}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                            {c.name}
                          </span>
                        </div>
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0,
                          border: enrolled ? '2px solid var(--accent)' : '2px solid var(--border)',
                          background: enrolled ? 'var(--accent)' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                        }}>
                          {enrolled && '\u2713'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const S = {
  saveBtn: {
    padding: '8px 24px', background: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  },
  card: {
    background: '#fff', borderRadius: '12px', padding: '20px',
    border: '1px solid var(--border)', marginBottom: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  enrolledChip: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px', background: 'var(--accent-light)',
    border: '1.5px solid var(--accent)', borderRadius: '10px',
    flex: '1 1 220px', minWidth: '200px',
  },
  removeBtn: {
    background: 'none', border: 'none', fontSize: '1.2rem',
    cursor: 'pointer', color: 'var(--text-muted)', padding: '0 4px',
  },
  search: {
    width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)',
    borderRadius: '10px', fontSize: '0.9rem', fontFamily: 'Inter, sans-serif',
    background: 'var(--bg)', outline: 'none', boxSizing: 'border-box',
  },
  deptHeader: {
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: '6px', paddingBottom: '4px',
    borderBottom: '1px solid var(--border)',
  },
  courseRow: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
    border: '1.5px solid', transition: 'background 0.1s',
  },
};

export default MyClasses;
