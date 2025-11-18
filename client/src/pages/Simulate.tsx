import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { adaptFromCones, applyManualAdjust } from '../utils/color';

export default function Simulate() {
  const { state } = useApp();
  const [mode, setMode] = useState('standard');
  const bg = '#ffffff',
    base = '#2f6df7';
  const color = useMemo(() => {
    if (mode === 'standard') return base;
    const c1 = adaptFromCones(base, state.cones);
    return applyManualAdjust(c1, state.manual, bg);
  }, [mode, state]);

  return (
    <div className="card">
      <h2>Simulator</h2>
      <div className="flex">
        <button
          className={`btn ${mode === 'standard' ? '' : 'secondary'}`}
          onClick={() => setMode('standard')}
          data-testid="button-standard">
          Standard
        </button>
        <button
          className={`btn ${mode === 'adaptive' ? '' : 'secondary'}`}
          onClick={() => setMode('adaptive')}
          data-testid="button-adaptive">
          Adaptive
        </button>
      </div>
      <div className="space"></div>
      <div className="card" style={{ background: bg }}>
        <div style={{ color, fontWeight: 800, padding: 20, borderRadius: 12 }}>Example Headline</div>
        <div className="small">Buttons/icons below use current mode color.</div>
        <div className="space"></div>
        <div className="flex">
          <div className="btn" style={{ background: color }} data-testid="button-primary">
            Primary
          </div>
          <div className="btn secondary" data-testid="button-secondary">
            Secondary
          </div>
        </div>
      </div>
    </div>
  );
}
