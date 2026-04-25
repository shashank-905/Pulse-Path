// Backend server URL - use environment variable for production
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
export const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Google Maps - get free API key from https://console.cloud.google.com/
// Enable: Maps JavaScript API, Directions API. Add to .env: VITE_GOOGLE_MAPS_KEY=your_key
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || ''
