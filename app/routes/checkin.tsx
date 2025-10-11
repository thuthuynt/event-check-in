import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { SearchComponent } from '~/components/SearchComponent';
import { ParticipantDetails } from '~/components/ParticipantDetails';
import { CheckInProcess } from '~/components/CheckInProcess';
import { StatsPanel } from '~/components/StatsPanel';
import ProtectedRoute from '~/components/ProtectedRoute';

interface SearchResult {
  id: number;
  bib_no: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  checkin_at: string | null;
  checkin_by: string | null;
}

interface Participant {
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

interface Stats {
  total: number;
  checked_in: number;
  remaining: number;
}

interface Event {
  id: number;
  event_name: string;
  event_start_date: string;
  participant_count: number;
}

export default function CheckInRoute() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [allParticipants, setAllParticipants] = useState<SearchResult[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [stats, setStats] = useState<Stats>({ total: 0, checked_in: 0, remaining: 0 });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  
  const participantsPerPage = 10;

  useEffect(() => {
    if (eventId) {
      loadEventDetails();
      loadStats();
      loadAllParticipants();
    }
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const eventData = await response.json();
        setEvent(eventData);
      } else {
        setError('Failed to load event details');
      }
    } catch (err) {
      setError('Failed to load event details');
      console.error('Error loading event:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/stats?event_id=${eventId}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAllParticipants = async () => {
    try {
      const response = await fetch(`/api/participants/search?event_id=${eventId}&q=`);
      const data = await response.json();
      setAllParticipants(data);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setLoading(true);
    try {
      const response = await fetch(`/api/participants/search?event_id=${eventId}&q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching participants:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectParticipant = async (participantId: number) => {
    try {
      const response = await fetch(`/api/participants/${participantId}?event_id=${eventId}`);
      const data = await response.json();
      setSelectedParticipant(data);
      setShowCheckIn(false);
    } catch (error) {
      console.error('Error loading participant details:', error);
    }
  };

  const handleStartCheckIn = () => {
    setShowCheckIn(true);
  };

  const handleCheckInComplete = () => {
    setShowCheckIn(false);
    setSelectedParticipant(null);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    loadStats(); // Refresh stats
    loadAllParticipants(); // Refresh participant list
  };

  // Get current participants to display
  const getCurrentParticipants = () => {
    if (isSearching) {
      return searchResults;
    }
    return allParticipants;
  };

  // Pagination logic
  const totalParticipants = getCurrentParticipants().length;
  const totalPages = Math.ceil(totalParticipants / participantsPerPage);
  const startIndex = (currentPage - 1) * participantsPerPage;
  const endIndex = startIndex + participantsPerPage;
  const currentParticipants = getCurrentParticipants().slice(startIndex, endIndex);

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/events')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Back to Events
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {event?.event_name || 'Loading...'}
                </h1>
                <p className="text-sm text-gray-600">
                  {event?.event_start_date ? new Date(event.event_start_date).toLocaleDateString() : ''}
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate(`/stats/${eventId}`)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-medium">Stats</span>
                </button>
                <button
                  onClick={() => navigate('/events')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Back to Events
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Stats Panel */}
          <div className="mb-6">
            <StatsPanel stats={stats} />
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Search Participants</h2>
            <SearchComponent
              onSearch={handleSearch}
              searchResults={[]}
              onSelectParticipant={handleSelectParticipant}
              loading={loading}
            />
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Participants List */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 sm:p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {isSearching ? 'Search Results' : 'All Participants'}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-96 sm:max-h-[500px] overflow-y-auto">
                {currentParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSelectParticipant(participant.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {participant.bib_no}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {participant.first_name} {participant.last_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {participant.phone} • ID: {participant.id}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        {participant.checkin_at ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Checked In
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {currentParticipants.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🏃‍♂️</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No participants found</h3>
                    <p className="text-gray-500">
                      {isSearching ? 'Try a different search term' : 'No participants available'}
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 sm:px-6 py-3 border-t bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {startIndex + 1} to {Math.min(endIndex, totalParticipants)} of {totalParticipants} participants
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Participant Details / Check-in Panel */}
            <div className="bg-white rounded-lg shadow-sm border">
              {selectedParticipant && !showCheckIn && (
                <ParticipantDetails
                  participant={selectedParticipant}
                  onStartCheckIn={handleStartCheckIn}
                />
              )}
              
              {selectedParticipant && showCheckIn && (
                <CheckInProcess
                  participant={selectedParticipant}
                  onComplete={handleCheckInComplete}
                  onCancel={() => setShowCheckIn(false)}
                />
              )}

              {!selectedParticipant && (
                <div className="p-6 text-center text-gray-500">
                  <div className="text-4xl mb-4">👆</div>
                  <h3 className="text-lg font-medium mb-2">Select a participant</h3>
                  <p className="text-sm">Choose a participant from the list to view details and begin check-in</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
