export function parseFecha(fechaStr) {
  if (!fechaStr) return null;
  const fecha = new Date(`${fechaStr}T00:00:00.000Z`);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha;
}

export function fechaKey(fecha) {
  return new Date(fecha).toISOString().slice(0, 10);
}
