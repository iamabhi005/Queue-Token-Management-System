// HTTP API Client for SmartQueue Backend (http://localhost:5001/api)

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Helper to make HTTP requests with JSON and Bearer auth header
 */
async function request(endpoint, options = {}) {
  const isLoginEndpoint = endpoint.startsWith('/auth/login');
  const token = isLoginEndpoint ? null : localStorage.getItem('smartqueue_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Handle expired session or unauthorized token
      if (res.status === 401 && !isLoginEndpoint && token) {
        console.warn('[API Auth] Session expired or invalid token. Clearing credentials.');
        localStorage.removeItem('smartqueue_token');
        localStorage.removeItem('smartqueue_auth_user');
        localStorage.removeItem('smartqueue_user');
        window.dispatchEvent(new Event('smartqueue_auth_expired'));
      }

      const errorMsg = data.message || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' || (error.message && error.message.toLowerCase().includes('fetch'))) {
      const connErr = new Error('Cannot connect to backend server at http://localhost:5001. Please ensure the backend server is running.');
      connErr.status = 503;
      throw connErr;
    }
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error.message);
    throw error;
  }
}

// 1. Authentication APIs
export const authAPI = {
  checkHealth: () => request('/health'),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password })
    }),

  register: (name, email, password, role = 'STAFF') =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role })
    })
};

// 2. Public Services API
export const serviceAPI = {
  getActiveServices: () => request('/services')
};

// 2b. Public Queue API (no auth required)
export const queueAPI = {
  getTodayTokens: () => request('/queue/today'),
  getCounters: () => request('/queue/counters')
};

// 3. Customer Token APIs
export const tokenAPI = {
  createToken: (customerName, serviceId) =>
    request('/tokens', {
      method: 'POST',
      body: JSON.stringify({ customerName, serviceId })
    }),

  getTokenById: (id) => request(`/tokens/${id}`),

  getTokenStatus: (id) => request(`/tokens/status/${id}`)
};

// 4. Admin Queue & Operations APIs
export const adminAPI = {
  getTokens: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/tokens${query ? `?${query}` : ''}`);
  },

  getStats: () => request('/admin/stats'),

  callNextToken: (counterId, serviceId) =>
    request('/admin/tokens/next', {
      method: 'POST',
      body: JSON.stringify({ counterId, serviceId })
    }),

  completeToken: (id) =>
    request(`/admin/tokens/${id}/complete`, {
      method: 'PATCH'
    }),

  skipToken: (id) =>
    request(`/admin/tokens/${id}/skip`, {
      method: 'PATCH'
    }),

  getCounters: () => request('/admin/counters'),

  createCounter: (name, serviceId) =>
    request('/admin/counters', {
      method: 'POST',
      body: JSON.stringify({ name, serviceId })
    }),

  createService: (name, description, averageServiceTime) =>
    request('/admin/services', {
      method: 'POST',
      body: JSON.stringify({ name, description, averageServiceTime })
    })
};

// 5. SmartQueue AI Assistant APIs (Unlimited Queue Assistant)
export const aiAPI = {
  sendMessage: (message, conversationHistory = [], tokenId = null) =>
    request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory, tokenId })
    }),

  getSuggestions: () => request('/ai/suggestions')
};

