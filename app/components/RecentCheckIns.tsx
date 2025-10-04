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

interface RecentCheckInsProps {
  participants: Participant[];
}

export function RecentCheckIns({ participants }: RecentCheckInsProps) {
  const formatTime = (timeString: string) => {
    if (!timeString) return "Unknown";
    return new Date(timeString).toLocaleString();
  };

  const getTimeAgo = (timeString: string) => {
    if (!timeString) return "Unknown";
    const now = new Date();
    const checkinTime = new Date(timeString);
    const diffInMinutes = Math.floor((now.getTime() - checkinTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
      {participants.map((participant) => (
        <div key={participant.id} className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">
                    {participant.bib_no}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {participant.first_name} {participant.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  Bib #{participant.bib_no} • {participant.phone}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-gray-500">
                {getTimeAgo(participant.checkin_at)}
              </p>
              <p className="text-xs text-gray-400">
                {formatTime(participant.checkin_at)}
              </p>
            </div>
          </div>
          
          {participant.note && (
            <div className="mt-2 pl-13">
              <p className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 inline-block">
                Note: {participant.note}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
