import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { GSU_COURSES } from '../../data/gsuCourses';

// Live lecture transcription using the browser's Web Speech API.
// Captures mic audio and produces live captions with zero server roundtrips.
// When the user saves, we POST the full transcript to the backend which runs
// it through the AI to extract a summary, key points, glossary, and action items.
function LiveTranscribe() {
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState('');
  const [final, setFinal] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState('root');
  const [sessions, setSessions] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [alert, setAlert] = useState({ text: '', type: '' });
  const [supported, setSupported] = useState(true);
  const [health, setHealth] = useState(null);

  const recognitionRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let interimPiece = '';
      let finalPiece = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalPiece += res[0].transcript + ' ';
        else interimPiece += res[0].transcript;
      }
      if (finalPiece) setFinal(prev => prev + finalPiece);
      setInterim(interimPiece);
    };

    rec.onerror = (e) => {
      console.error('SpeechRecognition error:', e.error);
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      setAlert({ text: 'Mic error: ' + e.error, type: 'error' });
    };

    rec.onend = () => {
      // Auto-restart if we're still supposed to be recording (browsers cap sessions)
      if (recordingRef.current) {
        try { rec.start(); } catch {}
      }
    };

    recognitionRef.current = rec;
    return () => { try { rec.stop(); } catch {} };
  }, []);

  const recordingRef = useRef(false);
  useEffect(() => { recordingRef.current = recording; }, [recording]);

  useEffect(() => { loadSessions(); }, []);

  useEffect(() => {
    api.get('/transcription/health').then(r => setHealth(r.data)).catch(() => {});
  }, []);

  const loadSessions = async () => {
    try {
      const res = await api.get('/transcription/sessions');
      setSessions(res.data);
    } catch {}
  };

  const start = () => {
    if (!recognitionRef.current) return;
    setFinal('');
    setInterim('');
    setElapsed(0);
    startTimeRef.current = Date.now();
    try { recognitionRef.current.start(); } catch {}
    setRecording(true);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const stop = () => {
    setRecording(false);
    try { recognitionRef.current?.stop(); } catch {}
    clearInterval(timerRef.current);
  };

  const save = async () => {
    const transcript = (final + ' ' + interim).trim();
    if (!transcript) {
      setAlert({ text: 'Nothing to save yet', type: 'error' });
      return;
    }
    try {
      await api.post('/transcription/sessions', {
        title: title || `Lecture ${new Date().toLocaleDateString()}`,
        folder,
        transcript,
        durationSeconds: elapsed,
      });
      setAlert({ text: 'Saved. Summary is being generated in the background.', type: 'success' });
      setFinal('');
      setInterim('');
      setTitle('');
      setElapsed(0);
      loadSessions();
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Save failed', type: 'error' });
    }
  };

  const discard = () => {
    if (!window.confirm('Discard the current transcript?')) return;
    setFinal('');
    setInterim('');
    setElapsed(0);
  };

  const openSession = async (id) => {
    try {
      const res = await api.get('/transcription/sessions/' + id);
      setViewing(res.data);
    } catch {}
  };

  const resummarize = async () => {
    if (!viewing) return;
    try {
      const res = await api.post(`/transcription/sessions/${viewing._id}/summarize`);
      setViewing(res.data);
      setAlert({ text: 'Summary refreshed', type: 'success' });
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Summary failed', type: 'error' });
    }
  };

  const deleteSession = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    try {
      await api.delete('/transcription/sessions/' + id);
      if (viewing?._id === id) setViewing(null);
      loadSessions();
    } catch {}
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  if (!supported) {
    return (
      <div className="card">
        <h1>Live Transcription</h1>
        <p>Your browser doesn't support the Web Speech API. Try Chrome, Edge, or Safari.</p>
      </div>
    );
  }

  if (viewing) {
    return (
      <div>
        <button onClick={() => setViewing(null)} className="btn btn-secondary btn-sm" style={{ marginBottom: '10px' }}>
          &larr; Back
        </button>
        <div className="page-header">
          <h1>{viewing.title}</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {viewing.folder && viewing.folder !== 'root' ? viewing.folder + ' - ' : ''}
            {new Date(viewing.createdAt).toLocaleString()}
            {viewing.durationSeconds ? ` - ${formatTime(viewing.durationSeconds)}` : ''}
          </p>
        </div>

        {alert.text && <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>{alert.text}</div>}

        {viewing.summary ? (
          <div className="card">
            <h2>Summary</h2>
            <p>{viewing.summary}</p>

            {viewing.keyPoints?.length > 0 && (
              <>
                <h3>Key points</h3>
                <ul>{viewing.keyPoints.map((k, i) => <li key={i}>{k}</li>)}</ul>
              </>
            )}

            {viewing.glossary?.length > 0 && (
              <>
                <h3>Glossary</h3>
                <ul>{viewing.glossary.map((g, i) => <li key={i}><strong>{g.term}:</strong> {g.definition}</li>)}</ul>
              </>
            )}

            {viewing.actionItems?.length > 0 && (
              <>
                <h3>Action items</h3>
                <ul>{viewing.actionItems.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </>
            )}
          </div>
        ) : (
          <div className="card">
            <p style={{ color: 'var(--text-muted)' }}>Summary not ready yet. Try again in a moment.</p>
            <button onClick={resummarize} className="btn btn-primary btn-sm">Generate summary now</button>
          </div>
        )}

        <div className="card">
          <h2>Full transcript</h2>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{viewing.transcript}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Live Transcription</h1>
        <p>Record a lecture or study session. The browser transcribes it live and the AI extracts notes when you save.</p>
      </div>

      {alert.text && <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>{alert.text}</div>}

      {health && !health.summary && (
        <div className="alert alert-error" style={{ marginBottom: '12px' }}>
          AI summarization isn't configured — you can still record and save transcripts, but summaries won't generate.
          Ask the admin to set <code>GEMINI_API_KEY</code> or AWS Bedrock credentials.
        </div>
      )}

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. CSC 1301 Lecture 5" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Course</label>
            <select value={folder} onChange={e => setFolder(e.target.value)}>
              <option value="root">None</option>
              {GSU_COURSES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
        </div>

        <div style={{
          background: recording ? '#fff5f5' : 'var(--bg)',
          border: recording ? '2px solid var(--red)' : '1px solid var(--border)',
          borderRadius: '10px',
          padding: '18px',
          minHeight: '180px',
          fontSize: '0.95rem',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap'
        }}>
          {recording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.82rem', color: 'var(--red)' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--red)' }} />
              Recording &middot; {formatTime(elapsed)}
            </div>
          )}
          {final}
          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{interim}</span>
          {!recording && !final && <span style={{ color: 'var(--text-muted)' }}>Click Start and begin speaking...</span>}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          {!recording ? (
            <button onClick={start} className="btn btn-primary">Start recording</button>
          ) : (
            <button onClick={stop} className="btn btn-danger">Stop</button>
          )}
          {final && !recording && (
            <>
              <button onClick={save} className="btn btn-primary">Save session</button>
              <button onClick={discard} className="btn btn-secondary">Discard</button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Saved sessions</h2>
        {sessions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No saved sessions yet.</p>
        ) : (
          sessions.map(s => (
            <div key={s._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div onClick={() => openSession(s._id)} style={{ cursor: 'pointer', flex: 1 }}>
                <strong>{s.title}</strong>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {s.folder && s.folder !== 'root' ? s.folder + ' - ' : ''}
                  {new Date(s.createdAt).toLocaleString()}
                  {s.durationSeconds ? ` - ${formatTime(s.durationSeconds)}` : ''}
                </div>
              </div>
              <button onClick={() => deleteSession(s._id)} className="btn btn-danger btn-sm">Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LiveTranscribe;
