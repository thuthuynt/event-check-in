import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

// CSV parsing function that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// CSV validation function
function validateCSVStructure(csvContent: string) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    return { isValid: false, error: 'CSV file must have at least a header row and one data row' };
  }

  const headerRow = parseCSVLine(lines[0]);
  const requiredColumns = [
    'participant_id', 'start_time', 'bib_no', 'id_card_passport', 'last_name', 'first_name',
    'tshirt_size', 'birthday_year', 'nationality', 'phone', 'email', 'emergency_contact_name',
    'emergency_contact_phone', 'blood_type', 'medical_information', 'medicines_using',
    'parent_full_name', 'parent_date_of_birth', 'parent_email', 'parent_id_card_passport',
    'parent_relationship', 'full_name', 'name_on_bib'
  ];

  // Check if all required columns are present
  const missingColumns = requiredColumns.filter(col => !headerRow.includes(col));
  if (missingColumns.length > 0) {
    return { 
      isValid: false, 
      error: `Missing required columns: ${missingColumns.join(', ')}` 
    };
  }

  // Check if there are extra columns
  const extraColumns = headerRow.filter(col => !requiredColumns.includes(col));
  if (extraColumns.length > 0) {
    return { 
      isValid: false, 
      error: `Unexpected columns found: ${extraColumns.join(', ')}` 
    };
  }

  // Validate data rows
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length !== requiredColumns.length) {
      return { 
        isValid: false, 
        error: `Row ${i + 1} has ${row.length} columns, expected ${requiredColumns.length}` 
      };
    }
  }

  return { isValid: true, participantCount: lines.length - 1 };
}

