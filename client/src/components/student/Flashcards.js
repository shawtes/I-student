import { useState, useEffect } from 'react';
import api from '../../services/api';

function Flashcards() {
  const [decks, setDecks] = useState([]);
  const [activeDeck, setActiveDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [view, setView] = useState('decks');
  const [newDeck, setNewDeck] = useState('');
  const [text, setText] = useState('');
  const [sourceMode, setSourceMode] = useState('text');
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [alert, setAlert] = useState({ text: '', type: '' });

  useEffect(() => { loadDecks(); loadFiles(); }, []);

  const loadDecks = async () => {
    try { setDecks((await api.get('/flashcards/decks')).data); } catch {}
  };
  const loadFiles = async () => {
    try { setFiles((await api.get('/files')).data); } catch {}
  };
  const openDeck = async (deck) => {
    setActiveDeck(deck);
    try {
      setCards((await api.get('/flashcards?deck=' + encodeURIComponent(deck))).data);
      setView('study');
    } catch {}
  };
  const generate = async (e) => {
    e.preventDefault();
    if (!newDeck.trim()) return;
    setGenerating(true);
    setAlert({ text: '', type: '' });
    try {
      const body = { deck: newDeck, count: 10 };
      if (sourceMode !== 'files') body.text = text;
      if (sourceMode !== 'text') body.fileIds = selectedFiles;
      await api.post('/flashcards/generate', body);
      setAlert({ text: 'Flashcards generated', type: 'success' });
      setText(''); setSelectedFiles([]);
      loadDecks();
      openDeck(newDeck);
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Generation failed', type: 'error' });
    } finally { setGenerating(false); }
  };
  const deleteCard = async (id) => {
    try { await api.delete('/flashcards/' + id); setCards(cards.filter(c => c._id !== id)); } catch {}
  };
  const toggleFile = (id) => {
    setSelectedFiles(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const grouped = {};
  for (const f of files) {
    const key = (!f.folder || f.folder === 'root') ? 'General' : f.folder;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  }

  if (view === 'study' && cards.length > 0) {
    return <StudyView cards={cards} deckName={activeDeck} onBack={() => setView('decks')} onDelete={deleteCard} />;
  }

  if (view === 'create') {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <button onClick={() => setView('decks')} style={S.backBtn}>&larr; Back to decks</button>
        {alert.text && <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>{alert.text}</div>}
        <div style={S.heroCard}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Create flashcards</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 20px' }}>AI generates Q&A cards from your material</p>
          <form onSubmit={generate}>
            <div style={{ marginBottom: '16px' }}>
              <label style={S.label}>Deck name</label>
              <input value={newDeck} onChange={e => setNewDeck(e.target.value)} required placeholder="e.g. Chapter 5 - Cells" style={S.input} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[['text', 'Paste text'], ['files', 'From files'], ['both', 'Both']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setSourceMode(v)}
                  style={{ ...S.modeBtn, ...(sourceMode === v ? S.modeBtnActive : {}) }}>{l}</button>
              ))}
            </div>
            {sourceMode !== 'files' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={S.label}>Notes / transcript</label>
                <textarea value={text} onChange={e => setText(e.target.value)} rows="6"
                  placeholder="Paste your study material here..." style={S.textarea} required={sourceMode === 'text'} />
              </div>
            )}
            {sourceMode !== 'text' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={S.label}>Source files</label>
                {files.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No files yet. Upload in the Files tab.</p>
                ) : (
                  <div style={S.fileList}>
                    {Object.entries(grouped).sort().map(([folder, ff]) => (
                      <div key={folder} style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{folder}</div>
                        {ff.map(f => (
                          <label key={f._id} style={S.fileItem}>
                            <input type="checkbox" checked={selectedFiles.includes(f._id)} onChange={() => toggleFile(f._id)} />
                            <span>{f.originalName}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {selectedFiles.length > 0 && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--accent)', marginTop: '6px' }}>{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected</p>
                )}
              </div>
            )}
            <button type="submit" disabled={generating} style={S.primaryBtn}>
              {generating ? 'Generating with AI...' : 'Generate flashcards'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>Flashcards</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>Study smarter with AI-generated cards</p>
        </div>
        <button onClick={() => setView('create')} style={S.primaryBtn}>+ Create deck</button>
      </div>
      {alert.text && <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>{alert.text}</div>}
      {decks.length === 0 ? (
        <div style={S.emptyState}>
          <h2>No flashcard decks yet</h2>
          <p style={{ color: 'var(--text-muted)' }}>Create your first deck from notes or uploaded files</p>
          <button onClick={() => setView('create')} style={{ ...S.primaryBtn, marginTop: '16px' }}>Create your first deck</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
          {decks.map(d => (
            <div key={d.deck} onClick={() => openDeck(d.deck)} style={S.deckCard}>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{d.deck}</h3>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>{d.count} card{d.count !== 1 ? 's' : ''}</span>
                {d.due > 0 && <span style={{ color: 'var(--orange)' }}>{d.due} due</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudyView({ cards, deckName, onBack, onDelete }) {
  const [mode, setMode] = useState('flashcards');
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());
  const [showAll, setShowAll] = useState(false);

  const card = cards[idx];
  const next = () => { setFlipped(false); setIdx(Math.min(idx + 1, cards.length - 1)); };
  const prev = () => { setFlipped(false); setIdx(Math.max(idx - 1, 0)); };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <button onClick={onBack} style={S.backBtn}>&larr; Back</button>
          <h1 style={{ margin: '4px 0 0', fontSize: '1.5rem' }}>{deckName}</h1>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {cards.length} card{cards.length !== 1 ? 's' : ''}
          {known.size > 0 && <span style={{ color: 'var(--green)' }}> &middot; {known.size} mastered</span>}
        </div>
      </div>

      <div style={S.modeTabs}>
        {[['flashcards', 'Flashcards'], ['list', 'Terms']].map(([v, l]) => (
          <button key={v} onClick={() => setMode(v)}
            style={{ ...S.modeTab, ...(mode === v ? S.modeTabActive : {}) }}>{l}</button>
        ))}
      </div>

      {mode === 'flashcards' && (
        <>
          <div onClick={() => setFlipped(!flipped)} style={{
            ...S.heroFlashcard,
            background: flipped ? 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' : '#fff',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              {flipped ? 'Answer' : 'Question'}
            </div>
            <div style={{ fontSize: '1.3rem', lineHeight: 1.55, maxWidth: '600px' }}>
              {flipped ? card.answer : card.question}
            </div>
            <div style={{ position: 'absolute', bottom: '16px', right: '20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click to flip
            </div>
          </div>

          <div style={S.cardNav}>
            <button onClick={prev} disabled={idx === 0} style={S.navArrow}>&larr;</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => { known.delete(card._id); setKnown(new Set(known)); next(); }}
                style={{ ...S.actionBtn, borderColor: 'var(--red)', color: 'var(--red)' }}>Still learning</button>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', minWidth: '60px', textAlign: 'center' }}>
                {idx + 1} / {cards.length}
              </span>
              <button onClick={() => { setKnown(new Set(known).add(card._id)); next(); }}
                style={{ ...S.actionBtn, borderColor: 'var(--green)', color: 'var(--green)' }}>Know it</button>
            </div>
            <button onClick={next} disabled={idx === cards.length - 1} style={S.navArrow}>&rarr;</button>
          </div>

          <div style={{ background: 'var(--border)', borderRadius: '4px', height: '4px', margin: '16px 0' }}>
            <div style={{ width: `${((idx + 1) / cards.length) * 100}%`, height: '100%', borderRadius: '4px', background: 'var(--accent)', transition: 'width 0.3s' }} />
          </div>

          {known.size === cards.length && (
            <div style={{ textAlign: 'center', padding: '24px', background: 'var(--green-light)', borderRadius: '12px', marginTop: '16px' }}>
              <h2 style={{ color: 'var(--green)', margin: '0 0 8px' }}>All cards mastered!</h2>
              <button onClick={() => { setKnown(new Set()); setIdx(0); setFlipped(false); }} style={S.secondaryBtn}>Study again</button>
            </div>
          )}
        </>
      )}

      {mode === 'list' && (
        <div style={{ marginTop: '16px' }}>
          {cards.slice(0, showAll ? cards.length : 8).map(c => (
            <div key={c._id} style={S.termRow}>
              <div style={S.termLeft}>
                <div style={S.termLabel}>TERM</div>
                <div style={{ fontSize: '0.95rem' }}>{c.question}</div>
              </div>
              <div style={S.termDivider} />
              <div style={S.termRight}>
                <div style={S.termLabel}>DEFINITION</div>
                <div style={{ fontSize: '0.95rem' }}>{c.answer}</div>
              </div>
              <button onClick={() => onDelete(c._id)} style={S.termDelete} title="Delete">x</button>
            </div>
          ))}
          {cards.length > 8 && !showAll && (
            <button onClick={() => setShowAll(true)} style={{ ...S.secondaryBtn, width: '100%', marginTop: '8px' }}>
              Show all {cards.length} terms
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const S = {
  backBtn: { background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', padding: '4px 0', fontFamily: 'Inter, sans-serif' },
  heroCard: { background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid var(--border)' },
  label: { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '10px', fontSize: '0.95rem', fontFamily: 'Inter, sans-serif', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '10px', fontSize: '0.95rem', fontFamily: 'Inter, sans-serif', background: 'var(--bg)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
  modeBtn: { padding: '6px 16px', border: '1.5px solid var(--border)', borderRadius: '20px', background: '#fff', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500 },
  modeBtnActive: { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' },
  fileList: { maxHeight: '180px', overflowY: 'auto', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '10px 12px', background: 'var(--bg)' },
  fileItem: { display: 'flex', gap: '8px', alignItems: 'center', padding: '3px 0 3px 10px', fontSize: '0.85rem', cursor: 'pointer' },
  primaryBtn: { padding: '10px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  secondaryBtn: { padding: '8px 20px', background: '#fff', color: 'var(--accent)', border: '1.5px solid var(--accent)', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  emptyState: { textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px solid var(--border)' },
  deckCard: { background: '#fff', borderRadius: '12px', padding: '20px', border: '1.5px solid var(--border)', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  modeTabs: { display: 'flex', gap: '0', borderBottom: '2px solid var(--border)', marginBottom: '20px' },
  modeTab: { padding: '10px 24px', border: 'none', background: 'none', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif', borderBottom: '2px solid transparent', marginBottom: '-2px' },
  modeTabActive: { color: 'var(--accent)', borderBottomColor: 'var(--accent)' },
  heroFlashcard: { position: 'relative', minHeight: '280px', borderRadius: '16px', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid var(--border)', transition: 'background 0.3s', userSelect: 'none' },
  cardNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' },
  navArrow: { width: '44px', height: '44px', borderRadius: '50%', border: '1.5px solid var(--border)', background: '#fff', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' },
  actionBtn: { padding: '8px 18px', borderRadius: '20px', border: '1.5px solid', background: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  termRow: { display: 'flex', alignItems: 'stretch', background: '#fff', borderRadius: '10px', marginBottom: '8px', border: '1px solid var(--border)', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  termLeft: { flex: 1, padding: '16px 20px' },
  termDivider: { width: '1px', background: 'var(--border)', alignSelf: 'stretch' },
  termRight: { flex: 1, padding: '16px 20px' },
  termLabel: { fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' },
  termDelete: { position: 'absolute', top: '8px', right: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', padding: '2px 6px' },
};

export default Flashcards;
