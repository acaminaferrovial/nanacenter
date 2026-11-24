import { useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { formatFechaCorta, formatFechaLarga, todayStr } from '../utils/date.js';
import {
  PLANNING_3_MESES,
  REGLAS_ORO_BEBE,
  calcularFechaVacunaSugerida,
  calcularSemanaBebe,
  obtenerEjerciciosParaFecha
} from '../data/bebePlanning3Meses.js';

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const TIPOS_CITA_RAPIDA = ['Revisión rutinaria', 'Pediatra', 'Enfermería', 'Urgencias', 'Especialista', 'Otra'];

const COLOR_CATEGORIA = {
  'Tummy Time': 'bg-rose-100 text-rose-700',
  Visual: 'bg-indigo-100 text-indigo-700',
  Auditiva: 'bg-amber-100 text-amber-800',
  Masaje: 'bg-teal-100 text-teal-700',
  Motricidad: 'bg-emerald-100 text-emerald-800'
};

export default function BebeCalendario({
  fechaNacimiento,
  onGuardarFechaNacimiento,
  revisiones,
  listaVacunas,
  actividadesBD,
  onRefrescar,
  onError
}) {
  const hoy = todayStr();
  const [mes, setMes] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy);
  const [fechaNacInput, setFechaNacInput] = useState(fechaNacimiento || '');
  const [guardandoFechaNac, setGuardandoFechaNac] = useState(false);

  // Formulario rápido de nueva cita médica en el día seleccionado
  const [nuevaCitaAbierta, setNuevaCitaAbierta] = useState(false);
  const [citaTipo, setCitaTipo] = useState(TIPOS_CITA_RAPIDA[0]);
  const [citaProfesional, setCitaProfesional] = useState('');
  const [citaResumen, setCitaResumen] = useState('');
  const [guardandoCita, setGuardandoCita] = useState(false);

  // Asignación rápida de fecha a una vacuna
  const [vacunaFechaEdit, setVacunaFechaEdit] = useState(null); // { codigo, fecha }
  const [guardandoVacuna, setGuardandoVacuna] = useState(false);

  // Guía completa 0-3 meses desplegable
  const [guiaAbierta, setGuiaAbierta] = useState(false);
  const [vacunasSinFechaAbierto, setVacunasSinFechaAbierto] = useState(false);

  // Sincronizar input si cambia desde fuera
  const fechaNacEfectiva = fechaNacimiento || '';

  // Mapa de actividades completadas: clave `${fecha}_${codigo}` -> actividadBD
  const mapaActividadesBD = useMemo(() => {
    const m = new Map();
    (actividadesBD || []).forEach((a) => {
      m.set(`${a.fecha}_${a.codigo}`, a);
    });
    return m;
  }, [actividadesBD]);

  // Vacunas con fecha efectiva (aplicada > prevista > sugerida por nacimiento)
  const vacunasConFecha = useMemo(() => {
    return (listaVacunas || [])
      .filter((v) => v.estado !== 'no_aplica')
      .map((v) => {
        const fechaAplicada = v.fechaAplicacion || '';
        const fechaPrevista = v.fechaPrevista || '';
        const fechaSugerida =
          !fechaAplicada && !fechaPrevista && fechaNacEfectiva
            ? calcularFechaVacunaSugerida(fechaNacEfectiva, v.edadRecomendada)
            : '';

        const fechaCalendario = fechaAplicada || fechaPrevista || fechaSugerida;
        const tipoFecha = fechaAplicada
          ? 'aplicada'
          : fechaPrevista
          ? 'prevista'
          : fechaSugerida
          ? 'sugerida'
          : 'sin_fecha';

        return {
          ...v,
          fechaCalendario,
          tipoFecha
        };
      });
  }, [listaVacunas, fechaNacEfectiva]);

  const vacunasSinFecha = useMemo(
    () => vacunasConFecha.filter((v) => !v.fechaCalendario),
    [vacunasConFecha]
  );

  // Mapas de eventos por fecha YYYY-MM-DD
  const citasPorFecha = useMemo(() => {
    const map = {};
    (revisiones || []).forEach((rev) => {
      if (rev.fecha) {
        if (!map[rev.fecha]) map[rev.fecha] = [];
        map[rev.fecha].push({ ...rev, _esProxima: false });
      }
      if (rev.proximaRevision) {
        if (!map[rev.proximaRevision]) map[rev.proximaRevision] = [];
        map[rev.proximaRevision].push({ ...rev, _esProxima: true });
      }
    });
    return map;
  }, [revisiones]);

  const vacunasPorFecha = useMemo(() => {
    const map = {};
    vacunasConFecha.forEach((v) => {
      if (!v.fechaCalendario) return;
      if (!map[v.fechaCalendario]) map[v.fechaCalendario] = [];
      map[v.fechaCalendario].push(v);
    });
    return map;
  }, [vacunasConFecha]);

  // Celdas del mes actual
  const celdas = useMemo(() => {
    const year = mes.getFullYear();
    const month = mes.getMonth();
    const primerDia = new Date(year, month, 1);
    const diasEnMes = new Date(year, month + 1, 0).getDate();
    const offset = (primerDia.getDay() + 6) % 7;

    const dias = [];
    for (let i = 0; i < offset; i++) dias.push(null);
    for (let d = 1; d <= diasEnMes; d++) {
      dias.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return dias;
  }, [mes]);

  function cambiarMes(delta) {
    setMes((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function irAHoy() {
    const d = new Date();
    setMes(new Date(d.getFullYear(), d.getMonth(), 1));
    setDiaSeleccionado(hoy);
  }

  async function handleGuardarFechaNacimiento(e) {
    e.preventDefault();
    setGuardandoFechaNac(true);
    try {
      await onGuardarFechaNacimiento(fechaNacInput || null);
    } finally {
      setGuardandoFechaNac(false);
    }
  }

  async function handleCrearCitaEnDia(e) {
    e.preventDefault();
    setGuardandoCita(true);
    onError('');
    try {
      await api.crearBebeRevision({
        fecha: diaSeleccionado,
        tipo: citaTipo,
        profesional: citaProfesional,
        resumen: citaResumen
      });
      setCitaProfesional('');
      setCitaResumen('');
      setNuevaCitaAbierta(false);
      await onRefrescar();
    } catch (err) {
      onError(err.message || 'No se pudo guardar la cita');
    } finally {
      setGuardandoCita(false);
    }
  }

  async function handleGuardarFechaVacuna(vacuna, nuevaFecha, marcarPuesta = false) {
    setGuardandoVacuna(true);
    onError('');
    try {
      const payload = {
        codigo: vacuna.codigo,
        nombre: vacuna.nombre,
        edadRecomendada: vacuna.edadRecomendada,
        dosis: vacuna.dosis,
        descripcion: vacuna.descripcion,
        estado: marcarPuesta ? 'puesta' : vacuna.estado,
        fechaAplicacion: marcarPuesta ? nuevaFecha || todayStr() : vacuna.fechaAplicacion || '',
        fechaPrevista: marcarPuesta ? vacuna.fechaPrevista || nuevaFecha || '' : nuevaFecha || '',
        lote: vacuna.lote || '',
        notas: vacuna.notas || '',
        personalizada: !!vacuna.personalizada
      };
      await api.guardarBebeVacuna(payload);
      setVacunaFechaEdit(null);
      await onRefrescar();
    } catch (err) {
      onError(err.message || 'No se pudo actualizar la fecha de la vacuna');
    } finally {
      setGuardandoVacuna(false);
    }
  }

  async function handleToggleEjercicio(ejercicio) {
    onError('');
    const existente = mapaActividadesBD.get(`${diaSeleccionado}_${ejercicio.codigo}`);
    const nuevoEstado = !(existente?.completada);
    try {
      await api.guardarBebeActividad({
        fecha: diaSeleccionado,
        codigo: ejercicio.codigo,
        titulo: ejercicio.titulo,
        categoria: ejercicio.categoria,
        completada: nuevoEstado
      });
      await onRefrescar();
    } catch (err) {
      onError(err.message || 'No se pudo actualizar el ejercicio');
    }
  }

  const tituloMes = mes.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const citasDia = citasPorFecha[diaSeleccionado] || [];
  const vacunasDia = vacunasPorFecha[diaSeleccionado] || [];
  const planDia = obtenerEjerciciosParaFecha(fechaNacEfectiva, diaSeleccionado);
  const edadHoy = calcularSemanaBebe(fechaNacEfectiva, hoy);

  return (
    <div className="space-y-4">
      {/* Banner fecha de nacimiento del bebé */}
      <section className="bg-white rounded-2xl shadow-sm border border-rose-100/70 p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="font-semibold text-rose-600 text-sm">🎂 Fecha de nacimiento del bebé</h2>
            <p className="text-[11px] text-gray-500">
              Se usa para calcular el planning de ejercicios (0–3 meses) y las fechas previstas de vacunas.
            </p>
          </div>
          {edadHoy && (
            <span className="text-xs font-semibold bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full">
              {edadHoy.dias >= 0
                ? `Semana ${edadHoy.semana} · ${edadHoy.dias} días`
                : `Faltan ${Math.abs(edadHoy.dias)} días`}
            </span>
          )}
        </div>

        <form onSubmit={handleGuardarFechaNacimiento} className="flex items-center gap-2">
          <input
            type="date"
            value={fechaNacInput}
            onChange={(e) => setFechaNacInput(e.target.value)}
            className="flex-1 text-xs rounded-lg border border-gray-300 px-2.5 py-1.5 bg-white"
          />
          <button
            type="submit"
            disabled={guardandoFechaNac}
            className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold disabled:opacity-50"
          >
            {guardandoFechaNac ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      </section>

      {/* Calendario mensual */}
      <section className="bg-white rounded-2xl shadow-sm border border-rose-100/70 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => cambiarMes(-1)} className="text-rose-500 px-2 text-lg font-bold">
            ‹
          </button>
          <div className="flex items-center gap-2">
            <span className="font-semibold capitalize text-sm text-gray-800">{tituloMes}</span>
            <button
              type="button"
              onClick={irAHoy}
              className="text-[11px] px-2 py-0.5 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              Hoy
            </button>
          </div>
          <button type="button" onClick={() => cambiarMes(1)} className="text-rose-500 px-2 text-lg font-bold">
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs text-gray-400">
          {DIAS_SEMANA.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {celdas.map((fecha, i) => {
            if (!fecha) return <div key={`blank-${i}`} />;
            const tieneCita = (citasPorFecha[fecha] || []).length > 0;
            const tieneVacuna = (vacunasPorFecha[fecha] || []).length > 0;
            const plan = obtenerEjerciciosParaFecha(fechaNacEfectiva, fecha);
            const tieneEjercicios = !!plan && plan.ejercicios.length > 0;

            const esHoy = fecha === hoy;
            const esSel = fecha === diaSeleccionado;
            const dia = Number(fecha.slice(-2));

            return (
              <button
                key={fecha}
                type="button"
                onClick={() => {
                  setDiaSeleccionado(fecha);
                  setNuevaCitaAbierta(false);
                }}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs transition-colors ${
                  esSel
                    ? 'bg-rose-500 text-white font-bold shadow-sm'
                    : esHoy
                    ? 'ring-2 ring-rose-400 bg-rose-50 text-rose-700 font-semibold'
                    : 'hover:bg-rose-50/70 text-gray-700'
                }`}
              >
                <span>{dia}</span>
                <div className="flex items-center gap-0.5 mt-0.5 h-1.5">
                  {tieneCita && (
                    <span className={`w-1.5 h-1.5 rounded-full ${esSel ? 'bg-white' : 'bg-rose-500'}`} />
                  )}
                  {tieneVacuna && (
                    <span className={`w-1.5 h-1.5 rounded-full ${esSel ? 'bg-amber-200' : 'bg-indigo-500'}`} />
                  )}
                  {tieneEjercicios && (
                    <span className={`w-1.5 h-1.5 rounded-full ${esSel ? 'bg-emerald-200' : 'bg-emerald-500'}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap pt-1 border-t border-rose-100/70">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Cita médica
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Vacuna
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ejercicios 0–3 meses
          </span>
        </div>
      </section>

      {/* Detalle del día seleccionado */}
      <section className="bg-white rounded-2xl shadow-sm border border-rose-100/70 p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="font-semibold text-rose-600 text-sm">
              📅 {formatFechaLarga(diaSeleccionado)}
            </h2>
            {planDia && (
              <p className="text-[11px] text-gray-500">
                Semana {planDia.semana} (Mes {planDia.mes}) · {planDia.etapa}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setNuevaCitaAbierta((v) => !v)}
            className="text-xs font-semibold text-rose-600 border border-rose-300 rounded-full px-3 py-1 hover:bg-rose-50"
          >
            {nuevaCitaAbierta ? 'Cerrar' : '+ Cita médica'}
          </button>
        </div>

        {/* Formulario rápido de cita médica para el día seleccionado */}
        {nuevaCitaAbierta && (
          <form
            onSubmit={handleCrearCitaEnDia}
            className="border border-rose-200 rounded-xl p-3 space-y-2 bg-rose-50/30"
          >
            <p className="text-xs font-semibold text-rose-700">
              Nueva cita médica para el {formatFechaCorta(diaSeleccionado)}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TIPOS_CITA_RAPIDA.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCitaTipo(t)}
                  className={`px-2 py-0.5 rounded-full text-[11px] border ${
                    citaTipo === t
                      ? 'bg-rose-500 text-white border-rose-500 font-medium'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Pediatra / Centro de salud (opcional)"
              value={citaProfesional}
              onChange={(e) => setCitaProfesional(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 px-2.5 py-1.5 bg-white"
            />
            <input
              type="text"
              placeholder="Motivo o notas de la cita"
              value={citaResumen}
              onChange={(e) => setCitaResumen(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 px-2.5 py-1.5 bg-white"
            />
            <button
              type="submit"
              disabled={guardandoCita}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {guardandoCita ? 'Guardando…' : 'Guardar cita'}
            </button>
          </form>
        )}

        {/* Citas médicas del día */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-rose-500">🩺 Citas médicas</h3>
          {citasDia.length === 0 ? (
            <p className="text-xs text-gray-400">No hay citas médicas para este día.</p>
          ) : (
            citasDia.map((c, idx) => (
              <div
                key={`${c._id}-${idx}`}
                className="border border-rose-100 rounded-xl p-2.5 bg-rose-50/30 space-y-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-800">{c.tipo}</span>
                  {c._esProxima && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                      Próxima revisión
                    </span>
                  )}
                </div>
                {c.profesional && <p className="text-[11px] text-gray-500">👩‍⚕️ {c.profesional}</p>}
                {c.resumen && <p className="text-xs text-gray-600">{c.resumen}</p>}
              </div>
            ))
          )}
        </div>

        {/* Vacunas del día */}
        <div className="space-y-2 pt-2 border-t border-rose-100/70">
          <h3 className="text-xs font-bold uppercase tracking-wide text-indigo-600">💉 Vacunas</h3>
          {vacunasDia.length === 0 ? (
            <p className="text-xs text-gray-400">No hay vacunas programadas para este día.</p>
          ) : (
            vacunasDia.map((v) => {
              const editandoFecha = vacunaFechaEdit?.codigo === v.codigo;
              return (
                <div
                  key={v.codigo}
                  className={`border rounded-xl p-2.5 space-y-1.5 ${
                    v.estado === 'puesta'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-indigo-50/30 border-indigo-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-800">
                        {v.nombre} {v.dosis && <span className="font-normal text-gray-500">· {v.dosis}</span>}
                      </p>
                      <span
                        className={`inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          v.estado === 'puesta'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.tipoFecha === 'prevista'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {v.estado === 'puesta'
                          ? 'Puesta'
                          : v.tipoFecha === 'prevista'
                          ? 'Fecha prevista'
                          : `Sugerida (${v.edadRecomendada})`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {v.estado !== 'puesta' && (
                        <button
                          type="button"
                          disabled={guardandoVacuna}
                          onClick={() => handleGuardarFechaVacuna(v, diaSeleccionado, true)}
                          className="px-2 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-semibold"
                        >
                          ✓ Puesta
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setVacunaFechaEdit(
                            editandoFecha ? null : { codigo: v.codigo, fecha: v.fechaCalendario || diaSeleccionado }
                          )
                        }
                        className="px-2 py-1 rounded-lg border border-indigo-200 text-indigo-600 text-[11px] font-medium bg-white"
                      >
                        {editandoFecha ? 'Cerrar' : 'Fecha'}
                      </button>
                    </div>
                  </div>

                  {editandoFecha && (
                    <div className="flex items-center gap-2 pt-1.5 border-t border-indigo-100">
                      <input
                        type="date"
                        value={vacunaFechaEdit.fecha}
                        onChange={(e) => setVacunaFechaEdit((prev) => ({ ...prev, fecha: e.target.value }))}
                        className="flex-1 text-xs rounded-lg border border-gray-300 px-2 py-1 bg-white"
                      />
                      <button
                        type="button"
                        disabled={guardandoVacuna}
                        onClick={() => handleGuardarFechaVacuna(v, vacunaFechaEdit.fecha, v.estado === 'puesta')}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500 text-white text-xs font-semibold"
                      >
                        Guardar
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Ejercicios y actividades del día (0–3 meses) */}
        <div className="space-y-2 pt-2 border-t border-rose-100/70">
          <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-600">
            🧸 Actividades y ejercicios del día (0–3 meses)
          </h3>

          {!fechaNacEfectiva ? (
            <p className="text-xs text-gray-500 bg-rose-50/50 rounded-xl p-2.5">
              Indica arriba la <strong>fecha de nacimiento del bebé</strong> para colocar automáticamente en el
              calendario los ejercicios de cada semana (semanas 1 a 12) y las fechas previstas de las vacunas.
            </p>
          ) : !planDia ? (
            <p className="text-xs text-gray-400">
              Este día está fuera de las primeras 12 semanas del bebé (0–3 meses).
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 italic">{planDia.objetivo}</p>
              {planDia.ejercicios.map((ej) => {
                const hecho = !!mapaActividadesBD.get(`${diaSeleccionado}_${ej.codigo}`)?.completada;
                const badgeClass = COLOR_CATEGORIA[ej.categoria] || 'bg-gray-100 text-gray-700';

                return (
                  <div
                    key={ej.codigo}
                    className={`rounded-xl border p-2.5 transition-colors ${
                      hecho ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-rose-100'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleEjercicio(ej)}
                        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                          hecho
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-gray-300 text-transparent hover:border-emerald-400'
                        }`}
                        title={hecho ? 'Marcar como pendiente' : 'Marcar como hecho'}
                      >
                        ✓
                      </button>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            className={`text-xs font-semibold ${
                              hecho ? 'line-through text-emerald-800/80' : 'text-gray-800'
                            }`}
                          >
                            {ej.titulo}
                          </span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
                            {ej.categoria}
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-500 font-medium">⏱ {ej.duracion}</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{ej.descripcion}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Asignar fecha rápida a vacunas sin fecha */}
      {vacunasSinFecha.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm border border-rose-100/70 p-4 space-y-3">
          <button
            type="button"
            onClick={() => setVacunasSinFechaAbierto((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-rose-400 text-xs">{vacunasSinFechaAbierto ? '▾' : '▸'}</span>
              <h2 className="font-semibold text-indigo-600 text-sm">
                💉 Vacunas sin fecha ({vacunasSinFecha.length})
              </h2>
            </div>
            <span className="text-[11px] text-gray-400">Asignar fecha</span>
          </button>

          {vacunasSinFechaAbierto && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Puedes poner fecha prevista a cualquier vacuna aquí (o añadir la fecha de nacimiento arriba para
                calcularlas automáticamente).
              </p>
              {vacunasSinFecha.map((v) => (
                <div
                  key={v.codigo}
                  className="flex items-center justify-between gap-2 border border-rose-100 rounded-xl p-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {v.nombre} {v.dosis ? `· ${v.dosis}` : ''}
                    </p>
                    <p className="text-[11px] text-gray-400">{v.edadRecomendada}</p>
                  </div>
                  <input
                    type="date"
                    onChange={(e) => {
                      if (e.target.value) handleGuardarFechaVacuna(v, e.target.value, false);
                    }}
                    className="text-xs rounded-lg border border-gray-300 px-2 py-1 bg-white shrink-0"
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Guía completa desplegable 0–3 meses */}
      <section className="bg-white rounded-2xl shadow-sm border border-rose-100/70 p-4 space-y-3">
        <button
          type="button"
          onClick={() => setGuiaAbierta((v) => !v)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-rose-400 text-xs">{guiaAbierta ? '▾' : '▸'}</span>
            <h2 className="font-semibold text-rose-600 text-sm">
              📖 Planning completo de ejercicios (0 a 3 meses)
            </h2>
          </div>
          <span className="text-[11px] text-gray-400">12 semanas</span>
        </button>

        {guiaAbierta && (
          <div className="space-y-3 pt-1">
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 space-y-1">
              <p className="text-xs font-semibold text-amber-800">⭐ Reglas de oro de pediatría</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-900">
                {REGLAS_ORO_BEBE.map((regla, i) => (
                  <li key={i}>{regla}</li>
                ))}
              </ul>
            </div>

            {PLANNING_3_MESES.map((sem) => (
              <div key={sem.semana} className="border border-rose-100 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-rose-600">
                    Semana {sem.semana} · Mes {sem.mes}
                  </span>
                  <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-medium">
                    {sem.etapa}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{sem.objetivo}</p>
                <div className="space-y-1.5">
                  {sem.ejercicios.map((ej) => (
                    <div key={ej.codigo} className="bg-rose-50/30 rounded-lg p-2 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-800">{ej.titulo}</span>
                        <span className="text-[10px] text-rose-500 font-medium shrink-0">{ej.duracion}</span>
                      </div>
                      <p className="text-[11px] text-gray-600">{ej.descripcion}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
