export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const OFFLINE = 'No hay conexión con el servidor. Verifica que el backend esté en ejecución e inténtalo de nuevo.';

export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, OFFLINE);   // network error: nothing answered at all
  }

  let data = null;
  try { data = await res.json(); } catch { /* empty or non-JSON body */ }

  // 502/503/504 come from the Vite proxy when the backend isn't reachable
  if ([502, 503, 504].includes(res.status)) throw new ApiError(res.status, OFFLINE);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `Error ${res.status}`);
  return data;
}