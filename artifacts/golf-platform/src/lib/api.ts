// Auth is now handled via httpOnly cookies; headers are intentionally empty.
export function getAuthHeaders(): Record<string, string> {
  return {};
}
