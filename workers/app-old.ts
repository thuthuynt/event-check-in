import { handleAPIRequest } from "./api";
import { handleMockAPIRequest } from "./mock-api";

function getContentType(pathname: string): string {
  if (pathname.endsWith('.css')) return 'text/css';
  if (pathname.endsWith('.js')) return 'application/javascript';
  if (pathname.endsWith('.ico')) return 'image/x-icon';
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      // Check if we have Cloudflare services available
      if (env && env.DUCKLYTICS_PROD && env.EVENT_STORAGE) {
        return handleAPIRequest(request, env.DUCKLYTICS_PROD, env.EVENT_STORAGE, env.JWT_SECRET);
      } else {
        // Use mock API for local development
        return handleMockAPIRequest(request);
      }
    }
    
    // Serve static assets from R2
    if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/build/')) {
      try {
        const key = url.pathname.startsWith('/build/') 
          ? url.pathname.substring(1) // Remove leading slash
          : `build/client${url.pathname}`;
        
        const object = await env.EVENT_STORAGE.get(key);
        if (object) {
          const contentType = getContentType(url.pathname);
          return new Response(object.body, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000', // 1 year cache
            },
          });
        }
      } catch (error) {
        console.error('Error serving static asset:', error);
      }
      
      return new Response('Asset not found', { status: 404 });
    }
    
    // Serve the main React Router application
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Check-in System</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/build/client/assets/root-Bhh87Ypv.css">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/build/client/assets/entry.client-Cwmah2k6.js"></script>
</body>
</html>`;
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 2rem;
            width: 100%;
            max-width: 400px;
            margin: 1rem;
        }
        .logo {
            text-align: center;
            margin-bottom: 2rem;
        }
        .logo h1 {
            color: #333;
            margin: 0;
            font-size: 1.8rem;
        }
        .form-group {
            margin-bottom: 1.5rem;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            color: #555;
            font-weight: 500;
        }
        input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s;
            box-sizing: border-box;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            width: 100%;
            background: #667eea;
            color: white;
            border: none;
            padding: 0.75rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        button:hover {
            background: #5a6fd8;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .error {
            color: #e74c3c;
            font-size: 0.875rem;
            margin-top: 0.5rem;
        }
        .success {
            color: #27ae60;
            font-size: 0.875rem;
            margin-top: 0.5rem;
        }
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .events-container {
            margin-top: 2rem;
        }
        .event-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        .event-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 0.5rem;
        }
        .event-date {
            color: #666;
            font-size: 0.875rem;
        }
        .create-event-btn {
            background: #28a745;
            margin-top: 1rem;
        }
        .create-event-btn:hover {
            background: #218838;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>🏃‍♂️ Event Check-in</h1>
        </div>
        <div id="app"></div>
    </div>

    <script type="text/babel">
        const { useState, useEffect } = React;

        function LoginForm() {
            const [username, setUsername] = useState('');
            const [password, setPassword] = useState('');
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState('');

            const handleLogin = async (e) => {
                e.preventDefault();
                setLoading(true);
                setError('');

                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_name: username, password })
                    });

                    const data = await response.json();
                    
                    if (data.success) {
                        localStorage.setItem('authToken', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        window.location.reload();
                    } else {
                        setError('Invalid username or password');
                    }
                } catch (err) {
                    setError('Login failed. Please try again.');
                } finally {
                    setLoading(false);
                }
            };

            return (
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <div className="error">{error}</div>}
                    <button type="submit" disabled={loading}>
                        {loading ? <span className="loading"></span> : 'Login'}
                    </button>
                </form>
            );
        }

        function CreateEventModal({ isOpen, onClose, onEventCreated }) {
            const [eventName, setEventName] = useState('');
            const [eventDate, setEventDate] = useState('');
            const [participantsFile, setParticipantsFile] = useState(null);
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState('');

            const handleSubmit = async (e) => {
                e.preventDefault();
                if (!eventName || !eventDate || !participantsFile) {
                    setError('Please fill in all fields and select a CSV file');
                    return;
                }

                setLoading(true);
                setError('');

                try {
                    const formData = new FormData();
                    formData.append('event_name', eventName);
                    formData.append('event_start_date', eventDate);
                    formData.append('participants_file', participantsFile);

                    const token = localStorage.getItem('authToken');
                    const response = await fetch('/api/events', {
                        method: 'POST',
                        headers: { 'Authorization': \`Bearer \${token}\` },
                        body: formData
                    });

                    const data = await response.json();
                    
                    if (data.success) {
                        onEventCreated();
                        onClose();
                        setEventName('');
                        setEventDate('');
                        setParticipantsFile(null);
                    } else {
                        setError(data.error || 'Failed to create event');
                    }
                } catch (err) {
                    setError('Failed to create event. Please try again.');
                } finally {
                    setLoading(false);
                }
            };

            if (!isOpen) return null;

            return (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        width: '90%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Create New Event</h3>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="eventName">Event Name</label>
                                <input
                                    type="text"
                                    id="eventName"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    placeholder="e.g., Marathon 2025"
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="eventDate">Event Date</label>
                                <input
                                    type="date"
                                    id="eventDate"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="participantsFile">Participants CSV File</label>
                                <input
                                    type="file"
                                    id="participantsFile"
                                    accept=".csv"
                                    onChange={(e) => setParticipantsFile(e.target.files[0])}
                                    required
                                />
                                <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                                    Upload a CSV file with participant data. Required columns: participant_id, start_time, bib_no, id_card_passport, last_name, first_name, tshirt_size, birthday_year, nationality, phone, email, emergency_contact_name, emergency_contact_phone, blood_type, medical_information, medicines_using, parent_full_name, parent_date_of_birth, parent_email, parent_id_card_passport, parent_relationship, full_name, name_on_bib
                                </div>
                            </div>
                            
                            {error && <div className="error">{error}</div>}
                            
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={onClose} style={{ background: '#6c757d', flex: 1 }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} style={{ flex: 1 }}>
                                    {loading ? <span className="loading"></span> : 'Create Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

        function EventsList() {
            const [events, setEvents] = useState([]);
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState('');
            const [showCreateModal, setShowCreateModal] = useState(false);

            useEffect(() => {
                fetchEvents();
            }, []);

            const fetchEvents = async () => {
                try {
                    const token = localStorage.getItem('authToken');
                    const response = await fetch('/api/events', {
                        headers: { 'Authorization': \`Bearer \${token}\` }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setEvents(data);
                    } else {
                        setError('Failed to load events');
                    }
                } catch (err) {
                    setError('Failed to load events');
                } finally {
                    setLoading(false);
                }
            };

            const handleLogout = () => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.reload();
            };

            const handleEventCreated = () => {
                fetchEvents(); // Refresh the events list
            };

            const handleEventSelect = (eventId) => {
                // Navigate to check-in page for this event
                window.location.hash = \`#/checkin/\${eventId}\`;
            };

            const handleStatsView = (eventId) => {
                // Navigate to stats page for this event
                window.location.hash = \`#/stats/\${eventId}\`;
            };

            if (loading) {
                return <div>Loading events...</div>;
            }

            return (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>Your Events</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setShowCreateModal(true)} className="create-event-btn" style={{ background: '#28a745', padding: '0.5rem 1rem', fontSize: '0.875rem', width: 'auto' }}>
                                ➕ Create Event
                            </button>
                            <button onClick={handleLogout} style={{ background: '#dc3545', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                Logout
                            </button>
                        </div>
                    </div>
                    
                    {error && <div className="error">{error}</div>}
                    
                    {events.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                            <p>No events found.</p>
                            <p>Click "Create Event" to get started!</p>
                        </div>
                    ) : (
                        <div className="events-container">
                            {events.map(event => (
                                <div key={event.id} className="event-card">
                                    <div className="event-name">{event.event_name}</div>
                                    <div className="event-date">Date: {event.event_start_date}</div>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                                        Participants: {event.participant_count || 0}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button 
                                            onClick={() => handleEventSelect(event.id)}
                                            style={{ background: '#007bff', padding: '0.5rem 1rem', fontSize: '0.875rem', flex: 1 }}
                                        >
                                            📋 Check-in
                                        </button>
                                        <button 
                                            onClick={() => handleStatsView(event.id)}
                                            style={{ background: '#6f42c1', padding: '0.5rem 1rem', fontSize: '0.875rem', flex: 1 }}
                                        >
                                            📊 Stats
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <CreateEventModal 
                        isOpen={showCreateModal}
                        onClose={() => setShowCreateModal(false)}
                        onEventCreated={handleEventCreated}
                    />
                </div>
            );
        }

        function CheckInPage({ eventId }) {
            const [event, setEvent] = useState(null);
            const [participants, setParticipants] = useState([]);
            const [searchQuery, setSearchQuery] = useState('');
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState('');
            const [selectedParticipant, setSelectedParticipant] = useState(null);

            useEffect(() => {
                fetchEventAndParticipants();
            }, [eventId]);

            const fetchEventAndParticipants = async () => {
                try {
                    const token = localStorage.getItem('authToken');
                    
                    // Fetch event details
                    const eventResponse = await fetch(\`/api/events/\${eventId}\`, {
                        headers: { 'Authorization': \`Bearer \${token}\` }
                    });
                    
                    if (eventResponse.ok) {
                        const eventData = await eventResponse.json();
                        setEvent(eventData);
                    }

                    // Fetch participants
                    const participantsResponse = await fetch(\`/api/participants/search?event_id=\${eventId}\`, {
                        headers: { 'Authorization': \`Bearer \${token}\` }
                    });
                    
                    if (participantsResponse.ok) {
                        const participantsData = await participantsResponse.json();
                        setParticipants(participantsData);
                    }
                } catch (err) {
                    setError('Failed to load data');
                } finally {
                    setLoading(false);
                }
            };

            const handleSearch = async () => {
                try {
                    const token = localStorage.getItem('authToken');
                    const response = await fetch(\`/api/participants/search?event_id=\${eventId}&q=\${encodeURIComponent(searchQuery)}\`, {
                        headers: { 'Authorization': \`Bearer \${token}\` }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        setParticipants(data);
                    }
                } catch (err) {
                    setError('Search failed');
                }
            };

            const handleBackToEvents = () => {
                window.location.hash = '#/events';
            };

            if (loading) {
                return <div>Loading...</div>;
            }

            if (selectedParticipant) {
                return <ParticipantDetails participant={selectedParticipant} event={event} onBack={() => setSelectedParticipant(null)} />;
            }

            return (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <button onClick={handleBackToEvents} style={{ background: '#6c757d', padding: '0.5rem 1rem', fontSize: '0.875rem', marginRight: '1rem' }}>
                                ← Back to Events
                            </button>
                            <h2>{event?.event_name || 'Event Check-in'}</h2>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <input
                            type="text"
                            id="search"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                // Auto-search as user types
                                const timeoutId = setTimeout(() => {
                                    handleSearch();
                                }, 300);
                                return () => clearTimeout(timeoutId);
                            }}
                            placeholder="Search by bib, name, phone, email..."
                            style={{ 
                                width: '100%',
                                padding: '0.75rem',
                                border: '2px solid #e1e5e9',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                transition: 'border-color 0.2s'
                            }}
                        />
                    </div>
                    
                    {error && <div className="error">{error}</div>}
                    
                    <div className="events-container">
                        {participants.map(participant => (
                            <div key={participant.id} className="event-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedParticipant(participant)}>
                                <div className="event-name">
                                    {participant.full_name || \`\${participant.first_name} \${participant.last_name}\`}
                                </div>
                                <div className="event-date">Name on Bib: {participant.name_on_bib}</div>
                                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                                    <div><strong>Bib:</strong> {participant.bib_no}</div>
                                    <div><strong>Phone:</strong> {participant.phone}</div>
                                    <div><strong>Email:</strong> {participant.email}</div>
                                    <div><strong>ID:</strong> {participant.id_card_passport}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        function ParticipantDetails({ participant, event, onBack }) {
            const [photo, setPhoto] = useState(null);
            const [signature, setSignature] = useState(null);
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState('');
            const [success, setSuccess] = useState(false);

            const handlePhotoCapture = () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'environment';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => setPhoto(e.target.result);
                        reader.readAsDataURL(file);
                    }
                };
                input.click();
            };

            const handleSignatureCapture = (signatureData) => {
                setSignature(signatureData);
            };

            const handleCheckIn = async () => {
                if (!photo || !signature) {
                    setError('Please capture both photo and signature');
                    return;
                }

                setLoading(true);
                setError('');

                try {
                    const token = localStorage.getItem('authToken');
                    
                    // Upload photo to R2
                    const photoResponse = await fetch('/api/upload', {
                        method: 'POST',
                        headers: { 'Authorization': \`Bearer \${token}\` },
                        body: JSON.stringify({ 
                            type: 'photo',
                            data: photo,
                            participant_id: participant.id
                        })
                    });
                    
                    const photoData = await photoResponse.json();
                    const photoUrl = photoData.url;

                    // Upload signature to R2
                    const signatureResponse = await fetch('/api/upload', {
                        method: 'POST',
                        headers: { 'Authorization': \`Bearer \${token}\` },
                        body: JSON.stringify({ 
                            type: 'signature',
                            data: signature,
                            participant_id: participant.id
                        })
                    });
                    
                    const signatureData = await signatureResponse.json();
                    const signatureUrl = signatureData.url;

                    // Complete check-in
                    const checkinResponse = await fetch('/api/checkin', {
                        method: 'POST',
                        headers: { 
                            'Authorization': \`Bearer \${token}\`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            participant_id: participant.id,
                            photo_url: photoUrl,
                            signature_url: signatureUrl
                        })
                    });

                    const data = await checkinResponse.json();
                    
                    if (data.success) {
                        setSuccess(true);
                        setTimeout(() => {
                            window.location.hash = '#/events';
                        }, 2000);
                    } else {
                        setError(data.error || 'Check-in failed');
                    }
                } catch (err) {
                    setError('Check-in failed. Please try again.');
                } finally {
                    setLoading(false);
                }
            };

            if (success) {
                return (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                        <h2 style={{ color: '#28a745' }}>Check-in Successful!</h2>
                        <p>Participant has been checked in successfully.</p>
                        <button onClick={() => window.location.hash = '#/events'} style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginTop: '1rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            Continue Check-in
                        </button>
                    </div>
                );
            }

            return (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <button onClick={onBack} style={{ 
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            ← Back
                        </button>
                        <h2 style={{ margin: 0 }}>{participant.full_name || \`\${participant.first_name} \${participant.last_name}\`}</h2>
                    </div>

                    {/* Contact Info */}
                    <div className="event-card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginTop: 0, color: '#333', borderBottom: '2px solid #e9ecef', paddingBottom: '0.5rem' }}>📞 Contact Info</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                            <div><strong>Full Name:</strong> {participant.full_name || \`\${participant.first_name} \${participant.last_name}\`}</div>
                            <div><strong>Name on Bib:</strong> {participant.name_on_bib}</div>
                            <div><strong>ID/Passport:</strong> {participant.id_card_passport}</div>
                            <div><strong>Phone:</strong> {participant.phone}</div>
                            <div><strong>Email:</strong> {participant.email}</div>
                            <div><strong>Nationality:</strong> {participant.nationality}</div>
                        </div>
                    </div>

                    {/* Race Info */}
                    <div className="event-card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginTop: 0, color: '#333', borderBottom: '2px solid #e9ecef', paddingBottom: '0.5rem' }}>🏃 Race Info</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                            <div><strong>Bib Number:</strong> {participant.bib_no}</div>
                            <div><strong>Start Time:</strong> {participant.start_time}</div>
                            <div><strong>T-Shirt Size:</strong> {participant.tshirt_size}</div>
                            <div><strong>Birth Year:</strong> {participant.birthday_year}</div>
                        </div>
                    </div>

                    {/* Medical Info */}
                    {participant.medical_information && (
                        <div className="event-card" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ marginTop: 0, color: '#333', borderBottom: '2px solid #e9ecef', paddingBottom: '0.5rem' }}>🏥 Medical Information</h3>
                            <div style={{ fontSize: '0.875rem' }}>
                                <div><strong>Medical Info:</strong> {participant.medical_information}</div>
                                {participant.medicines_using && <div><strong>Medicines:</strong> {participant.medicines_using}</div>}
                                {participant.blood_type && <div><strong>Blood Type:</strong> {participant.blood_type}</div>}
                            </div>
                        </div>
                    )}

                    {/* Emergency Info */}
                    <div className="event-card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginTop: 0, color: '#333', borderBottom: '2px solid #e9ecef', paddingBottom: '0.5rem' }}>🚨 Emergency Info</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                            <div><strong>Emergency Contact:</strong> {participant.emergency_contact_name}</div>
                            <div><strong>Emergency Phone:</strong> {participant.emergency_contact_phone}</div>
                        </div>
                    </div>

                    {/* Photo Capture */}
                    <div className="event-card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginTop: 0, color: '#333', borderBottom: '2px solid #e9ecef', paddingBottom: '0.5rem' }}>📸 Photo Capture</h3>
                        <div 
                            onClick={handlePhotoCapture}
                            style={{ 
                                border: photo ? '2px solid #28a745' : '2px dashed #ccc', 
                                borderRadius: '12px', 
                                padding: '2rem', 
                                textAlign: 'center', 
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                backgroundColor: photo ? '#f8fff8' : '#fafafa'
                            }}
                        >
                            {photo ? (
                                <div>
                                    <img src={photo} alt="Participant" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} />
                                    <p style={{ marginTop: '1rem', color: '#28a745', fontWeight: 'bold' }}>✅ Photo captured! Click to change</p>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ fontSize: '4rem', marginBottom: '1rem', color: '#ccc' }}>📷</div>
                                    <p style={{ color: '#666', fontSize: '1rem' }}>Click here to capture photo</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Digital Signature */}
                    <div className="event-card" style={{ marginBottom: '2rem' }}>
                        <h3 style={{ marginTop: 0, color: '#333', borderBottom: '2px solid #e9ecef', paddingBottom: '0.5rem' }}>✍️ Digital Signature</h3>
                        <SignaturePad onCapture={handleSignatureCapture} />
                    </div>

                    {error && <div className="error">{error}</div>}

                    <button 
                        onClick={handleCheckIn} 
                        disabled={loading || !photo || !signature}
                        style={{ 
                            width: '100%', 
                            background: photo && signature ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : '#ccc',
                            color: 'white',
                            border: 'none',
                            padding: '1rem',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            cursor: photo && signature ? 'pointer' : 'not-allowed',
                            boxShadow: photo && signature ? '0 6px 12px rgba(40, 167, 69, 0.3)' : 'none',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {loading ? <span className="loading"></span> : '✅ Complete Check-in'}
                    </button>
                </div>
            );
        }

        function SignaturePad({ onCapture }) {
            const canvasRef = React.useRef(null);
            const [isDrawing, setIsDrawing] = React.useState(false);
            const [hasSignature, setHasSignature] = React.useState(false);
            const [signatureCaptured, setSignatureCaptured] = React.useState(false);
            const [paths, setPaths] = React.useState([]);
            const currentPath = React.useRef([]);

            const drawPath = React.useCallback((path, context) => {
                if (path.length < 2) return;
                context.beginPath();
                context.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length - 2; i++) {
                    const c = (path[i].x + path[i + 1].x) / 2;
                    const d = (path[i].y + path[i + 1].y) / 2;
                    context.quadraticCurveTo(path[i].x, path[i].y, c, d);
                }
                context.quadraticCurveTo(path[path.length - 2].x, path[path.length - 2].y, path[path.length - 1].x, path[path.length - 1].y);
                context.stroke();
            }, []);

            const redrawAllPaths = React.useCallback(() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const context = canvas.getContext('2d');
                if (!context) return;
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.strokeStyle = '#000000';
                context.lineWidth = 3;
                context.lineCap = 'round';
                context.lineJoin = 'round';
                paths.forEach(path => drawPath(path, context));
                if (currentPath.current.length > 0) {
                    drawPath(currentPath.current, context);
                }
            }, [paths, drawPath]);

            React.useEffect(() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const context = canvas.getContext('2d');
                if (!context) return;
                const rect = canvas.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                context.scale(dpr, dpr);
                canvas.style.width = rect.width + 'px';
                canvas.style.height = rect.height + 'px';
                redrawAllPaths();
            }, [redrawAllPaths]);

            const getCoordinates = (e) => {
                const canvas = canvasRef.current;
                if (!canvas) return { x: 0, y: 0 };
                const rect = canvas.getBoundingClientRect();
                const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
                const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
                return {
                    x: (clientX - rect.left),
                    y: (clientY - rect.top)
                };
            };

            const startDrawing = (e) => {
                e.preventDefault();
                setIsDrawing(true);
                setHasSignature(true);
                currentPath.current = [getCoordinates(e)];
            };

            const draw = (e) => {
                if (!isDrawing) return;
                e.preventDefault();
                const newPoint = getCoordinates(e);
                currentPath.current.push(newPoint);
                redrawAllPaths();
            };

            const stopDrawing = () => {
                if (isDrawing) {
                    setIsDrawing(false);
                    if (currentPath.current.length > 0) {
                        setPaths(prevPaths => [...prevPaths, currentPath.current]);
                        currentPath.current = [];
                    }
                }
            };

            const clearSignature = () => {
                setPaths([]);
                currentPath.current = [];
                setHasSignature(false);
                setSignatureCaptured(false);
                redrawAllPaths();
            };

            const undoLastStroke = () => {
                if (paths.length > 0) {
                    setPaths(prevPaths => prevPaths.slice(0, prevPaths.length - 1));
                    if (paths.length === 1) {
                        setHasSignature(false);
                        setSignatureCaptured(false);
                    }
                }
            };

            const captureSignature = () => {
                const canvas = canvasRef.current;
                if (!canvas || !hasSignature) return;
                redrawAllPaths();
                const signatureData = canvas.toDataURL('image/png');
                setSignatureCaptured(true);
                onCapture(signatureData);
            };

            return (
                <div>
                    <div style={{ 
                        border: signatureCaptured ? '2px solid #28a745' : '2px dashed #ccc', 
                        borderRadius: '12px', 
                        marginBottom: '1rem', 
                        position: 'relative',
                        backgroundColor: signatureCaptured ? '#f8fff8' : '#fafafa',
                        transition: 'all 0.2s ease'
                    }}>
                        <canvas
                            ref={canvasRef}
                            style={{ 
                                width: '100%', 
                                height: '150px', 
                                cursor: signatureCaptured ? 'default' : 'crosshair',
                                opacity: signatureCaptured ? 0.8 : 1
                            }}
                            onMouseDown={signatureCaptured ? undefined : startDrawing}
                            onMouseMove={signatureCaptured ? undefined : draw}
                            onMouseUp={signatureCaptured ? undefined : stopDrawing}
                            onMouseLeave={signatureCaptured ? undefined : stopDrawing}
                            onTouchStart={signatureCaptured ? undefined : startDrawing}
                            onTouchMove={signatureCaptured ? undefined : draw}
                            onTouchEnd={signatureCaptured ? undefined : stopDrawing}
                        />
                        {!hasSignature && !signatureCaptured && (
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#999', pointerEvents: 'none' }}>
                                Sign here...
                            </div>
                        )}
                        {signatureCaptured && (
                            <div style={{ position: 'absolute', top: '10px', right: '10px', color: '#28a745', fontWeight: 'bold', fontSize: '0.875rem' }}>
                                ✅ Captured
                            </div>
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <button 
                            onClick={undoLastStroke} 
                            disabled={paths.length === 0 || signatureCaptured} 
                            style={{ 
                                flex: 1, 
                                background: paths.length === 0 || signatureCaptured ? '#ccc' : '#ffc107',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                cursor: paths.length === 0 || signatureCaptured ? 'not-allowed' : 'pointer',
                                boxShadow: paths.length === 0 || signatureCaptured ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            ↩️ Undo
                        </button>
                        <button 
                            onClick={clearSignature} 
                            disabled={!hasSignature} 
                            style={{ 
                                flex: 1, 
                                background: !hasSignature ? '#ccc' : '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                cursor: !hasSignature ? 'not-allowed' : 'pointer',
                                boxShadow: !hasSignature ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            🗑️ Clear
                        </button>
                        <button 
                            onClick={captureSignature} 
                            disabled={!hasSignature || signatureCaptured} 
                            style={{ 
                                flex: 1, 
                                background: !hasSignature || signatureCaptured ? '#ccc' : '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                cursor: !hasSignature || signatureCaptured ? 'not-allowed' : 'pointer',
                                boxShadow: !hasSignature || signatureCaptured ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            ✅ Confirm
                        </button>
                    </div>
                    
                    {signatureCaptured && (
                        <div style={{ 
                            textAlign: 'center', 
                            color: '#28a745', 
                            fontWeight: 'bold',
                            padding: '0.75rem',
                            backgroundColor: '#f8fff8',
                            borderRadius: '8px',
                            border: '1px solid #28a745'
                        }}>
                            ✅ Signature captured successfully! 👍
                        </div>
                    )}
                </div>
            );
        }

        function StatsPage({ eventId }) {
            const [event, setEvent] = useState(null);
            const [stats, setStats] = useState(null);
            const [recentCheckIns, setRecentCheckIns] = useState([]);
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState('');

            useEffect(() => {
                fetchStats();
            }, [eventId]);

            const fetchStats = async () => {
                try {
                    const token = localStorage.getItem('authToken');
                    
                    // Fetch event details
                    const eventResponse = await fetch(\`/api/events/\${eventId}\`, {
                        headers: { 'Authorization': \`Bearer \${token}\` }
                    });
                    
                    if (eventResponse.ok) {
                        const eventData = await eventResponse.json();
                        setEvent(eventData);
                    }

                    // Fetch stats
                    const statsResponse = await fetch(\`/api/stats?event_id=\${eventId}\`, {
                        headers: { 'Authorization': \`Bearer \${token}\` }
                    });
                    
                    if (statsResponse.ok) {
                        const statsData = await statsResponse.json();
                        setStats(statsData);
                    }

                    // Fetch recent check-ins
                    const recentResponse = await fetch(\`/api/recent-checkins?event_id=\${eventId}\`, {
                        headers: { 'Authorization': \`Bearer \${token}\` }
                    });
                    
                    if (recentResponse.ok) {
                        const recentData = await recentResponse.json();
                        setRecentCheckIns(recentData);
                    }
                } catch (err) {
                    setError('Failed to load statistics');
                } finally {
                    setLoading(false);
                }
            };

            const handleBackToEvents = () => {
                window.location.hash = '#/events';
            };

            if (loading) {
                return <div>Loading statistics...</div>;
            }

            return (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <button onClick={handleBackToEvents} style={{ background: '#6c757d', padding: '0.5rem 1rem', fontSize: '0.875rem', marginRight: '1rem' }}>
                            ← Back to Events
                        </button>
                        <h2>{event?.event_name || 'Event Statistics'}</h2>
                    </div>
                    
                    {error && <div className="error">{error}</div>}
                    
                    {stats && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            <div className="event-card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>{stats.total}</div>
                                <div>Total Participants</div>
                            </div>
                            <div className="event-card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>{stats.checked_in}</div>
                                <div>Checked In</div>
                            </div>
                            <div className="event-card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffc107' }}>{stats.remaining}</div>
                                <div>Remaining</div>
                            </div>
                        </div>
                    )}

                    {stats && (
                        <div className="event-card" style={{ marginBottom: '2rem' }}>
                            <h3>Progress</h3>
                            <div style={{ background: '#e9ecef', borderRadius: '4px', height: '20px', marginBottom: '0.5rem' }}>
                                <div style={{ 
                                    background: '#28a745', 
                                    height: '100%', 
                                    borderRadius: '4px',
                                    width: \`\${(stats.checked_in / stats.total) * 100}%\`,
                                    transition: 'width 0.3s ease'
                                }}></div>
                            </div>
                            <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>
                                \${Math.round((stats.checked_in / stats.total) * 100)}% Complete
                            </div>
                        </div>
                    )}

                    {recentCheckIns.length > 0 && (
                        <div className="event-card">
                            <h3>Recent Check-ins</h3>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {recentCheckIns.map((checkin, index) => (
                                    <div key={index} style={{ 
                                        padding: '0.75rem', 
                                        borderBottom: index < recentCheckIns.length - 1 ? '1px solid #e9ecef' : 'none',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{checkin.participant_name}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#666' }}>Bib: {checkin.bib_no}</div>
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                            {new Date(checkin.checkin_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        function App() {
            const [isAuthenticated, setIsAuthenticated] = useState(false);
            const [loading, setLoading] = useState(true);
            const [currentRoute, setCurrentRoute] = useState('');

            useEffect(() => {
                const token = localStorage.getItem('authToken');
                setIsAuthenticated(!!token);
                setLoading(false);
                
                // Handle hash routing
                const handleHashChange = () => {
                    const hash = window.location.hash.substring(1);
                    setCurrentRoute(hash);
                };
                
                handleHashChange();
                window.addEventListener('hashchange', handleHashChange);
                
                return () => window.removeEventListener('hashchange', handleHashChange);
            }, []);

            if (loading) {
                return <div>Loading...</div>;
            }

            if (!isAuthenticated) {
                return <LoginForm />;
            }

            // Route handling
            if (currentRoute.startsWith('/checkin/')) {
                const eventId = currentRoute.split('/')[2];
                return <CheckInPage eventId={eventId} />;
            }
            
            if (currentRoute.startsWith('/stats/')) {
                const eventId = currentRoute.split('/')[2];
                return <StatsPage eventId={eventId} />;
            }
            
            if (currentRoute === '/events' || currentRoute === '') {
                return <EventsList />;
            }

            // Default to events list
            return <EventsList />;
        }

        ReactDOM.render(<App />, document.getElementById('app'));
    </script>
</body>
</html>`;
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache',
      },
    });
  },
} satisfies ExportedHandler<Env>;
