import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { adaptFromCones, applyManualAdjust, hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from '../utils/color.js'

function useTimer(active){
  const [ms, setMs] = useState(0)
  useEffect(()=>{
    if(!active) return
    setMs(0)
    const t = setInterval(()=>setMs(v=>v+50), 50)
    return ()=>clearInterval(t)
  },[active])
  return [ms, setMs]
}

function Task({label, instruction, color, onWrong}){
  const options = [
    { text:'Blue',  color, correct:true },
    { text:'Green', color:'#22c55e', correct:false },
    { text:'Red',   color:'#ef4444', correct:false },
  ]
  return (
    <div className="card">
      <h3>{label}</h3>
      <p>{instruction}</p>
      <div className="space"></div>
      <div className="flex" style={{flexWrap:'wrap'}}>
        {options.map((o,i)=>(
          <button key={i} className="btn" style={{background:o.color,color:'#fff'}}
            onClick={()=>{ if(!o.correct) onWrong() }}>{o.text}</button>
        ))}
      </div>
    </div>
  )
}

function OddTile({color, onPick}){
  const tiles=25, odd=Math.floor(Math.random()*tiles)
  const { r,g,b }=hexToRgb(color), {h,s,l}=rgbToHsl(r,g,b)
  const o=hslToRgb((h+8)%360,s,l), oddHex=rgbToHex(o.r,o.g,o.b)
  return (
    <div className="grid5">
      {Array.from({length:tiles}).map((_,i)=>(
        <button key={i} className="tile" style={{background:i===odd?oddHex:color}} onClick={()=>onPick(i===odd)} />
      ))}
    </div>
  )
}

export default function Experiment(){
  const { state, setState } = useApp()
  const nav = useNavigate()
  const [phase, setPhase] = useState('nonadaptive')
  const [running, setRunning] = useState(false)
  const [ms, setMs] = useTimer(running)
  const [errors, setErrors] = useState(0)

  const base='#2f6df7', bg='#ffffff'
  const color = useMemo(()=>{
    if(phase==='nonadaptive') return base
    const c1 = adaptFromCones(base, state.cones)
    return applyManualAdjust(c1, state.manual, bg)
  }, [phase, state])

  function start(){ setRunning(true); setErrors(0); setMs(0) }
  function finish(correct){
    setRunning(false)
    const rec = { phase, taskId: phase==='nonadaptive'?'NA':'AD', ms, correct, errors, timestamp:new Date().toISOString() }
    setState(s=>({...s, trials:[...s.trials, rec]}))
  }

  return (
    <div className="row row-2">
      <div className="card">
        <h2>Experiment</h2>
        <p className="small">Phase 1: Non-Adaptive · Phase 2: Adaptive. Complete tasks then mini-game. We record time & accuracy.</p>
        <div className="flex">
          <button className={`btn ${phase==='nonadaptive'?'':'secondary'}`} onClick={()=>setPhase('nonadaptive')}>Phase 1</button>
          <button className={`btn ${phase==='adaptive'?'':'secondary'}`} onClick={()=>setPhase('adaptive')}>Phase 2</button>
        </div>
        <div className="space"></div>
        <div className="flex">
          {!running ? <button className="btn" onClick={start}>Start</button> :
            <button className="btn secondary" onClick={()=>{ setRunning(false); setErrors(e=>e+1) }}>Pause</button>}
          <div className="badge">Time: {(ms/1000).toFixed(1)}s</div>
          <div className="badge">Errors: {errors}</div>
        </div>
      </div>

      <div className="card">
        <Task label="Task A: Colored Button" instruction="Press the BLUE button to continue." color={color} onWrong={()=>running&&setErrors(e=>e+1)}/>
        <Task label="Task B: Legend Match" instruction="Pick the 'Revenue' label color." color={color} onWrong={()=>running&&setErrors(e=>e+1)}/>
        <Task label="Task C: Status Icon" instruction="Pick the ACTIVE status icon." color={color} onWrong={()=>running&&setErrors(e=>e+1)}/>
        <h3>Mini-game: Find the Odd Tile</h3>
        <OddTile color={color} onPick={(ok)=>{ if(!running) return; if(!ok) setErrors(e=>e+1) }} />
        <div className="space"></div>
        <div className="flex">
          <button className="btn" onClick={()=>finish(true)}>Finish (Correct)</button>
          <button className="btn secondary" onClick={()=>finish(false)}>Finish (Incorrect)</button>
          <button className="btn link" onClick={()=>nav('/survey')}>Next: Survey</button>
        </div>
      </div>
    </div>
  )
}
