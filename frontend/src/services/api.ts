const API_BASE = '/api';
const TOKEN_KEY = 'fintech_token';
const USER_KEY = 'fintech_user';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Clear auth state on 401 so user can log in again */
function clearAuthAndRedirect() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
}

/** Optional token override (e.g. from useAuth()) so portfolio/auth requests always use current session token */
async function api<T>(path: string, options: RequestInit = {}, tokenOverride?: string | null): Promise<T> {
  const token = tokenOverride !== undefined ? tokenOverride : getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  if (res.status === 401) {
    clearAuthAndRedirect();
    const err = await res.json().catch(() => ({ message: 'Unauthorized' }));
    throw new Error(err.message || 'Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

export interface MarketPriceResponse {
  symbol: string;
  price: number;
  timestamp: number;
}

export interface CandlePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface FeaturedStock {
  symbol: string;
  description: string;
  price: number | null;
}

export const marketApi = {
  getList: () => api<FeaturedStock[]>('/market/list'),
  getPrice: (symbol: string) =>
    api<MarketPriceResponse | { symbol: string; error: string }>(`/market/${encodeURIComponent(symbol)}`),
  getHistory: (symbol: string, from: number, to: number, resolution?: 'D') =>
    api<CandlePoint[]>(
      `/market/${encodeURIComponent(symbol)}/history?from=${from}&to=${to}${resolution ? `&resolution=${resolution}` : ''}`
    ),
};

export interface PortfolioPosition {
  id?: string;
  symbol: string;
  quantity: string;
  averagePrice: string;
}

export interface PortfolioResponse {
  id: string;
  balance: string;
  positions: PortfolioPosition[];
}

export const portfolioApi = {
  get: (token?: string | null) => api<PortfolioResponse>('/portfolio', {}, token),
  buy: (symbol: string, quantity: number, token?: string | null) =>
    api<{ balance: string; positions: unknown[] }>(
      '/portfolio/buy',
      { method: 'POST', body: JSON.stringify({ symbol, quantity }) },
      token
    ),
  sell: (symbol: string, quantity: number, token?: string | null) =>
    api<{ balance: string; positions: unknown[] }>(
      '/portfolio/sell',
      { method: 'POST', body: JSON.stringify({ symbol, quantity }) },
      token
    ),
};

export const authApi = {
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
