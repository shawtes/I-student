import { useState, useEffect } from 'react';
import api from '../../services/api';

function StudyTools() {
  const [contentType, setContentType] = useState('quiz');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [studyContent, setStudyContent] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => { loadFiles(); loadStudyContent(); }, []);

  const loadFiles = async () => {
    try { setFiles((await api.get('/files')).data); } catch {}
  };

  const loadStudyContent = async () => {
    try { setStudyContent((await api.get('/study')).data); } catch {}
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await api.post('/study/generate', {
        type: contentType, title, topic, fileIds: selectedFiles
      });
      setMessage({ text: 'Generated!', type: 'success' });
      setTitle(''); setTopic(''); setSelectedFiles([]);
      loadStudyContent();
      setViewing(res.data);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Generation failed', type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const toggleFile = (id) => {
    setSelectedFiles(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this?')) return;
    try {
      await api.delete(`/study/${id}`);
      if (viewing?._id === id) setViewing(null);
      loadStudyContent();
    } catch {}
  };

  const openContent = async (id) => {
    try {
      const res = await api.get(`/study/${id}`);
      setViewing(res.data);
    } catch {}
  };

  const typeLabels = { quiz: 'Quiz', flashcard: 'Flashcards', guide: 'Study Guide' };
  const typeColors = { quiz: 'var(--accent)', flashcard: 'var(--purple)', guide: 'var(--green)' };

  // Group files by folder for the picker
  const grouped = {};
  for (const f of files) {
    const key = (!f.folder || f.folder === 'root') ? 'General' : f.folder;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  }

  if (viewing) {
    return (
      <div>
        <button className="btn btn-secondary btn-sm" onClick={() => setViewing(null)} style={{ marginBottom: '12px' }}>
          Back to Study Tools
        </button>
        <ContentViewer content={viewing} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Study Tools</h1>
        <p>Generate quizzes, flashcards, and study guides from your materials using AI</p>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>{message.text}</div>
      )}

      <div className="card">
        <h2>Generate content</h2>
        <form onSubmit={handleGenerate} style={{ marginTop: '14px' }}>
          <div className="grid grid-3">
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select id="type" value={contentType} onChange={(e) => setContentType(e.target.value)}>
                <option value="quiz">Quiz (multiple choice)</option>
                <option value="flashcard">Flashcards</option>
                <option value="guide">Study Guide</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="gen-title">Title</label>
              <input id="gen-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 5 Review" required />
            </div>
            <div className="form-group">
              <label htmlFor="gen-topic">Topic</label>
              <input id="gen-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Photosynthesis" required />
            </div>
          </div>

          {files.length > 0 && (
            <div className="form-group">
              <label>Source files (optional — AI reads these to generate content)</label>
              <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px' }}>
                {Object.entries(grouped).sort().map(([folder, folderFiles]) => (
                  <div key={folder} style={{ marginBottom: '6px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{folder}</div>
                    {folderFiles.map(file => (
                      <label key={file._id} style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '2px 0 2px 10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selectedFiles.includes(file._id)} onChange={() => toggleFile(file._id)} />
                        {file.originalName}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
              {selectedFiles.length > 0 && (
                <div style={{ marginTop: '8px', padding: '10px', background: 'var(--accent-light)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '4px' }}>
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected — AI will read these:
                  </div>
                  {files.filter(f => selectedFiles.includes(f._id)).map(f => (
                    <div key={f._id} style={{ fontSize: '0.85rem', color: 'var(--accent)', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>&#x2713;</span> {f.originalName}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={generating}>
            {generating ? 'Generating with AI...' : 'Generate'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Saved content</h2>
        {studyContent.length === 0 ? (
          <p style={{ marginTop: '12px' }}>Nothing yet. Generate some content above.</p>
        ) : (
          <div className="grid grid-2" style={{ marginTop: '14px' }}>
            {studyContent.map(c => (
              <div key={c._id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', cursor: 'pointer' }} onClick={() => openContent(c._id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{c.title}</h3>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: typeColors[c.type], background: typeColors[c.type] + '15', padding: '2px 8px', borderRadius: '10px' }}>
                        {typeLabels[c.type] || c.type}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(c._id); }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Renders the actual generated content based on type
function ContentViewer({ content }) {
  const { type, title } = content;
  const data = content.content;

  return (
    <div>
      <div className="page-header">
        <h1>{title}</h1>
        <p style={{ textTransform: 'capitalize' }}>{type}</p>
      </div>

      {type === 'quiz' && <QuizViewer data={data} />}
      {type === 'flashcard' && <FlashcardViewer data={data} />}
      {type === 'guide' && <GuideViewer data={data} />}
    </div>
  );
}

function QuizViewer({ data }) {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const questions = Array.isArray(data) ? data : [];

  const pick = (qi, oi) => {
    if (showResults) return;
    setAnswers({ ...answers, [qi]: oi });
  };

  const score = questions.reduce((n, q, i) =>
    n + (answers[i] === q.correctAnswer ? 1 : 0), 0);

  return (
    <div>
      {questions.length === 0 ? (
        <div className="card"><p>No questions generated. Try again with more specific content.</p></div>
      ) : (
        <>
          {questions.map((q, qi) => (
            <div className="card" key={qi} style={{ marginBottom: '12px' }}>
              <h3 style={{ margin: '0 0 10px' }}>Q{qi + 1}. {q.question}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(q.options || []).map((opt, oi) => {
                  const picked = answers[qi] === oi;
                  const correct = showResults && oi === q.correctAnswer;
                  const wrong = showResults && picked && oi !== q.correctAnswer;
                  return (
                    <div key={oi} onClick={() => pick(qi, oi)} style={{
                      padding: '10px 14px', borderRadius: '8px', cursor: showResults ? 'default' : 'pointer',
                      border: `1.5px solid ${correct ? 'var(--green)' : wrong ? '#e53e3e' : picked ? 'var(--accent)' : 'var(--border)'}`,
                      background: correct ? 'var(--green-light)' : wrong ? '#fff5f5' : picked ? 'var(--accent-light)' : 'transparent',
                      fontSize: '0.9rem'
                    }}>
                      <strong>{String.fromCharCode(65 + oi)}.</strong> {opt}
                    </div>
                  );
                })}
              </div>
              {showResults && q.explanation && (
                <p style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)', padding: '8px', background: 'var(--bg)', borderRadius: '6px' }}>
                  {q.explanation}
                </p>
              )}
            </div>
          ))}

          {!showResults ? (
            <button className="btn btn-primary" onClick={() => setShowResults(true)}
              disabled={Object.keys(answers).length < questions.length}>
              Submit ({Object.keys(answers).length}/{questions.length} answered)
            </button>
          ) : (
            <div className="card" style={{ textAlign: 'center' }}>
              <h2>{score}/{questions.length} correct ({Math.round(score / questions.length * 100)}%)</h2>
              <button className="btn btn-secondary" style={{ marginTop: '10px' }}
                onClick={() => { setAnswers({}); setShowResults(false); }}>
                Retry
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FlashcardViewer({ data }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const cards = Array.isArray(data) ? data : [];

  if (cards.length === 0) {
    return <div className="card"><p>No flashcards generated. Try again with more content.</p></div>;
  }

  const card = cards[currentIdx];

  const next = () => { setFlipped(false); setCurrentIdx((currentIdx + 1) % cards.length); };
  const prev = () => { setFlipped(false); setCurrentIdx((currentIdx - 1 + cards.length) % cards.length); };

  return (
    <div>
      <div className="card" onClick={() => setFlipped(!flipped)} style={{
        minHeight: '200px', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
        textAlign: 'center', padding: '32px', transition: 'background 0.2s',
        background: flipped ? 'var(--accent-light)' : 'var(--bg)'
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          {flipped ? 'ANSWER' : 'QUESTION'} — Click to flip
        </div>
        <div style={{ fontSize: '1.15rem', lineHeight: 1.5 }}>
          {flipped ? (card.back || card.answer) : (card.front || card.question)}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '14px', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={prev}>Previous</button>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {currentIdx + 1} / {cards.length}
        </span>
        <button className="btn btn-primary" onClick={next}>Next</button>
      </div>
    </div>
  );
}

function GuideViewer({ data }) {
  const text = typeof data === 'string' ? data : data?.text || data?.raw || JSON.stringify(data, null, 2);

  // Basic markdown rendering: headers, bold, bullets
  const rendered = text
    .split('\n')
    .map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} style={{ marginTop: '16px' }}>{line.slice(4)}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} style={{ marginTop: '20px' }}>{line.slice(3)}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} style={{ marginTop: '24px' }}>{line.slice(2)}</h1>;
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} style={{ marginLeft: '20px', marginBottom: '4px' }}>{boldify(line.slice(2))}</li>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} style={{ marginBottom: '6px' }}>{boldify(line)}</p>;
    });

  return <div className="card" style={{ lineHeight: 1.65 }}>{rendered}</div>;
}

function boldify(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
}

export default StudyTools;
