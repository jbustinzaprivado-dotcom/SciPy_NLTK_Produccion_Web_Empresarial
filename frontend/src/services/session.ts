// Presentation hint only: protected API endpoints still verify the JWT signature.
export function hasActiveSession(token: string | null, now = Date.now()): boolean {
  if (!token) return false;
  try {
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(encoded));
    return typeof payload.exp === 'number' && payload.exp * 1000 > now;
  } catch { return false; }
}
