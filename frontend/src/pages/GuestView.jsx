import { useState, useEffect } from 'react'
import { SOCKET_URL } from '../config'
import { io } from 'socket.io-client'
import MapSelector from '../components/MapSelector'
import './GuestView.css'

function GuestView() {
  const [ambulanceLocation, setAmbulanceLocation] = useState(null)
  const [emergencyInfo, setEmergencyInfo] = useState(null)
  const [laneAlert, setLaneAlert] = useState(null)

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    s.emit('guest:join')

    s.on('ambulance:approaching', (data) => {
      if (data?.lat && data?.lng) {
        setAmbulanceLocation([data.lat, data.lng])
      }
    })

    s.on('emergency:active', (data) => {
      setEmergencyInfo(data)
      setLaneAlert(data?.lane || 'unknown')
    })

    s.on('emergency:cleared', () => {
      setAmbulanceLocation(null)
      setEmergencyInfo(null)
      setLaneAlert(null)
    })

    return () => s.disconnect()
  }, [])

  const laneLabels = {
    north: 'North',
    south: 'South',
    east: 'East',
    west: 'West'
  }

  return (
    <div className="guest-view">
      <header className="guest-header">
        <div>
          <h1>🚗 Guest Driver View</h1>
          <p>See approaching ambulances — move aside for emergency vehicles</p>
        </div>
      </header>

      <div className="guest-content">
        <div className="map-section">
          <MapSelector
            ambulanceLocation={ambulanceLocation}
            targetHospital={emergencyInfo?.hospital}
            showHospitalsOnly
            showRoute={!!(emergencyInfo?.hospital && ambulanceLocation)}
          />
        </div>

        <aside className="guest-panel">
          {!emergencyInfo ? (
            <div className="no-emergency">
              <div className="status-icon">✅</div>
              <h2>Clear</h2>
              <p>No ambulance in emergency mode nearby</p>
              <p className="sub">You'll be notified when one approaches your route</p>
            </div>
          ) : (
            <div className="emergency-alert">
              <div className="alert-header">
                <span className="pulse-dot" />
                <h2>EMERGENCY VEHICLE</h2>
                <p>Ambulance approaching</p>
              </div>

              <div className={`lane-highlight lane-${laneAlert}`}>
                <span className="lane-label">Lane: {laneLabels[laneAlert] || laneAlert}</span>
                <p>Move aside — This lane is for emergency vehicle</p>
              </div>

              {emergencyInfo.hospital && (
                <div className="dest-info">
                  <p>En route to: <strong>{emergencyInfo.hospital.name}</strong></p>
                </div>
              )}

              <a href="/traffic-demo" target="_blank" rel="noopener noreferrer" className="traffic-link">
                View Traffic Lights →
              </a>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default GuestView
