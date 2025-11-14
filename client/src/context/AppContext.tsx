import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Questionnaire, ConeTestResult, RGBAdjustment, TaskPerformance, OSPresetFilter } from '../../../shared/schema';

interface AppState {
  // Current session ID
  sessionId: string | null;
  
  // Questionnaire data
  questionnaire: Questionnaire | null;
  
  // Cone test results
  coneTestResult: ConeTestResult | null;
  
  // RGB adjustments
  rgbAdjustment: RGBAdjustment;
  
  // Task performances
  taskPerformances: TaskPerformance[];
  
  // Current selected OS preset for comparison
  selectedOSPreset: OSPresetFilter;
  
  // Which filter mode is currently active (for task page)
  currentFilterMode: 'custom' | OSPresetFilter;
  
  // Navigation state
  currentStep: number; // 0: questionnaire, 1: cone test, 2: adjustment, 3: tasks-custom, 4: tasks-preset, 5: stats
}

interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  updateQuestionnaire: (q: Questionnaire) => void;
  updateConeTestResult: (result: ConeTestResult) => void;
  updateRGBAdjustment: (adjustment: RGBAdjustment) => void;
  addTaskPerformance: (performance: TaskPerformance) => void;
  setSelectedOSPreset: (preset: OSPresetFilter) => void;
  nextStep: () => void;
  resetSession: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const defaultState: AppState = {
  sessionId: null,
  questionnaire: null,
  coneTestResult: null,
  rgbAdjustment: {
    redHue: 0,
    greenHue: 120,
    blueHue: 240,
  },
  taskPerformances: [],
  selectedOSPreset: 'protanopia',
  currentFilterMode: 'custom',
  currentStep: 0,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('cvd-aui-state');
    return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
  });

  useEffect(() => {
    localStorage.setItem('cvd-aui-state', JSON.stringify(state));
  }, [state]);

  const updateQuestionnaire = (q: Questionnaire) => {
    setState(s => ({ ...s, questionnaire: q }));
  };

  const updateConeTestResult = (result: ConeTestResult) => {
    setState(s => ({
      ...s,
      coneTestResult: result,
      // Auto-select appropriate OS preset based on detected type
      selectedOSPreset:
        result.detectedType === 'protan'
          ? 'protanopia'
          : result.detectedType === 'deutan'
          ? 'deuteranopia'
          : result.detectedType === 'tritan'
          ? 'tritanopia'
          : 'grayscale',
    }));
  };

  const updateRGBAdjustment = (adjustment: RGBAdjustment) => {
    setState(s => ({ ...s, rgbAdjustment: adjustment }));
  };

  const addTaskPerformance = (performance: TaskPerformance) => {
    setState(s => ({
      ...s,
      taskPerformances: [...s.taskPerformances, performance],
    }));
  };

  const setSelectedOSPreset = (preset: OSPresetFilter) => {
    setState(s => ({ ...s, selectedOSPreset: preset }));
  };

  const nextStep = () => {
    setState(s => ({ ...s, currentStep: s.currentStep + 1 }));
  };

  const resetSession = () => {
    setState(defaultState);
    localStorage.removeItem('cvd-aui-state');
  };

  const value = useMemo(
    () => ({
      state,
      setState,
      updateQuestionnaire,
      updateConeTestResult,
      updateRGBAdjustment,
      addTaskPerformance,
      setSelectedOSPreset,
      nextStep,
      resetSession,
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
