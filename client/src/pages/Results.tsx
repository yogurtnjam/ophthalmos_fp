import { useApp } from '../context/AppContext';

export default function Results() {
  const { state, setState } = useApp();
  const logs = state.trials.filter(t => t.phase);
  const nonAdaptive = logs.filter(l => l.phase === 'nonadaptive');
  const adaptive = logs.filter(l => l.phase === 'adaptive');

  const avg = (a: any[]) => (a.length ? Math.round(a.reduce((x, y) => x + y.ms, 0) / a.length) : 0);
  const acc = (a: any[]) => (a.length ? Math.round((100 * a.filter(x => x.correct).length) / a.length) : 0);

  const timeNA = avg(nonAdaptive),
    timeAD = avg(adaptive);
  const accNA = acc(nonAdaptive),
    accAD = acc(adaptive);
  const improvementTime = timeNA && timeAD ? Math.round((100 * (timeNA - timeAD)) / timeNA) : 0;
  const improvementAcc = accAD - accNA;

  return (
    <div className="row row-2">
      <div className="card">
        <h2>Results Summary</h2>
        <div className="row row-3">
          <div className="card">
            <h3>Avg Time (NA)</h3>
            <strong data-testid="text-time-na">{timeNA} ms</strong>
          </div>
          <div className="card">
            <h3>Avg Time (AD)</h3>
            <strong data-testid="text-time-ad">{timeAD} ms</strong>
          </div>
          <div className="card">
            <h3>Time Improvement</h3>
            <strong data-testid="text-time-improvement">{improvementTime}%</strong>
          </div>
          <div className="card">
            <h3>Accuracy (NA)</h3>
            <strong data-testid="text-accuracy-na">{accNA}%</strong>
          </div>
          <div className="card">
            <h3>Accuracy (AD)</h3>
            <strong data-testid="text-accuracy-ad">{accAD}%</strong>
          </div>
          <div className="card">
            <h3>Accuracy Δ</h3>
            <strong data-testid="text-accuracy-delta">{improvementAcc} pp</strong>
          </div>
        </div>
      </div>
      <div className="card">
        <h2>Manage Data</h2>
        <button className="btn secondary" onClick={() => setState(s => ({ ...s, trials: [] }))} data-testid="button-clear">
          Clear Trials
        </button>
        <div className="space"></div>
        <textarea className="input" rows={8} readOnly value={JSON.stringify(state.trials, null, 2)} data-testid="textarea-data" />
      </div>
    </div>
  );
}
