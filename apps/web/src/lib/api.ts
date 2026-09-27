const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/** Retrieve the stored JWT token from localStorage */
function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('rehab_token');
  }
  return null;
}

function getAuthHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Check if a JWT token is expired.
 * Returns true if expired or malformed.
 */
export function isTokenExpired(token: string): boolean {
  if (typeof window === 'undefined') return false; // SSR guard — atob not available in Node.js
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds; Date.now() is in ms
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * Check current token validity and clear if expired.
 * Returns true if user should be redirected to login.
 */
export function checkTokenAndRedirect(): boolean {
  const token = getToken();
  if (!token) return true;
  if (isTokenExpired(token)) {
    localStorage.removeItem('rehab_token');
    localStorage.removeItem('rehab_user');
    localStorage.removeItem('rehab_role');
    return true;
  }
  return false;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Pre-flight token expiry check (skip for auth endpoints)
  if (!endpoint.startsWith('/auth')) {
    const token = getToken();
    if (token && isTokenExpired(token)) {
      // Clear stale auth data
      localStorage.removeItem('rehab_token');
      localStorage.removeItem('rehab_user');
      localStorage.removeItem('rehab_role');
      // Dispatch a custom event so AuthContext / UI can react
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rehabsense:token-expired'));
      }
      throw new ApiError('Session expired. Please log in again.', 401);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });

  // Handle 401 — token rejected server-side
  if (response.status === 401) {
    localStorage.removeItem('rehab_token');
    localStorage.removeItem('rehab_user');
    localStorage.removeItem('rehab_role');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rehabsense:token-expired'));
    }
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new ApiError(errorDetail, response.status);
  }

  return response.json();
}

export const api = {
  // ── Auth & Demo Switching ──────────────────────────────────────
  login: (email: string, password: string) =>
    request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  demoSwitch: (role: 'PATIENT' | 'THERAPIST') =>
    request<any>('/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  getMe: () => request<any>('/auth/me'),

  // ── Patient Endpoints ─────────────────────────────────────────
  getPatientProfile: () => request<any>('/patients/me'),
  getPatientDashboard: () => request<any>('/patients/me/dashboard'),
  getPatientProgress: () => request<any>('/patients/me/progress'),
  getPatientSessions: () => request<any>('/patients/me/sessions'),

  // ── Exercise & Prescriptions ──────────────────────────────────
  getExercises: () => request<any[]>('/exercises'),
  getExercise: (id: string) => request<any>(`/exercises/${id}`),
  getPrescriptions: (patientId?: string) =>
    request<any[]>(`/prescriptions${patientId ? `?patient_id=${patientId}` : ''}`),
  updatePrescription: (prescriptionId: string, payload: {
    target_rom?: number;
    target_reps?: number;
    notes?: string;
    status?: string;
    frequency_per_day?: number;
  }) =>
    request<any>(`/prescriptions/${prescriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // ── Session Management ────────────────────────────────────────
  createSession: (payload: any) =>
    request<any>('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSession: (sessionId: string) => request<any>(`/sessions/${sessionId}`),

  // ── Therapist Operations ──────────────────────────────────────
  getTherapistDashboard: () => request<any>('/therapist/dashboard'),
  getTherapistPatientDetail: (patientId: string) =>
    request<any>(`/therapist/patients/${patientId}`),
  reviewSession: (sessionId: string, payload: any) =>
    request<any>(`/therapist/sessions/${sessionId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ── Notifications ─────────────────────────────────────────────
  getNotifications: () => request<any[]>('/notifications'),
  markNotificationRead: (notificationId: string) =>
    request<any>(`/notifications/${notificationId}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request<any>('/notifications/read-all', { method: 'PATCH' }),

  // ── Demo State Management ─────────────────────────────────────
  resetDemo: () =>
    request<any>('/demo/reset', { method: 'POST' }),
  getDemoInfo: () => request<any>('/demo/info'),
};

export { ApiError };
export default api;
