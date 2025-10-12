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
    
    // Serve the main React application
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Check-in System</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
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

        function EventsList() {
            const [events, setEvents] = useState([]);
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState('');

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

            if (loading) {
                return <div>Loading events...</div>;
            }

            return (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>Your Events</h2>
                        <button onClick={handleLogout} style={{ background: '#dc3545', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                            Logout
                        </button>
                    </div>
                    
                    {error && <div className="error">{error}</div>}
                    
                    {events.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                            <p>No events found.</p>
                            <p>Contact your administrator to create events.</p>
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
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        function App() {
            const [isAuthenticated, setIsAuthenticated] = useState(false);
            const [loading, setLoading] = useState(true);

            useEffect(() => {
                const token = localStorage.getItem('authToken');
                setIsAuthenticated(!!token);
                setLoading(false);
            }, []);

            if (loading) {
                return <div>Loading...</div>;
            }

            return isAuthenticated ? <EventsList /> : <LoginForm />;
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
