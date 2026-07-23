export function calcularGestacion(fechaUltimaRegla, fecha) {
  if (!fechaUltimaRegla) return {};
  const dias = Math.floor((fecha - new Date(fechaUltimaRegla)) / 86400000) + 1;
  if (dias < 1) return {};
  return { diaGestacion: dias, semanaEmbarazo: Math.floor((dias - 1) / 7) + 1 };
}
