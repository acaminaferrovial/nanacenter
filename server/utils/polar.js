const AUTH_URL = 'https://flow.polar.com/oauth2/authorization';
const TOKEN_URL = 'https://polarremote.com/v2/oauth2/token';
const API_BASE = 'https://www.polaraccesslink.com';

export function urlAutorizacion() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.POLAR_CLIENT_ID,
    redirect_uri: process.env.POLAR_REDIRECT_URI,
    scope: 'accesslink.read_all'
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function intercambiarCodigo(code) {
  const credenciales = Buffer.from(`${process.env.POLAR_CLIENT_ID}:${process.env.POLAR_CLIENT_SECRET}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.POLAR_REDIRECT_URI
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credenciales}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body
  });

  const datos = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(datos?.error_description || datos?.error || 'No se pudo intercambiar el código de Polar');
  }
  return datos; // { access_token, x_user_id, ... }
}

export async function registrarUsuario(token, polarUserId) {
  const res = await fetch(`${API_BASE}/v3/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ 'member-id': `nanacenter-${polarUserId}` })
  });

  // 409 = ya estaba registrado antes con este token; no es un error para nosotros
  if (!res.ok && res.status !== 409) {
    const texto = await res.text().catch(() => '');
    throw new Error(`No se pudo registrar el usuario en Polar (${res.status}): ${texto}`);
  }
}

/**
 * Consulta directa (actividad diaria, sueño, recuperación nocturna, ejercicios...).
 * Devuelve null si no hay datos (404/204).
 */
export async function obtenerPorFecha(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
  });
  if (res.status === 404 || res.status === 204) return null;
  if (!res.ok) {
    const texto = await res.text().catch(() => '');
    throw new Error(`Polar respondió ${res.status}: ${texto}`);
  }
  return res.json();
}
