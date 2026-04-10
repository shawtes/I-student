// Unit tests for the weighted-grade math used by GradeCalculator.
// The component owns the logic inline; we re-implement the same formula here
// so this test locks down the expected behavior as a spec.

function weighted(rows) {
  let total = 0;
  let weightSum = 0;
  for (const r of rows) {
    if (r.score === '' && r.weight === '') continue;
    const s = Number(r.score);
    const w = Number(r.weight);
    if (Number.isNaN(s) || Number.isNaN(w)) return { error: 'nan' };
    if (s < 0 || s > 100) return { error: 'score-range' };
    if (w < 0 || w > 100) return { error: 'weight-range' };
    total += s * w;
    weightSum += w;
  }
  if (weightSum === 0) return { error: 'empty' };
  return { grade: total / weightSum };
}

describe('grade math', () => {
  test('simple average when weights are equal', () => {
    const res = weighted([
      { score: '90', weight: '1' },
      { score: '80', weight: '1' },
      { score: '100', weight: '1' },
    ]);
    expect(res.grade).toBeCloseTo(90, 5);
  });

  test('normalizes weights that do not sum to 100', () => {
    const res = weighted([
      { score: '100', weight: '40' },
      { score: '50', weight: '40' },
    ]);
    expect(res.grade).toBeCloseTo(75, 5);
  });

  test('heavier weight moves the grade', () => {
    const res = weighted([
      { score: '100', weight: '80' },
      { score: '0', weight: '20' },
    ]);
    expect(res.grade).toBeCloseTo(80, 5);
  });

  test('rejects score over 100', () => {
    const res = weighted([{ score: '120', weight: '50' }]);
    expect(res.error).toBe('score-range');
  });

  test('rejects negative score', () => {
    const res = weighted([{ score: '-5', weight: '50' }]);
    expect(res.error).toBe('score-range');
  });

  test('skips rows that are entirely blank', () => {
    const res = weighted([
      { score: '90', weight: '50' },
      { score: '', weight: '' },
    ]);
    expect(res.grade).toBeCloseTo(90, 5);
  });

  test('errors when nothing is entered', () => {
    const res = weighted([{ score: '', weight: '' }]);
    expect(res.error).toBe('empty');
  });

  test('boundary values 0 and 100', () => {
    const lo = weighted([{ score: '0', weight: '100' }]);
    const hi = weighted([{ score: '100', weight: '100' }]);
    expect(lo.grade).toBe(0);
    expect(hi.grade).toBe(100);
  });
});
