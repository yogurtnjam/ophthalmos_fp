import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Questionnaire, ConeTestResult, RGBAdjustment, TaskPerformance, OSPresetFilter } from '../../../shared/schema';
import { apiRequest } from '../lib/queryClient';

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
  
  // Has completed custom filter tasks
  hasCompletedCustomTasks: boolean;
  
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
  hasCompletedCustomTasks: false,
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

  const updateQuestionnaire = async (q: Questionnaire) => {
    try {
      // Clear localStorage before creating new session to prevent contamination
      localStorage.removeItem('cvd-aui-state');
      
      // Create new session with questionnaire data
      const response = await apiRequest('POST', '/api/sessions', q);
      const data = await response.json();
      const newSessionId = data.sessionId;
      
      // Reset all session-scoped state for new session
      const freshState = { 
        ...defaultState,
        questionnaire: q,
        sessionId: newSessionId,
        currentStep: 0
      };
      setState(freshState);
      // Persist clean state immediately
      localStorage.setItem('cvd-aui-state', JSON.stringify(freshState));
    } catch (error) {
      console.error('Failed to save questionnaire:', error);
      // Clear localStorage and reset to defaults even if API fails
      localStorage.removeItem('cvd-aui-state');
      setState({ 
        ...defaultState,
        questionnaire: q 
      });
    }
  };

  const updateConeTestResult = async (result: ConeTestResult) => {
    const selectedPreset =
      result.detectedType === 'protan'
        ? 'protanopia'
        : result.detectedType === 'deutan'
        ? 'deuteranopia'
        : result.detectedType === 'tritan'
        ? 'tritanopia'
        : 'grayscale';

    // Capture current sessionId before setState
    const currentSessionId = state.sessionId;

    setState(s => ({
      ...s,
      coneTestResult: result,
      selectedOSPreset: selectedPreset,
    }));

    // Save to backend using captured sessionId
    if (currentSessionId) {
      try {
        await apiRequest('POST', `/api/sessions/${currentSessionId}/cone-test`, result);
      } catch (error) {
        console.error('Failed to save cone test result:', error);
      }
    }
  };

  const updateRGBAdjustment = async (adjustment: RGBAdjustment) => {
    // Capture current sessionId before setState
    const currentSessionId = state.sessionId;

    setState(s => ({ ...s, rgbAdjustment: adjustment }));

    // Save to backend using captured sessionId
    if (currentSessionId) {
      try {
        await apiRequest('POST', `/api/sessions/${currentSessionId}/rgb-adjustment`, adjustment);
      } catch (error) {
        console.error('Failed to save RGB adjustment:', error);
      }
    }
  };

  const addTaskPerformance = async (performance: TaskPerformance) => {
    // Capture current sessionId before setState
    const currentSessionId = state.sessionId;

    setState(s => ({
      ...s,
      taskPerformances: [...s.taskPerformances, performance],
    }));

    // Save to backend using captured sessionId
    if (currentSessionId) {
      try {
        await apiRequest('POST', `/api/sessions/${currentSessionId}/tasks`, performance);
      } catch (error) {
        console.error('Failed to save task performance:', error);
      }
    }
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
