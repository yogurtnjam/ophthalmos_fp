import { useApp } from '../context/AppContext.jsx'
import LabeledSlider from '../components/LabeledSlider.jsx'

export default function ConeTest(){
  const { state, setState } = useApp()
  const { L, M, S } = state.cones
  return (
    <div className="card">
      <h2>Cone Contrast Test (Input)</h2>
      <p className="small">Map your results (or estimate). We’ll adapt colors to your cones.</p>
      <div style={{display:'grid',gap:14,maxWidth:720}}>
        <LabeledSlider label="L-cone (Red)" value={Math.round(L*100)} setValue={v=>setState(s=>({...s,cones:{...s.cones,L:v/100}}))}/>
        <LabeledSlider label="M-cone (Green)" value={Math.round(M*100)} setValue={v=>setState(s=>({...s,cones:{...s.cones,M:v/100}}))}/>
        <LabeledSlider label="S-cone (Blue)" value={Math.round(S*100)} setValue={v=>setState(s=>({...s,cones:{...s.cones,S:v/100}}))}/>
      </div>
      <div className="space"></div>
      <div className="small">Low L→less red reliance; low M→separate greens; low S→avoid blue/yellow.</div>
    </div>
  )
}
