# SwiftAID Frontend - Emergency Response Dashboard

A modern, responsive web-based emergency response dashboard built with **Leaflet**, **HTML5**, **CSS3**, and **JavaScript**.

## Features

### 🗺️ Interactive Map
- **Leaflet-based mapping** with OpenStreetMap tiles
- **Real-time incident markers** with color-coded severity levels
- **Hotspot visualization** showing high-risk zones
- **Pan and zoom** capabilities for detailed area inspection

### 🚨 Incident Management
- **Critical** incidents shown in **red** (#dc2626)
- **High** severity incidents shown in **orange** (#ea580c)
- **Medium** severity incidents shown in **yellow** (#eab308)
- **Live incident list** with filtering by severity
- **Click-to-navigate** functionality - click any incident to view it on map

### 🚑 Emergency Dispatch (SOS)
- **Large SOS button** for emergency activation
- **Modal dialog** for detailed emergency description
- **Real-time dispatch** to backend NLP engine
- **Audio/visual feedback** with status messages
- **Automatic incident refresh** after SOS submission

### 📊 Dashboard Statistics
- **Real-time counters** for incident severity levels
- **Visual indicators** showing current emergency status
- **Severity legend** for reference

### 🔄 Auto-Refresh
- **30-second auto-refresh** cycle (configurable)
- **Manual refresh button** for on-demand updates
- **Data synchronization** between frontend and backend

---

## Installation

### Prerequisites
- Python 3.8 or higher
- Backend running at `http://localhost:8000`

### Setup Steps

1. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   pip install -r requirements.txt
   ```

2. **Start Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt  # if not already installed
   python app.py
   ```
   Backend should run on `http://localhost:8000`

3. **Start Frontend Server:**
   ```bash
   cd frontend
   python app.py
   ```
   Frontend will be available at `http://localhost:5000`

4. **Open in Browser:**
   ```
   http://localhost:5000
   ```

---

## Usage Guide

### 🗺️ Using the Map
- **Zoom**: Use mouse wheel or +/- buttons
- **Pan**: Click and drag to move around
- **Click Incidents**: Click any marker to view details and navigate

### 🚨 Sending an SOS
1. Click the **"SOS - PRESS FOR EMERGENCY"** button (red button on left sidebar)
2. Describe your emergency in the modal dialog
   - Example: "Fire in apartment building, multiple injuries, need ambulance"
3. Click **"Send SOS"** to dispatch
4. System will automatically refresh incidents

### 📍 Viewing Incidents
- **Sidebar List**: Shows all active incidents sorted by severity
- **Click Card**: Jump to incident location on map
- **Popup**: Click marker on map for quick info
- **Statistics**: Top shows count of each severity level

### 🎨 Severity Legend
- 🔴 **Critical** - Life-threatening, immediate response needed
- 🟠 **High** - Serious but not immediately life-threatening
- 🟡 **Medium** - Moderate emergency
- 🟣 **Hotspots** - Predicted high-risk zones

---

## Configuration

### Backend URL
To change the backend URL, edit the `BACKEND_URL` in `index.html`:
```javascript
const BACKEND_URL = 'http://localhost:8000';
```

### Map Center
To change the default map location (currently Bangalore, India):
```javascript
const DEFAULT_LAT = 12.9716;  // Latitude
const DEFAULT_LNG = 77.5946;  // Longitude
const DEFAULT_ZOOM = 12;       // Zoom level
```

### Auto-Refresh Interval
Change the auto-refresh cycle (currently 30 seconds):
```javascript
setInterval(() => {
    fetchIncidents();
    fetchHotspots();
}, 30000);  // milliseconds
```

---

## API Integration

The frontend communicates with these backend endpoints:

### GET `/incidents`
Returns active incidents with location and severity
```json
{
  "incidents": [
    {
      "id": "inc-001",
      "type": "medical",
      "severity": "high",
      "lat": 12.971598,
      "lng": 77.594562,
      "timestamp": "2026-03-26T10:30:00"
    }
  ]
}
```

### POST `/dispatch`
Sends emergency text for NLP processing
```json
{
  "text": "Fire in building, multiple injuries"
}
```

### GET `/hotspots`
Returns predicted high-risk zones
```json
{
  "hotspots": [
    {"lat": 12.95, "lng": 77.60, "risk": "High Risk Zone"},
    ...
  ]
}
```

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Keyboard Shortcuts

- **ESC**: Close SOS modal dialog
- **Ctrl+Enter**: Submit emergency description (when modal is open)

---

## Troubleshooting

### "Could not connect to backend"
- ✓ Ensure backend is running (`python backend/app.py`)
- ✓ Verify backend URL is correct in `index.html`
- ✓ Check if backend is on `http://localhost:8000`

### Map not loading
- ✓ Check internet connection (needs to download map tiles)
- ✓ Verify Leaflet CDN is accessible
- ✓ Try refreshing the page

### Incidents not showing
- ✓ Click "Refresh Data" button
- ✓ Check backend `/incidents` endpoint returning data
- ✓ Verify SSL certificates if using HTTPS

### SOS not working
- ✓ Ensure backend is running and accessible
- ✓ Check browser console for errors (F12 → Console)
- ✓ Verify `/dispatch` endpoint is working

---

## File Structure

```
frontend/
├── index.html          # Main HTML with embedded CSS and JS
├── app.py              # Flask server
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

---

## Development

To modify the UI or add features:

1. **Edit Styling**: Modify the `<style>` section in `index.html`
2. **Add Features**: Add JavaScript in the `<script>` section
3. **Test Changes**: Refresh browser after saving

No build process needed - just edit and refresh!

---

## Performance Notes

- Loads map tiles dynamically (minimal initial load)
- SVG-based markers for light performance
- Efficient DOM updates
- Optimized for 4G+ networks

---

## License

Part of SwiftAID Emergency Response System

---

## Support

For issues or questions:
1. Check browser console (F12)
2. Verify backend is running
3. Check API responses in Network tab (F12 → Network)
4. Review logs in terminal

