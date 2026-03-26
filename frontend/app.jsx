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

const Sidebar = () => (
    <div className="sidebar">
        <h2>Active Emergencies</h2>
        <div className="incidents-list">
            {MOCK_INCIDENTS.map(inc => (
                <div key={inc.id} className="incident-card">
                    <div className="card-header">
                        <span className="card-type">{inc.type}</span>
                        <span className={`badge badge-${inc.severity}`}>{inc.severity}</span>
                    </div>
                    <div className="card-loc"><i data-lucide="map-pin" style={{width: 14, height: 14, marginRight: 4}}></i>{inc.loc}</div>
                    <div className="card-time">{inc.time}</div>
                </div>
            ))}
        </div>
    </div>
);

// --- Main App Component ---
const App = () => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const ambulanceMarker = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDispatching, setIsDispatching] = useState(false);
    const [corridorActive, setCorridorActive] = useState(false);
    const [eta, setEta] = useState(null); // '08:30'
    const [etaSeconds, setEtaSeconds] = useState(0);

    // Initialize Map
    useEffect(() => {
        if (!mapInstance.current) {
            mapInstance.current = L.map(mapRef.current, { zoomControl: false }).setView([STATION_LAT, STATION_LNG], 13);
            L.control.zoom({ position: 'topright' }).addTo(mapInstance.current);

            // Esri Satellite Tiles
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri'
            }).addTo(mapInstance.current);

            // Blue Ambulance Station
            const ambIcon = L.divIcon({ className: 'marker-ambulance', iconSize: [24,24] });
            ambulanceMarker.current = L.marker([STATION_LAT, STATION_LNG], { icon: ambIcon }).addTo(mapInstance.current);

            // Severity-Segregated Pulsing Incidents
            MOCK_INCIDENTS.forEach(inc => {
                let markerClass = 'marker-medium';
                if (inc.severity === 'critical') markerClass = 'marker-critical';
                else if (inc.severity === 'high') markerClass = 'marker-high';

                const dynamicIcon = L.divIcon({ className: markerClass, iconSize: [20,20] });
                L.marker([inc.lat, inc.lng], { icon: dynamicIcon }).addTo(mapInstance.current);
            });

            // Fix map incomplete loading (grey tiles issue in React)
            setTimeout(() => {
                mapInstance.current.invalidateSize();
            }, 500);
        }
    }, []);

    // Lucide Icons initialization
    useEffect(() => {
        lucide.createIcons();
    }, [isModalOpen, corridorActive]);

    // Handle Dispatch Flow
    const handleDispatch = (text) => {
        setIsDispatching(true);
        setTimeout(() => {
            setIsDispatching(false);
            setIsModalOpen(false);
            startGreenCorridor();
        }, 2000);
    };

    const startGreenCorridor = () => {
        setCorridorActive(true);
        setEtaSeconds(8 * 60 + 30); // 8:30

        const destLat = MOCK_INCIDENTS[0].lat;
        const destLng = MOCK_INCIDENTS[0].lng;

        // Draw green polyline (Mocking a route)
        // Simple straight line with a curve for hackathon demo purposes
        const midLat = STATION_LAT + (destLat - STATION_LAT)/2 + 0.01;
        const midLng = STATION_LNG + (destLng - STATION_LNG)/2;
        const routePoints = [
            [STATION_LAT, STATION_LNG],
            [midLat, midLng],
            [destLat, destLng]
        ];

        const routeLine = L.polyline(routePoints, {
            color: '#2ea043', weight: 6, dashArray: '10, 10', className: 'route-anim'
        }).addTo(mapInstance.current);
        
        mapInstance.current.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

        // Animate marker along the line simply using interval
        let step = 0;
        const totalSteps = 100; // takes about 10 seconds visually
        
        const deltaLat1 = (midLat - STATION_LAT) / (totalSteps/2);
        const deltaLng1 = (midLng - STATION_LNG) / (totalSteps/2);
        
        const deltaLat2 = (destLat - midLat) / (totalSteps/2);
        const deltaLng2 = (destLng - midLng) / (totalSteps/2);

        const animInterval = setInterval(() => {
            step++;
            let cLat, cLng;
            if (step <= totalSteps/2) {
                cLat = STATION_LAT + deltaLat1 * step;
                cLng = STATION_LNG + deltaLng1 * step;
            } else {
                const s2 = step - Math.floor(totalSteps/2);
                cLat = midLat + deltaLat2 * s2;
                cLng = midLng + deltaLng2 * s2;
            }
            
            ambulanceMarker.current.setLatLng([cLat, cLng]);

            if (step >= totalSteps) {
                clearInterval(animInterval);
                // Snap to end
                ambulanceMarker.current.setLatLng([destLat, destLng]);
            }
        }, 50); // super fast visual 5s animation over route
    };

    // ETA Timer countdown logic (fast simulated countdown from 08:30 to 04:15)
    useEffect(() => {
        if (corridorActive && etaSeconds > 0) {
            const stopPoint = 4 * 60 + 15; // 04:15 is the goal where we stop simulation timer
            
            const timer = setInterval(() => {
                setEtaSeconds(prev => {
                    if (prev <= stopPoint) {
                        clearInterval(timer);
                        return stopPoint;
                    }
                    // Count down faster than reality for hackathon demo
                    return prev - 8; 
                });
            }, 100);

            return () => clearInterval(timer);
        }
    }, [corridorActive]);

    // Format ETA
    useEffect(() => {
        if (etaSeconds > 0) {
            const m = Math.floor(etaSeconds / 60).toString().padStart(2, '0');
            const s = (etaSeconds % 60).toString().padStart(2, '0');
            setEta(`${m}:${s}`);
        }
    }, [etaSeconds]);

    return (
        <div>
            <div id="map-container" ref={mapRef}></div>
            
            <TopNav />
            <Sidebar />

            {/* Banners & ETA */}
            {corridorActive && (
                <>
                    <div className="green-corridor-banner">
                        <i data-lucide="siren" style={{animation: 'pulse 1s infinite'}}></i>
                        Green Corridor Activated — 14 Signals Cleared
                    </div>
                    
                    <div className="eta-box">
                        <div className="eta-label">Estimated Arrival</div>
                        <div className={`eta-time ${etaSeconds <= 255 ? 'success' : ''}`}>
                            {eta}
                        </div>
                    </div>
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
