const { useState, useEffect, useRef } = React;
const lucide = window.lucide;

// --- Mock Data ---
const MOCK_INCIDENTS = [
    { id: 'inc-01', type: 'Severe Collision', loc: 'Hosur Road Junction', severity: 'critical', lat: 12.9250, lng: 77.6200, time: '14:23:10 IST' },
    { id: 'inc-02', type: 'Residential Fire', loc: 'Indiranagar 100ft Rd', severity: 'high', lat: 12.9784, lng: 77.6408, time: '14:15:45 IST' },
    { id: 'inc-03', type: 'Medical Emergency', loc: 'Koramangala 4th Block', severity: 'medium', lat: 12.9352, lng: 77.6245, time: '14:10:02 IST' },
];

const STATION_LAT = 12.9716;
const STATION_LNG = 77.5946;

// --- Helper Components ---
const TopNav = () => {
    const [time, setTime] = useState(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }));
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="navbar">
            <div className="brand">
                <i data-lucide="shield-alert" style={{color: 'white', width: 28, height: 28}}></i>
                SwiftAid
            </div>
            <div className="nav-right">
                <div className="clock">{time} IST</div>
                <div className="live-indicator">
                    <div className="live-dot"></div> LIVE
                </div>
            </div>
        </div>
    );
};

const Sidebar = ({ incidents }) => (
    <div className="sidebar">
        <h2>Active Emergencies</h2>
        <div className="incidents-list">
            {incidents.length === 0 ? (
                <div style={{color: '#8b949e', padding: '20px', textAlign: 'center'}}>No active dispatches. Type SOS to start.</div>
            ) : (
                incidents.map((inc, i) => (
                    <div key={i} className="incident-card">
                        <div className="card-header">
                            <span className="card-type" style={{textTransform: 'capitalize'}}>{inc.type}</span>
                            <span className={`badge badge-${inc.severity}`}>{inc.severity}</span>
                        </div>
                        <div className="card-loc"><i data-lucide="map-pin" style={{width: 14, height: 14, marginRight: 4}}></i>{inc.loc}</div>
                        <div className="card-time">{inc.time}</div>
                    </div>
                ))
            )}
        </div>
    </div>
);

