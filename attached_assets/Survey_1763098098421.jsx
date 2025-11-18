import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

export default function Survey(){
  const nav = useNavigate()
  const { setState } = useApp()
  const [vals,setVals]=useState({susEase:4,comfort:4,comments:''})

  function submit(){
    const rec={type:'survey',...vals,timestamp:new Date().toISOString()}
    setState(s=>({...s,trials:[...s.trials,rec]})); nav('/results')
  }
  return (
    <div className="card">
      <h2>Post-Test Survey</h2>
      <label>Usability — “The system was easy to use.” (1–5)</label>
      <input className="input" type="range" min="1" max="5" value={vals.susEase} onChange={e=>setVals(v=>({...v,susEase:+e.target.value}))}/>
      <div className="space"></div>
      <label>Comfort — “Colors felt comfortable/natural.” (1–5)</label>
      <input className="input" type="range" min="1" max="5" value={vals.comfort} onChange={e=>setVals(v=>({...v,comfort:+e.target.value}))}/>
      <div className="space"></div>
      <label>Comments</label>
      <textarea className="input" rows="4" value={vals.comments} onChange={e=>setVals(v=>({...v,comments:e.target.value}))}></textarea>
      <div className="space"></div>
      <button className="btn" onClick={submit}>Submit</button>
    </div>
  )
}
