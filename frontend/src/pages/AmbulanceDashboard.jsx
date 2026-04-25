import { useState, useEffect } from 'react'
import { API_URL, SOCKET_URL } from '../config'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import MapSelector from '../components/MapSelector'
import './AmbulanceDashboard.css'

const BENGALURU_CENTER = [12.9716, 77.5946]

function AmbulanceDashboard() {
  const [user, setUser] = useState(null)
  const [socket, setSocket] = useState(null)
  const [location, setLocation] = useState(null)
  const [hospital, setHospital] = useState(null)
  const [navigating, setNavigating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [routeInfo, setRouteInfo] = useState({ steps: [], distance: '', duration: '', durationInTraffic: '', eta: '' })
  const navigate = useNavigate()

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) {
      navigate('/')
      return
    }
    setUser(JSON.parse(u))
  }, [navigate])

  useEffect(() => {
    if (!user) return
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    s.emit('ambulance:login')
    s.on('ambulance:state', (state) => {
      if (state?.hospital) setHospital(state.hospital)
    })
    s.on('ambulance:hospital-found', (h) => setHospital(h))
    setSocket(s)
    return () => s.disconnect()
  }, [user])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(BENGALURU_CENTER)
      return
    }
    const opts = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setLocation([p.coords.latitude, p.coords.longitude]),
      () => setLocation(BENGALURU_CENTER),
      opts
    )
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        const coords = [p.coords.latitude, p.coords.longitude]
        setLocation(coords)
        socket?.emit('ambulance:location', { lat: coords[0], lng: coords[1] })
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    )
    return () => navigator.geolocation.clearWatch(watch)
  }, [socket])

  const findNearestHospital = async () => {
    if (!location) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/nearest-hospital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: location[0], lng: location[1] })
      })
      const data = await res.json()
      setHospital(data.hospital)
      socket?.emit('ambulance:find-hospital', {
        lat: location[0],
        lng: location[1],
        lane: 'north'
      })
      socket?.emit('ambulance:location', { lat: location[0], lng: location[1] })
      socket?.emit('ambulance:near-intersection', { intersectionId: 'int1', lane: 'north' })
      setTimeout(() => socket?.emit('ambulance:passed-intersection', { intersectionId: 'int1' }), 5000)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const clearEmergency = () => {
    setHospital(null)
    setNavigating(false)
    setRouteInfo({ steps: [], distance: '', duration: '', eta: '' })
    socket?.emit('ambulance:clear')
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('isAmbulance')
    socket?.emit('ambulance:clear')
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="ambulance-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <span className="logo">🚑</span>
          <div>
            <h1>Ambulance Control</h1>
            <p>{user.name}</p>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </header>

      <div className="dashboard-content">
        <div className="map-container">
          <MapSelector
            ambulanceLocation={location}
            targetHospital={hospital}
            showHospitalsOnly
            showRoute={navigating}
            onDirections={setRouteInfo}
          />
        </div>

        <aside className="control-panel">
          <div className="panel-section">
            <h2>Emergency Actions</h2>
            <button
              className="btn-emergency"
              onClick={findNearestHospital}
              disabled={!location || loading}
            >
              {loading ? (
                <>Locating...</>
              ) : (
                <>
                  <span className="btn-icon">📍</span>
                  Find Nearest Hospital
                </>
              )}
            </button>
            <p className="hint">Uses live GPS location</p>
          </div>

          {hospital && (
            <div className="panel-section hospital-card">
              <h3>{hospital.name}</h3>
              <p className="hospital-addr">{hospital.address}</p>
              <p className="hospital-dist">{hospital.distance?.toFixed(2) || '—'} km away</p>
              <button
                className="btn-navigate"
                onClick={() => setNavigating(true)}
                disabled={!location}
              >
                🧭 Navigate to Hospital
              </button>
              {navigating && (routeInfo.distance || routeInfo.steps.length > 0) && (
                <div className="route-summary">
                  <div className="route-stats">
                    <div className="stat"><span className="stat-label">Distance</span><span className="stat-value">{routeInfo.distance}</span></div>
                    <div className="stat"><span className="stat-label">Time (traffic)</span><span className="stat-value">{routeInfo.durationInTraffic || routeInfo.duration}</span></div>
                    <div className="stat"><span className="stat-label">ETA</span><span className="stat-value">{routeInfo.eta}</span></div>
                  </div>
                </div>
              )}
              {navigating && routeInfo.steps.length > 0 && (
                <div className="directions-list">
                  <h4>Follow this route</h4>
                  {routeInfo.steps.slice(0, 15).map((step, i) => (
                    <div key={i} className="direction-step">
                      <span className="step-num">{i + 1}</span>
                      <span className="step-text">{step.instruction}</span>
                      {step.distance && <span className="step-dist">{step.distance}</span>}
                    </div>
                  ))}
                </div>
              )}
              {navigating && !routeInfo.distance && routeInfo.steps.length === 0 && (
                <p className="loading-route">Loading route…</p>
              )}
              <button className="btn-clear" onClick={clearEmergency}>Clear / Done</button>
            </div>
          )}

          <div className="traffic-link">
            <a href="/traffic-demo" target="_blank" rel="noopener noreferrer">
              Open Traffic Light Demo →
            </a>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default AmbulanceDashboard
