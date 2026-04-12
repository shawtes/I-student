import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';

const CATEGORIES = [
  'Bug Report', 'Account Issue', 'Billing / Payment',
  'Tutoring Issue', 'General Question', 'Feature Request',
];

const STATUS_META = {
  open:        { label: 'Open',        bg: '#e8f4fd', color: '#1565c0', dot: '#1976d2' },
  in_progress: { label: 'In Progress', bg: '#fff8e1', color: '#f57f17', dot: '#fbc02d' },
  resolved:    { label: 'Resolved',    bg: '#e8f5e9', color: '#2e7d32', dot: '#43a047' },
  closed:      { label: 'Closed',      bg: '#f5f5f5', color: '#616161', dot: '#9e9e9e' },
};

const CAT_ICONS = {
  'Bug Report': '[B]', 'Account Issue': '[A]', 'Billing / Payment': '[P]',
  'Tutoring Issue': '[T]', 'General Question': '[Q]', 'Feature Request': '[F]',
};

function timeAgo(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.open;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: m.bg, color: m.color, borderRadius: 20,
      padding: '0.2rem 0.7rem', fontSize: '0.76rem', fontWeight: 700,
      letterSpacing: '0.03em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, display: 'inline-block' }} />
      {m.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HelpDeskAdmin() {
  const [view, setView]         = useState('list');   // 'list' | 'detail'
  const [tickets, setTickets]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [stats, setStats]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [filterStatus, setFilterStatus]   = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [replyBody, setReplyBody]   = useState('');
  const [replySending, setReplySending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage]     = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const threadBottomRef = useRef(null);

  // ─── Load all tickets (admin) ──────────────────────────────────────────────

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 30 };
      if (filterStatus   !== 'all') params.status   = filterStatus;
      if (filterCategory !== 'all') params.category = filterCategory;

      const { data } = await api.get('/helpdesk/admin/tickets', { params });
      setTickets(data.tickets || []);
      setStats(data.stats || {});
      setTotalPages(data.pages || 1);
    } catch {
      setError('Could not load tickets.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, page]);

  useEffect(() => { loadTickets(); }, [filterStatus, filterCategory, page]);

  // ─── Open ticket detail ────────────────────────────────────────────────────

  const openTicket = async (ticket) => {
    try {
      const { data } = await api.get(`/helpdesk/tickets/${ticket._id}`);
      setSelected(data.ticket);
      setView('detail');
      window.scrollTo(0, 0);
    } catch {
      setError('Could not load ticket.');
    }
  };

  useEffect(() => {
    if (view === 'detail') {
      setTimeout(() => threadBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [selected?.messages?.length, view]);

  // ─── Send reply ────────────────────────────────────────────────────────────

  const handleReply = async () => {
    if (!replyBody.trim() || !selected) return;
    try {
      setReplySending(true);
      const { data } = await api.post(
        `/helpdesk/tickets/${selected._id}/messages`,
        { body: replyBody.trim() }
      );
      setSelected((prev) => ({
        ...prev,
        status: data.status,
        messages: [...prev.messages, data.message],
      }));
      // Sync status in list too
      setTickets((prev) => prev.map((t) =>
        t._id === selected._id ? { ...t, status: data.status } : t
      ));
      setReplyBody('');
      setSuccess('Reply sent.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send reply.');
    } finally {
      setReplySending(false);
    }
  };

  // ─── Update status ─────────────────────────────────────────────────────────

  const handleStatusChange = async (newStatus) => {
    if (!selected) return;
    try {
      setStatusUpdating(true);
      await api.patch(
        `/helpdesk/admin/tickets/${selected._id}/status`,
        { status: newStatus }
      );
      setSelected((prev) => ({ ...prev, status: newStatus }));
      setTickets((prev) => prev.map((t) =>
        t._id === selected._id ? { ...t, status: newStatus } : t
      ));
      setSuccess(`Status updated to ${STATUS_META[newStatus]?.label}.`);
    } catch {
      setError('Could not update status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  // ─── Auto-clear notices ────────────────────────────────────────────────────

  useEffect(() => {
    if (error)   { const t = setTimeout(() => setError(''),   4000); return () => clearTimeout(t); }
  }, [error]);
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); }
  }, [success]);

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div style={s.root}>
      <style>{css}</style>

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          {view === 'detail' && (
            <button style={s.backBtn} onClick={() => { setView('list'); setSelected(null); }}>
              ← Back
            </button>
          )}
          <div>
            <h1 style={s.pageTitle}>
              {view === 'list' ? 'Help Desk — Admin' : `Ticket ${selected?.ticket_number}`}
            </h1>
            <p style={s.pageSubtitle}>
              {view === 'list'
                ? 'View, respond to, and manage all support tickets'
                : selected?.subject}
            </p>
          </div>
        </div>
      </div>

      {/* ── Notifications ── */}
      {error   && <div style={s.errorBanner}>⚠ {error}</div>}
      {success && <div style={s.successBanner}>✓ {success}</div>}

      {/* ══════════════════════════════════════════════════════════════════
          LIST VIEW
      ══════════════════════════════════════════════════════════════════ */}
      {view === 'list' && (
        <>
          {/* Stats */}
          <div style={s.statsGrid}>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <div
                key={key}
                style={{
                  ...s.statCard,
                  borderTop: `3px solid ${meta.dot}`,
                  ...(filterStatus === key ? { boxShadow: `0 0 0 2px ${meta.dot}` } : {}),
                }}
                className="stat-card"
                onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
              >
                <span style={{ ...s.statNum, color: meta.color }}>{stats[key] ?? '—'}</span>
                <span style={s.statLabel}>{meta.label}</span>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={s.filtersRow}>
            <div style={s.filterGroup}>
              <span style={s.filterLabel}>Status</span>
              <div style={s.filterBtns}>
                {['all', ...Object.keys(STATUS_META)].map((f) => (
                  <button
                    key={f}
                    style={{ ...s.filterBtn, ...(filterStatus === f ? s.filterBtnActive : {}) }}
                    onClick={() => { setFilterStatus(f); setPage(1); }}
                  >
                    {f === 'all' ? 'All' : STATUS_META[f]?.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={s.filterGroup}>
              <span style={s.filterLabel}>Category</span>
              <select
                style={s.catSelect}
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Tickets table */}
          {loading ? (
            <div style={s.emptyState}>Loading tickets…</div>
          ) : tickets.length === 0 ? (
            <div style={s.emptyState}>No tickets match your filters.</div>
          ) : (
            <>
              <div style={s.table}>
                {/* Table header */}
                <div style={s.tableHead}>
                  <span style={{ ...s.th, flex: '0 0 100px' }}>Ticket #</span>
                  <span style={{ ...s.th, flex: 1 }}>Subject</span>
                  <span style={{ ...s.th, flex: '0 0 140px' }}>Category</span>
                  <span style={{ ...s.th, flex: '0 0 110px' }}>Status</span>
                  <span style={{ ...s.th, flex: '0 0 110px' }}>Submitted</span>
                  <span style={{ ...s.th, flex: '0 0 130px' }}>User</span>
                </div>

                {/* Rows */}
                {tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    style={s.tableRow}
                    className="table-row"
                    onClick={() => openTicket(ticket)}
                  >
                    <span style={{ ...s.td, flex: '0 0 100px', ...s.monoTd }}>
                      {ticket.ticket_number}
                    </span>
                    <span style={{ ...s.td, flex: 1, fontWeight: 600, color: '#0d1b3e' }}>
                      {ticket.subject}
                    </span>
                    <span style={{ ...s.td, flex: '0 0 140px', color: '#666', fontSize: '0.83rem' }}>
                      {CAT_ICONS[ticket.category]} {ticket.category}
                    </span>
                    <span style={{ ...s.td, flex: '0 0 110px' }}>
                      <StatusBadge status={ticket.status} />
                    </span>
                    <span style={{ ...s.td, flex: '0 0 110px', color: '#aaa', fontSize: '0.8rem' }}>
                      {timeAgo(ticket.created_at)}
                    </span>
                    <span style={{ ...s.td, flex: '0 0 130px', fontSize: '0.83rem', color: '#555' }}>
                      {ticket.author_name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={s.pagination}>
                  <button style={s.pageBtn} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                  <span style={s.pageInfo}>Page {page} of {totalPages}</span>
                  <button style={s.pageBtn} disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          DETAIL VIEW
      ══════════════════════════════════════════════════════════════════ */}
      {view === 'detail' && selected && (
        <div style={s.detailLayout}>

          {/* Left: thread */}
          <div style={s.threadCol}>
            <div style={s.threadCard}>
              <h3 style={s.threadHeading}>
                Conversation · {selected.messages?.length || 0} message{selected.messages?.length !== 1 ? 's' : ''}
              </h3>
              <div style={s.thread}>
                {(selected.messages || []).map((msg, i) => {
                  const isSupport = msg.sender_role === 'admin';
                  return (
                    <div key={msg._id || i} style={{
                      ...s.msgRow,
                      flexDirection: isSupport ? 'row-reverse' : 'row',
                    }}>
                      <div style={{
                        ...s.msgAvatar,
                        background: isSupport ? '#0d47a1' : '#37474f',
                      }}>
                        {isSupport ? '🛡' : (msg.sender_name?.[0] || '?').toUpperCase()}
                      </div>
                      <div style={{ maxWidth: '72%', minWidth: 0 }}>
                        <div style={{ ...s.msgMeta, justifyContent: isSupport ? 'flex-end' : 'flex-start' }}>
                          <span style={s.msgSender}>{isSupport ? 'You (Support)' : msg.sender_name}</span>
                          <span style={s.msgTime}>{timeAgo(msg.sent_at)}</span>
                        </div>
                        <div style={{
                          ...s.msgBubble,
                          background: isSupport ? '#0d47a1' : '#f1f3f4',
                          color: isSupport ? '#fff' : '#1c1c2e',
                          borderRadius: isSupport ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        }}>
                          {msg.body}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={threadBottomRef} />
              </div>

              {/* Reply box */}
              {selected.status !== 'closed' ? (
                <div style={s.replyBox}>
                  <textarea
                    style={s.replyTextarea}
                    placeholder="Type your response to the user…"
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={4}
                    maxLength={3000}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply();
                    }}
                  />
                  <div style={s.replyFooter}>
                    <span style={s.charHint}>{replyBody.length} / 3000 · Ctrl+Enter to send</span>
                    <button
                      style={{ ...s.submitBtn, opacity: replySending || !replyBody.trim() ? 0.55 : 1 }}
                      onClick={handleReply}
                      disabled={replySending || !replyBody.trim()}
                    >
                      {replySending ? 'Sending…' : 'Send Response'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={s.closedNotice}>🔒 Ticket is closed.</div>
              )}
            </div>
          </div>

          {/* Right: ticket info + actions */}
          <div style={s.sideCol}>

            {/* Info */}
            <div style={s.sideCard}>
              <p style={s.sideCardTitle}>Ticket Info</p>
              <div style={s.infoRow}><span style={s.infoKey}>Number</span><span style={{ ...s.infoVal, fontFamily: 'monospace' }}>{selected.ticket_number}</span></div>
              <div style={s.infoRow}><span style={s.infoKey}>Status</span><StatusBadge status={selected.status} /></div>
              <div style={s.infoRow}><span style={s.infoKey}>Category</span><span style={s.infoVal}>{CAT_ICONS[selected.category]} {selected.category}</span></div>
              <div style={s.infoRow}><span style={s.infoKey}>Submitted by</span><span style={s.infoVal}>{selected.author_name}</span></div>
              {selected.author_email && (
                <div style={s.infoRow}><span style={s.infoKey}>Email</span><span style={{ ...s.infoVal, fontSize: '0.82rem' }}>{selected.author_email}</span></div>
              )}
              <div style={s.infoRow}><span style={s.infoKey}>Opened</span><span style={s.infoVal}>{timeAgo(selected.created_at)}</span></div>
              {selected.assigned_to_name && (
                <div style={s.infoRow}><span style={s.infoKey}>Assigned to</span><span style={s.infoVal}>{selected.assigned_to_name}</span></div>
              )}
            </div>

            {/* Status actions */}
            <div style={s.sideCard}>
              <p style={s.sideCardTitle}>Update Status</p>
              <div style={s.statusBtns}>
                {Object.entries(STATUS_META).map(([key, meta]) => (
                  <button
                    key={key}
                    style={{
                      ...s.statusBtn,
                      background: selected.status === key ? meta.dot : '#f7f9ff',
                      color: selected.status === key ? '#fff' : '#555',
                      borderColor: selected.status === key ? meta.dot : '#dce3f0',
                      opacity: statusUpdating ? 0.6 : 1,
                    }}
                    onClick={() => handleStatusChange(key)}
                    disabled={statusUpdating || selected.status === key}
                  >
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  .stat-card { cursor: pointer; transition: box-shadow 0.15s, transform 0.15s; }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.10) !important; }
  .table-row:hover { background: #f0f4ff !important; }
`;

const s = {
  root: {
    minHeight: '100vh', background: '#f4f6fb',
    fontFamily: "'DM Sans', sans-serif", color: '#1c1c2e',
    padding: '2rem 1.5rem', maxWidth: 1100, margin: '0 auto',
  },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: '1.75rem',
    flexWrap: 'wrap', gap: '1rem',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
  backBtn: {
    background: 'none', border: 'none', color: '#0d47a1',
    fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
    padding: '0.3rem 0', fontFamily: "'DM Sans', sans-serif",
  },
  pageTitle: {
    fontFamily: "'DM Sans', sans-serif", fontSize: '1.8rem',
    fontWeight: 700, margin: 0, color: '#0d1b3e',
  },
  pageSubtitle: { margin: '0.2rem 0 0', color: '#7a849e', fontSize: '0.9rem' },
  errorBanner: {
    background: '#fdecea', color: '#b71c1c', padding: '0.75rem 1rem',
    borderRadius: 8, marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid #ffcdd2',
  },
  successBanner: {
    background: '#e8f5e9', color: '#1b5e20', padding: '0.75rem 1rem',
    borderRadius: 8, marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid #c8e6c9',
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.75rem', marginBottom: '1.5rem',
  },
  statCard: {
    background: '#fff', borderRadius: 12, padding: '1.1rem',
    textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    border: '1.5px solid #e8ecf5', display: 'flex',
    flexDirection: 'column', gap: 4,
  },
  statNum: { fontSize: '1.7rem', fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: '0.72rem', color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' },
  filtersRow: {
    display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
    marginBottom: '1.25rem', alignItems: 'flex-end',
  },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  filterLabel: { fontSize: '0.72rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em' },
  filterBtns: { display: 'flex', gap: '0.35rem', flexWrap: 'wrap' },
  filterBtn: {
    padding: '0.35rem 0.85rem', border: '1.5px solid #dce3f0',
    borderRadius: 20, background: '#fff', color: '#7a849e',
    fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
  },
  filterBtnActive: { background: '#0d47a1', borderColor: '#0d47a1', color: '#fff' },
  catSelect: {
    padding: '0.4rem 0.8rem', border: '1.5px solid #dce3f0',
    borderRadius: 8, background: '#fff', color: '#555',
    fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif", outline: 'none',
  },
  table: {
    background: '#fff', border: '1.5px solid #e8ecf5',
    borderRadius: 14, overflow: 'hidden',
    boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
  },
  tableHead: {
    display: 'flex', background: '#f7f9ff',
    borderBottom: '1.5px solid #e8ecf5', padding: '0.65rem 1.25rem',
  },
  th: { fontSize: '0.72rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em' },
  tableRow: {
    display: 'flex', alignItems: 'center', padding: '0.9rem 1.25rem',
    borderBottom: '1px solid #f0f3fa', cursor: 'pointer',
    transition: 'background 0.1s',
  },
  td: { fontSize: '0.88rem', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  monoTd: { fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: '#7a849e' },
  pagination: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    gap: '1rem', marginTop: '1.25rem',
  },
  pageBtn: {
    background: '#fff', border: '1.5px solid #dce3f0', borderRadius: 8,
    padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.83rem',
    color: '#555', fontFamily: "'DM Sans', sans-serif",
  },
  pageInfo: { fontSize: '0.83rem', color: '#aaa' },
  emptyState: { textAlign: 'center', color: '#aaa', padding: '3rem', fontSize: '1rem' },

  // Detail layout
  detailLayout: { display: 'flex', gap: '1.25rem', alignItems: 'flex-start' },
  threadCol: { flex: 1, minWidth: 0 },
  sideCol: { width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' },

  threadCard: {
    background: '#fff', border: '1.5px solid #e8ecf5',
    borderRadius: 14, padding: '1.5rem',
    boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
  },
  threadHeading: {
    fontSize: '1rem', fontWeight: 700, margin: '0 0 1.25rem', color: '#0d1b3e',
  },
  thread: { display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '1.5rem' },
  msgRow: { display: 'flex', gap: '0.75rem', alignItems: 'flex-end' },
  msgAvatar: {
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: '0.82rem',
  },
  msgMeta: { display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' },
  msgSender: { fontSize: '0.76rem', fontWeight: 700, color: '#555' },
  msgTime:   { fontSize: '0.7rem', color: '#bbb' },
  msgBubble: { padding: '0.65rem 1rem', fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  replyBox: { borderTop: '1.5px solid #f0f3fa', paddingTop: '1.25rem' },
  replyTextarea: {
    width: '100%', border: '1.5px solid #dce3f0', borderRadius: 9,
    padding: '0.7rem 0.9rem', fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.9rem', outline: 'none', color: '#0d1b3e',
    background: '#f7f9ff', resize: 'none', boxSizing: 'border-box', lineHeight: 1.6,
  },
  replyFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' },
  charHint: { fontSize: '0.72rem', color: '#bbb' },
  submitBtn: {
    background: '#0d47a1', color: '#fff', border: 'none', borderRadius: 9,
    padding: '0.6rem 1.4rem', fontWeight: 600, fontSize: '0.88rem',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  },
  closedNotice: {
    borderTop: '1.5px solid #f0f3fa', paddingTop: '1rem',
    fontSize: '0.85rem', color: '#999', textAlign: 'center',
  },

  // Side cards
  sideCard: {
    background: '#fff', border: '1.5px solid #e8ecf5',
    borderRadius: 12, padding: '1.1rem',
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  },
  sideCardTitle: {
    fontSize: '0.72rem', fontWeight: 700, color: '#aaa',
    textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.85rem',
  },
  infoRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '0.45rem 0',
    borderBottom: '1px solid #f4f6fb', gap: '0.5rem',
  },
  infoKey: { fontSize: '0.78rem', color: '#aaa', fontWeight: 600, flexShrink: 0 },
  infoVal: { fontSize: '0.85rem', fontWeight: 600, color: '#0d1b3e', textAlign: 'right' },
  statusBtns: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  statusBtn: {
    width: '100%', padding: '0.5rem', border: '1.5px solid',
    borderRadius: 8, fontWeight: 600, fontSize: '0.85rem',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.12s',
  },
};
