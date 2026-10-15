// Единый HTTP-клиент фронтенда. Вход выполняется через Basic Auth; пароль хранится только в памяти вкладки.
let credentials = null;

export function setApiCredentials(username, password) { credentials = { username, password }; }
export function clearApiCredentials() { credentials = null; }

export async function apiRequest(path, options = {}) {
  const baseUrl = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const headers = new Headers(options.headers || {});
  if (credentials) headers.set('Authorization', `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  let response;
  try { response = await fetch(`${baseUrl}${path}`, { ...options, headers }); }
  catch (cause) { const error = new Error('Не удалось связаться с API. Проверьте VITE_API_URL, доступность сервера и настройки CORS.'); error.cause = cause; throw error; }
  if (response.status === 204) return null;
  const type = response.headers.get('content-type') || '';
  const body = type.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof body === 'object' && body !== null ? body.detail || body.message || body.title || body.error : body;
    const error = new Error(message || `Ошибка API: ${response.status}`); error.status = response.status; error.payload = body; throw error;
  }
  return body;
}
