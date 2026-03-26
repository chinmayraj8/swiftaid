# 🚑 SwiftAID Frontend - QUICKSTART GUIDE

## Get Started in 5 Minutes

### Step 1: Start the Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Keep this terminal open!**

---

### Step 2: Start the Frontend

**Option A: Windows**
```bash
cd frontend
start.bat
```

**Option B: Linux/Mac**
```bash
cd frontend
chmod +x start.sh
./start.sh
```

**Option C: Manual**
```bash
cd frontend
pip install -r requirements.txt
python app.py
```

---

### Step 3: Open in Browser

```
http://localhost:5000
```

✅ **Done! The dashboard is now live.**

---

## Dashboard Features

### 🗺️ Map
- Shows all active incidents as colored markers
- Click any marker for details
- Purple circles = High-risk zones (hotspots)

### 🚨 SOS Button
- **Red button** on the left sidebar
- Click → Describe emergency → Send
- Automatically dispatches to emergency services

### 📊 Sidebar
- **Active Incidents**: List of all emergencies
- **Statistics**: Count by severity
- **Legend**: Color reference

### 🎨 Color Coding
| Color | Severity | Icon |
|-------|----------|------|
| 🔴 Red | Critical | ⚠️ |
| 🟠 Orange | High | ⚠️ |
| 🟡 Yellow | Medium | ℹ️ |
| 🟣 Purple | Hotspot | Zone |

---

## Test Drive

### 1. View Mock Incidents
- Open dashboard
- You'll see **3 sample incidents** in Bangalore
- Click "Refresh Data" button to reload

### 2. Send a Test SOS
1. Click red **"SOS"** button
2. Type: `Medical emergency at Lavelle Road`
3. Click **"Send SOS"**
4. Dashboard auto-refreshes with response

### 3. Explore the Map
- Scroll to zoom
- Drag to pan
- Click incidents in sidebar to navigate
- Close popups by clicking X

---

## Troubleshooting

### Issue: "Could not connect to backend"
```
✓ Is backend running? (Check step 1)
✓ Is it on localhost:8000?
✓ Try restarting both servers
```

### Issue: Map is blank
```
✓ Check internet connection (needs tiles)
✓ Wait 5 seconds for load
✓ Refresh page (Ctrl+R)
```

### Issue: SOS not working
```
✓ Check browser console: F12 → Console
✓ Verify backend received it
✓ Try sending again
```

---

## Configuration

### Change Backend URL
Edit `frontend/index.html` line ~150:
```javascript
const BACKEND_URL = 'http://localhost:8000';
```

### Change Map Center
Edit `frontend/index.html` lines ~151-153:
```javascript
const DEFAULT_LAT = 12.9716;    // Latitude
const DEFAULT_LNG = 77.5946;    // Longitude
const DEFAULT_ZOOM = 12;         // Zoom level
```

---

## What's Happening Behind the Scenes?

```
User clicks SOS
    ↓
Frontend opens modal dialog
    ↓
User describes emergency + sends
    ↓
Frontend sends POST to /dispatch
    ↓
Backend NLP engine parses request
    ↓
Emergency is logged as new incident
    ↓
Frontend auto-refreshes to show new incident
    ↓
Dashboard shows alert & refreshed list
```

---

## API Endpoints (Reference)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/incidents` | Get all active incidents |
| GET | `/hotspots` | Get high-risk zones |
| POST | `/dispatch` | Send emergency text |
| POST | `/corridor` | Generate emergency route |

---

## Performance Tips

- Frontend auto-refreshes every 30 seconds
- Manual "Refresh Data" button for immediate update
- Smoothly handles 50+ incidents on most browsers
- Optimized for 4G+ networks

---

## Next Steps

1. **Customize**: Edit styling in `index.html` `<style>` section
2. **Integrate**: Connect real backend API endpoints
3. **Deploy**: Host on web server (AWS, Heroku, etc.)
4. **Mobile**: Responsive design works on phones

---

## File Overview

| File | Purpose |
|------|---------|
| `index.html` | Main dashboard (HTML + CSS + JS) |
| `app.py` | Flask server |
| `requirements.txt` | Python dependencies |
| `README.md` | Full documentation |
| `start.bat` | Windows quick start |
| `start.sh` | Linux/Mac quick start |

---

## Need Help?

1. **Check Console**: Press `F12` → `Console` tab
2. **Check Network**: Press `F12` → `Network` tab
3. **Check Logs**: Look at terminal output
4. **Check Backend**: Verify backend is running

---

## Success Indicators ✅

When working properly, you should see:
- ✅ Map loads with Bangalore location
- ✅ 3 incident markers visible
- ✅ Sidebar shows statistics (1 Critical, 1 High, 1 Medium)
- ✅ SOS button is clickable
- ✅ "Refresh Data" button works
- ✅ Status messages appear
- ✅ Auto-refresh happens every 30 sec

---

**Enjoy using SwiftAID! 🚑**
