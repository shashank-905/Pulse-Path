import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AmbulanceDashboard from './pages/AmbulanceDashboard'
import GuestView from './pages/GuestView'
import TrafficSimulator from './pages/TrafficSimulator'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/ambulance" element={<AmbulanceDashboard />} />
      <Route path="/guest" element={<GuestView />} />
      <Route path="/traffic-demo" element={<TrafficSimulator />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
