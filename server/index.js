const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Bengaluru + surrounding 100km (villages, towns) - hospitals
const HOSPITALS = [
  { id: 1, name: "Apollo Hospital", lat: 12.9716, lng: 77.5946, address: "Bannerghatta Road, Bengaluru" },
  { id: 2, name: "Manipal Hospital", lat: 12.9352, lng: 77.6245, address: "Old Airport Road, Bengaluru" },
  { id: 3, name: "Fortis Hospital", lat: 12.9665, lng: 77.7128, address: "Cunningham Road, Bengaluru" },
  { id: 4, name: "Columbia Asia", lat: 12.9977, lng: 77.6965, address: "Yeshwanthpur, Bengaluru" },
  { id: 5, name: "Victoria Hospital", lat: 12.9518, lng: 77.5845, address: "KR Market, Bengaluru" },
  { id: 6, name: "NIMHANS", lat: 12.9421, lng: 77.6011, address: "Hosur Road, Bengaluru" },
  { id: 7, name: "St. John's Medical College", lat: 12.9250, lng: 77.5945, address: "Koramangala, Bengaluru" },
  { id: 8, name: "BMCRI (Bowring)", lat: 12.9792, lng: 77.5948, address: "Shivajinagar, Bengaluru" },
  { id: 9, name: "Sagar Hospitals", lat: 12.9352, lng: 77.6123, address: "Bannerghatta Road, Bengaluru" },
  { id: 10, name: "MS Ramaiah Memorial", lat: 13.0389, lng: 77.5522, address: "MSRIT Post, Bengaluru" },
  { id: 11, name: "Narayana Health City", lat: 12.9098, lng: 77.5978, address: "Hosur Road, Bengaluru" },
  { id: 12, name: "Sakra World Hospital", lat: 13.0689, lng: 77.6201, address: "Devanahalli" },
  { id: 13, name: "Kolar District Hospital", lat: 13.1343, lng: 78.1296, address: "Kolar Town" },
  { id: 14, name: "Tumakuru General Hospital", lat: 13.3415, lng: 77.1010, address: "Tumakuru (Tumkur)" },
  { id: 15, name: "Mandya District Hospital", lat: 12.5222, lng: 76.8985, address: "Mandya" },
  { id: 16, name: "Ramanagara Govt Hospital", lat: 12.7237, lng: 77.2810, address: "Ramanagara" },
  { id: 17, name: "Chikkaballapur District Hospital", lat: 13.4350, lng: 77.7275, address: "Chikkaballapur" },
  { id: 18, name: "Hosur Govt Hospital", lat: 12.7358, lng: 77.8250, address: "Hosur" },
  { id: 19, name: "Nelamangala Taluk Hospital", lat: 13.0983, lng: 77.3934, address: "Nelamangala" },
  { id: 20, name: "Magadi Community Health Centre", lat: 12.9710, lng: 77.2233, address: "Magadi" },
  { id: 21, name: "Doddaballapur Hospital", lat: 13.2954, lng: 77.5431, address: "Doddaballapur" },
  { id: 22, name: "Hoskote Govt Hospital", lat: 13.0700, lng: 77.7980, address: "Hoskote" }
];

// Simulated traffic intersections (Bengaluru)
const INTERSECTIONS = [
  { id: 'int1', lat: 12.9716, lng: 77.5946, name: "MG Road Junction" },
  { id: 'int2', lat: 12.9352, lng: 77.6245, name: "Indiranagar Junction" },
  { id: 'int3', lat: 12.9665, lng: 77.7128, name: "Cunningham Road" },
  { id: 'int4', lat: 12.9518, lng: 77.5845, name: "KR Market" },
  { id: 'int5', lat: 12.9421, lng: 77.6011, name: "Hosur Road Junction" }
];

// Simple auth for demo (no real database)
const DEMO_USERS = {
  ambulance1: { password: "demo123", name: "Ambulance Driver 1" },
  driver: { password: "demo123", name: "Demo Driver" }
};

app.get('/api/hospitals', (req, res) => {
  res.json(HOSPITALS);
});

