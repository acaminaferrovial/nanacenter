export function todayStr() {
  return new Date().toLocaleDateString('sv-SE');
}

export function addDays(fecha, delta) {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toLocaleDateString('sv-SE');
}

export function formatFechaLarga(fecha) {
  const d = new Date(`${fecha}T00:00:00`);
  const texto = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatFechaCorta(fecha) {
  return `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
}

export function fechaKey(isoFecha) {
  return new Date(isoFecha).toISOString().slice(0, 10);
}

export function calcularGestacion(fechaUltimaRegla, fecha) {
  if (!fechaUltimaRegla) return null;
  const fum = fechaKey(fechaUltimaRegla);
  const dias = Math.floor((new Date(`${fecha}T00:00:00Z`) - new Date(`${fum}T00:00:00Z`)) / 86400000) + 1;
  if (dias < 1) return null;
  return { diaGestacion: dias, semanaEmbarazo: Math.floor((dias - 1) / 7) + 1 };
}
