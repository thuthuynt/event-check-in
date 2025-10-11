import EventSelection from '../components/EventSelection';
import ProtectedRoute from '../components/ProtectedRoute';

export default function EventsRoute() {
  return (
    <ProtectedRoute>
      <EventSelection />
    </ProtectedRoute>
  );
}
