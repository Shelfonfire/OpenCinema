const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchAPI(endpoint: string, params?: Record<string, string>) {
  // In production: relative URL → same CloudFront domain → /api/* routes to Lambda
  // In dev: set NEXT_PUBLIC_API_URL=http://localhost:8000
  const base = API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const path = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const url = new URL(path, base || 'http://localhost:8000');
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
