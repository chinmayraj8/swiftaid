const BACKEND_URL = 'http://localhost:8000';

let map;
let markersLayer = new L.LayerGroup();
let hotspotsLayer = new L.LayerGroup();

// --- SIMULATION ENGINE ---
let simulatedIncidents = [];
let simulatedHotspots = [
    { lat: 12.9352, lng: 77.6245, risk_score: 80 }, // Koramangala
    { lat: 12.9716, lng: 77.5946, risk_score: 60 }, // MG Road
    { lat: 12.9141, lng: 77.5841, risk_score: 45 }  // Jayanagar
];
let incidentCounter = 1;

const types = ['medical', 'fire', 'accident', 'crime', 'rescue'];
const severities = ['critical', 'high', 'medium'];
// Bangalore Center
const baseLat = 12.9716;
const baseLng = 77.5946;

function generateRandomIncident() {
    // Generate lat/lng within ~5km of center
    const lat = baseLat + (Math.random() - 0.5) * 0.1;
    const lng = baseLng + (Math.random() - 0.5) * 0.1;
    
    return {
        id: `inc-sim-${String(incidentCounter++).padStart(3, '0')}`,
        type: types[Math.floor(Math.random() * types.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        lat: lat,
        lng: lng,
        timestamp: new Date().toISOString()
    };
}

function initSimulation() {
    // Start with 4 initial incidents
    for(let i=0; i<4; i++) {
        simulatedIncidents.push(generateRandomIncident());
    }
    
    // Simulation Loop every 3 seconds
    setInterval(() => {
        // 40% chance to add a new incident
        if (Math.random() < 0.4 && simulatedIncidents.length < 15) {
            simulatedIncidents.unshift(generateRandomIncident());
        }
        
        // 20% chance to resolve (remove) the oldest incident
        if (Math.random() < 0.2 && simulatedIncidents.length > 2) {
            simulatedIncidents.pop(); // remove oldest
        }
        
        // Render updates
        renderIncidents(simulatedIncidents);
        renderHotspots(simulatedHotspots);
        
    }, 3000);
}
// -------------------------

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initSimulation(); // Use simulation instead of fetchData
    setupSOSLogic();
});

function initMap() {
    map = L.map('map', {
        zoomControl: false 
    }).setView([baseLat, baseLng], 13);
    
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    markersLayer.addTo(map);
    hotspotsLayer.addTo(map);
}

function renderIncidents(incidents) {
    markersLayer.clearLayers();
    
    const listContainer = document.getElementById('incident-list');
    listContainer.innerHTML = '';
    
    if (incidents.length === 0) {
        listContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">No active incidents.</div>';
        return;
    }

    incidents.forEach(inc => {
        const card = document.createElement('div');
        card.className = 'incident-card';
        card.innerHTML = `
            <div class="incident-header">
                <span class="incident-type">${inc.type}</span>
                <span class="severity-badge severity-${inc.severity}">${inc.severity}</span>
            </div>
            <div class="incident-meta">ID: ${inc.id} | ${new Date(inc.timestamp).toLocaleTimeString()}</div>
        `;
        
        card.onclick = () => {
            map.flyTo([inc.lat, inc.lng], 16, { duration: 1 });
        };
        listContainer.appendChild(card);

        let color = '#2ea043'; 
        if (inc.severity === 'critical') color = '#ff4d4d';
        else if (inc.severity === 'high') color = '#ffa500';

        const markerHtml = `
            <div style="
                background-color: ${color};
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 15px ${color};
                animation: pulse 2s infinite;
            "></div>
        `;

        const icon = L.divIcon({
            html: markerHtml,
            className: 'custom-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const popupContent = `
            <div style="padding: 5px;">
                <h3 style="color: ${color}; text-transform: capitalize; margin-bottom: 5px;">${inc.severity} Priority</h3>
                <div><b>Type:</b> <span style="text-transform: capitalize;">${inc.type}</span></div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 5px;">ID: ${inc.id}</div>
                <div style="font-size: 11px; color: #888; margin-top: 3px;">Simulated Data</div>
            </div>
        `;

        L.marker([inc.lat, inc.lng], { icon })
         .bindPopup(popupContent, { closeButton: false })
         .addTo(markersLayer);
    });
}

function renderHotspots(hotspots) {
    hotspotsLayer.clearLayers();
    
    hotspots.forEach(spot => {
        L.circle([spot.lat, spot.lng], {
            color: '#ff3333',
            fillColor: '#ff3333',
            fillOpacity: 0.15,
            radius: (spot.risk_score || 50) * 15 
        }).bindPopup(`<div style="padding:5px; color: #ff3333; font-weight: bold;">High Risk Hotspot (Score: ${spot.risk_score})</div>`)
          .addTo(hotspotsLayer);
    });
}

function setupSOSLogic() {
    const btnSos = document.getElementById('btn-sos');
    const modalOverlay = document.getElementById('sos-modal-overlay');
    const btnCancel = document.getElementById('btn-cancel');
    const btnConfirm = document.getElementById('btn-confirm');
    const textArea = document.getElementById('sos-text');

    btnSos.addEventListener('click', () => {
        modalOverlay.classList.add('active');
        textArea.focus();
    });

    const closeModal = () => modalOverlay.classList.remove('active');
    btnCancel.addEventListener('click', closeModal);
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    btnConfirm.addEventListener('click', async () => {
        const text = textArea.value.trim();
        if (!text) return alert('Please describe the emergency!');

        btnConfirm.textContent = 'Dispatching via API...';
        btnConfirm.disabled = true;

        try {
            // We still try to send the dispatch to the real backend NLP engine
            const res = await fetch(`${BACKEND_URL}/dispatch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await res.json();
            console.log('Dispatch result from backend:', data);
            
            // For simulation: Inject the SOS as a new critical incident right in the center!
            simulatedIncidents.unshift({
                id: `sos-${String(incidentCounter++).padStart(3, '0')}`,
                type: 'SOS Dispatched',
                severity: 'critical',
                lat: baseLat + (Math.random() - 0.5) * 0.02,
                lng: baseLng + (Math.random() - 0.5) * 0.02,
                timestamp: new Date().toISOString()
            });
            renderIncidents(simulatedIncidents);

            btnConfirm.textContent = 'Dispatched!';
            btnConfirm.style.background = '#2ea043'; 
            
            setTimeout(() => {
                closeModal();
                btnConfirm.textContent = 'Dispatch SOS';
                btnConfirm.disabled = false;
                btnConfirm.style.background = ''; 
                textArea.value = ''; 
            }, 1000);
            
        } catch (e) {
            console.error(e);
            
            // Even if backend fails, simulate the dispatch locally
            simulatedIncidents.unshift({
                id: `sos-local-${String(incidentCounter++).padStart(3, '0')}`,
                type: 'SOS (Local Sim)',
                severity: 'critical',
                lat: baseLat,
                lng: baseLng,
                timestamp: new Date().toISOString()
            });
            renderIncidents(simulatedIncidents);

            btnConfirm.textContent = 'Simulated Dispatch!';
            btnConfirm.style.background = '#2ea043'; 
            
            setTimeout(() => {
                closeModal();
                btnConfirm.textContent = 'Dispatch SOS';
                btnConfirm.disabled = false;
                btnConfirm.style.background = ''; 
                textArea.value = ''; 
            }, 1000);
        }
    });
}
