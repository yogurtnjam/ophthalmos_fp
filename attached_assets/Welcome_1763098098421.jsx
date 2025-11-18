import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

export default function Welcome(){
  const nav = useNavigate(); const { state, setState } = useApp()
  return (
    <div className="card" style={{textAlign:'center'}}>
      <h1>See the World in Full Color</h1>
      <p className="small">Personalized color vision enhancement via cone contrast testing and adaptive rendering.</p>
      <div style={{maxWidth:420,margin:'16px auto'}}>
        <input className="input" placeholder="Enter your name"
          value={state.user.name}
          onChange={e=>setState(s=>({...s,user:{...s.user,name:e.target.value}}))}/>
      </div>
      <button className="btn" onClick={()=>nav('/home')}>Continue</button>
    </div>
  )
}
