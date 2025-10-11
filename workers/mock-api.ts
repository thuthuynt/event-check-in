// Mock API for local development
export async function handleMockAPIRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

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

  // Mock responses for local development
  if (path === '/api/auth/login' && method === 'POST') {
    const mockResponse = {
      success: true,
      token: 'mock-jwt-token',
      user: {
        id: 1,
        user_name: 'admin',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    };
    
    return new Response(JSON.stringify(mockResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path === '/api/events' && method === 'GET') {
    const mockEvents = [
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
    
    return new Response(JSON.stringify(mockEvents), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path.startsWith('/api/events/') && method === 'GET') {
    const eventId = path.split('/')[3];
    const mockEvent = {
      id: parseInt(eventId),
      event_name: 'Mock Event',
      event_start_date: '2024-04-15',
      participant_count: 100,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };
    
    return new Response(JSON.stringify(mockEvent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path === '/api/stats' && method === 'GET') {
    const eventId = url.searchParams.get('event_id');
    const mockStats = {
      total: 100,
      checked_in: 30,
      remaining: 70,
      event_id: eventId
    };
    
    return new Response(JSON.stringify(mockStats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path === '/api/participants/search' && method === 'GET') {
    const query = url.searchParams.get('q') || '';
    const mockParticipants = [
      {
        id: 1,
        bib_no: '001',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        email: 'john.doe@example.com',
        checkin_at: null,
        checkin_by: null
      },
      {
        id: 2,
        bib_no: '002',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+1234567891',
        email: 'jane.smith@example.com',
        checkin_at: '2024-04-15T08:30:00Z',
        checkin_by: 'Staff Member'
      }
    ];
    
    const filteredParticipants = query 
      ? mockParticipants.filter(p => 
          p.bib_no.includes(query) ||
          p.first_name.toLowerCase().includes(query.toLowerCase()) ||
          p.last_name.toLowerCase().includes(query.toLowerCase()) ||
          p.phone.includes(query) ||
          p.email.toLowerCase().includes(query.toLowerCase())
        )
      : mockParticipants;
    
    return new Response(JSON.stringify(filteredParticipants), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path.startsWith('/api/participants/') && method === 'GET') {
    const mockParticipant = {
      id: 1,
      event_id: 1,
      participant_id: 'P001',
      start_time: '08:00',
      bib_no: '001',
      id_card_passport: 'A1234567',
      last_name: 'Doe',
      first_name: 'John',
      tshirt_size: 'L',
      birthday_year: '1990',
      nationality: 'USA',
      phone: '+1234567890',
      email: 'john.doe@example.com',
      emergency_contact_name: 'Jane Doe',
      emergency_contact_phone: '+1234567891',
      blood_type: 'O+',
      medical_information: 'None',
      medicines_using: 'None',
      parent_full_name: '',
      parent_date_of_birth: '',
      parent_email: '',
      parent_id_card_passport: '',
      parent_relationship: '',
      full_name: 'John Doe',
      name_on_bib: 'J. Doe',
      signature: '',
      uploaded_image: '',
      checkin_at: '',
      checkin_by: '',
      note: '',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };
    
    return new Response(JSON.stringify(mockParticipant), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path === '/api/checkin' && method === 'POST') {
    const mockResponse = { success: true };
    
    return new Response(JSON.stringify(mockResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path === '/api/recent-checkins' && method === 'GET') {
    const mockRecent = [
      {
        id: 1,
        participant_name: 'John Doe',
        bib_no: '001',
        checkin_at: '2024-04-15T08:30:00Z',
        checkin_by: 'Staff Member'
      }
    ];
    
    return new Response(JSON.stringify(mockRecent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 404 for unknown routes
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}