// --- Main App Component ---
const App = () => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const ambulanceMarker = useRef(null);
    const markersRef = useRef([]); 
    const routePolyline = useRef(null);
    
    const [activeEmergencies, setActiveEmergencies] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDispatching, setIsDispatching] = useState(false);
    const [corridorActive, setCorridorActive] = useState(false);
    const [corridorMessage, setCorridorMessage] = useState('Green Corridor Activated — Signals Cleared');
    const [eta, setEta] = useState(''); 
    const [etaSeconds, setEtaSeconds] = useState(0);

    // Initialize Map
    useEffect(() => {
        if (!mapInstance.current && window.google) {
            const darkMapStyle = [
              { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
              { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
              { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
              { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
            ];

            mapInstance.current = new window.google.maps.Map(mapRef.current, {
                center: { lat: STATION_LAT, lng: STATION_LNG },
                zoom: 13,
                disableDefaultUI: true,
                zoomControl: true,
                styles: darkMapStyle
            });

            const trafficLayer = new window.google.maps.TrafficLayer();
            trafficLayer.setMap(mapInstance.current);

            ambulanceMarker.current = new window.google.maps.Marker({
                position: { lat: STATION_LAT, lng: STATION_LNG },
                map: mapInstance.current,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 12,
                    fillColor: '#3388ff',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 3,
                },
                zIndex: 999
            });
        }
    }, []);

    useEffect(() => {
        lucide.createIcons();
    }, [isModalOpen, corridorActive, corridorMessage, activeEmergencies]);

    const handleDispatch = async (text) => {
        setIsDispatching(true);
        try {
            const response = await fetch('http://localhost:8000/dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await response.json();
            
            const newIncident = {
                type: data.result.incident_type,
                loc: data.result.location_name,
                severity: data.result.severity,
                time: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST'
            };
            setActiveEmergencies(prev => [newIncident, ...prev]);

            setIsDispatching(false);
            setIsModalOpen(false);
            startGreenCorridor(data.result);
        } catch (e) {
            console.error(e);
            setIsDispatching(false);
            alert("Backend dispatch failed. Ensure the python backend is running on port 8000.");
        }
    };

    const driveTo = (origin, destination, isHospitalLeg, callback) => {
        const directionsService = new window.google.maps.DirectionsService();

        directionsService.route({
            origin: origin,
            destination: destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
        }, (response, status) => {
            if (status === 'OK') {
                const route = response.routes[0].overview_path;
                
                if (routePolyline.current) {
                    routePolyline.current.setMap(null);
                }

                routePolyline.current = new window.google.maps.Polyline({
                    path: route,
                    geodesic: true,
                    strokeColor: isHospitalLeg ? '#3388ff' : '#2ea043',
                    strokeOpacity: 1.0,
                    strokeWeight: 6,
                    map: mapInstance.current
                });

                const pathLength = route.length;
                const numSignals = isHospitalLeg ? 4 : 6;
                const signalMarkers = [];
                for(let i=1; i<=numSignals; i++) {
                    const idx = Math.floor((pathLength / (numSignals + 1)) * i);
                    const pt = route[idx];
                    
                    const sigMarker = new window.google.maps.Marker({
                        position: pt,
                        map: mapInstance.current,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: '#ff3333', // RED initially
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                        },
                        title: "Traffic Signal (Ready)"
                    });
                    markersRef.current.push(sigMarker);
                    signalMarkers.push({ marker: sigMarker, cleared: false });
                }

                const bounds = new window.google.maps.LatLngBounds();
                route.forEach(p => bounds.extend(p));
                mapInstance.current.fitBounds(bounds, { padding: 50 });

                let currentPathIdx = 0;
                let currentSegmentStep = 0;
                
                // Animation settings
                const animationInterval = 50; 
                const totalAnimationDuration = 12000; // Increased to 12s
                const totalSteps = Math.ceil(totalAnimationDuration / animationInterval);
                let currentTotalStep = 0;

                const animInterval = setInterval(() => {
                    if (currentPathIdx >= pathLength - 1) {
                        clearInterval(animInterval);
                        ambulanceMarker.current.setPosition(route[pathLength - 1]);
                        setEtaSeconds(0);
                        if (callback) callback();
                        return;
                    }

                    const p1 = route[currentPathIdx];
                    const p2 = route[currentPathIdx + 1];

                    currentSegmentStep++;
                    currentTotalStep++;
                    
                    // Sync ETA to animation progress
                    const remainingMs = Math.max(0, totalAnimationDuration - (currentTotalStep * animationInterval));
                    setEtaSeconds(Math.ceil(remainingMs / 1000));

                    const stepsPerSegment = Math.max(1, Math.floor(totalSteps / pathLength));
                    const fraction = currentSegmentStep / stepsPerSegment;

                    const curLat = p1.lat() + (p2.lat() - p1.lat()) * fraction;
                    const curLng = p1.lng() + (p2.lng() - p1.lng()) * fraction;
                    const curPos = { lat: curLat, lng: curLng };

                    ambulanceMarker.current.setPosition(curPos);

                    // Dynamic signal clearing
                    signalMarkers.forEach(sig => {
                        if (!sig.cleared) {
                            const dist = window.google.maps.geometry.spherical.computeDistanceBetween(
                                new window.google.maps.LatLng(curLat, curLng),
                                sig.marker.getPosition()
                            );
                            if (dist < 150) { 
                                sig.cleared = true;
                                sig.marker.setIcon({
                                    path: window.google.maps.SymbolPath.CIRCLE,
                                    scale: 8,
                                    fillColor: isHospitalLeg ? '#3388ff' : '#2ea043',
                                    fillOpacity: 1,
                                    strokeColor: '#ffffff',
                                    strokeWeight: 2,
                                });
                                sig.marker.setTitle("Traffic Signal (Cleared)");
                            }
                        }
                    });

                    if (currentSegmentStep >= stepsPerSegment) {
                        currentSegmentStep = 0;
                        currentPathIdx++;
                    }
                }, animationInterval);
            } else {
                console.error('Directions request failed due to ' + status);
            }
        });
    };

    const startGreenCorridor = (result) => {
        setCorridorActive(true);
        setCorridorMessage('Routing to Emergency Area — Signals Cleared');

        const destLat = result.lat;
        const destLng = result.lng;
        
        const stationLat = result.ambulance_dispatched ? result.ambulance_dispatched.lat : STATION_LAT;
        const stationLng = result.ambulance_dispatched ? result.ambulance_dispatched.lng : STATION_LNG;

        // Clear existing markers except the ambulance
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];
        
        const dynamicIncidentMarker = new window.google.maps.Marker({
            position: { lat: destLat, lng: destLng },
            map: mapInstance.current,
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#ff3333',
                fillOpacity: 0.9,
                strokeColor: '#ffffff',
                strokeWeight: 2,
            }
        });
        markersRef.current.push(dynamicIncidentMarker);

        ambulanceMarker.current.setPosition({ lat: stationLat, lng: stationLng });

        // Phase 1: Drive to Incident
        driveTo({ lat: stationLat, lng: stationLng }, { lat: destLat, lng: destLng }, false, () => {
            if (result.nearest_hospital) {
                setCorridorMessage('Patient Picked Up! Rerouting to Nearest Hospital...');
                setEtaSeconds(0);
                setTimeout(() => {
                    setCorridorMessage(`Routing to ${result.nearest_hospital.name} — Green Corridor Active`);
                    
                    // Mark hospital
                    const hospMarker = new window.google.maps.Marker({
                        position: { lat: result.nearest_hospital.lat, lng: result.nearest_hospital.lng },
                        map: mapInstance.current,
                        icon: {
                            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                            scale: 6,
                            fillColor: '#ffffff',
                            fillOpacity: 1,
                            strokeColor: '#3388ff',
                            strokeWeight: 3,
                        },
                        title: result.nearest_hospital.name
                    });
                    markersRef.current.push(hospMarker);
                    
                    // Phase 2: Drive to Hospital
                    driveTo(
                        { lat: destLat, lng: destLng },
                        { lat: result.nearest_hospital.lat, lng: result.nearest_hospital.lng },
                        true,
                        () => {
                            setCorridorMessage('Arrived at Hospital. Mission Complete.');
                        }
                    );
                }, 2000); // 2 second pause before phase 2
            } else {
                setCorridorMessage('Arrived at Scene. No Transport Required.');
            }
        });
    };

    useEffect(() => {
        // Removed old eta timer effect, handled inside driveTo loop now
    }, []);

    useEffect(() => {
        if (etaSeconds > 0) {
            const m = Math.floor(etaSeconds / 60).toString().padStart(2, '0');
            const s = (etaSeconds % 60).toString().padStart(2, '0');
            setEta(`${m}:${s}`);
        } else if (etaSeconds === 0 && corridorActive) {
            setEta("00:00");
        }
    }, [etaSeconds, corridorActive]);

    return (
        <div>
            <div id="map-container" ref={mapRef}></div>
            
            <TopNav />
            <Sidebar incidents={activeEmergencies} />

            {/* Banners & ETA */}
            {corridorActive && (
                <>
                    <div className="green-corridor-banner">
                        <i data-lucide="siren" style={{animation: 'pulse 1s infinite'}}></i>
                        {corridorMessage}
                    </div>
                    
                    {etaSeconds >= 0 && (
                        <div className="eta-box">
                            <div className="eta-label">Estimated Arrival</div>
                            <div className={`eta-time ${etaSeconds <= 5 ? 'success' : ''}`}>
                                {eta}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* SOS Trigger */}
            {!corridorActive && (
                <button className="sos-btn-fixed" onClick={() => setIsModalOpen(true)}>
                    <div className="sos-pulse"></div>
                    SOS
                </button>
            )}

            {/* Modal */}
            {isModalOpen && (
                <SosModal 
                    onClose={() => !isDispatching && setIsModalOpen(false)}
                    onDispatch={handleDispatch}
                    isDispatching={isDispatching}
                />
            )}
        </div>
    );
};

// -- SOS Modal Component with Speech --
const SosModal = ({ onClose, onDispatch, isDispatching }) => {
    const [text, setText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Setup Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                }
                if (finalTranscript) {
                    setText(prev => prev + " " + finalTranscript.trim());
                }
            };
            
            recognitionRef.current.onerror = (e) => console.error("Speech error", e);
            recognitionRef.current.onend = () => setIsRecording(false);
        }
    }, []);

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            if (recognitionRef.current) {
                recognitionRef.current.start();
                setIsRecording(true);
            } else {
                alert("Speech Recognition not supported in this browser.");
            }
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <h2><i data-lucide="radio" style={{color: 'red'}}></i> Emergency Dispatch Control</h2>
                
                <div className="audio-row">
                    <button 
                        className={`btn-mic ${isRecording ? 'recording' : ''}`}
                        onClick={toggleRecording}
                        title="Hold to Speak"
                    >
                        <i data-lucide={isRecording ? "mic-off" : "mic"}></i>
                    </button>
                    {isRecording ? <span style={{color: '#ff4d4d', fontWeight: 'bold'}}>&nbsp;&nbsp;Listening...</span> : <span style={{color: '#8b949e'}}>&nbsp;&nbsp;Click mic to speak</span>}
                </div>

                <textarea 
                    className="textarea-sos"
                    placeholder="Describe context... (e.g. 'Pileup on Hosur Road, need 3 ambulances immediately')"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    disabled={isDispatching}
                ></textarea>

                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose} disabled={isDispatching}>Cancel</button>
                    <button className="btn btn-dispatch" onClick={() => onDispatch(text)} disabled={isDispatching || !text.trim()}>
                        {isDispatching ? <span className="spinner"></span> : "Dispatch Rescue"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
