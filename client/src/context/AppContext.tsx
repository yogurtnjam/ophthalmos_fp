import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

interface UserState {
  name: string;
}

interface ConesState {
  L: number;
  M: number;
  S: number;
}

interface ManualState {
  hShift: number;
  sMult: number;
  lMult: number;
  extraContrast: number;
}

interface PerAppState {
  name: string;
  bg: string;
  baseFg: string;
}

interface Trial {
  phase?: string;
  taskId?: string;
  ms?: number;
  correct?: boolean;
  errors?: number;
  timestamp?: string;
  type?: string;
  susEase?: number;
  comfort?: number;
  comments?: string;
}

interface AppState {
  user: UserState;
  cones: ConesState;
  manual: ManualState;
  perApp: PerAppState;
  trials: Trial[];
}

interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Ctx = createContext<AppContextType | null>(null);

const defaultState: AppState = {
  user: { name: '' },
  cones: { L: 0.4, M: 0.7, S: 0.6 },
  manual: { hShift: 0, sMult: 1.0, lMult: 1.0, extraContrast: 4 },
  perApp: { name: 'Canvas', bg: '#ffffff', baseFg: '#1f2937' },
  trials: [],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('oph-state');
    return saved ? JSON.parse(saved) : defaultState;
  });
  useEffect(() => {
    localStorage.setItem('oph-state', JSON.stringify(state));
  }, [state]);
  const value = useMemo(() => ({ state, setState }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const context = useContext(Ctx);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
