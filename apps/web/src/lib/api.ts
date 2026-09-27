const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function getAuthHeader(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rehab_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth & Demo Switching
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

  // Patient Endpoints
  getPatientProfile: () => request<any>('/patients/me'),
  getPatientDashboard: () => request<any>('/patients/me/dashboard'),
  getPatientProgress: () => request<any>('/patients/me/progress'),
  getPatientSessions: () => request<any>('/patients/me/sessions'),

  // Exercise & Prescriptions
  getExercises: () => request<any[]>('/exercises'),
  getExercise: (id: string) => request<any>(`/exercises/${id}`),

  // Session Management
  createSession: (payload: any) =>
    request<any>('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSession: (sessionId: string) => request<any>(`/sessions/${sessionId}`),

  // Therapist Operations
  getTherapistDashboard: () => request<any>('/therapist/dashboard'),
  getTherapistPatientDetail: (patientId: string) =>
    request<any>(`/therapist/patients/${patientId}`),
  reviewSession: (sessionId: string, payload: any) =>
    request<any>(`/therapist/sessions/${sessionId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Demo State Management
  resetDemo: () =>
    request<any>('/demo/reset', {
      method: 'POST',
    }),
  getDemoInfo: () => request<any>('/demo/info'),
};

export default api;