// In-memory storage for events (in a real app, this would be a database)
// Use global to persist across Vite reloads
if (!globalThis.mockEvents) {
  globalThis.mockEvents = [
    {
      id: 1,
      event_name: 'Spring Marathon 2024',
      event_start_date: '2024-04-15',
      participant_count: 150,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      event_name: 'Summer 5K Run',
      event_start_date: '2024-06-20',
      participant_count: 75,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];
}

const events = globalThis.mockEvents;

export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    // Custom plugin to handle API routes
    {
      name: 'mock-api',
      configureServer(server) {
        server.middlewares.use('/api', (req, res, next) => {
          console.log('API Request:', req.method, req.url);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }
          
          if ((req.url?.includes('/api/auth/login') || req.url?.includes('/auth/login')) && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                if (data.user_name && data.password) {
                  const mockUser = { id: 1, user_name: data.user_name };
                  const mockToken = 'mock-jwt-token-' + Date.now();
                  
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(JSON.stringify({
                    success: true,
                    token: mockToken,
                    user: mockUser
                  }));
                } else {
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 400;
                  res.end(JSON.stringify({
                    success: false,
                    error: 'Username and password required'
                  }));
                }
              } catch (error) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
          
          if ((req.url?.includes('/api/events') || req.url?.includes('/events')) && req.method === 'GET' && !req.url.includes('/events/')) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(events));
            return;
          }
          
          if ((req.url?.includes('/api/events/') || req.url?.includes('/events/')) && req.method === 'GET') {
            // Extract event ID from URL path
            const urlParts = req.url.split('/');
            const eventId = urlParts[urlParts.length - 1]?.split('?')[0]; // Get last part and remove query params
            
            const event = events.find(e => e.id.toString() === eventId);
            
            if (event) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(event));
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Event not found', eventId }));
            }
            return;
          }
          
          if ((req.url?.includes('/api/events/test') || req.url?.includes('/events/test')) && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const { event_name, event_start_date, csv_content } = data;
                
                // Validate CSV file if provided
                if (csv_content) {
                  const validationResult = validateCSVStructure(csv_content);
                  
                  if (!validationResult.isValid) {
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 400;
                    res.end(JSON.stringify({
                      success: false,
                      error: `CSV validation failed: ${validationResult.error}`
                    }));
                    return;
                  }
                }

                const mockEvent = {
                  id: Date.now(),
                  event_name: event_name,
                  event_start_date: event_start_date,
                  participant_count: csv_content ? 150 : 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };

                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({
                  success: true,
                  eventId: mockEvent.id,
                  message: csv_content ? 'Event created with participants imported successfully' : 'Event created successfully'
                }));
              } catch (error) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: 'Failed to process event creation' }));
              }
            });
            return;
          }
          
          if ((req.url?.includes('/api/events') || req.url?.includes('/events')) && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                // Parse multipart form data
                const boundary = req.headers['content-type']?.split('boundary=')[1];
                if (!boundary) {
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, error: 'Invalid form data' }));
                  return;
                }

                const parts = body.split(`--${boundary}`);
                let eventName = '';
                let eventDate = '';
                let csvContent = '';
                let hasCSV = false;

                for (let i = 0; i < parts.length; i++) {
                  const part = parts[i];
                  
                  if (part.includes('name="event_name"')) {
                    const lines = part.split('\r\n');
                    eventName = lines[lines.length - 2] || '';
                  } else if (part.includes('name="event_start_date"')) {
                    const lines = part.split('\r\n');
                    eventDate = lines[lines.length - 2] || '';
                  } else if (part.includes('name="participants_file"')) {
                    const lines = part.split('\r\n');
                    
                    // Find the empty line that separates headers from content
                    let emptyLineIndex = -1;
                    for (let j = 0; j < lines.length; j++) {
                      if (lines[j].trim() === '') {
                        emptyLineIndex = j;
                        break;
                      }
                    }
                    
                    if (emptyLineIndex > 0 && emptyLineIndex < lines.length - 1) {
                      // Extract CSV content after the empty line, excluding the last boundary line
                      csvContent = lines.slice(emptyLineIndex + 1, -1).join('\r\n');
                      hasCSV = true;
                    } else {
                      // Try alternative parsing - look for content after Content-Type line
                      const contentTypeIndex = lines.findIndex(line => line.startsWith('Content-Type:'));
                      if (contentTypeIndex > 0 && contentTypeIndex < lines.length - 1) {
                        // Skip the empty line after Content-Type
                        const contentStart = contentTypeIndex + 2;
                        if (contentStart < lines.length - 1) {
                          csvContent = lines.slice(contentStart, -1).join('\r\n');
                          hasCSV = true;
                        }
                      }
                    }
                  }
                }

                // Validate CSV file if provided
                if (hasCSV && csvContent) {
                  const validationResult = validateCSVStructure(csvContent);
                  
                  if (!validationResult.isValid) {
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 400;
                    res.end(JSON.stringify({
                      success: false,
                      error: `CSV validation failed: ${validationResult.error}`
                    }));
                    return;
                  }
                }

                const newEvent = {
                  id: Date.now(),
                  event_name: eventName,
                  event_start_date: eventDate,
                  participant_count: hasCSV ? 150 : 0, // Mock participant count
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };

                // Add the new event to the events list
                events.push(newEvent);

                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({
                  success: true,
                  eventId: newEvent.id,
                  message: hasCSV ? 'Event created with participants imported successfully' : 'Event created successfully'
                }));
              } catch (error) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: 'Failed to process event creation' }));
              }
            });
            return;
          }
          
          if ((req.url?.includes('/api/participants/search') || req.url?.includes('/participants/search')) && req.method === 'GET') {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const query = url.searchParams.get('q') || '';
            const eventId = url.searchParams.get('event_id');
            
            // Find the event to get participant count
            const event = events.find(e => e.id.toString() === eventId);
            const participantCount = event ? event.participant_count || 0 : 0;
            
            // Generate mock participants based on event participant count
            const mockParticipants = [];
            const maxParticipants = Math.min(participantCount, 20); // Show max 20 participants for performance
            
            for (let i = 1; i <= maxParticipants; i++) {
              const isCheckedIn = Math.random() < 0.3; // 30% chance of being checked in
              mockParticipants.push({
                id: i,
                bib_no: `A${String(i).padStart(3, '0')}`,
                first_name: `Participant${i}`,
                last_name: 'Runner',
                phone: `+123456789${i}`,
                email: `participant${i}@example.com`,
                checkin_at: isCheckedIn ? new Date().toISOString() : null,
                checkin_by: isCheckedIn ? 'Staff Member' : null
              });
            }
            
            const filteredParticipants = query 
              ? mockParticipants.filter(p => 
                  p.bib_no.includes(query) ||
                  p.first_name.toLowerCase().includes(query.toLowerCase()) ||
                  p.last_name.toLowerCase().includes(query.toLowerCase()) ||
                  p.phone.includes(query) ||
                  p.email.toLowerCase().includes(query.toLowerCase())
                )
              : mockParticipants;
            
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(filteredParticipants));
            return;
          }
          
          if ((req.url?.includes('/api/participants/') || req.url?.includes('/participants/')) && req.method === 'GET' && !req.url.includes('/participants/search')) {
            const participantId = req.url.split('/')[3];
            const mockParticipant = {
              id: parseInt(participantId),
              event_id: 1,
              participant_id: 'P001',
              start_time: '08:00',
              bib_no: '001',
              id_card_passport: 'A1234567',
              last_name: 'Smith',
              first_name: 'John',
              tshirt_size: 'L',
              birthday_year: '1990',
              nationality: 'USA',
              phone: '+1234567890',
              email: 'john.smith@email.com',
              emergency_contact_name: 'Jane Smith',
              emergency_contact_phone: '+1234567891',
              blood_type: 'O+',
              medical_information: 'None',
              medicines_using: 'None',
              parent_full_name: '',
              parent_date_of_birth: '',
              parent_email: '',
              parent_id_card_passport: '',
              parent_relationship: '',
              full_name: 'John Smith',
              name_on_bib: 'J. Smith',
              signature: '',
              uploaded_image: '',
              checkin_at: '',
              checkin_by: '',
              note: '',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            };
            
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(mockParticipant));
            return;
          }
          
          if ((req.url?.includes('/api/checkin') || req.url?.includes('/checkin')) && req.method === 'POST') {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
            return;
          }
          
          if ((req.url?.includes('/api/stats') || req.url?.includes('/stats')) && req.method === 'GET') {
            // Parse event_id from query parameters
            const url = new URL(req.url, 'http://localhost');
            const eventId = url.searchParams.get('event_id');
            
            // Find the event to get participant count
            const event = events.find(e => e.id.toString() === eventId);
            const participantCount = event ? event.participant_count || 0 : 0;
            
            const mockStats = {
              total: participantCount,
              checked_in: Math.floor(participantCount * 0.3), // 30% checked in
              remaining: Math.floor(participantCount * 0.7), // 70% remaining
              event_id: eventId
            };
            
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(mockStats));
            return;
          }
          
          if ((req.url?.includes('/api/recent-checkins') || req.url?.includes('/recent-checkins')) && req.method === 'GET') {
            const mockRecentCheckIns = [
              {
                id: 2,
                event_id: 1,
                participant_id: 'P002',
                start_time: '08:15',
                bib_no: '002',
                id_card_passport: 'B2345678',
                last_name: 'Johnson',
                first_name: 'Sarah',
                tshirt_size: 'M',
                birthday_year: '1985',
                nationality: 'Canada',
                phone: '+1987654321',
                email: 'sarah.johnson@email.com',
                emergency_contact_name: 'Mike Johnson',
                emergency_contact_phone: '+1987654322',
                blood_type: 'A+',
                medical_information: 'Asthma',
                medicines_using: 'Inhaler',
                parent_full_name: '',
                parent_date_of_birth: '',
                parent_email: '',
                parent_id_card_passport: '',
                parent_relationship: '',
                full_name: 'Sarah Johnson',
                name_on_bib: 'S. Johnson',
                signature: 'mock-signature-data',
                uploaded_image: 'mock-image-data',
                checkin_at: '2024-04-15T08:30:00Z',
                checkin_by: 'Staff Member',
                note: '',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-04-15T08:30:00Z'
              }
            ];
            
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(mockRecentCheckIns));
            return;
          }
          
          // 404 for unknown routes
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Not found' }));
        });
      }
    }
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  optimizeDeps: {
    exclude: ["fsevents", "lightningcss"]
  },
  ssr: {
    noExternal: ["fsevents"]
  },
  define: {
    global: "globalThis",
  }
});
