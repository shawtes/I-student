import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function Partners() {
  const [partners, setPartners] = useState([]);
  const [groups, setGroups] = useState([]);
  const [potentialPartners, setPotentialPartners] = useState([]);
  const [message, setMessage] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
    course: ''
  });

  useEffect(() => {
    loadPartners();
    loadGroups();
    findPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const response = await api.get('/partners');
      setPartners(response.data);
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await api.get('/partners/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const findPartners = async () => {
    try {
      const response = await api.get('/partners/find');
      setPotentialPartners(response.data);
    } catch (error) {
      console.error('Error finding partners:', error);
    }
  };

  const handleAddPartner = async (partnerId) => {
    try {
      await api.post('/partners/request', { partnerId });
      setMessage('Partner added successfully!');
      loadPartners();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add partner');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/partners/groups', groupData);
      setMessage('Group created successfully!');
      setShowCreateGroup(false);
      setGroupData({ name: '', description: '', course: '' });
      loadGroups();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create group');
    }
  };

  return (
    <div>
      <h1>Study Partners & Groups</h1>
      <p>Connect with other students and form study groups</p>

      {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}

      <div className="card">
        <h2>My Study Partners</h2>
        {partners.length === 0 ? (
          <p>No study partners yet. Find partners below!</p>
        ) : (
          <div className="grid grid-3">
            {partners.map(partner => (
              <div key={partner._id} className="card" style={{ background: '#f9f9f9' }}>
                <h3>{partner.name}</h3>
                <p>{partner.email}</p>
                {partner.major && <p><strong>Major:</strong> {partner.major}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Find Study Partners</h2>
        {potentialPartners.length === 0 ? (
          <p>No potential partners found. Update your profile with interests to find matches!</p>
        ) : (
          <div className="grid grid-3">
            {potentialPartners.map(partner => (
              <div key={partner._id} className="card" style={{ background: '#f9f9f9' }}>
                <h3>{partner.name}</h3>
                <p>{partner.email}</p>
                {partner.major && <p><strong>Major:</strong> {partner.major}</p>}
                {partner.interests && partner.interests.length > 0 && (
                  <p><strong>Interests:</strong> {partner.interests.join(', ')}</p>
                )}
                <button className="btn btn-primary" onClick={() => handleAddPartner(partner._id)}>
                  Add Partner
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>My Study Groups</h2>
          <button className="btn btn-primary" onClick={() => setShowCreateGroup(!showCreateGroup)}>
            {showCreateGroup ? 'Cancel' : 'Create Group'}
          </button>
        </div>

        {showCreateGroup && (
          <form onSubmit={handleCreateGroup} style={{ marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '4px' }}>
            <div className="form-group">
              <label>Group Name</label>
              <input
                type="text"
                value={groupData.name}
                onChange={(e) => setGroupData({ ...groupData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={groupData.description}
                onChange={(e) => setGroupData({ ...groupData, description: e.target.value })}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Course</label>
              <input
                type="text"
                value={groupData.course}
                onChange={(e) => setGroupData({ ...groupData, course: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">Create Group</button>
          </form>
        )}

        {groups.length === 0 ? (
          <p>No groups yet. Create one above!</p>
        ) : (
          <div className="grid grid-2">
            {groups.map(group => (
              <div key={group._id} className="card" style={{ background: '#f9f9f9' }}>
                <h3>{group.name}</h3>
                <p>{group.description}</p>
                {group.course && <p><strong>Course:</strong> {group.course}</p>}
                <p><strong>Members:</strong> {group.members.length}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Partners;
