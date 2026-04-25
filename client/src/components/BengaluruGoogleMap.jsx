import { useState, useEffect, useCallback } from 'react'
import { API_URL } from '../config'
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Circle,
  DirectionsRenderer,
  InfoWindow
} from '@react-google-maps/api'
import './BengaluruGoogleMap.css'

const BENGALURU_CENTER = { lat: 12.9716, lng: 77.5946 }
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' }
const BENGALURU_BOUNDS = {
  north: 13.1127,
  south: 12.8342,
  east: 77.7673,
  west: 77.4577
}

export default function BengaluruGoogleMap({
  ambulanceLocation,
  targetHospital,
  showHospitalsOnly,
  showRoute
}) {
  const [hospitals, setHospitals] = useState([])
  const [directions, setDirections] = useState(null)
  const [map, setMap] = useState(null)
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [pulseRadius, setPulseRadius] = useState(20)

  useEffect(() => {
    const t = setInterval(() => {
      setPulseRadius((r) => (r >= 35 ? 15 : r + 2))
    }, 80)
    return () => clearInterval(t)
  }, [])

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
    id: 'google-map-script'
  })

  useEffect(() => {
    fetch(`${API_URL}/api/hospitals`)
      .then((r) => r.json())
      .then(setHospitals)
      .catch(() => setHospitals([]))
  }, [])

  useEffect(() => {
    if (!showRoute || !ambulanceLocation || !targetHospital || !isLoaded || !window.google) {
      setDirections(null)
      return
    }
    const origin = { lat: ambulanceLocation[0], lng: ambulanceLocation[1] }
    const destination = { lat: targetHospital.lat, lng: targetHospital.lng }
    const service = new window.google.maps.DirectionsService()
    service.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === 'OK') setDirections(result)
        else setDirections(null)
      }
    )
  }, [showRoute, ambulanceLocation, targetHospital, isLoaded])

  const onLoad = useCallback((mapInstance) => {
    mapInstance.fitBounds(BENGALURU_BOUNDS)
    setMap(mapInstance)
  }, [])

  const onUnmount = useCallback(() => setMap(null), [])

  useEffect(() => {
    if (map && ambulanceLocation && targetHospital) {
      const bounds = new window.google.maps.LatLngBounds()
      bounds.extend({ lat: ambulanceLocation[0], lng: ambulanceLocation[1] })
      bounds.extend({ lat: targetHospital.lat, lng: targetHospital.lng })
      map.fitBounds(bounds, 80)
    }
  }, [map, ambulanceLocation, targetHospital])

  if (!isLoaded) {
    const hasKey = !!import.meta.env.VITE_GOOGLE_MAPS_KEY
    return (
      <div className="google-map-placeholder">
        {hasKey ? (
          <p>Loading Google Maps...</p>
        ) : (
          <div>
            <p>Add Google Maps API key to use exact map</p>
            <p className="hint">Create .env with: VITE_GOOGLE_MAPS_KEY=your_key</p>
            <p className="hint">Get key: console.cloud.google.com</p>
          </div>
        )}
      </div>
    )
  }

  const ambulancePos = ambulanceLocation
    ? { lat: ambulanceLocation[0], lng: ambulanceLocation[1] }
    : null

  return (
    <div className="bengaluru-google-map">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={ambulancePos || BENGALURU_CENTER}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          restriction: {
            latLngBounds: {
              north: BENGALURU_BOUNDS.north,
              south: BENGALURU_BOUNDS.south,
              east: BENGALURU_BOUNDS.east,
              west: BENGALURU_BOUNDS.west
            },
            strictBounds: false
          },
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true
        }}
      >
        {ambulancePos && (
          <>
            <Circle
              center={ambulancePos}
              radius={pulseRadius}
              options={{
                fillColor: '#4285F4',
                fillOpacity: 0.15,
                strokeColor: '#4285F4',
                strokeOpacity: 0.5,
                strokeWeight: 1
              }}
            />
            <Circle
              center={ambulancePos}
              radius={8}
              options={{
                fillColor: '#4285F4',
                fillOpacity: 0.6,
                strokeColor: '#1967D2',
                strokeWeight: 3
              }}
            />
            <Marker
              position={ambulancePos}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 3
              }}
              title={`Your Ambulance (Live) — ${ambulanceLocation[0].toFixed(6)}, ${ambulanceLocation[1].toFixed(6)}`}
            />
          </>
        )}

        {showHospitalsOnly &&
          hospitals.map((h) => (
            <Marker
              key={h.id}
              position={{ lat: h.lat, lng: h.lng }}
              icon={{
                path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: '#EA4335',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 1
              }}
              onClick={() => setSelectedHospital(selectedHospital?.id === h.id ? null : h)}
            >
              {selectedHospital?.id === h.id && (
                <InfoWindow onCloseClick={() => setSelectedHospital(null)}>
                  <div className="map-info">
                    <strong>{h.name}</strong>
                    <br />
                    {h.address}
                  </div>
                </InfoWindow>
              )}
            </Marker>
          ))}

        {targetHospital && (
          <Marker
            position={{ lat: targetHospital.lat, lng: targetHospital.lng }}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }}
            title={`Destination: ${targetHospital.name}`}
          />
        )}

        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
    </div>
  )
}
