// api.js
// Central place for talking to the Express backend.
//
// VITE_API_URL controls where requests go:
//  - Local dev (frontend on :5173, backend on :3000): set it to
//    http://localhost:3000, or leave it unset (that's the default below).
//  - Single-origin cloud deployment (Express serves the built frontend,
//    see server.js note in the README): set VITE_API_URL="" so requests
//    are same-origin relative paths and no CORS/cookie config is needed.
// api.js
const API_URL = import.meta.env.PROD 
    ? '' 
    : (import.meta.env.VITE_API_URL ?? 'http://localhost:3000');

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include', // required: the JWT lives in an HttpOnly cookie
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  let body = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return { ok: res.ok, status: res.status, body };
}

export const api = {
  loginUrl: `${API_URL}/login`,

  health: () => request('/api/health'),

  logout: () => request('/api/logout', { method: 'POST' }),

  listCapsules: () => request('/api/capsules'),

  createCapsule: (data) =>
    request('/api/capsules', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateCapsule: (id, data) =>
    request(`/api/capsules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteCapsule: (id) =>
    request(`/api/capsules/${id}`, { method: 'DELETE' })
};
