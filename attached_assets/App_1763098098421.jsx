import { Routes, Route, Link, NavLink } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import Welcome from './pages/Welcome.jsx'
import Home from './pages/Home.jsx'
import ConeTest from './pages/ConeTest.jsx'
import Adapt from './pages/Adapt.jsx'
import Simulate from './pages/Simulate.jsx'
import Experiment from './pages/Experiment.jsx'
import Survey from './pages/Survey.jsx'
import Results from './pages/Results.jsx'

export default function App(){
  return (
    <AppProvider>
      <div className="container">
        <header className="header">
          <Link to="/" className="brand">OPHTHALMOS</Link>
          <nav className="nav">
            <NavLink to="/home">Home</NavLink>
            <NavLink to="/test/cones">Cone Test</NavLink>
            <NavLink to="/adapt">Adapt</NavLink>
            <NavLink to="/simulate">Simulate</NavLink>
            <NavLink to="/experiment">Experiment</NavLink>
            <NavLink to="/results">Results</NavLink>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Welcome/>} />
          <Route path="/home" element={<Home/>} />
          <Route path="/test/cones" element={<ConeTest/>} />
          <Route path="/adapt" element={<Adapt/>} />
          <Route path="/simulate" element={<Simulate/>} />
          <Route path="/experiment" element={<Experiment/>} />
          <Route path="/survey" element={<Survey/>} />
          <Route path="/results" element={<Results/>} />
        </Routes>
      </div>
    </AppProvider>
  )
}
