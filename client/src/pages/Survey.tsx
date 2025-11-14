import { useState } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '../context/AppContext';

export default function Survey() {
  const [, setLocation] = useLocation();
  const { setState } = useApp();
  const [vals, setVals] = useState({ susEase: 4, comfort: 4, comments: '' });

  function submit() {
    const rec = { type: 'survey', ...vals, timestamp: new Date().toISOString() };
    setState(s => ({ ...s, trials: [...s.trials, rec] }));
    setLocation('/results');
  }
  return (
    <div className="card">
      <h2>Post-Test Survey</h2>
      <label>Usability — "The system was easy to use." (1–5)</label>
      <input
        className="input"
        type="range"
        min="1"
        max="5"
        value={vals.susEase}
        onChange={e => setVals(v => ({ ...v, susEase: +e.target.value }))}
        data-testid="slider-usability"
      />
      <div className="space"></div>
      <label>Comfort — "Colors felt comfortable/natural." (1–5)</label>
      <input
        className="input"
        type="range"
        min="1"
        max="5"
        value={vals.comfort}
        onChange={e => setVals(v => ({ ...v, comfort: +e.target.value }))}
        data-testid="slider-comfort"
      />
      <div className="space"></div>
      <label>Comments</label>
      <textarea
        className="input"
        rows={4}
        value={vals.comments}
        onChange={e => setVals(v => ({ ...v, comments: e.target.value }))}
        data-testid="textarea-comments"
      />
      <div className="space"></div>
      <button className="btn" onClick={submit} data-testid="button-submit">
        Submit
      </button>
    </div>
  );
}
