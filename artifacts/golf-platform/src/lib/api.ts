const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Auth is handled via httpOnly cookies
export function getAuthHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
  };
}

export { API_BASE };
