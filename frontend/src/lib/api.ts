const API_BASE = '/api';

interface ApiOptions {
  method?: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...headers,
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  // Convenience methods
  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, body: Record<string, unknown>) {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  // Auth
  register(email: string, password: string, name?: string) {
    return this.request<{ success: boolean; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: { email, password, name },
    });
  }

  login(email: string, password: string) {
    return this.request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  getProfile() {
    return this.request<{ success: boolean; user: any }>('/auth/profile');
  }

  updateProfile(data: Record<string, unknown>) {
    return this.request<{ success: boolean; user: any }>('/auth/profile', {
      method: 'PUT',
      body: data,
    });
  }

  // Dashboard
  getDashboardStats() {
    return this.request<{ success: boolean; data: any }>('/dashboard/stats');
  }

  getActivityLog() {
    return this.request<{ success: boolean; data: any[] }>('/dashboard/activity');
  }
}

export const api = new ApiClient();
