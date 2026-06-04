import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// ============================================================
// Token storage (in-memory + localStorage fallback)
// ============================================================

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (token) {
    if (typeof window !== 'undefined') localStorage.setItem('_at', token);
  } else {
    if (typeof window !== 'undefined') localStorage.removeItem('_at');
  }
}

export function getStoredToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('_at');
  }
  return null;
}

// ============================================================
// Axios instance
// ============================================================

export const api: AxiosInstance = axios.create({
  baseURL:         API_URL,
  withCredentials: true,  // for refresh token cookie
  headers:         { 'Content-Type': 'application/json' },
  timeout:         15000,
});

// Request interceptor: attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach session ID for anonymous RFQ tracking
  if (typeof window !== 'undefined') {
    let sid = sessionStorage.getItem('_sid');
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem('_sid', sid);
    }
    config.headers['X-Session-Id'] = sid;
  }

  return config;
});

// Response interceptor: auto-refresh on 401
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.error === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = response.data.data.accessToken;
        setAccessToken(newToken);

        refreshQueue.forEach(({ resolve }) => resolve(newToken));
        refreshQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        refreshQueue.forEach(({ reject }) => reject(refreshError));
        refreshQueue = [];
        setAccessToken(null);
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login?expired=1';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================
// Typed API helpers
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data:    T;
  message?: string;
  error?:   string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    pagination: {
      total:      number;
      page:       number;
      limit:      number;
      totalPages: number;
    };
  } & T;
}

// Auth
export const authApi = {
  register: (data: unknown)                   => api.post('/auth/register', data),
  login:    (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout:   ()                                => api.post('/auth/logout'),
  refresh:  ()                                => api.post('/auth/refresh'),
  me:       ()                                => api.get('/auth/me'),
};

// Parts
export const partsApi = {
  search:     (q: string) => api.get(`/parts/search?q=${encodeURIComponent(q)}`),
  batchLookup:(partNumbers: string[]) => api.post('/parts/batch-lookup', { part_numbers: partNumbers }),
};

// RFQ
export const rfqApi = {
  downloadTemplate: () => api.get('/rfq/template', { responseType: 'arraybuffer' }),
  createDraft:      ()  => api.post('/rfq/draft'),
  uploadFile:       (formData: FormData) => api.post('/rfq/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateItems:      (id: string, items: unknown[]) => api.post(`/rfq/${id}/items`, { items }),
  submit:           (id: string, data: unknown)    => api.post(`/rfq/${id}/submit`, data),
  get:              (id: string)                   => api.get(`/rfq/${id}`),
  myRfqs:           (page = 1)                     => api.get(`/rfq/my?page=${page}`),
};

// Admin
export const adminApi = {
  // Users
  users:            (params?: Record<string,unknown>) => api.get('/admin/users', { params }),
  getUser: (id: string) => axios.get(`/admin/users/${id}`),
  approveUser:      (id: string)                      => api.patch(`/admin/users/${id}/approve`),
  rejectUser:       (id: string, reason: string)      => api.patch(`/admin/users/${id}/reject`, { reason }),
  suspendUser:      (id: string)                      => api.patch(`/admin/users/${id}/suspend`),
  updateUserRole:   (id: string, role: string)        => api.patch(`/admin/users/${id}/role`, { role }),

  // RFQ
  rfqs:             (params?: Record<string,unknown>) => api.get('/rfq/admin/all', { params }),
  updateRfqStatus:  (rfqId: string, status: string)   => api.patch(`/rfq/${rfqId}/status`, { status }),
  downloadPdf:      (rfqId: string)                   => api.get(`/admin/pdf/rfq/${rfqId}`, { responseType: 'arraybuffer' }),

  // Leads
  leads:            (params?: Record<string,unknown>) => api.get('/admin/leads', { params }),
  leadStats:        ()                                => api.get('/admin/leads/stats'),
  updateLead:       (id: string, data: unknown)       => api.patch(`/admin/leads/${id}`, data),

  // Analytics
  kpis:             ()             => api.get('/admin/analytics/kpis'),
  searchTrends:     (days = 30)    => api.get(`/admin/analytics/search-trends?days=${days}`),
  partsNotFound:    (days = 30)    => api.get(`/admin/analytics/parts-not-found?days=${days}`),
  rfqTrends:        (period = 'daily') => api.get(`/admin/analytics/rfq-trends?period=${period}`),
  topCustomers:     ()             => api.get('/admin/analytics/top-customers'),
  pipeline:         ()             => api.get('/admin/analytics/pipeline'),
  activityFeed:     (limit = 50)   => api.get(`/admin/analytics/activity-feed?limit=${limit}`),
  searchVolume:     ()             => api.get('/admin/analytics/search-volume'),

  // Parts
  parts:            (params?: Record<string,unknown>) => api.get('/parts/admin/list', { params }),
  upsertPart:       (pn: string, data: unknown)        => api.put(`/parts/admin/${encodeURIComponent(pn)}`, data),
  bulkImportParts:  (rows: unknown[])                  => api.post('/parts/admin/bulk-import', { rows }),

  // Settings
  settings:         ()                              => api.get('/admin/settings'),
  updateSetting:    (key: string, value: string)    => api.patch(`/admin/settings/${key}`, { value }),
};

export default api;
