// HTTP-клиент: учётные данные хранятся только в памяти вкладки и не пишутся в localStorage.
let credentials = null;

export function setApiCredentials(username, password) {
  credentials = { username, password };
}

export function clearApiCredentials() {
  credentials = null;
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (credentials) {
    headers.set("Authorization", `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`);
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL ?? ""}${path}`, {
    ...options,
    headers
  });

  if (response.status === 204) {
    if (!response.ok) throw new Error(`Ошибка API: ${response.status}`);
    return null;
  }

  const type = response.headers.get("content-type") || "";
  const body = type.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof body === "object" && body !== null
      ? body.detail || body.message || body.title
      : body;
    const error = new Error(message || `Ошибка API: ${response.status}`);
    error.status = response.status;
    error.payload = body;
    throw error;
  }
  return body;
}
