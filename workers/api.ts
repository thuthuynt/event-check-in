// Multi-Event Running Check-in System API

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Interfaces
export interface User {
  id: number;
  user_name: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: number;
  user_id: number;
  event_name: string;
  event_start_date: string;
  created_at: string;
  updated_at: string;
  participant_count?: number;
}

export interface Participant {
  id: number;
  event_id: number;
  participant_id: string;
  start_time: string;
  bib_no: string;
  id_card_passport: string;
  last_name: string;
  first_name: string;
  tshirt_size: string;
  birthday_year: string;
  nationality: string;
  phone: string;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_type: string;
  medical_information: string;
  medicines_using: string;
  parent_full_name: string;
  parent_date_of_birth: string;
  parent_email: string;
  parent_id_card_passport: string;
  parent_relationship: string;
  full_name: string;
  name_on_bib: string;
  signature: string;
  uploaded_image: string;
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

export interface LoginData {
  user_name: string;
  password: string;
}

export interface CreateEventData {
  event_name: string;
  event_start_date: string;
  participants_file?: File;
}

export class MultiEventCheckInAPI {
  private db: D1Database;
  private r2: R2Bucket;
  private jwtSecret: string;

  constructor(db: D1Database, r2: R2Bucket, jwtSecret?: string) {
    this.db = db;
    this.r2 = r2;
    this.jwtSecret = jwtSecret || 'your-secret-key-change-in-production';
  }

  // Authentication methods
  async authenticateUser(loginData: LoginData): Promise<{ success: boolean; token?: string; user?: User }> {
    try {
      const stmt = this.db.prepare('SELECT * FROM users WHERE user_name = ?');
      const user = await stmt.bind(loginData.user_name).first() as User;
      
      if (!user) {
        return { success: false };
      }

      const isValidPassword = await bcrypt.compare(loginData.password, user.password_hash);
      if (!isValidPassword) {
        return { success: false };
      }

      const token = jwt.sign(
        { userId: user.id, userName: user.user_name },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      return { success: true, token, user };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false };
    }
  }

