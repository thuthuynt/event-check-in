import type { Route } from "./+types/stats";
import { useState, useEffect } from "react";
import { StatsPanel } from "~/components/StatsPanel";
import { RecentCheckIns } from "~/components/RecentCheckIns";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Event Statistics - Check-in System" },
    { name: "description", content: "Event check-in statistics and analytics" },
  ];
}

interface Stats {
  total: number;
  checked_in: number;
  remaining: number;
}

interface Participant {
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

export default function Stats() {
  const [stats, setStats] = useState<Stats>({ total: 0, checked_in: 0, remaining: 0 });
  const [recentCheckIns, setRecentCheckIns] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadRecentCheckIns();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentCheckIns = async () => {
    try {
      const response = await fetch('/api/recent-checkins?limit=20');
      const data = await response.json();
      setRecentCheckIns(data);
    } catch (error) {
      console.error('Error loading recent check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    setLoading(true);
    loadStats();
    loadRecentCheckIns();
  };

  const checkInPercentage = stats.total > 0 ? Math.round((stats.checked_in / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Event Statistics</h1>
            </div>
            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
          <StatsPanel stats={stats} />
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Check-in Progress</span>
              <span>{checkInPercentage}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${checkInPercentage}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{stats.checked_in}</div>
                <div className="text-sm text-green-700">Completed</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">{stats.remaining}</div>
                <div className="text-sm text-orange-700">Pending</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Check-ins */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Check-ins</h2>
            <p className="text-sm text-gray-600 mt-1">Latest participants who have checked in</p>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading recent check-ins...</p>
            </div>
          ) : recentCheckIns.length > 0 ? (
            <RecentCheckIns participants={recentCheckIns} />
          ) : (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium mb-2">No check-ins yet</h3>
              <p>Check-ins will appear here once participants start arriving</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
