import { useState, useEffect } from 'react';
import api from '../../services/api';

function Partners() {
  const [partners, setPartners] = useState([]);
  const [groups, setGroups] = useState([]);
  const [potentialPartners, setPotentialPartners] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showForm, setShowForm] = useState(false);
  const [groupData, setGroupData] = useState({ name: '', description: '', course: '' });

  useEffect(() => {
    loadPartners();
    loadGroups();
    findPartners();
  }, []);

  const loadPartners = async () => {
    try { setPartners((await api.get('/partners')).data); } catch {}
  };
  const loadGroups = async () => {
    try { setGroups((await api.get('/partners/groups')).data); } catch {}
  };
  const findPartners = async () => {
    try { setPotentialPartners((await api.get('/partners/find')).data); } catch {}
  };

  const handleAddPartner = async (partnerId) => {
    try {
      await api.post('/partners/request', { partnerId });
      setMessage({ text: 'Partner added', type: 'success' });
      loadPartners();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to add partner', type: 'error' });
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/partners/groups', groupData);
      setMessage({ text: 'Group created', type: 'success' });
      setShowForm(false);
      setGroupData({ name: '', description: '', course: '' });
      loadGroups();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to create group', type: 'error' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Study Partners & Groups</h1>
        <p>Connect with classmates and form study groups</p>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>{message.text}</div>
      )}

      <div className="card">
        <h2>My partners</h2>
        {partners.length === 0 ? (
          <p style={{ marginTop: '12px' }}>No study partners yet.</p>
        ) : (
          <div className="grid grid-3" style={{ marginTop: '14px' }}>
            {partners.map(p => (
              <div key={p._id} style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }}>
                <h3>{p.name}</h3>
                <p style={{ fontSize: '0.84rem' }}>{p.email}</p>
                {p.major && <span className="badge badge-blue" style={{ marginTop: '8px' }}>{p.major}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {potentialPartners.length > 0 && (
        <div className="card">
          <h2>Suggested partners</h2>
          <div className="grid grid-3" style={{ marginTop: '14px' }}>
            {potentialPartners.map(p => (
              <div key={p._id} style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }}>
                <h3>{p.name}</h3>
                <p style={{ fontSize: '0.84rem' }}>{p.email}</p>
                {p.major && <span className="badge badge-blue" style={{ marginTop: '6px', display: 'inline-block' }}>{p.major}</span>}
                {p.interests && p.interests.length > 0 && (
                  <p style={{ fontSize: '0.8rem', marginTop: '6px' }}>{p.interests.join(', ')}</p>
                )}
                <button className="btn btn-primary btn-sm" style={{ marginTop: '10px' }} onClick={() => handleAddPartner(p._id)}>
                  Add partner
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Study groups</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'New group'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateGroup} style={{ padding: '16px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
            <div className="form-group">
              <label htmlFor="g-name">Name</label>
              <input id="g-name" type="text" value={groupData.name} onChange={(e) => setGroupData({ ...groupData, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label htmlFor="g-desc">Description</label>
              <textarea id="g-desc" value={groupData.description} onChange={(e) => setGroupData({ ...groupData, description: e.target.value })} rows="2" />
            </div>
            <div className="form-group">
              <label htmlFor="g-course">Course</label>
              <input id="g-course" type="text" value={groupData.course} onChange={(e) => setGroupData({ ...groupData, course: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary">Create</button>
          </form>
        )}

        {groups.length === 0 ? (
          <p>No groups yet.</p>
        ) : (
          <div className="grid grid-2">
            {groups.map(g => (
              <div key={g._id} style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }}>
                <h3>{g.name}</h3>
                {g.description && <p style={{ fontSize: '0.84rem', marginTop: '4px' }}>{g.description}</p>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {g.course && <span className="badge badge-purple">{g.course}</span>}
                  <span className="badge badge-green">{g.members.length} members</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Partners;
