import { useState, useEffect } from 'react';
import api from '../../services/api';

function Flashcards() {
  const [decks, setDecks] = useState([]);
  const [activeDeck, setActiveDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [newDeck, setNewDeck] = useState('');
  const [text, setText] = useState('');
  const [sourceMode, setSourceMode] = useState('text'); // 'text' | 'files' | 'both'
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [studying, setStudying] = useState(false);
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
    setStudying(false);
    try { setCards((await api.get('/flashcards?deck=' + encodeURIComponent(deck))).data); } catch {}
  };

  const generate = async (e) => {
    e.preventDefault();
    if (!newDeck.trim()) return;
    if (sourceMode === 'text' && !text.trim()) return;
    if (sourceMode === 'files' && selectedFiles.length === 0) return;

    setGenerating(true);
    setAlert({ text: '', type: '' });
    try {
      const body = { deck: newDeck, count: 10 };
      if (sourceMode !== 'files') body.text = text;
      if (sourceMode !== 'text') body.fileIds = selectedFiles;

      await api.post('/flashcards/generate', body);
      setAlert({ text: 'Flashcards generated', type: 'success' });
      setText('');
      setSelectedFiles([]);
      loadDecks();
      openDeck(newDeck);
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Generation failed', type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const deleteCard = async (id) => {
    try {
      await api.delete('/flashcards/' + id);
      setCards(cards.filter(c => c._id !== id));
    } catch {}
  };

  const toggleFile = (id) => {
    setSelectedFiles(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  // Group files by folder
  const grouped = {};
  for (const f of files) {
    const key = (!f.folder || f.folder === 'root') ? 'General' : f.folder;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  }

  // Study mode
  if (studying && cards.length > 0) {
    return (
      <div>
        <button className="btn btn-secondary btn-sm" onClick={() => setStudying(false)} style={{ marginBottom: '12px' }}>
          Back to {activeDeck}
        </button>
        <StudyMode cards={cards} deckName={activeDeck} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Flashcards</h1>
        <p>Generate study cards from your notes or uploaded files with AI</p>
      </div>

      {alert.text && (
        <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>{alert.text}</div>
      )}

      <div className="card">
        <h2>Generate flashcards</h2>
        <form onSubmit={generate} style={{ marginTop: '14px' }}>
          <div className="form-group">
            <label htmlFor="deck">Deck name</label>
            <input id="deck" value={newDeck} onChange={e => setNewDeck(e.target.value)} required placeholder="Chapter 5 - Cells" />
          </div>

          <div className="form-group">
            <label>Source</label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              {[['text', 'Paste text'], ['files', 'From files'], ['both', 'Both']].map(([val, label]) => (
                <button key={val} type="button"
                  className={`btn btn-sm ${sourceMode === val ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSourceMode(val)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {sourceMode !== 'files' && (
            <div className="form-group">
              <label htmlFor="text">Paste notes or lecture transcript</label>
              <textarea id="text" value={text} onChange={e => setText(e.target.value)} rows="5"
                placeholder="Paste your notes here..." required={sourceMode === 'text'} />
            </div>
          )}

          {sourceMode !== 'text' && (
            <div className="form-group">
              <label>Select files (AI will extract and read them)</label>
              {files.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No files uploaded yet. Go to Files to upload.</p>
              ) : (
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px' }}>
                  {Object.entries(grouped).sort().map(([folder, folderFiles]) => (
                    <div key={folder} style={{ marginBottom: '6px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{folder}</div>
                      {folderFiles.map(f => (
                        <label key={f._id} style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '2px 0 2px 10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedFiles.includes(f._id)} onChange={() => toggleFile(f._id)} />
                          {f.originalName}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {selectedFiles.length > 0 && (
                <p style={{ fontSize: '0.82rem', color: 'var(--accent)', marginTop: '4px' }}>
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={generating}>
            {generating ? 'Generating with AI...' : 'Generate cards'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>My decks</h2>
        {decks.length === 0 ? (
          <p style={{ marginTop: '10px' }}>No decks yet. Generate some above.</p>
        ) : (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
            {decks.map(d => (
              <button key={d.deck}
                className={`btn btn-sm ${activeDeck === d.deck ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => openDeck(d.deck)}>
                {d.deck} ({d.count}{d.due > 0 ? `, ${d.due} due` : ''})
              </button>
            ))}
          </div>
        )}
      </div>

      {activeDeck && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{activeDeck} ({cards.length} cards)</h2>
            {cards.length > 0 && (
              <button className="btn btn-primary btn-sm" onClick={() => setStudying(true)}>Study</button>
            )}
          </div>
          {cards.length === 0 ? (
            <p style={{ marginTop: '10px' }}>No cards in this deck.</p>
          ) : (
            cards.map(c => (
              <div key={c._id} style={{ padding: '10px', margin: '8px 0', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div><strong>Q:</strong> {c.question}</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}><strong>A:</strong> {c.answer}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteCard(c._id)} style={{ flexShrink: 0 }}>Delete</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StudyMode({ cards, deckName }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());
  const [reviewing, setReviewing] = useState(new Set());

  const card = cards[idx];
  const next = () => { setFlipped(false); setIdx((idx + 1) % cards.length); };
  const prev = () => { setFlipped(false); setIdx((idx - 1 + cards.length) % cards.length); };

  const markKnown = () => {
    setKnown(new Set(known).add(card._id));
    reviewing.delete(card._id);
    setReviewing(new Set(reviewing));
    next();
  };

  const markReview = () => {
    setReviewing(new Set(reviewing).add(card._id));
    known.delete(card._id);
    setKnown(new Set(known));
    next();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Studying: {deckName}</h1>
        <p>{known.size} known, {reviewing.size} need review, {cards.length - known.size - reviewing.size} unseen</p>
      </div>

      <div className="card" onClick={() => setFlipped(!flipped)} style={{
        minHeight: '220px', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
        textAlign: 'center', padding: '32px',
        background: flipped ? 'var(--accent-light)' : 'var(--bg)',
        border: known.has(card._id) ? '2px solid var(--green)' : reviewing.has(card._id) ? '2px solid var(--orange)' : '1px solid var(--border)'
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          {flipped ? 'ANSWER' : 'QUESTION'} — Click to flip &middot; {idx + 1}/{cards.length}
        </div>
        <div style={{ fontSize: '1.15rem', lineHeight: 1.5 }}>
          {flipped ? card.answer : card.question}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '14px' }}>
        <button className="btn btn-secondary" onClick={prev}>Prev</button>
        <button className="btn btn-secondary" style={{ color: 'var(--green)' }} onClick={markKnown}>Got it</button>
        <button className="btn btn-secondary" style={{ color: 'var(--orange)' }} onClick={markReview}>Review again</button>
        <button className="btn btn-primary" onClick={next}>Next</button>
      </div>

      {known.size + reviewing.size === cards.length && (
        <div className="card" style={{ textAlign: 'center', marginTop: '16px' }}>
          <h2>Done!</h2>
          <p>{known.size}/{cards.length} cards mastered, {reviewing.size} flagged for review</p>
        </div>
      )}
    </div>
  );
}

export default Flashcards;
