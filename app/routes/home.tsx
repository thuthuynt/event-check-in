import type { Route } from "./+types/home";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Event Check-in System" },
    { name: "description", content: "Professional event check-in system for running events" },
  ];
}

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      // User is authenticated, redirect to events
      navigate('/events');
    } else {
      // User is not authenticated, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}