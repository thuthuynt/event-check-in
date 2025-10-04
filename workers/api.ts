// API endpoints for Event Check-in System

export interface Participant {
  id: number;
  start_time: string;
  bib_no: string;
  id_card_passport: string;
  last_name: string;
  first_name: string;
  tshirt_size: string;
  birthday_year: number;
  nationality: string;
  phone: string;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_type: string;
  medical_information: string;
  medicines_using: string;
  parent_guardian_full_name: string;
  parent_guardian_dob: string;
  parent_guardian_email: string;
  parent_guardian_id_card: string;
  parent_guardian_relationship: string;
  full_name: string;
  name_on_bib: string;
  signature_url: string;
  uploaded_image_url: string;
  checkin_at: string;
  checkin_by: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  id: number;
  bib_no: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  checkin_at: string | null;
  checkin_by: string | null;
}

export interface CheckInData {
  participant_id: number;
  signature: string; // base64 image data
  photo: string; // base64 image data
  checkin_by: string;
  note?: string;
}

export class EventCheckInAPI {
  private db: D1Database;
  private r2: R2Bucket;

  constructor(db: D1Database, r2: R2Bucket) {
    this.db = db;
    this.r2 = r2;
  }

  // Search participants by various criteria
  async searchParticipants(query: string): Promise<SearchResult[]> {
    const searchTerm = `%${query}%`;
    
    const stmt = this.db.prepare(`
      SELECT id, bib_no, first_name, last_name, phone, email, checkin_at, checkin_by
      FROM participants 
      WHERE bib_no LIKE ? 
         OR first_name LIKE ? 
         OR last_name LIKE ? 
         OR phone LIKE ? 
         OR email LIKE ?
      ORDER BY last_name, first_name
      LIMIT 20
    `);

    const result = await stmt.bind(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm).all();
    return result.results as SearchResult[];
  }

  // Get participant details by ID
  async getParticipant(id: number): Promise<Participant | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM participants WHERE id = ?
    `);

    const result = await stmt.bind(id).first();
    return result as Participant | null;
  }

  // Get participant by bib number
  async getParticipantByBib(bibNo: string): Promise<Participant | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM participants WHERE bib_no = ?
    `);

    const result = await stmt.bind(bibNo).first();
    return result as Participant | null;
  }

  // Upload image to R2 storage
  async uploadImage(imageData: string, filename: string): Promise<string> {
    try {
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const key = `images/${Date.now()}-${filename}`;
      
      console.log('Uploading to R2:', { key, bufferSize: buffer.length });
      
      await this.r2.put(key, buffer, {
        httpMetadata: {
          contentType: imageData.includes('png') ? 'image/png' : 'image/jpeg',
        },
      });

      console.log('R2 upload successful:', key);
      return key;
    } catch (error) {
      console.error('R2 upload error:', error);
      throw error;
    }
  }

  // Check in a participant
  async checkInParticipant(data: CheckInData): Promise<boolean> {
    try {
      console.log('Starting check-in process for participant:', data.participant_id);
      
      let signatureKey = '';
      let photoKey = '';
      
      // Try to upload to R2, fallback to storing base64 in database
      try {
        console.log('Uploading signature to R2...');
        signatureKey = await this.uploadImage(data.signature, `signature-${data.participant_id}.png`);
        console.log('Signature uploaded to R2:', signatureKey);
      } catch (r2Error) {
        console.warn('R2 upload failed for signature, storing in database:', r2Error.message);
        signatureKey = data.signature; // Store base64 directly
      }
      
      try {
        console.log('Uploading photo to R2...');
        photoKey = await this.uploadImage(data.photo, `photo-${data.participant_id}.jpg`);
        console.log('Photo uploaded to R2:', photoKey);
      } catch (r2Error) {
        console.warn('R2 upload failed for photo, storing in database:', r2Error.message);
        photoKey = data.photo; // Store base64 directly
      }

      console.log('Updating database...');
      // Update participant record
      const stmt = this.db.prepare(`
        UPDATE participants 
        SET signature_url = ?, 
            uploaded_image_url = ?, 
            checkin_at = datetime('now'), 
            checkin_by = ?, 
            note = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `);

      const result = await stmt.bind(
        signatureKey,
        photoKey,
        data.checkin_by,
        data.note || '',
        data.participant_id
      ).run();

      console.log('Database update result:', result);
      return result.changes > 0;
    } catch (error) {
      console.error('Error checking in participant:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        participant_id: data.participant_id
      });
      return false;
    }
  }

  // Get check-in statistics
  async getCheckInStats(): Promise<{ total: number; checked_in: number; remaining: number }> {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as total FROM participants');
    const checkedInStmt = this.db.prepare('SELECT COUNT(*) as checked_in FROM participants WHERE checkin_at IS NOT NULL');

    const [totalResult, checkedInResult] = await Promise.all([
      totalStmt.first(),
      checkedInStmt.first()
    ]);

    const total = (totalResult as any).total;
    const checked_in = (checkedInResult as any).checked_in;
    const remaining = total - checked_in;

    return { total, checked_in, remaining };
  }

  // Get recent check-ins
  async getRecentCheckIns(limit: number = 10): Promise<Participant[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM participants 
      WHERE checkin_at IS NOT NULL 
      ORDER BY checkin_at DESC 
      LIMIT ?
    `);

    const result = await stmt.bind(limit).all();
    return result.results as Participant[];
  }
}

// API route handlers
export async function handleAPIRequest(request: Request, db: D1Database, r2: R2Bucket): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const api = new EventCheckInAPI(db, r2);

  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Search participants
    if (path === '/api/search' && method === 'GET') {
      const query = url.searchParams.get('q') || '';
      const results = await api.searchParticipants(query);
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get participant by ID
    if (path.startsWith('/api/participant/') && method === 'GET') {
      const id = parseInt(path.split('/')[3]);
      const participant = await api.getParticipant(id);
      
      if (!participant) {
        return new Response(JSON.stringify({ error: 'Participant not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(participant), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get participant by bib number
    if (path.startsWith('/api/participant/bib/') && method === 'GET') {
      const bibNo = path.split('/')[4];
      const participant = await api.getParticipantByBib(bibNo);
      
      if (!participant) {
        return new Response(JSON.stringify({ error: 'Participant not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(participant), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check in participant
    if (path === '/api/checkin' && method === 'POST') {
      const data: CheckInData = await request.json();
      const success = await api.checkInParticipant(data);
      
      return new Response(JSON.stringify({ success }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get check-in statistics
    if (path === '/api/stats' && method === 'GET') {
      const stats = await api.getCheckInStats();
      return new Response(JSON.stringify(stats), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get recent check-ins
    if (path === '/api/recent-checkins' && method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const recent = await api.getRecentCheckIns(limit);
      return new Response(JSON.stringify(recent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
