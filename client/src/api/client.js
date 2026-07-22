const BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('gestabien_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `Error ${res.status}`);
  }

  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getRegistros: () => request('/registros'),
  getRegistro: (fecha) => request(`/registros/${fecha}`),
  guardarRegistro: (datos) => request('/registros', { method: 'POST', body: datos }),
  actualizarRegistro: (fecha, datos) => request(`/registros/${fecha}`, { method: 'PATCH', body: datos }),
  getSemana: (n) => request(`/registros/semana/${n}`),
  getPerfil: () => request('/auth/me'),
  actualizarPerfil: (datos) => request('/auth/me', { method: 'PATCH', body: datos }),
  subirArchivo: async (file) => {
    const firma = await request('/upload/firma');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', firma.apiKey);
    formData.append('timestamp', firma.timestamp);
    formData.append('signature', firma.signature);
    formData.append('folder', firma.folder);
    formData.append('use_filename', firma.use_filename);
    formData.append('unique_filename', firma.unique_filename);
    formData.append('access_control', firma.access_control);

    const resourceType = file.type === 'application/pdf' ? 'raw' : 'auto';
    const res = await fetch(`https://api.cloudinary.com/v1_1/${firma.cloudName}/${resourceType}/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error?.message || 'Error al subir el archivo');
    }

    // Fuerza acceso anónimo vía Admin API (necesario cuando la cuenta tiene
    // "Restricted media access" activo, ya que ignora el parámetro access_control del upload)
    await request('/upload/publicar', {
      method: 'POST',
      body: { publicId: data.public_id, resourceType: data.resource_type }
    });

    return data;
  }
};
