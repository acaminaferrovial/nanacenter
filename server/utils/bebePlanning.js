// Planning de ejercicios 0-3 meses y generador del resumen diario para Telegram

const PLANNING_3_MESES = [
  {
    semana: 1,
    mes: 1,
    etapa: 'Adaptación y contacto',
    ejercicios: [
      { titulo: 'Tummy Time piel con piel sobre tu pecho', duracion: '1–2 min (2–3 veces)', diasSemana: [0, 1, 2, 3, 4, 5, 6] },
      { titulo: 'Conexión visual y voz cercana (20–25 cm)', duracion: '3–5 min', diasSemana: [1, 3, 5, 0] },
      { titulo: 'Caricias suaves piel con piel', duracion: '3–5 min', diasSemana: [2, 4, 6] }
    ]
  },
  {
    semana: 2,
    mes: 1,
    etapa: 'Adaptación y contacto',
    ejercicios: [
      { titulo: 'Tummy Time atravesado sobre el regazo', duracion: '2–3 min (2–3 veces)', diasSemana: [0, 1, 2, 3, 4, 5, 6] },
      { titulo: 'Tarjetas de alto contraste (blanco y negro)', duracion: '3–5 min', diasSemana: [1, 3, 5] },
      { titulo: 'Estimulación del reflejo de agarre palmar', duracion: '2–3 min', diasSemana: [2, 4, 6, 0] }
    ]
  },
  {
    semana: 3,
    mes: 1,
    etapa: 'Adaptación y contacto',
    ejercicios: [
      { titulo: 'Tummy Time tras el cambio de pañal', duracion: '2–3 min', diasSemana: [0, 1, 2, 3, 4, 5, 6] },
      { titulo: 'Bicicleta suave de piernas (gases y cadera)', duracion: '2–3 min', diasSemana: [1, 3, 5, 0] },
      { titulo: 'Canciones y sonidos suaves a ambos lados', duracion: '5 min', diasSemana: [2, 4, 6] }
    ]
  },
  {
    semana: 4,
    mes: 1,
    etapa: 'Adaptación y contacto',
    ejercicios: [
      { titulo: 'Tummy Time en manta firme con toalla enrollada', duracion: '3–5 min (10–15 min/día)', diasSemana: [0, 1, 2, 3, 4, 5, 6] },
      { titulo: 'Masaje infantil en barriguita y pies', duracion: '5 min', diasSemana: [1, 3, 5, 0] },
      { titulo: 'Seguimiento visual en arco corto', duracion: '3–5 min', diasSemana: [2, 4, 6] }
    ]
  },
  {
    semana: 5,
    mes: 2,
    etapa: 'Control cefálico inicial',
    ejercicios: [
      { titulo: 'Tummy Time con estímulo sonoro a su altura', duracion: '5 min/sesión', diasSemana: [0, 1, 2, 3, 4, 5, 6] },
      { titulo: 'Conversaciones y primeras sonrisas sociales', duracion: '5 min', diasSemana: [1, 3, 5, 0] },
      { titulo: 'Exploración de texturas suaves', duracion: '3–5 min', diasSemana: [2, 4, 6] }
    ]
  },
  {
    semana: 6,
    mes: 2,
    etapa: 'Control cefálico inicial',
    ejercicios: [
      { titulo: 'Tummy Time frente a un espejo seguro', duracion: '5–7 min/sesión', diasSemana: [0, 1, 2, 3, 4, 5, 6] },
      { titulo: 'Llevar sus manitas al centro (línea media)', duracion: '3 min', diasSemana: [1, 3, 5] },
      { titulo: 'Paseo narrado por casa', duracion: '5–10 min', diasSemana: [2, 4, 6, 0] }
    ]
  },
  {
    semana: 7,
    mes: 2,
    etapa: 'Control cefálico inicial',
    ejercicios: [
      { titulo: 'Tummy Time apoyado en antebrazos con alto contraste', duracion: '7–8 min/sesión', diasSemana: [0, 1, 2, 3, 4, 5, 6] },
      { titulo: 'Seguimiento visual amplio (180°)', duracion: '3–5 min', diasSemana: [1, 3, 5, 0] },
      { titulo: 'Sujetar un sonajero ligero', duracion: '3 min', diasSemana: [2, 4, 6] }
    ]
  },
  {
    semana: 8,
    mes: 2,
    etapa: 'Control cefálico inicial',
    ejercicios: [
      { titulo: 'Tummy Time + masaje relajante de espalda y brazos', duracion: '8–10 min/sesión', diasSemana: [0, 1, 2, 3, 4, 5, 6] },
      { titulo: 'Juego de pataleo libre boca arriba', duracion: '5 min', diasSemana: [1, 3, 5] },
      { titulo: 'Primeros cuentos de tela y rimas', duracion: '5 min', diasSemana: [2, 4, 6, 0] }
    ]
  },
  {
    semana: 9,
    mes: 3,
    etapa: 'Fuerza en hombros y soporte',
    ejercicios: [
      { titulo: 'Tummy Time con arco de juegos o juguetes delante', duracion: '10 min/sesión', diasSemana: [0, 1, 2, 3, 4, 5, 6] },
      { titulo: 'Golpear móviles en el gimnasio de actividades', duracion: '5–10 min', diasSemana: [1, 3, 5, 0] },
      { titulo: 'Juego de vocales y turnos de palabra', duracion: '5 min', diasSemana: [2, 4, 6] }
    ]
  },
  {
    semana: 10,
    mes: 3,
    etapa: 'Fuerza en hombros y soporte',
    ejercicios: [
      { titulo: 'Postura del «avión» (balanceo suave en brazos)', duracion: '10–12 min', diasSemana: [0, 1, 2, 3, 4, 5, 6] },
      { titulo: 'Descubrir rodillas y pies', duracion: '5 min', diasSemana: [1, 3, 5] },
      { titulo: 'Música tranquila y balanceo en brazos', duracion: '5–10 min', diasSemana: [2, 4, 6, 0] }
    ]
  },
  {
    semana: 11,
    mes: 3,
    etapa: 'Fuerza en hombros y soporte',
    ejercicios: [
      { titulo: 'Tummy Time con transición al giro lateral', duracion: '12–15 min/sesión', diasSemana: [0, 1, 2, 3, 4, 5, 6] },
      { titulo: 'Juego tumbado de lado (decúbito lateral)', duracion: '3–5 min/lado', diasSemana: [1, 3, 5, 0] },
      { titulo: 'Primeros juegos de «cucú-tras»', duracion: '3–5 min', diasSemana: [2, 4, 6] }
    ]
  },
  {
    semana: 12,
    mes: 3,
    etapa: 'Fuerza en hombros y soporte',
    ejercicios: [
      { titulo: 'Juego libre boca abajo en alfombra de actividades', duracion: '15 min (20–30 min/día)', diasSemana: [0, 1, 2, 3, 4, 5, 6] },
      { titulo: 'Estiramiento y abrazo de brazos', duracion: '3–5 min', diasSemana: [1, 3, 5] },
      { titulo: 'Sesión de masaje relajante post-baño', duracion: '5–10 min', diasSemana: [2, 4, 6, 0] }
    ]
  }
];

