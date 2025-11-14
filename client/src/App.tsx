import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from './context/AppContext';
import Questionnaire from './pages/Questionnaire';
import ConeTest from './pages/ConeTest';
import CVDResults from './pages/CVDResults';
import TaskGames from './pages/TaskGames';
import Statistics from './pages/Statistics';
import './styles.css';

function Router() {
  return (
    <div className="container">
      <header className="header">
        <Link to="/" className="brand" data-testid="link-brand">
          OPHTHALMOS
        </Link>
        <nav className="nav">
          <Link to="/" data-testid="link-questionnaire">Questionnaire</Link>
          <Link to="/cone-test" data-testid="link-cone-test">Cone Test</Link>
          <Link to="/cvd-results" data-testid="link-cvd-results">Results</Link>
          <Link to="/tasks" data-testid="link-tasks">Tasks</Link>
          <Link to="/statistics" data-testid="link-statistics">Statistics</Link>
        </nav>
      </header>

      <Switch>
        <Route path="/" component={Questionnaire} />
        <Route path="/cone-test" component={ConeTest} />
        <Route path="/cvd-results" component={CVDResults} />
        <Route path="/tasks" component={TaskGames} />
        <Route path="/statistics" component={Statistics} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <Router />
        </AppProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
