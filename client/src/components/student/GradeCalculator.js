import { useState, useMemo } from 'react';

const defaultRows = [
  { name: 'Assignments', score: '', weight: '40' },
  { name: 'Quizzes', score: '', weight: '20' },
  { name: 'Tests', score: '', weight: '40' },
];

function GradeCalculator() {
  const [rows, setRows] = useState(defaultRows);

  const updateRow = (i, field, value) => {
    const next = rows.slice();
    next[i] = { ...next[i], [field]: value };
    setRows(next);
  };

  const addRow = () => {
    setRows([...rows, { name: '', score: '', weight: '' }]);
  };

  const removeRow = (i) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, idx) => idx !== i));
  };

  const reset = () => setRows(defaultRows);

  const { grade, error } = useMemo(() => compute(rows), [rows]);
  const letter = grade == null ? '' : letterFor(grade);
  const hasAnyInput = rows.some(r => r.score !== '' || r.weight !== '');

  return (
    <div>
      <div className="page-header">
        <h1>Grade Calculator</h1>
        <p>Figure out where you stand in a course</p>
      </div>

      {error && hasAnyInput && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <h2>Categories</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Weights don't have to add up to 100 &mdash; we normalize for you.
        </p>

        <div style={{ marginTop: '16px' }}>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-3" style={{ marginBottom: '10px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor={`name-${i}`}>Category</label>
                <input
                  id={`name-${i}`}
                  type="text"
                  value={r.name}
                  onChange={(e) => updateRow(i, 'name', e.target.value)}
                  placeholder="e.g. Midterm"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor={`score-${i}`}>Score (%)</label>
                <input
                  id={`score-${i}`}
                  type="number"
                  min="0"
                  max="100"
                  value={r.score}
                  onChange={(e) => updateRow(i, 'score', e.target.value)}
                  placeholder="0-100"
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label htmlFor={`weight-${i}`}>Weight (%)</label>
                  <input
                    id={`weight-${i}`}
                    type="number"
                    min="0"
                    max="100"
                    value={r.weight}
                    onChange={(e) => updateRow(i, 'weight', e.target.value)}
                    placeholder="0-100"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => removeRow(i)}
                  disabled={rows.length <= 1}
                  aria-label={`Remove ${r.name || 'row'}`}
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addRow}>+ Add category</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={reset}>Reset</button>
        </div>
      </div>

      <div className="card">
        <h2>Current grade</h2>
        {grade == null ? (
          <p style={{ marginTop: '12px' }}>Enter scores above to see your grade.</p>
        ) : (
          <div style={{ marginTop: '14px', display: 'flex', gap: '20px', alignItems: 'baseline' }} data-testid="grade-result">
            <div style={{ fontSize: '2.6rem', fontWeight: 600 }}>{grade.toFixed(2)}%</div>
            <div style={{ fontSize: '1.4rem', color: 'var(--text-muted)' }}>{letter}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function compute(rows) {
  let total = 0;
  let weightSum = 0;
  for (const r of rows) {
    if (r.score === '' && r.weight === '') continue;
    const s = Number(r.score);
    const w = Number(r.weight);
    if (Number.isNaN(s) || Number.isNaN(w)) {
      return { grade: null, error: 'Please enter numbers for score and weight' };
    }
    if (s < 0 || s > 100) {
      return { grade: null, error: 'Score must be between 0 and 100' };
    }
    if (w < 0 || w > 100) {
      return { grade: null, error: 'Weight must be between 0 and 100' };
    }
    total += s * w;
    weightSum += w;
  }
  if (weightSum === 0) {
    return { grade: null, error: 'Enter at least one score and weight' };
  }
  return { grade: total / weightSum, error: null };
}

function letterFor(g) {
  if (g >= 90) return 'A';
  if (g >= 80) return 'B';
  if (g >= 70) return 'C';
  if (g >= 60) return 'D';
  return 'F';
}

export default GradeCalculator;