const VACUNAS_BASE_EDADES = [
  { codigo: 'vrs-rn', nombre: 'VRS (Nirsevimab)', dosis: 'Única', edadRecomendada: 'Recién nacido', meses: 0 },
  { codigo: 'hexa-2m', nombre: 'Hexavalente', dosis: '1ª dosis', edadRecomendada: '2 meses', meses: 2 },
  { codigo: 'vnc-2m', nombre: 'Neumococo conjugada (VNC)', dosis: '1ª dosis', edadRecomendada: '2 meses', meses: 2 },
  { codigo: 'menb-2m', nombre: 'Meningococo B (MenB)', dosis: '1ª dosis', edadRecomendada: '2 meses', meses: 2 },
  { codigo: 'rv-2m', nombre: 'Rotavirus (RV)', dosis: '1ª dosis', edadRecomendada: '2 meses', meses: 2 },
  { codigo: 'hexa-4m', nombre: 'Hexavalente', dosis: '2ª dosis', edadRecomendada: '4 meses', meses: 4 },
  { codigo: 'vnc-4m', nombre: 'Neumococo conjugada (VNC)', dosis: '2ª dosis', edadRecomendada: '4 meses', meses: 4 },
  { codigo: 'menb-4m', nombre: 'Meningococo B (MenB)', dosis: '2ª dosis', edadRecomendada: '4 meses', meses: 4 },
  { codigo: 'menc-4m', nombre: 'Meningococo C (MenC)', dosis: '1ª dosis', edadRecomendada: '4 meses', meses: 4 },
  { codigo: 'rv-4m', nombre: 'Rotavirus (RV)', dosis: '2ª dosis', edadRecomendada: '4 meses', meses: 4 },
  { codigo: 'rv-6m', nombre: 'Rotavirus (RV)', dosis: '3ª dosis', edadRecomendada: '6 meses', meses: 6 },
  { codigo: 'gripe-6m', nombre: 'Gripe', dosis: 'Campaña anual', edadRecomendada: '6 meses', meses: 6 },
  { codigo: 'hexa-11m', nombre: 'Hexavalente', dosis: '3ª dosis', edadRecomendada: '11 meses', meses: 11 },
  { codigo: 'vnc-11m', nombre: 'Neumococo conjugada (VNC)', dosis: '3ª dosis', edadRecomendada: '11 meses', meses: 11 },
  { codigo: 'tv-12m', nombre: 'Triple Vírica (SRP)', dosis: '1ª dosis', edadRecomendada: '12 meses', meses: 12 },
  { codigo: 'menb-12m', nombre: 'Meningococo B (MenB)', dosis: '3ª dosis', edadRecomendada: '12 meses', meses: 12 },
  { codigo: 'menacwy-12m', nombre: 'Meningococo ACWY', dosis: '1ª dosis', edadRecomendada: '12 meses', meses: 12 },
  { codigo: 'varicela-15m', nombre: 'Varicela (VVZ)', dosis: '1ª dosis', edadRecomendada: '15 meses', meses: 15 }
];

