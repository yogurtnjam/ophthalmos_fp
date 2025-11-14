export function recommendManualParams(cones, history=[]){
  function dist(a,b){return Math.sqrt((a.L-b.L)**2+(a.M-b.M)**2+(a.S-b.S)**2)}
  const profiles=[
    {cones:{L:.4,M:.85,S:.85}, manual:{hShift:10,sMult:1.1,lMult:1,extraContrast:5}},
    {cones:{L:.85,M:.6,S:.85}, manual:{hShift:-8,sMult:1.1,lMult:1,extraContrast:4}},
    {cones:{L:.85,M:.85,S:.55}, manual:{hShift:6,sMult:1,lMult:1.05,extraContrast:5}},
    {cones:{L:.9,M:.9,S:.9}, manual:{hShift:0,sMult:1,lMult:1,extraContrast:3}},
  ]
  let best=profiles[0], bestD=dist(cones,profiles[0].cones)
  for(const p of profiles){
    const d=dist(cones,p.cones); if(d<bestD){bestD=d;best=p}
  }
  let {hShift,sMult,lMult,extraContrast} = best.manual
  const runs=history.filter(r=>r.phase)
  if(runs.length){
    const avgMs = runs.reduce((a,b)=>a+b.ms,0)/runs.length
    const acc = runs.filter(r=>r.correct).length/runs.length
    if(acc<.8){ extraContrast+=2; sMult+=.05 }
    if(avgMs>6000) extraContrast+=1
  }
  return {hShift,sMult,lMult,extraContrast}
}