app.get('/api/intersections', (req, res) => {
  res.json(INTERSECTIONS);
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = DEMO_USERS[username];
  if (user && user.password === password) {
    res.json({ success: true, user: { username, name: user.name }, isAmbulance: username === 'ambulance1' });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// Haversine distance formula
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Directions - Google (with traffic) or OSRM or fallback
app.get('/api/directions', async (req, res) => {
  const { origin, destination } = req.query;
  if (!origin || !destination) return res.status(400).json({ error: 'origin and destination required' });

  const [lat1, lng1] = origin.split(',').map(Number);
  const [lat2, lng2] = destination.split(',').map(Number);
  const fallback = () => {
    const distKm = getDistance(lat1, lng1, lat2, lng2);
    const durMin = Math.round((distKm / 35) * 60); // ~35 km/h avg
    const eta = new Date(Date.now() + durMin * 60000);
    return {
      points: [[lat1, lng1], [lat2, lng2]],
      steps: [{ instruction: `Head toward destination (${distKm.toFixed(1)} km)`, distance: `${distKm.toFixed(1)} km`, duration: `${durMin} min` }],
      distance: `${distKm.toFixed(1)} km`,
      duration: `${durMin} min`,
      durationInTraffic: `${durMin} min (est.)`,
      eta: eta.toLocaleTimeString(),
      provider: 'fallback'
    };
  };

  const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (GOOGLE_KEY) {
    try {
      const depTime = Math.floor(Date.now() / 1000);
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat1},${lng1}&destination=${lat2},${lng2}&mode=driving&departure_time=${depTime}&traffic_model=best_guess&key=${GOOGLE_KEY}`;
      const r = await fetch(url);
      const data = await r.json();
      if (data.status === 'OK' && data.routes?.[0]) {
        const route = data.routes[0];
        const leg = route.legs?.[0];
        const points = route.overview_polyline?.points ? decodePolyline(route.overview_polyline.points) : [];
        const steps = (route.legs || []).flatMap(l =>
          (l.steps || []).map(s => ({
            instruction: (s.html_instructions || '').replace(/<[^>]*>/g, '').trim() || 'Continue',
            distance: s.distance?.text || '',
            duration: s.duration?.text || ''
          }))
        );
        return res.json({
          points,
          steps,
          distance: leg?.distance?.text || '',
          duration: leg?.duration?.text || '',
          durationInTraffic: leg?.duration_in_traffic?.text || leg?.duration?.text || '',
          eta: leg?.duration_in_traffic?.value
            ? new Date(Date.now() + leg.duration_in_traffic.value * 1000).toLocaleTimeString()
            : leg?.duration?.value
              ? new Date(Date.now() + leg.duration.value * 1000).toLocaleTimeString()
              : '',
          provider: 'google'
        });
      }
    } catch (e) {
      console.error('Google Directions error:', e.message);
    }
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson&steps=true`;
    const r = await fetch(url);
    const data = await r.json();
    if (data.code === 'Ok' && data.routes?.[0]) {
      const route = data.routes[0];
      const leg = route.legs?.[0];
      const points = (route.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]);
      const steps = (route.legs || []).flatMap(l =>
        (l.steps || []).map(s => {
          const m = s.maneuver || {};
          const instr = [m.modifier, m.type].filter(Boolean).join(' ') || s.name || 'Continue';
          return {
            instruction: instr,
            distance: s.distance ? `${(s.distance / 1000).toFixed(1)} km` : '',
            duration: s.duration ? `${Math.round(s.duration / 60)} min` : ''
          };
        })
      );
      const distM = (leg?.distance || route.distance || 0) / 1000;
      const durS = (leg?.duration || route.duration || distM * 60) || distM * 60;
      return res.json({
        points,
        steps,
        distance: `${distM.toFixed(1)} km`,
        duration: `${Math.round(durS / 60)} min`,
        durationInTraffic: `${Math.round(durS / 60)} min`,
        eta: new Date(Date.now() + durS * 1000).toLocaleTimeString(),
        provider: 'osrm'
      });
    }
  } catch (e) {
    console.error('OSRM error:', e.message);
  }

  return res.json(fallback());
});

function decodePolyline(encoded) {
  const points = [];
  let i = 0, lat = 0, lng = 0;
  while (i < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(i++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(i++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

app.post('/api/nearest-hospital', (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: "Location required" });
  
  const sorted = HOSPITALS
    .map(h => ({ ...h, distance: getDistance(lat, lng, h.lat, h.lng) }))
    .sort((a, b) => a.distance - b.distance);
  
  res.json({ hospital: sorted[0], alternatives: sorted.slice(1, 4) });
});

// WebSocket handlers
const ambulanceState = { location: null, hospital: null, active: false, lane: null };
const trafficState = {};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('ambulance:login', () => {
    socket.join('ambulance');
    socket.emit('ambulance:state', ambulanceState);
  });

  socket.on('ambulance:location', (data) => {
    ambulanceState.location = data;
    ambulanceState.active = true;
    io.to('guests').emit('ambulance:approaching', data);
    io.emit('ambulance:location', data);
  });

  socket.on('ambulance:find-hospital', (data) => {
    const { lat, lng } = data;
    const sorted = HOSPITALS
      .map(h => ({ ...h, distance: getDistance(lat, lng, h.lat, h.lng) }))
      .sort((a, b) => a.distance - b.distance);
    ambulanceState.hospital = sorted[0];
    ambulanceState.lane = data.lane || 'north';
    socket.emit('ambulance:hospital-found', sorted[0]);
    io.emit('emergency:active', { hospital: sorted[0], lane: ambulanceState.lane });
  });

  socket.on('ambulance:near-intersection', (data) => {
    io.emit('traffic:emergency', {
      intersectionId: data.intersectionId,
      lane: data.lane,
      duration: 5000
    });
  });

  socket.on('ambulance:passed-intersection', (data) => {
    io.emit('traffic:reset', { intersectionId: data.intersectionId, delay: 30000 });
  });

  socket.on('ambulance:clear', () => {
    ambulanceState.active = false;
    ambulanceState.location = null;
    ambulanceState.hospital = null;
    io.emit('emergency:cleared');
  });

  socket.on('guest:join', () => {
    socket.join('guests');
    if (ambulanceState.active) {
      socket.emit('ambulance:approaching', ambulanceState.location);
      socket.emit('emergency:active', { hospital: ambulanceState.hospital, lane: ambulanceState.lane });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║  🚑 Ambulance Emergency App - Server Running             ║
  ║  http://localhost:${PORT}                                  ║
  ║  For demo: Use your laptop IP (e.g. 192.168.x.x:${PORT})   ║
  ║  Login: ambulance1 / demo123 (ambulance)                  ║
  ╚══════════════════════════════════════════════════════════╝
  `);
});