  async verifyToken(token: string): Promise<{ valid: boolean; userId?: number; userName?: string }> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return { valid: true, userId: decoded.userId, userName: decoded.userName };
    } catch (error) {
      return { valid: false };
    }
  }

  // Event management methods
  async getUserEvents(userId: number): Promise<Event[]> {
    const stmt = this.db.prepare(`
      SELECT e.*, COUNT(p.id) as participant_count
      FROM events e
      LEFT JOIN participants p ON e.id = p.event_id
      WHERE e.user_id = ?
      GROUP BY e.id
      ORDER BY e.event_start_date DESC
    `);
    
    const result = await stmt.bind(userId).all();
    return result.results as Event[];
  }

  async createEvent(userId: number, eventData: CreateEventData): Promise<{ success: boolean; eventId?: number; error?: string }> {
    try {
      // Insert event
      const eventStmt = this.db.prepare(`
        INSERT INTO events (user_id, event_name, event_start_date)
        VALUES (?, ?, ?)
      `);
      
      const eventResult = await eventStmt.bind(
        userId,
        eventData.event_name,
        eventData.event_start_date
      ).run();

      const eventId = eventResult.meta.last_row_id;

      // If participants file is provided, parse and insert participants
      if (eventData.participants_file) {
        const participants = await this.parseParticipantsFile(eventData.participants_file);
        await this.bulkInsertParticipants(eventId, participants);
      }

      return { success: true, eventId };
    } catch (error) {
      console.error('Error creating event:', error);
      return { success: false, error: error.message };
    }
  }

  async getEvent(eventId: number, userId: number): Promise<Event | null> {
    const stmt = this.db.prepare(`
      SELECT e.*, COUNT(p.id) as participant_count
      FROM events e
      LEFT JOIN participants p ON e.id = p.event_id
      WHERE e.id = ? AND e.user_id = ?
      GROUP BY e.id
    `);
    
    const result = await stmt.bind(eventId, userId).first();
    return result as Event | null;
  }

  // Participant management methods
  async searchParticipants(eventId: number, query: string): Promise<SearchResult[]> {
    const searchTerm = `%${query}%`;
    
    const stmt = this.db.prepare(`
      SELECT id, bib_no, first_name, last_name, phone, email, checkin_at, checkin_by
      FROM participants 
      WHERE event_id = ? AND (
        bib_no LIKE ? 
         OR first_name LIKE ? 
         OR last_name LIKE ? 
         OR phone LIKE ? 
         OR email LIKE ?
        OR id_card_passport LIKE ?
      )
      ORDER BY last_name, first_name
      LIMIT 20
    `);

    const result = await stmt.bind(eventId, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm).all();
    return result.results as SearchResult[];
  }

  async getParticipant(participantId: number, eventId: number): Promise<Participant | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM participants WHERE id = ? AND event_id = ?
    `);

    const result = await stmt.bind(participantId, eventId).first();
    return result as Participant | null;
  }

  async getParticipantByBib(eventId: number, bibNo: string): Promise<Participant | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM participants WHERE event_id = ? AND bib_no = ?
    `);

    const result = await stmt.bind(eventId, bibNo).first();
    return result as Participant | null;
  }

  // File parsing methods
  async parseParticipantsFile(file: File): Promise<Partial<Participant>[]> {
    const fileContent = await file.text();
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      return this.parseCSV(fileContent);
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      return this.parseExcel(fileContent);
    } else {
      throw new Error('Unsupported file format. Please use CSV or Excel files.');
    }
  }

  private parseCSV(content: string): Partial<Participant>[] {
    const result = Papa.parse(content, { header: true, skipEmptyLines: true });
    
    if (result.errors.length > 0) {
      throw new Error(`CSV parsing error: ${result.errors[0].message}`);
    }

    return result.data.map((row: any) => ({
      participant_id: row.participant_id || '',
      start_time: row.start_time || '',
      bib_no: row.bib_no || '',
      id_card_passport: row.id_card_passport || '',
      last_name: row.last_name || '',
      first_name: row.first_name || '',
      tshirt_size: row.tshirt_size || '',
      birthday_year: row.birthday_year || '',
      nationality: row.nationality || '',
      phone: row.phone || '',
      email: row.email || '',
      emergency_contact_name: row.emergency_contact_name || '',
      emergency_contact_phone: row.emergency_contact_phone || '',
      blood_type: row.blood_type || '',
      medical_information: row.medical_information || '',
      medicines_using: row.medicines_using || '',
      parent_full_name: row.parent_full_name || '',
      parent_date_of_birth: row.parent_date_of_birth || '',
      parent_email: row.parent_email || '',
      parent_id_card_passport: row.parent_id_card_passport || '',
      parent_relationship: row.parent_relationship || '',
      full_name: row.full_name || `${row.first_name} ${row.last_name}`.trim(),
      name_on_bib: row.name_on_bib || `${row.first_name} ${row.last_name}`.trim(),
    }));
  }

  private parseExcel(content: string): Partial<Participant>[] {
    const workbook = XLSX.read(content, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    return jsonData.map((row: any) => ({
      participant_id: row.participant_id || '',
      start_time: row.start_time || '',
      bib_no: row.bib_no || '',
      id_card_passport: row.id_card_passport || '',
      last_name: row.last_name || '',
      first_name: row.first_name || '',
      tshirt_size: row.tshirt_size || '',
      birthday_year: row.birthday_year || '',
      nationality: row.nationality || '',
      phone: row.phone || '',
      email: row.email || '',
      emergency_contact_name: row.emergency_contact_name || '',
      emergency_contact_phone: row.emergency_contact_phone || '',
      blood_type: row.blood_type || '',
      medical_information: row.medical_information || '',
      medicines_using: row.medicines_using || '',
      parent_full_name: row.parent_full_name || '',
      parent_date_of_birth: row.parent_date_of_birth || '',
      parent_email: row.parent_email || '',
      parent_id_card_passport: row.parent_id_card_passport || '',
      parent_relationship: row.parent_relationship || '',
      full_name: row.full_name || `${row.first_name} ${row.last_name}`.trim(),
      name_on_bib: row.name_on_bib || `${row.first_name} ${row.last_name}`.trim(),
    }));
  }

  async bulkInsertParticipants(eventId: number, participants: Partial<Participant>[]): Promise<{ success: boolean; inserted: number; errors: string[] }> {
    const errors: string[] = [];
    let inserted = 0;

    for (const participant of participants) {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO participants (
            event_id, participant_id, start_time, bib_no, id_card_passport,
            last_name, first_name, tshirt_size, birthday_year, nationality,
            phone, email, emergency_contact_name, emergency_contact_phone,
            blood_type, medical_information, medicines_using, parent_full_name,
            parent_date_of_birth, parent_email, parent_id_card_passport,
            parent_relationship, full_name, name_on_bib
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        await stmt.bind(
          eventId,
          participant.participant_id || '',
          participant.start_time || '',
          participant.bib_no || '',
          participant.id_card_passport || '',
          participant.last_name || '',
          participant.first_name || '',
          participant.tshirt_size || '',
          participant.birthday_year || '',
          participant.nationality || '',
          participant.phone || '',
          participant.email || '',
          participant.emergency_contact_name || '',
          participant.emergency_contact_phone || '',
          participant.blood_type || '',
          participant.medical_information || '',
          participant.medicines_using || '',
          participant.parent_full_name || '',
          participant.parent_date_of_birth || '',
          participant.parent_email || '',
          participant.parent_id_card_passport || '',
          participant.parent_relationship || '',
          participant.full_name || '',
          participant.name_on_bib || ''
        ).run();

        inserted++;
      } catch (error) {
        errors.push(`Error inserting participant ${participant.bib_no || participant.full_name}: ${error.message}`);
      }
    }

    return { success: errors.length === 0, inserted, errors };
  }

  // R2 Storage methods
  async uploadImage(imageData: string, filename: string): Promise<string> {
    try {
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const key = `images/${Date.now()}-${filename}`;
      
      await this.r2.put(key, buffer, {
        httpMetadata: {
          contentType: imageData.includes('png') ? 'image/png' : 'image/jpeg',
        },
      });

      // Return the R2 public URL (you'll need to configure this in your R2 bucket settings)
      return `https://event-check-in-storage.your-account.r2.cloudflarestorage.com/${key}`;
    } catch (error) {
      console.error('R2 upload error:', error);
      throw error;
    }
  }

  // Check-in methods
  async checkInParticipant(data: CheckInData): Promise<boolean> {
    try {
      let signatureKey = '';
      let photoKey = '';
      
      // Upload to R2, fallback to storing base64 in database
      try {
        signatureKey = await this.uploadImage(data.signature, `signature-${data.participant_id}.png`);
      } catch (r2Error) {
        console.warn('R2 upload failed for signature, storing in database');
        signatureKey = data.signature;
      }
      
      try {
        photoKey = await this.uploadImage(data.photo, `photo-${data.participant_id}.jpg`);
      } catch (r2Error) {
        console.warn('R2 upload failed for photo, storing in database');
        photoKey = data.photo;
      }

      // Update participant record
      const stmt = this.db.prepare(`
        UPDATE participants 
        SET signature = ?, 
            uploaded_image = ?, 
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

      return result.changes > 0;
    } catch (error) {
      console.error('Error checking in participant:', error);
      return false;
    }
  }

  // Statistics methods
  async getEventStats(eventId: number): Promise<{ total: number; checked_in: number; remaining: number }> {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as total FROM participants WHERE event_id = ?');
    const checkedInStmt = this.db.prepare('SELECT COUNT(*) as checked_in FROM participants WHERE event_id = ? AND checkin_at IS NOT NULL');

    const [totalResult, checkedInResult] = await Promise.all([
      totalStmt.bind(eventId).first(),
      checkedInStmt.bind(eventId).first()
    ]);

    const total = (totalResult as any).total;
    const checked_in = (checkedInResult as any).checked_in;
    const remaining = total - checked_in;

    return { total, checked_in, remaining };
  }

  async getRecentCheckIns(eventId: number, limit: number = 10): Promise<Participant[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM participants 
      WHERE event_id = ? AND checkin_at IS NOT NULL 
      ORDER BY checkin_at DESC 
      LIMIT ?
    `);

    const result = await stmt.bind(eventId, limit).all();
    return result.results as Participant[];
  }
}

// API route handlers
export async function handleAPIRequest(request: Request, db: D1Database, r2: R2Bucket, jwtSecret?: string): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const api = new MultiEventCheckInAPI(db, r2, jwtSecret);

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

  try {
    // Authentication endpoints
    if (path === '/api/auth/login' && method === 'POST') {
      const loginData: LoginData = await request.json();
      const result = await api.authenticateUser(loginData);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Event management endpoints
    if (path === '/api/events' && method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Authorization required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const auth = await api.verifyToken(token);
      
      if (!auth.valid) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const events = await api.getUserEvents(auth.userId!);
      return new Response(JSON.stringify(events), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (path === '/api/events' && method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Authorization required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const auth = await api.verifyToken(token);
      
      if (!auth.valid) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const formData = await request.formData();
      const eventData: CreateEventData = {
        event_name: formData.get('event_name') as string,
        event_start_date: formData.get('event_start_date') as string,
        participants_file: formData.get('participants_file') as File || undefined
      };

      const result = await api.createEvent(auth.userId!, eventData);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Participant search (requires event_id parameter)
    if (path === '/api/participants/search' && method === 'GET') {
      const eventId = parseInt(url.searchParams.get('event_id') || '0');
      const query = url.searchParams.get('q') || '';
      
      if (!eventId) {
        return new Response(JSON.stringify({ error: 'event_id parameter required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const results = await api.searchParticipants(eventId, query);
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get participant by ID
    if (path.startsWith('/api/participants/') && method === 'GET') {
      const id = parseInt(path.split('/')[3]);
      const eventId = parseInt(url.searchParams.get('event_id') || '0');
      
      if (!eventId) {
        return new Response(JSON.stringify({ error: 'event_id parameter required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const participant = await api.getParticipant(id, eventId);
      
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

    // Get event statistics
    if (path === '/api/stats' && method === 'GET') {
      const eventId = parseInt(url.searchParams.get('event_id') || '0');
      
      if (!eventId) {
        return new Response(JSON.stringify({ error: 'event_id parameter required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const stats = await api.getEventStats(eventId);
      return new Response(JSON.stringify(stats), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get recent check-ins
    if (path === '/api/recent-checkins' && method === 'GET') {
      const eventId = parseInt(url.searchParams.get('event_id') || '0');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      
      if (!eventId) {
        return new Response(JSON.stringify({ error: 'event_id parameter required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const recent = await api.getRecentCheckIns(eventId, limit);
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