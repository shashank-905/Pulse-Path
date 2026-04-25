import { useEffect, useState } from 'react'
import { API_URL } from '../config'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'

// Bengaluru + 100km radius (villages, towns around)
const BENGALURU_BOUNDS = [
  [11.95, 76.4],
  [14.0, 78.8]
]

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function MapUpdater({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, zoom || 13)
  }, [center, zoom, map])
  return null
}

export default function BengaluruMap({ ambulanceLocation, targetHospital, showHospitalsOnly, showRoute, onDirections }) {
  const [hospitals, setHospitals] = useState([])
  const [routePoints, setRoutePoints] = useState([])
  const [pulseRadius, setPulseRadius] = useState(12)

  useEffect(() => {
    const t = setInterval(() => setPulseRadius((r) => (r >= 25 ? 10 : r + 1)), 60)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/api/hospitals`)
      .then((r) => r.json())
      .then(setHospitals)
      .catch(() => setHospitals([]))
  }, [])

  useEffect(() => {
    if (!showRoute || !ambulanceLocation || !targetHospital) {
      setRoutePoints([])
      onDirections?.({ steps: [], distance: '', duration: '', eta: '' })
      return
    }
    const [lat1, lng1] = ambulanceLocation
    const [lat2, lng2] = [targetHospital.lat, targetHospital.lng]
    const origin = `${lat1},${lng1}`
    const dest = `${lat2},${lng2}`
    fetch(`${API_URL}/api/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.points?.length) setRoutePoints(data.points)
        else setRoutePoints([[lat1, lng1], [lat2, lng2]])
        onDirections?.({
          steps: data.steps || [],
          distance: data.distance || '',
          duration: data.duration || '',
          durationInTraffic: data.durationInTraffic || data.duration || '',
          eta: data.eta || ''
        })
      })
      .catch(() => {
        setRoutePoints([[lat1, lng1], [lat2, lng2]])
        onDirections?.({ steps: [], distance: '', duration: '', eta: '' })
      })
  }, [showRoute, ambulanceLocation, targetHospital])

  const center = ambulanceLocation || [12.9716, 77.5946]
  const routeColor = '#e63946'

  return (
    <MapContainer
      center={center}
      zoom={10}
      className="bengaluru-map"
      maxBounds={BENGALURU_BOUNDS}
      minZoom={8}
      maxZoom={18}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
      />
      <MapUpdater center={center} zoom={12} />

      {routePoints.length > 0 && (
        <Polyline
          positions={routePoints}
          color={routeColor}
          weight={7}
          opacity={0.95}
        />
      )}

      {showHospitalsOnly && hospitals.map((h) => (
        <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}>
          <Popup>
            <strong>{h.name}</strong>
            <br />
            {h.address}
          </Popup>
        </Marker>
      ))}

      {ambulanceLocation && (
        <>
          <Circle
            center={ambulanceLocation}
            radius={pulseRadius}
            pathOptions={{
              color: '#4285F4',
              fillColor: '#4285F4',
              fillOpacity: 0.2,
              weight: 1
            }}
          />
          <CircleMarker
            center={ambulanceLocation}
            radius={6}
            pathOptions={{
              color: '#1967D2',
              fillColor: '#4285F4',
              fillOpacity: 1,
              weight: 3
            }}
          >
            <Popup>
              <strong>You (Live GPS)</strong>
              <br />
              {ambulanceLocation[0].toFixed(6)}, {ambulanceLocation[1].toFixed(6)}
            </Popup>
          </CircleMarker>
        </>
      )}

      {targetHospital && (
        <Marker
          position={[targetHospital.lat, targetHospital.lng]}
          icon={hospitalIcon}
        >
          <Popup>
            <strong>Destination: {targetHospital.name}</strong>
            <br />
            {targetHospital.address}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
