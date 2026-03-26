# 🔧 SwiftAID Frontend - Troubleshooting Guide

## 🆘 Common Issues & Solutions

### Issue 1: "Could not connect to backend"
**Error Message:**
```
Error: Could not connect to backend: Failed to fetch
```

**Causes:**
- ❌ Backend server is not running
- ❌ Backend is on wrong port
- ❌ CORS not enabled
- ❌ Firewall blocking connection
- ❌ Network connectivity issue

**Solutions:**

**Step 1: Verify Backend is Running**
```bash
# Terminal 1 - Check if backend is running
cd backend
python app.py
# Should show: INFO: Uvicorn running on http://127.0.0.1:8000
```

**Step 2: Check Backend URL**
```javascript
// In index.html, verify this line (around line 150):
const BACKEND_URL = 'http://localhost:8000';
```

**Step 3: Test Backend Connection**
```bash
# In PowerShell or Terminal
curl http://localhost:8000/
# Should return: {"message":"Welcome to SwiftAid API"}
```

**Step 4: Clear Browser Cache**
- Press: **Ctrl+Shift+Delete**
- Select: "All time"
- Check: Cookies, Cached images
- Click: **Clear data**
- Refresh page

**Step 5: Check Firewall**
```powershell
# Windows Firewall Check
Get-NetFirewallRule -DisplayName "*8000*" | Select-Object DisplayName,Enabled
```

---

### Issue 2: Map Not Loading
**Symptoms:**
- ❌ Blank gray area where map should be
- ❌ No map tiles visible
- ❌ Console shows tile loading errors

**Causes:**
- ❌ No internet connection
- ❌ OpenStreetMap server down
- ❌ CDN not working
- ❌ Browser security policy

**Solutions:**

**Step 1: Check Internet Connection**
```bash
# Test internet connectivity
ping 8.8.8.8
```

**Step 2: Test Leaflet CDN**
```javascript
// Open browser console (F12) and paste:
fetch('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js')
  .then(r => r.status === 200 ? 'CDN works' : 'CDN failed')
  .then(console.log)
```

**Step 3: Refresh Page**
- Press: **Ctrl+F5** (hard refresh)
- Wait 5 seconds for map to load

**Step 4: Check Browser Console for Errors**
- Press: **F12**
- Click: **Console** tab
- Look for red error messages
- Take screenshot and save

**Step 5: Try Different Browser**
- Try Chrome, Firefox, or Edge
- If it works elsewhere, issue is browser-specific

---

### Issue 3: Incidents Not Showing
**Symptoms:**
- ❌ Map loads but no incident markers
- ❌ Sidebar shows "No active incidents"
- ❌ Statistics all show 0

**Causes:**
- ❌ Backend not returning incident data
- ❌ API endpoint returning error
- ❌ Data parsing issue
- ❌ Incidents list is empty

**Solutions:**

