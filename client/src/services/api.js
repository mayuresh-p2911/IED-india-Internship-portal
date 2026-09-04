// ═══════════════════════════════════════════════════════════
// IED India IMS — API Helper (React port)
// ═══════════════════════════════════════════════════════════

const BASE = '/api';

const getToken = () => {
  const t = localStorage.getItem('ied_token');
  if (!t || t === 'null' || t === 'undefined') return null;
  return t;
};

const getHeaders = () => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const request = async (method, path, body = null, isFormData = false) => {
  const token = getToken();
  const formPayload = isFormData || (typeof FormData !== 'undefined' && body instanceof FormData);
  const opts = {
    method,
    headers: formPayload
      ? (token ? { 'Authorization': `Bearer ${token}` } : {})
      : getHeaders()
  };
  if (body) opts.body = formPayload ? body : JSON.stringify(body);
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { message: text || `HTTP ${res.status}: ${res.statusText}` };
    }
    if (res.status === 401) {
      localStorage.removeItem('ied_token');
      localStorage.removeItem('ied_user');
      window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: data }));
    }
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    throw err;
  }
};

const API = {
  get:       (path)               => request('GET', path),
  post:      (path, body, fd)     => request('POST', path, body, fd),
  put:       (path, body)         => request('PUT', path, body),
  patch:     (path, body)         => request('PATCH', path, body),
  delete:    (path)               => request('DELETE', path),
  upload:    (path, formData)     => request('POST', path, formData, true),
  uploadPut: (path, formData)     => request('PUT', path, formData, true),
};

export default API;
