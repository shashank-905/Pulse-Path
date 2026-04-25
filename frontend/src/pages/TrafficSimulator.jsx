import { useState, useEffect } from 'react'
import { SOCKET_URL } from '../config'
import { io } from 'socket.io-client'
import './TrafficSimulator.css'

const LANES = ['north', 'south', 'east', 'west']

function TrafficSimulator() {
  const [lights, setLights] = useState({
    north: 'green',
    south: 'red',
    east: 'red',
    west: 'red'
  })
  const [ambulanceLane, setAmbulanceLane] = useState(null)
  const [status, setStatus] = useState('Normal')

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] })

    s.on('traffic:emergency', (data) => {
      setStatus('EMERGENCY — Ambulance approaching')
      setAmbulanceLane(data.lane)
      setLights({
        north: data.lane === 'north' ? 'green' : 'red',
        south: data.lane === 'south' ? 'green' : 'red',
        east: data.lane === 'east' ? 'green' : 'red',
        west: data.lane === 'west' ? 'green' : 'red'
      })
    })

    s.on('traffic:reset', (data) => {
      setTimeout(() => {
        setStatus('Resetting in 30 seconds...')
        setAmbulanceLane(null)
        setLights({
          north: 'green',
          south: 'red',
          east: 'red',
          west: 'red'
        })
        setTimeout(() => setStatus('Normal'), 2000)
      }, data.delay || 30000)
    })

    return () => s.disconnect()
  }, [])

  const simulateEmergency = (lane) => {
    setStatus('EMERGENCY (Simulated)')
    setAmbulanceLane(lane)
    setLights(
      Object.fromEntries(
        LANES.map((l) => [l, l === lane ? 'green' : 'red'])
      )
    )
    setTimeout(() => {
      setAmbulanceLane(null)
      setLights({
        north: 'green',
        south: 'red',
        east: 'red',
        west: 'red'
      })
      setStatus('Normal')
    }, 35000)
  }

  return (
    <div className="traffic-simulator">
      <header className="traffic-header">
        <h1>🚦 Traffic Light Simulator</h1>
        <p>Bengaluru Intersection — Demo Mode</p>
        <div className={`status-bar ${ambulanceLane ? 'emergency' : ''}`}>
          {status}
        </div>
      </header>

      <div className="intersection">
        <div className="road vertical" />
        <div className="road horizontal" />

        {LANES.map((lane) => (
          <div key={lane} className={`signal-group signal-${lane}`}>
            <div className="signal-box">
              <div className={`light ${lights[lane]}`} />
              <div className="lane-label">{lane.toUpperCase()}</div>
              {ambulanceLane === lane && (
                <div className="ambulance-badge">🚑 CLEAR</div>
              )}
            </div>
          </div>
        ))}

        <div className="center-label">JUNCTION</div>
      </div>

      <div className="simulate-section">
        <h3>Demo: Simulate Ambulance</h3>
        <p>Click a direction to simulate ambulance approaching</p>
        <div className="sim-buttons">
          {LANES.map((lane) => (
            <button
              key={lane}
              className={`sim-btn ${ambulanceLane === lane ? 'active' : ''}`}
              onClick={() => simulateEmergency(lane)}
            >
              From {lane.charAt(0).toUpperCase() + lane.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="legend">
        <span><span className="dot red" /> Red = Stop</span>
        <span><span className="dot green" /> Green = Ambulance lane (go)</span>
      </div>
    </div>
  )
}

export default TrafficSimulator
