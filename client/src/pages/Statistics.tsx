import { useApp } from '../context/AppContext';
import { getFilterDisplayName } from '../utils/filters';

export default function Statistics() {
  const { state, resetSession } = useApp();
  const { taskPerformances, questionnaire, coneTestResult } = state;

  // Group performances by task and filter
  const getTaskStats = (taskId: string, filterType: string) => {
    const tasks = taskPerformances.filter(t => t.taskId === taskId && t.filterType === filterType);
    if (tasks.length === 0) return null;

    const totalTime = tasks.reduce((sum, t) => sum + t.timeMs, 0);
    const totalSwipes = tasks.reduce((sum, t) => sum + t.swipes, 0);
    const totalClicks = tasks.reduce((sum, t) => sum + t.clicks, 0);
    const correct = tasks.filter(t => t.correct).length;

    return {
      avgTime: totalTime / tasks.length,
      totalSwipes,
      totalClicks,
      accuracy: (correct / tasks.length) * 100,
      count: tasks.length,
    };
  };

  const taskIds = ['tile-1', 'tile-2', 'color-match', 'card-match'];
  const customStats = taskIds.map(id => ({ id, stats: getTaskStats(id, 'custom') }));
  const presetStats = taskIds.map(id => ({ id, stats: getTaskStats(id, state.selectedOSPreset) }));

  // Calculate totals
  const customTotal = {
    time: customStats.reduce((sum, t) => sum + (t.stats?.avgTime || 0), 0),
    swipes: customStats.reduce((sum, t) => sum + (t.stats?.totalSwipes || 0), 0),
    clicks: customStats.reduce((sum, t) => sum + (t.stats?.totalClicks || 0), 0),
  };

  const presetTotal = {
    time: presetStats.reduce((sum, t) => sum + (t.stats?.avgTime || 0), 0),
    swipes: presetStats.reduce((sum, t) => sum + (t.stats?.totalSwipes || 0), 0),
    clicks: presetStats.reduce((sum, t) => sum + (t.stats?.totalClicks || 0), 0),
  };

  const getTaskLabel = (id: string) => {
    switch (id) {
      case 'tile-1':
        return 'Tile Game 1';
      case 'tile-2':
        return 'Tile Game 2';
      case 'color-match':
        return 'Color Matcher';
      case 'card-match':
        return 'Card Matching';
      default:
        return id;
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h1>Performance Statistics</h1>
        {questionnaire && (
          <p className="small">
            Participant: {questionnaire.name} · Age: {questionnaire.age}
          </p>
        )}
        {coneTestResult && (
          <div className="flex" style={{ marginTop: 8 }}>
            <div className="badge">Detected: {coneTestResult.detectedType}</div>
            <div className="badge">L: {(coneTestResult.L * 100).toFixed(0)}%</div>
            <div className="badge">M: {(coneTestResult.M * 100).toFixed(0)}%</div>
            <div className="badge">S: {(coneTestResult.S * 100).toFixed(0)}%</div>
          </div>
        )}
      </div>

      <div className="row row-2">
        {/* Custom Adaptive Filter Stats */}
        <div className="card">
          <h2>Custom Adaptive Filter</h2>
          <div className="space"></div>

          {customStats.map(({ id, stats }) => (
            <div key={id} className="card" style={{ padding: 12, marginBottom: 12 }}>
              <strong>{getTaskLabel(id)}</strong>
              {stats ? (
                <div style={{ marginTop: 8 }}>
                  <div className="small" data-testid={`custom-${id}-time`}>
                    Time: {(stats.avgTime / 1000).toFixed(2)}s
                  </div>
                  <div className="small" data-testid={`custom-${id}-swipes`}>
                    Swipes: {stats.totalSwipes}
                  </div>
                  <div className="small" data-testid={`custom-${id}-clicks`}>
                    Clicks: {stats.totalClicks}
                  </div>
                  <div className="small">Accuracy: {stats.accuracy.toFixed(0)}%</div>
                </div>
              ) : (
                <div className="small">No data</div>
              )}
            </div>
          ))}

          <div className="card" style={{ padding: 12, background: '#eef2ff' }}>
            <strong>Total</strong>
            <div className="small" data-testid="custom-total-time">
              Total Time: {(customTotal.time / 1000).toFixed(2)}s
            </div>
            <div className="small" data-testid="custom-total-swipes">
              Total Swipes: {customTotal.swipes}
            </div>
            <div className="small" data-testid="custom-total-clicks">
              Total Clicks: {customTotal.clicks}
            </div>
          </div>
        </div>

        {/* OS Preset Filter Stats */}
        <div className="card">
          <h2>{getFilterDisplayName(state.selectedOSPreset)}</h2>
          <div className="space"></div>

          {presetStats.map(({ id, stats }) => (
            <div key={id} className="card" style={{ padding: 12, marginBottom: 12 }}>
              <strong>{getTaskLabel(id)}</strong>
              {stats ? (
                <div style={{ marginTop: 8 }}>
                  <div className="small" data-testid={`preset-${id}-time`}>
                    Time: {(stats.avgTime / 1000).toFixed(2)}s
                  </div>
                  <div className="small" data-testid={`preset-${id}-swipes`}>
                    Swipes: {stats.totalSwipes}
                  </div>
                  <div className="small" data-testid={`preset-${id}-clicks`}>
                    Clicks: {stats.totalClicks}
                  </div>
                  <div className="small">Accuracy: {stats.accuracy.toFixed(0)}%</div>
                </div>
              ) : (
                <div className="small">No data</div>
              )}
            </div>
          ))}

          <div className="card" style={{ padding: 12, background: '#eef2ff' }}>
            <strong>Total</strong>
            <div className="small" data-testid="preset-total-time">
              Total Time: {(presetTotal.time / 1000).toFixed(2)}s
            </div>
            <div className="small" data-testid="preset-total-swipes">
              Total Swipes: {presetTotal.swipes}
            </div>
            <div className="small" data-testid="preset-total-clicks">
              Total Clicks: {presetTotal.clicks}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Summary */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Comparison Summary</h2>
        <div className="row row-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>Time Difference</h3>
            <strong style={{ fontSize: 24, color: customTotal.time < presetTotal.time ? 'var(--primary)' : 'var(--warning)' }}>
              {Math.abs(((customTotal.time - presetTotal.time) / 1000)).toFixed(2)}s
            </strong>
            <div className="small">{customTotal.time < presetTotal.time ? 'Custom Faster' : 'Preset Faster'}</div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <h3>Swipe Difference</h3>
            <strong style={{ fontSize: 24, color: customTotal.swipes < presetTotal.swipes ? 'var(--primary)' : 'var(--warning)' }}>
              {Math.abs(customTotal.swipes - presetTotal.swipes)}
            </strong>
            <div className="small">{customTotal.swipes < presetTotal.swipes ? 'Custom Less' : 'Preset Less'}</div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <h3>Click Difference</h3>
            <strong style={{ fontSize: 24, color: customTotal.clicks < presetTotal.clicks ? 'var(--primary)' : 'var(--warning)' }}>
              {Math.abs(customTotal.clicks - presetTotal.clicks)}
            </strong>
            <div className="small">{customTotal.clicks < presetTotal.clicks ? 'Custom Less' : 'Preset Less'}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Actions</h3>
        <div className="flex">
          <button className="btn secondary" onClick={resetSession} data-testid="button-reset">
            Start New Session
          </button>
          <button
            className="btn"
            onClick={() => {
              const dataStr = JSON.stringify(state, null, 2);
              const blob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `cvd-study-${questionnaire?.name || 'participant'}-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
            data-testid="button-export">
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
}
