import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from './context/AppContext';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import ConeTest from './pages/ConeTest';
import Adapt from './pages/Adapt';
import Simulate from './pages/Simulate';
import Experiment from './pages/Experiment';
import Survey from './pages/Survey';
import Results from './pages/Results';
import './styles.css';

function Router() {
  return (
    <div className="container">
      <header className="header">
        <Link to="/" className="brand" data-testid="link-brand">
          OPHTHALMOS
        </Link>
        <nav className="nav">
          <Link to="/home" data-testid="link-home">Home</Link>
          <Link to="/test/cones" data-testid="link-conetest">Cone Test</Link>
          <Link to="/adapt" data-testid="link-adapt">Adapt</Link>
          <Link to="/simulate" data-testid="link-simulate">Simulate</Link>
          <Link to="/experiment" data-testid="link-experiment">Experiment</Link>
          <Link to="/results" data-testid="link-results">Results</Link>
        </nav>
      </header>

      <Switch>
        <Route path="/" component={Welcome} />
        <Route path="/home" component={Home} />
        <Route path="/test/cones" component={ConeTest} />
        <Route path="/adapt" component={Adapt} />
        <Route path="/simulate" component={Simulate} />
        <Route path="/experiment" component={Experiment} />
        <Route path="/survey" component={Survey} />
        <Route path="/results" component={Results} />
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
