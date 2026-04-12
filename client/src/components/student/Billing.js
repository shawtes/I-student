import { useState, useEffect } from 'react';
import api from '../../services/api';

function Billing() {
  const [plans, setPlans] = useState({});
  const [sub, setSub] = useState(null);
  const [upgrading, setUpgrading] = useState(null);
  const [alert, setAlert] = useState({ text: '', type: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [p, s] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get('/subscriptions/me')
      ]);
      setPlans(p.data);
      setSub(s.data);
    } catch {}
  };

  const upgrade = async (plan) => {
    if (!window.confirm(`Upgrade to ${plans[plan].name} ($${plans[plan].price}/mo)?`)) return;
    setUpgrading(plan);
    setAlert({ text: '', type: '' });
    try {
      const res = await api.post('/subscriptions/upgrade', { plan, method: 'card' });
      setSub(res.data);
      setAlert({ text: `Upgraded to ${plans[plan].name}`, type: 'success' });
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Upgrade failed', type: 'error' });
    } finally {
      setUpgrading(null);
    }
  };

  const cancel = async () => {
    if (!window.confirm('Cancel your subscription? You\'ll keep access until the end of the billing period.')) return;
    try {
      await api.post('/subscriptions/cancel');
      setAlert({ text: 'Subscription cancelled', type: 'success' });
      load();
    } catch {
      setAlert({ text: 'Cancel failed', type: 'error' });
    }
  };

  const planOrder = ['free', 'pro', 'premium'];
  const currentPlan = sub?.plan || 'free';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Billing and Plans</h1>
        <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>
          Currently on <strong>{plans[currentPlan]?.name || 'Free'}</strong>
          {sub?.status === 'cancelled' && <span style={{ color: 'var(--orange)' }}> (cancelled, active until {sub?.renewsAt ? new Date(sub.renewsAt).toLocaleDateString() : 'end of period'})</span>}
        </p>
      </div>

      {alert.text && (
        <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>{alert.text}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {planOrder.map(key => {
          const p = plans[key];
          if (!p) return null;
          const isCurrent = currentPlan === key;
          const isPopular = key === 'pro';
          return (
            <div key={key} style={{
              background: '#fff', borderRadius: '14px', padding: '24px',
              border: isCurrent ? '2px solid var(--accent)' : '1.5px solid var(--border)',
              position: 'relative',
              boxShadow: isPopular ? '0 4px 20px rgba(45, 91, 227, 0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              {isPopular && (
                <div style={{
                  position: 'absolute', top: '-10px', right: '16px',
                  background: 'var(--accent)', color: '#fff',
                  fontSize: '0.7rem', fontWeight: 600,
                  padding: '3px 10px', borderRadius: '10px',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div style={{
                  position: 'absolute', top: '-10px', left: '16px',
                  background: 'var(--green)', color: '#fff',
                  fontSize: '0.7rem', fontWeight: 600,
                  padding: '3px 10px', borderRadius: '10px',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  Current
                </div>
              )}

              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{p.name}</h2>
              <div style={{ margin: '8px 0 16px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700 }}>${p.price}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {p.price === 0 ? ' forever' : '/month'}
                </span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', fontSize: '0.88rem' }}>
                {p.features.map((f, i) => (
                  <li key={i} style={{ padding: '4px 0', display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'var(--green)', flexShrink: 0 }}>+</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                sub?.status === 'active' && key !== 'free' ? (
                  <button onClick={cancel} style={{
                    width: '100%', padding: '10px', background: '#fff',
                    color: 'var(--red)', border: '1.5px solid var(--red)',
                    borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                  }}>
                    Cancel plan
                  </button>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px' }}>
                    Your current plan
                  </div>
                )
              ) : (
                <button onClick={() => upgrade(key)} disabled={upgrading === key} style={{
                  width: '100%', padding: '10px',
                  background: isPopular ? 'var(--accent)' : '#fff',
                  color: isPopular ? '#fff' : 'var(--accent)',
                  border: `1.5px solid var(--accent)`,
                  borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}>
                  {upgrading === key ? 'Processing...' : (planOrder.indexOf(key) > planOrder.indexOf(currentPlan) ? 'Upgrade' : 'Downgrade')}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {sub?.paymentHistory?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}>Payment history</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th></tr>
              </thead>
              <tbody>
                {[...sub.paymentHistory].reverse().map((p, i) => (
                  <tr key={i}>
                    <td>{new Date(p.processedAt).toLocaleDateString()}</td>
                    <td>${p.amount.toFixed(2)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.method}</td>
                    <td>
                      <span className={`badge ${p.status === 'succeeded' ? 'badge-green' : 'badge-orange'}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;
