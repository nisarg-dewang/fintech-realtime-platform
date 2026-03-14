const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('fintech_token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

export const auth = {
  login: (email: string, password: string) =>
    api<{ access_token: string; user: { id: string; email: string; createdAt: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
  register: (email: string, password: string) =>
    api<{ access_token: string; user: { id: string; email: string; createdAt: string } }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
};

export const portfolio = {
  get: () => api<{ id: string; balance: string; positions: Array<{ symbol: string; quantity: string; averagePrice: string }> }>('/portfolio'),
  buy: (symbol: string, quantity: number) =>
    api<{ balance: string; positions: unknown[] }>('/portfolio/buy', {
      method: 'POST',
      body: JSON.stringify({ symbol, quantity }),
    }),
  sell: (symbol: string, quantity: number) =>
    api<{ balance: string; positions: unknown[] }>('/portfolio/sell', {
      method: 'POST',
      body: JSON.stringify({ symbol, quantity }),
    }),
};
