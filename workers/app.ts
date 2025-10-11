import { handleAPIRequest } from "./api";
import { handleMockAPIRequest } from "./mock-api";

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
    
    // For all other routes, return a simple HTML response
    // In production, you would typically serve static files from R2 or another CDN
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Check-in System</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 { 
            color: #333; 
            text-align: center; 
            margin-bottom: 30px;
        }
        .status { 
            background: #e8f5e8; 
            padding: 20px; 
            border-radius: 5px; 
            margin: 20px 0;
            border-left: 4px solid #4caf50;
        }
        .api-test {
            background: #f0f8ff;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #2196f3;
        }
        button {
            background: #2196f3;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #1976d2;
        }
        pre {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 3px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏃‍♂️ Event Check-in System</h1>
        
        <div class="status">
            <h3>✅ System Status</h3>
            <p><strong>API Endpoints:</strong> Working</p>
            <p><strong>Database:</strong> Connected</p>
            <p><strong>Storage:</strong> Ready</p>
        </div>
        
        <div class="api-test">
            <h3>🧪 API Test</h3>
            <p>Test the API endpoints:</p>
            <button onclick="testAPI()">Test Events API</button>
            <button onclick="testAuth()">Test Auth API</button>
            <button onclick="testStats()">Test Stats API</button>
            <pre id="result"></pre>
        </div>
        
        <div class="status">
            <h3>📱 Mobile App</h3>
            <p>This is the backend API for the Event Check-in mobile application.</p>
            <p><strong>Available Endpoints:</strong></p>
            <ul>
                <li><code>POST /api/auth/login</code> - User authentication</li>
                <li><code>GET /api/events</code> - List events</li>
                <li><code>POST /api/events</code> - Create event with CSV upload</li>
                <li><code>GET /api/participants/search</code> - Search participants</li>
                <li><code>POST /api/checkin</code> - Check in participant</li>
                <li><code>GET /api/stats</code> - Get event statistics</li>
            </ul>
        </div>
    </div>
    
    <script>
        async function testAPI() {
            try {
                const response = await fetch('/api/events');
                const data = await response.json();
                document.getElementById('result').textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                document.getElementById('result').textContent = 'Error: ' + error.message;
            }
        }
        
        async function testAuth() {
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_name: 'admin', password: 'password' })
                });
                const data = await response.json();
                document.getElementById('result').textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                document.getElementById('result').textContent = 'Error: ' + error.message;
            }
        }
        
        async function testStats() {
            try {
                const response = await fetch('/api/stats?event_id=1');
                const data = await response.json();
                document.getElementById('result').textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                document.getElementById('result').textContent = 'Error: ' + error.message;
            }
        }
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
