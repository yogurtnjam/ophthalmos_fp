import { Link } from 'wouter';
import { useApp } from '../context/AppContext';

export default function Home() {
  const { state } = useApp();
  const runs = state.trials;
  const testsTaken = new Set(runs.map(r => r.timestamp?.slice(0, 10))).size;
  const avgMs = runs.length ? Math.round(runs.reduce((a, b) => a + (b.ms || 0), 0) / runs.length) : 0;
  const accuracy = runs.length ? Math.round((100 * runs.filter(r => r.correct).length) / runs.length) : 0;
  return (
    <div className="row row-2">
      <div className="card">
        <h2>Welcome back{state.user.name ? `, ${state.user.name}` : ''}!</h2>
        <p className="small">Track your color vision journey.</p>
        <div className="space"></div>
        <Link to="/test/cones" className="btn" data-testid="link-cone-test">
          Take Cone Test
        </Link>
      </div>
      <div className="card">
        <h3>Performance Stats</h3>
        <p className="small" data-testid="text-tests-taken">Tests Taken: {testsTaken}</p>
        <p className="small" data-testid="text-avg-time">Avg Time: {avgMs} ms</p>
        <p className="small" data-testid="text-accuracy">Overall Accuracy: {accuracy}%</p>
      </div>
      <div className="card">
        <h3>Color Simulator</h3>
        <p className="small">Preview how colors adapt to your vision profile.</p>
        <Link to="/simulate" className="btn secondary" data-testid="link-simulator">
          Open Simulator
        </Link>
      </div>
      <div className="card">
        <h3>Experiment</h3>
        <p className="small">Run Non-Adaptive vs Adaptive tasks and compare.</p>
        <Link to="/experiment" className="btn" data-testid="link-experiment">
          Start Experiment
        </Link>
      </div>
    </div>
  );
}
