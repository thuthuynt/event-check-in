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

interface ParticipantDetailsProps {
  participant: Participant;
  onStartCheckIn: () => void;
}

export function ParticipantDetails({ participant, onStartCheckIn }: ParticipantDetailsProps) {
  const isCheckedIn = !!participant.checkin_at;

  const formatTime = (timeString: string) => {
    if (!timeString) return "Not set";
    return new Date(timeString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {participant.first_name} {participant.last_name}
          </h3>
          <p className="text-sm text-gray-500">Bib #{participant.bib_no}</p>
        </div>
        <div className="text-right">
          {isCheckedIn ? (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              ✓ Checked In
            </div>
          ) : (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              Pending Check-in
            </div>
          )}
        </div>
      </div>

      {/* Check-in Status */}
      {isCheckedIn && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">Already Checked In</h4>
              <p className="text-sm text-green-700">
                Checked in at {formatTime(participant.checkin_at)} by {participant.checkin_by}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Participant Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
          <dl className="space-y-2">
            <div>
              <dt className="text-xs text-gray-500">Start Time</dt>
              <dd className="text-sm text-gray-900">{participant.start_time || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">T-Shirt Size</dt>
              <dd className="text-sm text-gray-900">{participant.tshirt_size || "Not specified"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Birth Year</dt>
              <dd className="text-sm text-gray-900">{participant.birthday_year || "Not specified"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Nationality</dt>
              <dd className="text-sm text-gray-900">{participant.nationality || "Not specified"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Blood Type</dt>
              <dd className="text-sm text-gray-900">{participant.blood_type || "Not specified"}</dd>
            </div>
          </dl>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
          <dl className="space-y-2">
            <div>
              <dt className="text-xs text-gray-500">Phone</dt>
              <dd className="text-sm text-gray-900">{participant.phone || "Not provided"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Email</dt>
              <dd className="text-sm text-gray-900">{participant.email || "Not provided"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">ID/Passport</dt>
              <dd className="text-sm text-gray-900">{participant.id_card_passport || "Not provided"}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Emergency Contact */}
      {participant.emergency_contact_name && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Emergency Contact</h4>
          <dl className="space-y-2">
            <div>
              <dt className="text-xs text-gray-500">Name</dt>
              <dd className="text-sm text-gray-900">{participant.emergency_contact_name}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Phone</dt>
              <dd className="text-sm text-gray-900">{participant.emergency_contact_phone || "Not provided"}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Medical Information */}
      {(participant.medical_information || participant.medicines_using) && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Medical Information</h4>
          <dl className="space-y-2">
            {participant.medical_information && (
              <div>
                <dt className="text-xs text-gray-500">Medical Conditions</dt>
                <dd className="text-sm text-gray-900">{participant.medical_information}</dd>
              </div>
            )}
            {participant.medicines_using && (
              <div>
                <dt className="text-xs text-gray-500">Medications</dt>
                <dd className="text-sm text-gray-900">{participant.medicines_using}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Parent/Guardian Information */}
      {participant.parent_guardian_full_name && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Parent/Guardian</h4>
          <dl className="space-y-2">
            <div>
              <dt className="text-xs text-gray-500">Name</dt>
              <dd className="text-sm text-gray-900">{participant.parent_guardian_full_name}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Relationship</dt>
              <dd className="text-sm text-gray-900">{participant.parent_guardian_relationship || "Not specified"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Email</dt>
              <dd className="text-sm text-gray-900">{participant.parent_guardian_email || "Not provided"}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Check-in Note */}
      {participant.note && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Check-in Note</h4>
          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{participant.note}</p>
        </div>
      )}

      {/* Action Button */}
      {!isCheckedIn && (
        <div className="pt-4 border-t">
          <button
            onClick={onStartCheckIn}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Start Check-in Process
          </button>
        </div>
      )}

      {isCheckedIn && (
        <div className="pt-4 border-t">
          <div className="text-center text-sm text-gray-500">
            This participant has already been checked in
          </div>
        </div>
      )}
    </div>
  );
}
