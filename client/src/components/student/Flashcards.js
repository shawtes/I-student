import { useState, useEffect } from 'react';
import api from '../../services/api';

function Flashcards() {
  const [decks, setDecks] = useState([]);
  const [activeDeck, setActiveDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [newDeck, setNewDeck] = useState('');
  const [text, setText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [alert, setAlert] = useState({ text: '', type: '' });

  useEffect(() => { loadDecks(); }, []);

  const loadDecks = async () => {
    try {
      const res = await api.get('/flashcards/decks');
      setDecks(res.data);
    } catch {}
  };

  const openDeck = async (deck) => {
    setActiveDeck(deck);
    try {
      const res = await api.get('/flashcards?deck=' + encodeURIComponent(deck));
      setCards(res.data);
    } catch {}
  };

  const generate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setAlert({ text: '', type: '' });
    try {
      await api.post('/flashcards/generate', {
        deck: newDeck,
        text,
        count: 10
      });
      setAlert({ text: 'Flashcards generated', type: 'success' });
      setText('');
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

  return (
    <div>
      <div className="page-header">
        <h1>Flashcards</h1>
        <p>Generate study cards from your notes with AI, or add them manually</p>
      </div>

      {alert.text && (
        <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>{alert.text}</div>
      )}

      <div className="card">
        <h2>Generate from text</h2>
        <form onSubmit={generate} style={{ marginTop: '14px' }}>
          <div className="form-group">
            <label htmlFor="deck">Deck name</label>
            <input id="deck" value={newDeck} onChange={e => setNewDeck(e.target.value)} required placeholder="Chapter 5 - Cells" />
          </div>
          <div className="form-group">
            <label htmlFor="text">Paste notes, a lecture transcript, or text from a PDF</label>
            <textarea id="text" value={text} onChange={e => setText(e.target.value)} rows="6" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={generating}>
            {generating ? 'Generating...' : 'Generate cards'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>My decks</h2>
        {decks.length === 0 ? (
          <p>No decks yet.</p>
        ) : (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
            {decks.map(d => (
              <button key={d.deck} className="btn btn-secondary btn-sm" onClick={() => openDeck(d.deck)}>
                {d.deck} ({d.count}{d.due > 0 ? `, ${d.due} due` : ''})
              </button>
            ))}
          </div>
        )}
      </div>

      {activeDeck && (
        <div className="card">
          <h2>{activeDeck}</h2>
          {cards.map(c => (
            <div key={c._id} style={{ padding: '10px', margin: '8px 0', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <div><strong>Q:</strong> {c.question}</div>
              <div><strong>A:</strong> {c.answer}</div>
              <button className="btn btn-danger btn-sm" onClick={() => deleteCard(c._id)} style={{ marginTop: '6px' }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Flashcards;
