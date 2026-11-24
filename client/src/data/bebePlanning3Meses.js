// Planning de actividades y ejercicios de estimulación temprana para bebés de 0 a 3 meses (semanas 1 a 12)
// Basado en recomendaciones pediátricas y de fisioterapia infantil (Tummy Time progresivo, estimulación sensorial, masaje y motricidad).

export const REGLAS_ORO_BEBE = [
  'Siempre despierto y bajo supervisión directa en los ejercicios boca abajo (Tummy Time).',
  'Mejor sesiones muy cortas varias veces al día que una larga si se cansa o llora.',
  'Evita los ejercicios boca abajo justo después de comer (espera 20–30 min para evitar regurgitaciones).',
  'Usa superficies firmes (tu pecho al principio y después una manta firme en el suelo, nunca camas blandas).'
];

export const PLANNING_3_MESES = [
  {
    semana: 1,
    mes: 1,
    etapa: 'Adaptación y contacto',
    objetivo: 'Contacto piel con piel, calma y primeras tomas de contacto boca abajo sobre el pecho.',
    ejercicios: [
      {
        codigo: 's1-tummy-pecho',
        titulo: 'Tummy Time piel con piel sobre tu pecho',
        categoria: 'Tummy Time',
        duracion: '1–2 min (2–3 veces/día)',
        descripcion: 'Coloca al bebé boca abajo sobre tu pecho mientras estás semirreclinada/o. Háblale bajito y acaríciale la espalda para que intente levantar un instante la barbilla.',
        diasSemana: [0, 1, 2, 3, 4, 5, 6]
      },
      {
        codigo: 's1-voz-rostro',
        titulo: 'Conexión visual y voz cercana',
        categoria: 'Visual',
        duracion: '3–5 min',
        descripcion: 'Acerca tu cara a unos 20–25 cm (su distancia de enfoque al nacer), sonríe, saca la lengua despacio y háblale con tono suave y pausado.',
        diasSemana: [1, 3, 5, 0]
      },
      {
        codigo: 's1-caricias-tacto',
        titulo: 'Caricias suaves piel con piel',
        categoria: 'Masaje',
        duracion: '3–5 min',
        descripcion: 'Pasa tus manos tibias con suavidad por sus brazos, piernas y espalda en un ambiente tranquilo para ayudarle a tomar conciencia de su cuerpo.',
        diasSemana: [2, 4, 6]
      }
    ]
  },
  {
    semana: 2,
    mes: 1,
    etapa: 'Adaptación y contacto',
    objetivo: 'Ganar seguridad boca abajo sobre el regazo y estimular el reflejo de agarre y seguimiento.',
    ejercicios: [
      {
        codigo: 's2-tummy-regazo',
        titulo: 'Tummy Time atravesado sobre el regazo',
        categoria: 'Tummy Time',
        duracion: '2–3 min (2–3 veces/día)',
        descripcion: 'Pon al bebé boca abajo sobre tus piernas sujetándolo con seguridad y coloca tu cara frente a la suya para que busque tu voz y tu rostro.',
        diasSemana: [0, 1, 2, 3, 4, 5, 6]
      },
      {
        codigo: 's2-alto-contraste',
        titulo: 'Tarjetas de alto contraste (blanco y negro)',
        categoria: 'Visual',
        duracion: '3–5 min',
        descripcion: 'Muéstrale una tarjeta o dibujo en blanco y negro a 20–25 cm y muévelo muy despacio de un lado a otro para entrenar el enfoque ocular.',
        diasSemana: [1, 3, 5]
      },
      {
        codigo: 's2-agarre-palmar',
        titulo: 'Estimulación del reflejo de agarre',
        categoria: 'Motricidad',
        duracion: '2–3 min',
        descripcion: 'Coloca tu dedo índice en la palma de su mano para que cierre los deditos a su alrededor. Repite en ambas manos con suavidad.',
        diasSemana: [2, 4, 6, 0]
      }
    ]
  },
  {
    semana: 3,
    mes: 1,
    etapa: 'Adaptación y contacto',
    objetivo: 'Integrar el Tummy Time en la rutina diaria y aliviar gases con movilización suave.',
    ejercicios: [
      {
        codigo: 's3-tummy-cambiador',
        titulo: 'Tummy Time tras el cambio de pañal',
        categoria: 'Tummy Time',
        duracion: '2–3 min por cambio',
        descripcion: 'Al terminar de cambiarle el pañal, gíralo suavemente boca abajo 1–2 minutos (siempre con tus manos protegiéndole) para crear una rutina natural.',
        diasSemana: [0, 1, 2, 3, 4, 5, 6]
      },
      {
        codigo: 's3-bicicleta-gases',
        titulo: 'Bicicleta suave de piernas',
        categoria: 'Motricidad',
        duracion: '2–3 min',
        descripcion: 'Boca arriba, mueve sus piernecitas alternándolas como si pedaleara suavemente. Favorece la movilidad de cadera y ayuda a expulsar gases.',
        diasSemana: [1, 3, 5, 0]
      },
      {
        codigo: 's3-sonidos-suaves',
        titulo: 'Canciones y sonidos suaves',
        categoria: 'Auditiva',
        duracion: '5 min',
        descripcion: 'Cántale nanas o haz sonar un sonajero muy suave a un lado y luego al otro de su cabeza, dándole tiempo para reaccionar al sonido.',
        diasSemana: [2, 4, 6]
      }
    ]
  },
  {
    semana: 4,
    mes: 1,
    etapa: 'Adaptación y contacto',
    objetivo: 'Primeras sesiones en manta firme en el suelo y masaje relajante diario.',
    ejercicios: [
      {
        codigo: 's4-tummy-manta',
        titulo: 'Tummy Time en manta firme con toalla enrollada',
        categoria: 'Tummy Time',
        duracion: '3–5 min (10–15 min/día total)',
        descripcion: 'Pasa a una manta firme en el suelo. Si le cuesta despegar la cabeza, coloca una toalla pequeña enrollada bajo sus axilas y pecho como apoyo suave.',
        diasSemana: [0, 1, 2, 3, 4, 5, 6]
      },
      {
        codigo: 's4-masaje-abdomen',
        titulo: 'Masaje infantil en barriguita y pies',
        categoria: 'Masaje',
        duracion: '5 min',
        descripcion: 'Haz círculos suaves en sentido de las agujas del reloj en su abdomen y acaricia las plantas de los pies (del talón a los dedos).',
        diasSemana: [1, 3, 5, 0]
      },
      {
        codigo: 's4-seguimiento-facial',
        titulo: 'Seguimiento visual en arco corto',
        categoria: 'Visual',
        duracion: '3–5 min',
        descripcion: 'Boca arriba, haz que siga tu rostro o un objeto de alto contraste moviéndolo despacio de izquierda a derecha en un arco de unos 90 grados.',
        diasSemana: [2, 4, 6]
      }
    ]
  },
  {
    semana: 5,
    mes: 2,
    etapa: 'Control cefálico inicial',
    objetivo: 'Empezar a girar la cabeza a ambos lados buscando sonidos y reforzar el cuello a 45°.',
    ejercicios: [
      {
        codigo: 's5-tummy-sonoro',
        titulo: 'Tummy Time con estímulo sonoro a su altura',
        categoria: 'Tummy Time',
        duracion: '5 min por sesión',
        descripcion: 'Túmbate frente al bebé a su misma altura sobre la manta. Háblale o agita un sonajero suave a un lado y al otro para que gire la cabeza hacia ambos lados.',
        diasSemana: [0, 1, 2, 3, 4, 5, 6]
      },
      {
        codigo: 's5-dialogo-sonrisas',
        titulo: 'Conversaciones y primeras sonrisas sociales',
        categoria: 'Auditiva',
        duracion: '5 min',
        descripcion: 'Imita sus gorjeos y vocalizaciones, haz pausas esperando su respuesta y premia sus sonrisas hablándole con expresividad.',
        diasSemana: [1, 3, 5, 0]
      },
      {
        codigo: 's5-texturas-suaves',
        titulo: 'Exploración de texturas suaves',
        categoria: 'Masaje',
        duracion: '3–5 min',
        descripcion: 'Roza suavemente sus manos, brazos y pies con distintas telas limpias (algodón, muselina, felpa suave) nombrando cada sensación.',
        diasSemana: [2, 4, 6]
      }
    ]
  },
  {
    semana: 6,
    mes: 2,
    etapa: 'Control cefálico inicial',
    objetivo: 'Motivar la elevación de la cabeza con espejo seguro y abrir sus manitas.',
    ejercicios: [
      {
        codigo: 's6-tummy-espejo',
        titulo: 'Tummy Time frente a un espejo seguro',
        categoria: 'Tummy Time',
        duracion: '5–7 min por sesión',
        descripcion: 'Coloca un espejo irrompible infantil a 20–30 cm frente al bebé. Verse reflejado le fascina y le anima a mantener la cabeza levantada.',
        diasSemana: [0, 1, 2, 3, 4, 5, 6]
      },
      {
        codigo: 's6-manos-linea-media',
        titulo: 'Llevar sus manitas al centro (línea media)',
        categoria: 'Motricidad',
        duracion: '3 min',
        descripcion: 'Boca arriba, junta suavemente sus manos frente a su pecho para que empiece a descubrirlas y a llevarlas hacia la boca.',
        diasSemana: [1, 3, 5]
      },
      {
        codigo: 's6-paseo-narrado',
        titulo: 'Paseo narrado por casa',
        categoria: 'Visual',
        duracion: '5–10 min',
        descripcion: 'Llévalo en brazos mirando hacia distintos rincones luminosos de la casa y ve contándole qué está viendo (ventanas, cuadros, plantas).',
        diasSemana: [2, 4, 6, 0]
      }
    ]
  },
  {
    semana: 7,
    mes: 2,
    etapa: 'Control cefálico inicial',
    objetivo: 'Fomentar el apoyo en antebrazos y ampliar el seguimiento visual a 180°.',
    ejercicios: [
      {
        codigo: 's7-tummy-antebrazos',
        titulo: 'Tummy Time apoyado en antebrazos con alto contraste',
        categoria: 'Tummy Time',
        duracion: '7–8 min por sesión',
        descripcion: 'Coloca sus coditos alineados bajo los hombros y pon un libro de tela blanco, negro y rojo a poca distancia para motivar que sostenga el pecho.',
        diasSemana: [0, 1, 2, 3, 4, 5, 6]
      },
      {
        codigo: 's7-seguimiento-180',
        titulo: 'Seguimiento visual amplio (180°)',
        categoria: 'Visual',
        duracion: '3–5 min',
        descripcion: 'Mueve despacio un juguete llamativo de un lateral al otro pasando por el centro, asegurándote de que gire el cuello hacia ambos lados por igual.',
        diasSemana: [1, 3, 5, 0]
      },
      {
        codigo: 's7-sonajero-mano',
        titulo: 'Sujetar un sonajero ligero',
        categoria: 'Motricidad',
        duracion: '3 min',
        descripcion: 'Ofrécele un sonajero muy ligero y fino en la mano para que practique sostenerlo unos segundos y descubra que suena al moverse.',
        diasSemana: [2, 4, 6]
      }
    ]
  },
  {
    semana: 8,
    mes: 2,
    etapa: 'Control cefálico inicial',
    objetivo: 'Consolidar sesiones de hasta 8–10 minutos boca abajo y combinar con masaje relajante.',
    ejercicios: [
      {
        codigo: 's8-tummy-masaje',
        titulo: 'Tummy Time + masaje relajante de espalda y brazos',
        categoria: 'Tummy Time',
        duracion: '8–10 min por sesión',
        descripcion: 'Antes o después del tiempo boca abajo, hazle caricias y masajes suaves desde los hombros hasta las piernas para relajar la musculatura trabajada.',
        diasSemana: [0, 1, 2, 3, 4, 5, 6]
      },
      {
        codigo: 's8-pataleo-libre',
        titulo: 'Juego de pataleo libre boca arriba',
        categoria: 'Motricidad',
        duracion: '5 min',
        descripcion: 'Déjalo descalzo en la manta para que patee libremente; puedes sujetar un pañuelo o juguete blando cerca de sus pies para que lo golpee.',
        diasSemana: [1, 3, 5]
      },
      {
        codigo: 's8-lectura-cuentos',
        titulo: 'Primeros cuentos de tela y rimas',
        categoria: 'Auditiva',
        duracion: '5 min',
        descripcion: 'Enséñale páginas con formas grandes y colores vivos mientras lees con ritmo y cambios suaves de entonación.',
        diasSemana: [2, 4, 6, 0]
      }
    ]
  },
  {
    semana: 9,
    mes: 3,
    etapa: 'Fuerza en hombros y soporte',
    objetivo: 'Sostener la cabeza a 90° con mayor firmeza y estimular el alcance con las manos.',
    ejercicios: [
      {
        codigo: 's9-tummy-juguetes',
        titulo: 'Tummy Time con arco de juegos o juguetes delante',
        categoria: 'Tummy Time',
        duracion: '10 min por sesión',
        descripcion: 'Coloca juguetes coloridos a su alcance frente a él mientras está boca abajo y anímale a despegar una manita para intentar tocarlos.',
        diasSemana: [0, 1, 2, 3, 4, 5, 6]
      },
      {
        codigo: 's9-gimnasio-boca-arriba',
        titulo: 'Golpear móviles en el gimnasio de actividades',
        categoria: 'Motricidad',
        duracion: '5–10 min',
        descripcion: 'Boca arriba bajo el arco de juegos, deja que observe los colgantes y practique coordinación ojo-mano intentando darles manotazos.',
        diasSemana: [1, 3, 5, 0]
      },
      {
        codigo: 's9-imitacion-sonidos',
        titulo: 'Juego de vocales y turnos de palabra',
        categoria: 'Auditiva',
        duracion: '5 min',
        descripcion: 'Pronuncia vocales largas ("aaa", "ooo") frente a él y deja silencio para que intente responder con balbuceos.',
        diasSemana: [2, 4, 6]
      }
    ]
  },
  {
    semana: 10,
    mes: 3,
    etapa: 'Fuerza en hombros y soporte',
    objetivo: 'Estimulación vestibular suave y fortalecimiento global de cuello y tronco.',
    ejercicios: [
      {
        codigo: 's10-tummy-avion',
        titulo: 'Postura del «avión» (balanceo suave en brazos)',
        categoria: 'Tummy Time',
        duracion: '10–12 min (combinado con suelo)',
        descripcion: 'Sostén al bebé boca abajo de forma segura sobre tus antebrazos en paralelo al suelo y paséalo suavemente por la habitación para que mire alrededor.',
        diasSemana: [0, 1, 2, 3, 4, 5, 6]
      },
      {
        codigo: 's10-pies-manos',
        titulo: 'Descubrir rodillas y pies',
        categoria: 'Motricidad',
        duracion: '5 min',
        descripcion: 'Boca arriba, acerca suavemente sus pies hacia sus manos o ponle calcetines de colores llamativos para despertar su curiosidad.',
        diasSemana: [1, 3, 5]
      },
      {
        codigo: 's10-musica-ritmo',
        titulo: 'Música tranquila y balanceo en brazos',
        categoria: 'Auditiva',
        duracion: '5–10 min',
        descripcion: 'Pon música suave y baila despacio con el bebé en brazos cambiando ligeramente de ritmo para estimular su sistema vestibular.',
        diasSemana: [2, 4, 6, 0]
      }
    ]
  },
  {
    semana: 11,
    mes: 3,
    etapa: 'Fuerza en hombros y soporte',
    objetivo: 'Desplazar peso hacia los laterales y preparar las bases del futuro volteo.',
    ejercicios: [
      {
        codigo: 's11-tummy-volteo',
        titulo: 'Tummy Time con transición al giro lateral',
        categoria: 'Tummy Time',
        duracion: '12–15 min por sesión',
        descripcion: 'Estando boca abajo, mueve un juguete llamativo lentamente hacia un lateral para invitarle a trasladar el peso y ensayar el inicio del giro.',
        diasSemana: [0, 1, 2, 3, 4, 5, 6]
      },
      {
        codigo: 's11-lado-a-lado',
        titulo: 'Juego tumbado de lado (decúbito lateral)',
        categoria: 'Motricidad',
        duracion: '3–5 min por cada lado',
        descripcion: 'Colócalo un ratito de lado (alternando izquierdo y derecho) con un juguete delante para que junte ambas manos y trabaje la simetría.',
        diasSemana: [1, 3, 5, 0]
      },
      {
        codigo: 's11-cucu-tras',
        titulo: 'Primeros juegos de «cucú-tras»',
        categoria: 'Visual',
        duracion: '3–5 min',
        descripcion: 'Tápate suavemente la cara con un pañuelo o tus manos y descúbrete sonriendo para estimular su atención y anticipación.',
        diasSemana: [2, 4, 6]
      }
    ]
  },
  {
    semana: 12,
    mes: 3,
    etapa: 'Fuerza en hombros y soporte',
    objetivo: 'Autonomía de apoyo en antebrazos alcanzando 20–30 minutos diarios acumulados de Tummy Time.',
    ejercicios: [
      {
        codigo: 's12-tummy-autonomia',
        titulo: 'Juego libre boca abajo en alfombra de actividades',
        categoria: 'Tummy Time',
        duracion: '15 min (20–30 min acumulados/día)',
        descripcion: 'Permítele jugar libremente apoyado en antebrazos rodeado de 2–3 juguetes seguros a su alcance para observar, estirar los brazos y levantar bien el pecho.',
        diasSemana: [0, 1, 2, 3, 4, 5, 6]
      },
      {
        codigo: 's12-traccion-suave',
        titulo: 'Estiramiento y abrazo de brazos',
        categoria: 'Motricidad',
        duracion: '3–5 min',
        descripcion: 'Boca arriba, abre suavemente sus brazos hacia los lados y crúzalos en un abrazo sobre su pecho, acompañando el movimiento con una canción.',
        diasSemana: [1, 3, 5]
      },
      {
        codigo: 's12-masaje-completo',
        titulo: 'Sesión de masaje relajante post-baño',
        categoria: 'Masaje',
        duracion: '5–10 min',
        descripcion: 'Masaje suave en piernas, barriga, brazos y espalda antes de dormir para reforzar el vínculo y ayudar a conciliar el sueño.',
        diasSemana: [2, 4, 6, 0]
      }
    ]
  }
];

