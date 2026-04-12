import { useState, useEffect } from 'react';
import api from '../../services/api';

function Earnings() {
  const [data, setData] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/bookings/earnings');
      setData(res.data);
    } catch {}
  };

  if (!data) return <div>Loading earnings...</div>;

  const fmt = (n) => '$' + Number(n || 0).toFixed(2);

  return (
    <div>
      <div className="page-header">
        <h1>Earnings</h1>
        <p>Your tutoring income and session history</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '16px' }}>
        <div style={S.statCard}>
          <div style={S.statLabel}>Total earned</div>
          <div style={{ ...S.statValue, color: 'var(--green)' }}>{fmt(data.totalEarned)}</div>
          <div style={S.statSub}>{data.sessionsCompleted} completed sessions</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Pending payout</div>
          <div style={{ ...S.statValue, color: 'var(--orange)' }}>{fmt(data.pendingPayout)}</div>
          <div style={S.statSub}>{data.sessionsUpcoming} upcoming sessions</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Next payout</div>
          <div style={{ ...S.statValue, fontSize: '1.2rem' }}>15th of month</div>
          <div style={S.statSub}>Direct deposit to bank on file</div>
        </div>
      </div>

      <div style={S.card}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}>Recent transactions</h2>
        {data.recent.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No transactions yet. Complete sessions to start earning.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Student</th><th>Subject</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.recent.map((r, i) => (
                  <tr key={i}>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>{r.student}</td>
                    <td>{r.subject || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(r.amount)}</td>
                    <td>
                      <span className={`badge ${r.status === 'completed' ? 'badge-green' : 'badge-blue'}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={S.card}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}>Payout settings</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Payouts are sent on the 15th of each month for all completed sessions in the prior month.
          Platform fee: 15% per session.
        </p>
      </div>
    </div>
  );
}

const S = {
  statCard: {
    background: '#fff', borderRadius: '12px', padding: '20px',
    border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  statLabel: {
    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px',
  },
  statValue: { fontSize: '1.8rem', fontWeight: 700 },
  statSub: { fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' },
  card: {
    background: '#fff', borderRadius: '12px', padding: '20px',
    border: '1px solid var(--border)', marginBottom: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
};

export default Earnings;
