# 🚑 Pulse-Path — Ambulance Emergency Response System

A real-time emergency response web application for Bengaluru, built for hackathon demo. It enables ambulance drivers to navigate optimally with live traffic signal management.

## 📁 Project Structure

```
Pulse-Path/
├── frontend/         # Vite + React client app
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/          # Node.js + Express + Socket.IO server
│   ├── index.js
│   └── package.json
└── package.json      # Root scripts to run both together
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm

### Install Dependencies
```bash
npm run install:all
```

### Run (Development)
```bash
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🔐 Demo Login
| Role | Username | Password |
|------|----------|----------|
| Ambulance Driver | `ambulance1` | `demo123` |
| Guest/Observer | `driver` | `demo123` |

## 🌟 Features
- 🗺️ Real-time GPS tracking on Leaflet maps
- 🏥 Nearest hospital finder (22 hospitals across Bengaluru + 100km radius)
- 🚦 Automatic traffic signal pre-emption at intersections
- 📡 Live WebSocket updates for all connected clients
- 🛣️ Turn-by-turn directions (Google Maps / OSRM / fallback)

## 🔧 Environment Variables

### Backend (`backend/.env`)
```
GOOGLE_MAPS_API_KEY=your_key_here   # Optional, falls back to OSRM
PORT=3001
```

### Frontend (`frontend/.env`)
```
VITE_SERVER_URL=http://localhost:3001
```

## 📡 API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hospitals` | List all hospitals |
| POST | `/api/nearest-hospital` | Find nearest hospital |
| GET | `/api/directions` | Get route directions |
| POST | `/api/login` | Authenticate user |

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Leaflet.js, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO
- **Maps**: Leaflet + OpenStreetMap / Google Maps

## 📜 License
MIT