function sumarMeses(fechaStr, meses) {
  const d = new Date(`${fechaStr}T00:00:00`);
  const diaOriginal = d.getDate();
  d.setMonth(d.getMonth() + meses);
  // Ajustar si el mes destino tiene menos días (p. ej. 31 ene + 1 mes)
  if (d.getDate() < diaOriginal) {
    d.setDate(0);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function calcularFechaVacunaSugerida(fechaNacimientoStr, edadRecomendada) {
  if (!fechaNacimientoStr) return '';
  switch (edadRecomendada) {
    case 'Recién nacido':
      return fechaNacimientoStr;
    case '2 meses':
      return sumarMeses(fechaNacimientoStr, 2);
    case '4 meses':
      return sumarMeses(fechaNacimientoStr, 4);
    case '6 meses':
      return sumarMeses(fechaNacimientoStr, 6);
    case '11 meses':
      return sumarMeses(fechaNacimientoStr, 11);
    case '12 meses':
      return sumarMeses(fechaNacimientoStr, 12);
    case '15 meses':
      return sumarMeses(fechaNacimientoStr, 15);
    default:
      return '';
  }
}

export function calcularSemanaBebe(fechaNacimientoStr, fechaStr) {
  if (!fechaNacimientoStr || !fechaStr) return null;
  const inicio = new Date(`${fechaNacimientoStr}T00:00:00Z`);
  const actual = new Date(`${fechaStr}T00:00:00Z`);
  const diffDias = Math.floor((actual - inicio) / 86400000);
  if (diffDias < 0) return { dias: diffDias, semana: null };
  return { dias: diffDias, semana: Math.floor(diffDias / 7) + 1 };
}

export function obtenerEjerciciosParaFecha(fechaNacimientoStr, fechaStr) {
  const info = calcularSemanaBebe(fechaNacimientoStr, fechaStr);
  if (!info || !info.semana || info.semana < 1 || info.semana > 12) return null;

  const planSemana = PLANNING_3_MESES.find((p) => p.semana === info.semana);
  if (!planSemana) return null;

  const diaSemana = new Date(`${fechaStr}T00:00:00`).getDay(); // 0=Dom..6=Sab
  const ejerciciosDelDia = planSemana.ejercicios.filter(
    (ej) => !ej.diasSemana || ej.diasSemana.includes(diaSemana)
  );

  return {
    semana: planSemana.semana,
    mes: planSemana.mes,
    etapa: planSemana.etapa,
    objetivo: planSemana.objetivo,
    ejercicios: ejerciciosDelDia
  };
}