function escapeHtml(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sumarMeses(fechaStr, meses) {
  const d = new Date(`${fechaStr}T00:00:00`);
  const diaOriginal = d.getDate();
  d.setMonth(d.getMonth() + meses);
  if (d.getDate() < diaOriginal) d.setDate(0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function hoyMadridStr() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
}

function diffDias(desdeStr, hastaStr) {
  const a = new Date(`${desdeStr}T00:00:00Z`);
  const b = new Date(`${hastaStr}T00:00:00Z`);
  return Math.floor((b - a) / 86400000);
}

export function construirMensajeResumenBebe({
  hoyStr,
  fechaNacimientoStr,
  revisiones = [],
  citasEmbarazo = [],
  vacunasBD = [],
  appUrl = ''
}) {
  const lineas = [];
  const fechaBonita = new Date(`${hoyStr}T00:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  lineas.push(`🍼 <b>Ñaña Center — Resumen de Mini-ñaña</b>`);
  lineas.push(`<i>${escapeHtml(fechaBonita.charAt(0).toUpperCase() + fechaBonita.slice(1))}</i>`);
  lineas.push('');

  if (!fechaNacimientoStr) {
    lineas.push('📅 Aún no has indicado la fecha de nacimiento (o FPP) de Mini-ñaña en la app.');
  } else {
    const dias = diffDias(fechaNacimientoStr, hoyStr);

    if (dias < 0) {
      const faltan = Math.abs(dias);
      lineas.push(
        `⏳ <b>¡Faltan ${faltan} ${faltan === 1 ? 'día' : 'días'}</b> para la llegada de Mini-ñaña!`
      );
    } else if (dias === 0) {
      lineas.push('🎉 <b>¡Hoy es el gran día! ¡Bienvenido al mundo, Mini-ñaña!</b>');
    } else {
      const semana = Math.floor(dias / 7) + 1;
      lineas.push(`👶 <b>Semana ${semana}</b> (${dias} días de vida)`);

      if (semana <= 12) {
        const plan = PLANNING_3_MESES.find((p) => p.semana === semana);
        if (plan) {
          const diaSem = new Date(`${hoyStr}T00:00:00`).getDay();
          const ejerciciosHoy = plan.ejercicios.filter((e) => e.diasSemana.includes(diaSem));
          if (ejerciciosHoy.length > 0) {
            lineas.push('');
            lineas.push(`🧸 <b>Ejercicios recomendados hoy</b> (${escapeHtml(plan.etapa)}):`);
            ejerciciosHoy.forEach((ej) => {
              lineas.push(`• ${escapeHtml(ej.titulo)} <i>(${escapeHtml(ej.duracion)})</i>`);
            });
          }
        }
      }
    }
  }

  // Citas médicas de hoy, mañana o próximos 3 días (bebé + embarazo)
  const citasProximas = [];
  revisiones.forEach((r) => {
    const f = r.fecha ? new Date(r.fecha).toISOString().slice(0, 10) : '';
    const fp = r.proximaRevision ? new Date(r.proximaRevision).toISOString().slice(0, 10) : '';
    if (f) {
      const d = diffDias(hoyStr, f);
      if (d >= 0 && d <= 3) {
        citasProximas.push({
          dias: d,
          cuando: d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : `En ${d} días`,
          texto: `👶 ${r.tipo || 'Revisión'}${r.profesional ? ` (${r.profesional})` : ''}`
        });
      }
    }
    if (fp) {
      const d = diffDias(hoyStr, fp);
      if (d >= 0 && d <= 3) {
        citasProximas.push({
          dias: d,
          cuando: d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : `En ${d} días`,
          texto: `👶 Próxima revisión: ${r.tipo || 'Pediatría'}`
        });
      }
    }
  });

  citasEmbarazo.forEach((c) => {
    const f = c.fecha ? new Date(c.fecha).toISOString().slice(0, 10) : '';
    if (!f) return;
    const d = diffDias(hoyStr, f);
    if (d >= 0 && d <= 3) {
      citasProximas.push({
        dias: d,
        cuando: d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : `En ${d} días`,
        texto: `🤰 ${c.tipo || 'Cita embarazo'}${c.resumen ? ` — ${c.resumen}` : ''}`
      });
    }
  });

  citasProximas.sort((a, b) => a.dias - b.dias);

  if (citasProximas.length > 0) {
    lineas.push('');
    lineas.push('🩺 <b>Citas médicas próximas:</b>');
    citasProximas.forEach((c) => {
      lineas.push(`• <b>${c.cuando}:</b> ${escapeHtml(c.texto)}`);
    });
  }

  // Vacunas previstas hoy o en los próximos 3 días
  const mapaVacunas = new Map();
  vacunasBD.forEach((v) => mapaVacunas.set(v.codigo, v));

  const vacunasProximas = [];
  VACUNAS_BASE_EDADES.forEach((base) => {
    const g = mapaVacunas.get(base.codigo);
    if (g?.estado === 'puesta' || g?.estado === 'no_aplica') return;
    const fechaPrev = g?.fechaPrevista
      ? new Date(g.fechaPrevista).toISOString().slice(0, 10)
      : fechaNacimientoStr
      ? sumarMeses(fechaNacimientoStr, base.meses)
      : '';
    if (!fechaPrev) return;
    const d = diffDias(hoyStr, fechaPrev);
    if (d >= 0 && d <= 3) {
      vacunasProximas.push({
        cuando: d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : `En ${d} días`,
        texto: `${base.nombre} (${base.dosis})`
      });
    }
  });

  if (vacunasProximas.length > 0) {
    lineas.push('');
    lineas.push('💉 <b>Vacunas próximas:</b>');
    vacunasProximas.forEach((v) => {
      lineas.push(`• <b>${v.cuando}:</b> ${escapeHtml(v.texto)}`);
    });
  }

  if (appUrl) {
    const cleanUrl = appUrl.replace(/\/+$/, '');
    lineas.push('');
    lineas.push(`👉 <a href="${cleanUrl}/bebe">Abrir calendario de Mini-ñaña en Ñaña Center</a>`);
  }

  return lineas.join('\n');
}
