import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const Ctx = createContext(null)
const defaultState = {
  user: { name: '' },
  cones: { L: 0.40, M: 0.70, S: 0.60 },   // 0..1
  manual: { hShift: 0, sMult: 1.0, lMult: 1.0, extraContrast: 4 },
  perApp: { name: 'Canvas', bg: '#ffffff', baseFg: '#1f2937' },
  trials: [] // { phase, taskId, ms, correct, errors, timestamp } + survey rows
}

export function AppProvider({children}){
  const [state, setState] = useState(()=>{
    const saved = localStorage.getItem('oph-state')
    return saved ? JSON.parse(saved) : defaultState
  })
  useEffect(()=>{ localStorage.setItem('oph-state', JSON.stringify(state)) }, [state])
  const value = useMemo(()=>({ state, setState }), [state])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(){ return useContext(Ctx) }