**Step 1: Check Backend /incidents Endpoint**
```bash
# PowerShell
$response = Invoke-WebRequest -Uri "http://localhost:8000/incidents"
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Step 2: Verify Data Format**
Expected response:
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

**Step 3: Check Browser Console**
- Press: **F12**
- Click: **Console**
- Paste this code:
```javascript
fetch('http://localhost:8000/incidents')
  .then(r => r.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(e => console.error(e))
```

**Step 4: Manually Refresh**
- Click "🔄 Refresh Data" button
- Wait for spinner to stop

**Step 5: Check Backend Logs**
- Look at backend terminal (python app.py output)
- Should see: `GET /incidents` logs
- Check for errors

---

### Issue 4: SOS Button Not Working
**Symptoms:**
- ❌ Button doesn't open modal
- ❌ Modal opens but send button doesn't work
- ❌ "Failed to send SOS" error

**Causes:**
- ❌ Modal not initializing
- ❌ Backend /dispatch endpoint down
- ❌ Backend returning error
- ❌ JavaScript error in console

**Solutions:**

**Step 1: Check Browser Console**
- Press: **F12**
- Click: **Console** tab
- Click SOS button
- Look for error messages in red
- Copy any errors

**Step 2: Test SOS Button Opening**
```javascript
// In browser console:
document.getElementById('sosButton').click()
// Modal should appear
```

**Step 3: Test Backend /dispatch**
```bash
# PowerShell
$body = @{ text = "Test emergency" } | ConvertTo-Json
Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8000/dispatch" `
  -Body $body `
  -ContentType "application/json" | Select-Object -ExpandProperty Content
```

**Step 4: Clear Modal and Try Again**
```javascript
// In console - force clear and open modal:
document.getElementById('sosModal').classList.remove('active')
document.getElementById('emergencyText').value = ''
document.getElementById('sosButton').click()
```

**Step 5: Try Sending Test SOS**
- Type: "Test emergency message"
- Send it
- Check backend logs for processing

---

### Issue 5: Auto-Refresh Not Working
**Symptoms:**
- ❌ Dashboard doesn't update automatically
- ❌ New incidents don't appear
- ❌ Manual refresh works but auto doesn't

**Causes:**
- ❌ Auto-refresh timer not starting
- ❌ Fetch requests failing silently
- ❌ Browser tab not in focus
- ❌ Network timeout

**Solutions:**

**Step 1: Verify Auto-Refresh is Enabled**
In browser console:
```javascript
// Check if auto-refresh interval exists:
console.log('Checking refresh cycle...')
// Auto-refresh runs every 30 seconds by default
// Look at terminal - should see GET requests every 30 seconds
```

**Step 2: Test Manual Refresh**
- Click "🔄 Refresh Data" button
- Should show spinner
- Incidents should update
- If manual works but auto doesn't, continue

**Step 3: Check Network Tab**
- Press: **F12**
- Click: **Network** tab
- Wait 30+ seconds
- Should see requests to `/incidents` and `/hotspots`
- If no requests appear, auto-refresh is broken

**Step 4: Keep Browser Tab Active**
- Some browsers pause timers in background tabs
- Make sure SwiftAID tab is active/focused
- Auto-refresh resumes when tab is active

**Step 5: Increase Auto-Refresh Interval**
Edit `index.html` (~line 398):
```javascript
// Change from 30000ms to 60000ms (60 seconds):
setInterval(() => {
    fetchIncidents();
    fetchHotspots();
}, 60000);  // Changed from 30000
```

---

### Issue 6: Sidebar Not Scrolling / Content Cut Off
**Symptoms:**
- ❌ Incident list doesn't scroll
- ❌ Can't see all incidents
- ❌ Statistics cut off at bottom

**Causes:**
- ❌ Browser viewport too small
- ❌ CSS overflow not set
- ❌ Mobile view issue

**Solutions:**

**Step 1: Expand Browser Window**
- Make browser window wider
- Make window taller
- Check if content appears

**Step 2: Check Browser Zoom**
- Press: **Ctrl+0** (reset zoom to 100%)
- Try **Ctrl+Minus** (zoom out) if needed

**Step 3: Check Mobile View**
- Press: **F12**
- Click: **Toggle device toolbar** (Ctrl+Shift+M)
- Select phone/tablet size
- Scroll should work

**Step 4: Try Full Screen**
- Press: **F11** (full screen mode)
- Check if everything visible

---

### Issue 7: Browser Shows Security Warning
**Symptoms:**
- ❌ Mixed content warning
- ❌ "Not secure" warning
- ❌ HTTPS/HTTP mismatch

**Causes:**
- ❌ Backend on HTTP, frontend on HTTPS
- ❌ Self-signed certificate
- ❌ CORS policy

**Solutions:**

**For Development:**
Use `http://` for both:
```javascript
// index.html
const BACKEND_URL = 'http://localhost:8000';
// NOT https://
```

**For Production:**
Use HTTPS for both and update:
```javascript
const BACKEND_URL = 'https://api.example.com';
```

---

### Issue 8: Markers Not Showing Colors (All Gray)
**Symptoms:**
- ❌ All markers are gray/black
- ❌ Colors don't match severity
- ❌ Icons not showing

**Causes:**
- ❌ Font Awesome not loaded
- ❌ CSS styling issue
- ❌ Severity data malformed

**Solutions:**

**Step 1: Check Font Awesome**
In browser console:
```javascript
// Test if Font Awesome loaded:
const link = document.querySelector('link[href*="fontawesome"]')
console.log('Font Awesome loaded:', link !== null)
```

**Step 2: Check Severity Values**
```javascript
// In console - check incident data:
fetch('http://localhost:8000/incidents')
  .then(r => r.json())
  .then(data => {
    data.incidents.forEach(i => {
      console.log(`${i.id}: severity=${i.severity}`)
    })
  })
```

Severity should be: `critical`, `high`, or `medium` (lowercase)

**Step 3: Force Refresh Markers**
```javascript
// In console:
clearMarkers()
updateMarkers()
```

---

### Issue 9: Modal Can't Be Closed
**Symptoms:**
- ❌ Modal stays open after sending SOS
- ❌ Can't close with ESC key
- ❌ Cancel button doesn't work

**Causes:**
- ❌ Modal stuck in active state
- ❌ JavaScript error preventing close
- ❌ Event listener not working

**Solutions:**

**Step 1: Force Close Modal**
```javascript
// In browser console:
document.getElementById('sosModal').classList.remove('active')
```

**Step 2: Try ESC Key**
- Press: **Escape** key
- Modal should close

**Step 3: Click Cancel Button**
- Look for "Cancel" button in modal
- Try clicking it
- Modal should close

**Step 4: Hard Refresh**
- Press: **Ctrl+F5**
- This reloads all JavaScript
- Open modal again and try closing

---

### Issue 10: Data Not Persisting (Lost After Refresh)
**Symptoms:**
- ❌ Incidents disappear after page refresh
- ❌ SOS sent but doesn't show
- ❌ Statistics reset

**Causes:**
- ❌ Data only in frontend memory (expected)
- ❌ Backend not persisting data
- ❌ No database configured

**This is Normal!**

The frontend loads fresh data from backend every 30 seconds. Data is not stored locally.

**Expected Behavior:**
1. Page load → fetches data from backend
2. Backend has 3 mock incidents always
3. You send SOS → backend processes
4. Page refresh → data reloads from backend

---

## 🧪 Debugging Checklist

Use this when something doesn't work:

- [ ] Backend running? (`python backend/app.py`)
- [ ] Backend on port 8000? (`http://localhost:8000`)
- [ ] Frontend accessible? (`http://localhost:5000`)
- [ ] Browser console clear of errors? (F12 → Console)
- [ ] Network tab shows API calls? (F12 → Network)
- [ ] Page refreshed? (Ctrl+F5)
- [ ] Browser cache cleared? (Ctrl+Shift+Delete)
- [ ] Firewall allowing ports 5000 & 8000?
- [ ] Internet connection working? (test.com loads)
- [ ] Leaflet CDN accessible? (loads map)

---

## 📞 Getting Help

### Collect Diagnostic Info
```javascript
// Paste this in console to get diagnostics:
(function() {
  console.log('=== SwiftAID Diagnostics ===')
  console.log('Backend URL:', BACKEND_URL)
  console.log('Map Status:', map ? 'Loaded' : 'Not loaded')
  console.log('Incidents:', incidents.length)
  console.log('Hotspots:', hotspots.length)
  fetch(BACKEND_URL + '/incidents')
    .then(r => r.json())
    .then(d => console.log('Backend Response:', d))
    .catch(e => console.error('Backend Error:', e))
})()
```

### Create Bug Report
Include:
1. **Screenshot** of error
2. **Browser console output** (F12)
3. **Network tab** (F12 → Network)
4. **Steps to reproduce**
5. **Diagnostic output** (from script above)

---

## 🆠 Quick Fix Commands

Paste these in browser console when stuck:

```javascript
// Force close modal
document.getElementById('sosModal').classList.remove('active')

// Force refresh all data
clearMarkers(); fetchIncidents(); fetchHotspots()

// Reset sidebar
location.reload()

// Check backend
fetch('http://localhost:8000/').then(r => r.json()).then(console.log)

// Show all errors
window.addEventListener('error', e => console.error(e))
```

---

## 📊 Testing Different Scenarios

### Test 1: No Backend
1. Stop backend (Ctrl+C)
2. Try opening dashboard
3. Should show error message
4. Test if error is clear

### Test 2: Slow Connection
1. Open DevTools (F12)
2. Network tab → Throttling
3. Set to "Slow 4G"
4. Try operations
5. Check responsiveness

### Test 3: Mobile View
1. Press Ctrl+Shift+M
2. Select iPhone SE
3. Test all buttons
4. Check scrolling
5. Test SOS on mobile

---

## 🚀 Performance Troubleshooting

**Dashboard Slow?**
1. Too many incidents (50+)
2. Old browser
3. Low RAM/disk
4. Network slow

**Fix:**
1. Reduce incident refresh
2. Use modern browser (Chrome)
3. Close unused tabs
4. Check internet speed

---

**Remember:** Most issues stem from backend not running or being unavailable. Always check backend status first! 🔍

