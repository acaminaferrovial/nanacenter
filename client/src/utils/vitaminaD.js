// Estimación aproximada, NO una medición clínica.
//
// Minutos necesarios para alcanzar 1 MED ("Minimal Erythemal Dose", la dosis a la que
// la piel empieza a enrojecer) con un índice UV de 1, por fototipo Fitzpatrick.
// Derivados de los valores estándar de MED en J/m² (200/250/300/450/600/1000 para los
// tipos I-VI), sabiendo que un índice UV de 1 equivale a 25 mW/m² eritematicos:
//   minutos = (MED en J/m²) / 0.025 / 60
const MED_MINUTOS_UV1 = { 1: 133, 2: 167, 3: 200, 4: 300, 5: 400, 6: 667 };

// Referencia de síntesis: exponer el CUERPO ENTERO a 1 MED produce del orden de
// 10.000-25.000 UI de vitamina D (cifra ampliamente citada, p.ej. Holick MF).
// Usamos el extremo conservador del rango.
const IU_POR_MED_CUERPO_ENTERO = 10000;
export const IU_MAXIMO_SESION = 20000; // la síntesis cutánea se satura; tope conservador

export function calcularSuperficieCorporal(alturaCm, pesoKg) {
  if (!alturaCm || !pesoKg) return null;
  const alturaM = alturaCm / 100;
  return 0.20247 * Math.pow(alturaM, 0.725) * Math.pow(pesoKg, 0.425);
}

// La capacidad de la piel para sintetizar vitamina D baja con la edad.
export function calcularFactorEdad(edad) {
  if (edad == null) return 1;
  if (edad < 20) return 1;
  if (edad > 80) return 0.1;
  return 1 - 0.015 * (edad - 20);
}

/**
 * Devuelve { porcentajeTiempoSeguro, vitaminaDIU } o null si faltan datos imprescindibles.
 * `uvIndex` debe ser el índice UV medio durante toda la exposición, no el del instante inicial.
 */
export function calcularExposicionUV({ uvIndex, duracionMin, fototipo, alturaCm, pesoKg, edad, bsaFraccion, spfFactor }) {
  if (uvIndex == null || !duracionMin || !fototipo) return null;

  const medMinutos = MED_MINUTOS_UV1[fototipo];
  const spf = spfFactor && spfFactor > 1 ? spfFactor : 1;

  const tiempoSeguroMin = (medMinutos / uvIndex) * spf;
  const porcentajeTiempoSeguro = Math.round((duracionMin / tiempoSeguroMin) * 100);

  // Dosis recibida expresada en MED propios de esa piel: al normalizar por el MED del
  // fototipo ya queda recogido que la melanina filtra parte del UVB.
  const dosisMed = (uvIndex * duracionMin) / medMinutos / spf;

  const bsa = calcularSuperficieCorporal(alturaCm, pesoKg);
  const bf = bsa ? bsa / 1.7 : 1;
  const fraccionCuerpo = bsaFraccion || 1;
  const af = calcularFactorEdad(edad);

  const vitaminaDIU = Math.round(
    Math.min(IU_MAXIMO_SESION, Math.max(0, IU_POR_MED_CUERPO_ENTERO * dosisMed * fraccionCuerpo * af * bf))
  );

  return { porcentajeTiempoSeguro, vitaminaDIU };
}
