import { useApp } from '../context/AppContext.jsx'

export default function Results(){
  const { state, setState } = useApp()
  const logs = state.trials.filter(t=>t.phase) // ignore survey-only rows
  const nonAdaptive = logs.filter(l=>l.phase==='nonadaptive')
  const adaptive = logs.filter(l=>l.phase==='adaptive')

  const avg = a => a.length ? Math.round(a.reduce((x,y)=>x+y.ms,0)/a.length) : 0
  const acc = a => a.length ? Math.round(100*a.filter(x=>x.correct).length/a.length) : 0

  const timeNA=avg(nonAdaptive), timeAD=avg(adaptive)
  const accNA=acc(nonAdaptive), accAD=acc(adaptive)
  const improvementTime = (timeNA&&timeAD)?Math.round(100*(timeNA-timeAD)/timeNA):0
  const improvementAcc = accAD - accNA

  return (
    <div className="row row-2">
      <div className="card">
        <h2>Results Summary</h2>
        <div className="row row-3">
          <div className="card"><h3>Avg Time (NA)</h3><strong>{timeNA} ms</strong></div>
          <div className="card"><h3>Avg Time (AD)</h3><strong>{timeAD} ms</strong></div>
          <div className="card"><h3>Time Improvement</h3><strong>{improvementTime}%</strong></div>
          <div className="card"><h3>Accuracy (NA)</h3><strong>{accNA}%</strong></div>
          <div className="card"><h3>Accuracy (AD)</h3><strong>{accAD}%</strong></div>
          <div className="card"><h3>Accuracy Δ</h3><strong>{improvementAcc} pp</strong></div>
        </div>
      </div>
      <div className="card">
        <h2>Manage Data</h2>
        <button className="btn secondary" onClick={()=>setState(s=>({...s,trials:[]}))}>Clear Trials</button>
        <div className="space"></div>
        <textarea className="input" rows="8" readOnly value={JSON.stringify(state.trials,null,2)} />
      </div>
    </div>
  )
}
