import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { addDays, formatFechaLarga, todayStr } from '../utils/date.js';
import { calcularExposicionUV, IU_MAXIMO_SESION } from '../utils/vitaminaD.js';

export const SINTOMA_TIPOS = [
  'Náuseas', 'Vómitos', 'Dolor lumbar', 'Cansancio', 'Hinchazón', 'Dolor de cabeza',
  'Mareo', 'Acidez', 'Calambres', 'Dolor pélvico', 'Insomnio',
  'Dolor de tetas', 'Gases', 'Cólicos', 'Mal aliento'
];

const EJERCICIO_TIPOS = ['Pilates', 'Yoga', 'Movilidad', 'Estiramientos', 'Caminar', 'Fuerza', 'Aeróbic', 'Cardio'];
const CANTIDAD_POPO = ['poca', 'normal', 'abundante'];
const COLOR_POPO = ['Negro', 'Marrón', 'Marrón ennegrecido', 'Marrón amarillento', 'Marrón anaranjado'];
const INFUSION_TIPOS = ['Manzanilla', 'Romero', 'Tomillo', 'Duermebien', 'Meabien', 'Cagabien'];
const UBICACIONES = ['Casa'];
const PARTES_CUERPO_OPCIONES = [
  { label: 'Cara y manos', valor: 0.1 },
  { label: 'Camiseta y pantalón corto', valor: 0.3 },
  { label: 'Tirantes y pantalón corto', valor: 0.5 },
  { label: 'Bañador', valor: 0.7 },
  { label: 'Cuerpo entero', valor: 1 }
];
const BSA_POR_DEFECTO = 1;

const MOMENTOS = ['mañana', 'tarde', 'noche'];
const MOMENTO_KEY_MAP = { 'mañana': 'manana', tarde: 'tarde', noche: 'noche' };

const SECTION_IDS = [
  'sintomas', 'emocional', 'sueno', 'recuperacion', 'peso', 'nutricion', 'transito', 'ejercicio',
  'actividad', 'sol', 'medicacion', 'infusiones', 'miccion', 'momentos', 'diario'
];

const SECTION_FIELDS = {
  sintomas: ['sintomas'],
  emocional: ['emocional'],
  sueno: ['sueno'],
  peso: ['peso'],
  nutricion: ['nutricion'],
  transito: ['transito'],
  ejercicio: ['ejercicio'],
  actividad: ['actividad'],
  recuperacion: ['recuperacion'],
  sol: ['exposicionSolar'],
  medicacion: ['medicacion'],
  infusiones: ['infusiones'],
  miccion: ['miccion'],
  momentos: ['momentos'],
  diario: ['diario', 'resumenDia']
};

function emptyRegistro() {
  return {
    sintomas: [],
    emocional: { animo: null, ansiedad: null, estres: null, irritabilidad: null, energia: null, nota: '' },
    sueno: { horas: '', calidad: null, despertares: '', dificultadConciliar: false, sensacionAlDespertar: '', nota: '' },
    peso: '',
    nutricion: { comidas: '', hambre: null },
    transito: { deposiciones: [], estrenimiento: false, diarrea: false, nota: '' },
    ejercicio: [],
    actividad: { pasos: '', caloriasActivas: '', porcentajeActividad: '', fuente: null },
    recuperacion: { ansCharge: '', hrvMs: '', frecuenciaRespiratoria: '', fuente: null },
    exposicionSolar: [],
    medicacion: [],
    infusiones: [],
    miccion: { frecuencia: '', nota: '' },
    momentos: {
      manana: { nota: '', energia: null },
      tarde: { nota: '', energia: null },
      noche: { nota: '', energia: null }
    },
    diario: '',
    resumenDia: ''
  };
}

function toggleArrayValue(arr, value) {
  const lista = arr || [];
  return lista.includes(value) ? lista.filter((v) => v !== value) : [...lista, value];
}

function Section({ id, title, open, hasContent, onToggle, onCopy, children }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="w-full flex items-center justify-between px-4 py-3">
        <button type="button" onClick={() => onToggle(id)} className="flex items-center gap-2 font-semibold text-rose-600 flex-1 text-left">
          {title}
          {hasContent && <span className="w-2 h-2 rounded-full bg-rose-400" aria-hidden="true" />}
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {onCopy && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopy(id);
              }}
              className="text-xs text-rose-400 border border-rose-200 rounded-full px-2 py-0.5"
            >
              Copiar de ayer
            </button>
          )}
          <button type="button" onClick={() => onToggle(id)} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>
            ⌄
          </button>
        </div>
      </div>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </section>
  );
}

function esVacio(v) {
  return v === '' || v === null || v === undefined;
}

function hasSintomas(r) {
  return r.sintomas.length > 0;
}
function hasEmocional(r) {
  const e = r.emocional;
  return e.animo !== null || e.ansiedad !== null || e.estres !== null || e.irritabilidad !== null || e.energia !== null || e.nota !== '';
}
function hasSueno(r) {
  const s = r.sueno;
  return !esVacio(s.horas) || !esVacio(s.calidad) || !esVacio(s.despertares) || s.dificultadConciliar || !esVacio(s.sensacionAlDespertar) || !esVacio(s.nota);
}
function hasPeso(r) {
  return !esVacio(r.peso);
}
function hasNutricion(r) {
  const n = r.nutricion;
  return !esVacio(n.comidas) || !esVacio(n.hambre);
}
function hasTransito(r) {
  const t = r.transito;
  return t.deposiciones.length > 0 || t.estrenimiento || t.diarrea || !esVacio(t.nota);
}
function hasEjercicio(r) {
  return r.ejercicio.length > 0;
}
function hasActividad(r) {
  return !esVacio(r.actividad?.pasos) || !esVacio(r.actividad?.caloriasActivas) || !esVacio(r.actividad?.porcentajeActividad);
}
function hasRecuperacion(r) {
  return !esVacio(r.recuperacion?.ansCharge) || !esVacio(r.recuperacion?.hrvMs) || !esVacio(r.recuperacion?.frecuenciaRespiratoria);
}
function hasSol(r) {
  return r.exposicionSolar.length > 0;
}
function hasMedicacion(r) {
  return r.medicacion.length > 0;
}
function hasInfusiones(r) {
  return r.infusiones.length > 0;
}
function hasMiccion(r) {
  return !esVacio(r.miccion.frecuencia) || !esVacio(r.miccion.nota);
}
function hasMomentos(r) {
  return Object.values(r.momentos).some((m) => m && (!esVacio(m.energia) || !esVacio(m.nota)));
}
function hasDiario(r) {
  return !esVacio(r.diario) || !esVacio(r.resumenDia);
}

function computeOpenSections(registro) {
  return {
    sintomas: hasSintomas(registro),
    emocional: hasEmocional(registro),
    sueno: hasSueno(registro),
    peso: hasPeso(registro),
    nutricion: hasNutricion(registro),
    transito: hasTransito(registro),
    ejercicio: hasEjercicio(registro),
    actividad: hasActividad(registro),
    recuperacion: hasRecuperacion(registro),
    sol: hasSol(registro),
    medicacion: hasMedicacion(registro),
    infusiones: hasInfusiones(registro),
    miccion: hasMiccion(registro),
    momentos: hasMomentos(registro),
    diario: hasDiario(registro)
  };
}

function BadgePolar() {
  return <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">Polar</span>;
}

function BotonPolar({ onClick, cargando, mensaje }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={cargando}
        className="text-xs text-blue-600 border border-blue-200 rounded-full px-3 py-1 disabled:opacity-50"
      >
        {cargando ? 'Trayendo…' : 'Traer de Polar'}
      </button>
      {mensaje && <span className="text-xs text-gray-500">{mensaje}</span>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <span className="block text-sm text-gray-600 mb-1">{label}</span>
      {children}
    </div>
  );
}

function ScalePicker({ value, onChange, max = 10 }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {Array.from({ length: max + 1 }, (_, i) => i).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          className={`w-8 h-8 rounded-full text-sm font-medium border ${
            value === n ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-600 border-gray-300'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function ToggleChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border capitalize ${
        active ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-600 border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

const BRISTOL_LABELS = {
  1: 'Bolitas duras',
  2: 'Grumosa',
  3: 'Agrietada',
  4: 'Lisa',
  5: 'Blanda',
  6: 'Pastosa',
  7: 'Líquida'
};

function BristolIcon({ tipo, className = 'w-5 h-5' }) {
  const shapes = {
    1: (
      <>
        <circle cx="5" cy="12" r="3" />
        <circle cx="12" cy="12" r="3" />
        <circle cx="19" cy="12" r="3" />
      </>
    ),
    2: (
      <>
        <ellipse cx="12" cy="12" rx="9" ry="4.2" />
        <circle cx="6" cy="12" r="1" fill="white" />
        <circle cx="12" cy="12" r="1" fill="white" />
        <circle cx="18" cy="12" r="1" fill="white" />
      </>
    ),
    3: (
      <>
        <rect x="3" y="9" width="18" height="6" rx="3" />
        <path d="M8 9v6M16 9v6" stroke="white" strokeWidth="1" fill="none" />
      </>
    ),
    4: <rect x="3" y="9.5" width="18" height="5" rx="2.5" />,
    5: (
      <>
        <ellipse cx="7" cy="12" rx="4.5" ry="3.5" />
        <ellipse cx="16" cy="12" rx="4.5" ry="3.5" />
      </>
    ),
    6: <path d="M3 14c1-4 3-5 6-4s4 3 7 2 4-3 5-1c-1 4-4 6-9 6s-9-1-9-3z" />,
    7: (
      <path
        d="M2 10c2 2 4-2 6 0s4-2 6 0 4-2 6 0 4-2 6 0"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    )
  };
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      {shapes[tipo]}
    </svg>
  );
}

function BristolPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {[1, 2, 3, 4, 5, 6, 7].map((tipo) => (
        <button
          key={tipo}
          type="button"
          onClick={() => onChange(value === tipo ? null : tipo)}
          className={`flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 ${
            value === tipo ? 'bg-amber-700 text-white border-amber-700' : 'bg-white text-amber-800 border-gray-300'
          }`}
        >
          <BristolIcon tipo={tipo} />
          <span className="text-[10px] leading-tight text-center">
            {tipo}. {BRISTOL_LABELS[tipo]}
          </span>
        </button>
      ))}
    </div>
  );
}

function TextInput({ value, ...props }) {
  return (
    <input
      {...props}
      value={value ?? ''}
      className={`w-full text-sm rounded-lg border border-gray-300 px-3 py-1.5 ${props.className || ''}`}
    />
  );
}

function TextArea({ value, ...props }) {
  return (
    <textarea
      {...props}
      value={value ?? ''}
      className={`w-full text-sm rounded-lg border border-gray-300 px-3 py-2 ${props.className || ''}`}
    />
  );
}

function updateAtPath(obj, path, value) {
  const next = structuredClone(obj);
  const keys = path.split('.');
  let cursor = next;
  for (let i = 0; i < keys.length - 1; i++) cursor = cursor[keys[i]];
  cursor[keys[keys.length - 1]] = value;
  return next;
}

export default function RegistroDia() {
  const { fecha: fechaParam } = useParams();
  const fecha = fechaParam || todayStr();
  const esHoy = fecha === todayStr();

  const [registro, setRegistro] = useState(emptyRegistro());
  const [openSections, setOpenSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [uvCargando, setUvCargando] = useState({});
  const [uvError, setUvError] = useState({});
  const [perfil, setPerfil] = useState(null);
  const [polarSincronizando, setPolarSincronizando] = useState({});
  const [polarMensaje, setPolarMensaje] = useState({});

  useEffect(() => {
    api.getPerfil().then(setPerfil).catch(() => {});
  }, []);

  async function sincronizarConPolar(tipo, campo) {
    setPolarSincronizando((prev) => ({ ...prev, [tipo]: true }));
    setPolarMensaje((prev) => ({ ...prev, [tipo]: '' }));
    try {
      const resultado = await api.sincronizarPolar(tipo, fecha);
      const actualizado = await api.getRegistro(fecha).catch(() => null);
      if (actualizado && actualizado[campo] !== undefined) {
        setRegistro((prev) => ({ ...prev, [campo]: actualizado[campo] }));
      }
      setPolarMensaje((prev) => ({ ...prev, [tipo]: resultado.mensaje || 'Actualizado desde Polar' }));
    } catch (err) {
      setPolarMensaje((prev) => ({ ...prev, [tipo]: err.message }));
    } finally {
      setPolarSincronizando((prev) => ({ ...prev, [tipo]: false }));
      setTimeout(() => setPolarMensaje((prev) => ({ ...prev, [tipo]: '' })), 5000);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSavedAt(null);
    api
      .getRegistro(fecha)
      .then((data) => {
        if (cancelled) return;
        const { _id, usuarioId, fecha: _fecha, createdAt, updatedAt, __v, ...resto } = data;
        const merged = { ...emptyRegistro(), ...resto };
        setRegistro(merged);
        setOpenSections(computeOpenSections(merged));
      })
      .catch(() => {
        if (cancelled) return;
        setRegistro(emptyRegistro());
        setOpenSections({});
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [fecha]);

  function toggleSection(id) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function colapsarOExpandirTodo() {
    const todosAbiertos = SECTION_IDS.every((id) => openSections[id]);
    const next = {};
    SECTION_IDS.forEach((id) => {
      next[id] = !todosAbiertos;
    });
    setOpenSections(next);
  }

  function update(path, value) {
    setRegistro((prev) => updateAtPath(prev, path, value));
  }

  function addItem(listKey, item) {
    setRegistro((prev) => ({ ...prev, [listKey]: [...prev[listKey], item] }));
  }

  function updateItem(listKey, index, patch) {
    setRegistro((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((item, i) => (i === index ? { ...item, ...patch } : item))
    }));
  }

  function removeItem(listKey, index) {
    setRegistro((prev) => ({ ...prev, [listKey]: prev[listKey].filter((_, i) => i !== index) }));
  }

  function addDeposicion() {
    setRegistro((prev) => ({
      ...prev,
      transito: {
        ...prev.transito,
        deposiciones: [
          ...prev.transito.deposiciones,
          { hora: '', tipoBristol: null, cantidad: null, color: null, evacuacionCompleta: null, dolor: false, nota: '' }
        ]
      }
    }));
  }

  function updateDeposicion(index, patch) {
    setRegistro((prev) => ({
      ...prev,
      transito: {
        ...prev.transito,
        deposiciones: prev.transito.deposiciones.map((d, i) => (i === index ? { ...d, ...patch } : d))
      }
    }));
  }

  function removeDeposicion(index) {
    setRegistro((prev) => ({
      ...prev,
      transito: { ...prev.transito, deposiciones: prev.transito.deposiciones.filter((_, i) => i !== index) }
    }));
  }

  async function copiarSeccion(id) {
    try {
      const anterior = await api.getRegistro(addDays(fecha, -1));
      const campos = SECTION_FIELDS[id];
      const patch = {};
      campos.forEach((campo) => {
        patch[campo] = anterior[campo] !== undefined ? anterior[campo] : emptyRegistro()[campo];
      });
      setRegistro((prev) => ({ ...prev, ...patch }));
      setOpenSections((prev) => ({ ...prev, [id]: true }));
    } catch {
      setErrorMsg('No hay registro del día anterior para copiar.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  }

  async function recalcularExposicion(index, overrides = {}) {
    const entrada = { ...registro.exposicionSolar[index], ...overrides };
    const { ubicacion, horaInicio, duracion, spf, factorSpf, bsaFraccion } = entrada;
    if (!ubicacion || !horaInicio) return;

    setUvCargando((prev) => ({ ...prev, [index]: true }));
    setUvError((prev) => ({ ...prev, [index]: '' }));
    try {
      const { uvIndex } = await api.consultarUV(ubicacion, fecha, horaInicio, Number(duracion) || 0);
      const resultado = calcularExposicionUV({
        uvIndex,
        duracionMin: Number(duracion) || 0,
        fototipo: perfil?.fototipo,
        alturaCm: perfil?.alturaCm,
        pesoKg: Number(registro.peso) || null,
        edad: perfil?.edad,
        bsaFraccion,
        spfFactor: spf ? Number(factorSpf) || 1 : 1
      });
      updateItem('exposicionSolar', index, {
        uvIndex,
        porcentajeTiempoSeguro: resultado?.porcentajeTiempoSeguro ?? null,
        vitaminaDIU: resultado?.vitaminaDIU ?? null
      });
    } catch {
      setUvError((prev) => ({ ...prev, [index]: 'No se pudo calcular el UV' }));
    } finally {
      setUvCargando((prev) => ({ ...prev, [index]: false }));
    }
  }

  async function guardar() {
    setSaving(true);
    setErrorMsg('');
    try {
      await api.guardarRegistro({ ...registro, fecha });
      setSavedAt(new Date());
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-gray-500">Cargando…</div>;
  }

  return (
    <div className="p-4 pb-28 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {!esHoy && (
            <Link to="/calendario" className="text-rose-500 text-xl leading-none shrink-0">
              ←
            </Link>
          )}
          <h1 className="text-xl font-bold text-rose-600 truncate">{esHoy ? 'Hoy' : formatFechaLarga(fecha)}</h1>
        </div>
        <button
          type="button"
          onClick={colapsarOExpandirTodo}
          className="text-sm text-rose-500 border border-rose-300 rounded-full px-3 py-1 whitespace-nowrap shrink-0"
        >
          {SECTION_IDS.every((id) => openSections[id]) ? 'Colapsar todo' : 'Expandir todo'}
        </button>
      </div>

      <Section id="sintomas" title="Síntomas" open={!!openSections.sintomas} onToggle={toggleSection} onCopy={copiarSeccion} hasContent={hasSintomas(registro)}>
        <div className="flex flex-wrap gap-2">
          {SINTOMA_TIPOS.map((tipo) => (
            <ToggleChip key={tipo} onClick={() => addItem('sintomas', { tipo, momento: [], duracion: '', nota: '' })}>
              + {tipo}
            </ToggleChip>
          ))}
        </div>
        <div className="space-y-3 mt-2">
          {registro.sintomas.map((s, i) => (
            <div key={i} className="border border-rose-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{s.tipo}</span>
                <button type="button" onClick={() => removeItem('sintomas', i)} className="text-gray-400 text-sm">
                  Quitar
                </button>
              </div>
              <div className="space-y-2">
                {MOMENTOS.map((m) => {
                  const entrada = (s.momento || []).find((x) => x.momento === m);
                  return (
                    <div key={m} className="space-y-1">
                      <ToggleChip
                        active={!!entrada}
                        onClick={() =>
                          updateItem('sintomas', i, {
                            momento: entrada
                              ? s.momento.filter((x) => x.momento !== m)
                              : [...(s.momento || []), { momento: m, intensidad: 5 }]
                          })
                        }
                      >
                        {m}
                      </ToggleChip>
                      {entrada && (
                        <ScalePicker
                          value={entrada.intensidad}
                          onChange={(v) =>
                            updateItem('sintomas', i, {
                              momento: s.momento.map((x) => (x.momento === m ? { ...x, intensidad: v } : x))
                            })
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <TextInput placeholder="Nota (opcional)" value={s.nota} onChange={(e) => updateItem('sintomas', i, { nota: e.target.value })} />
            </div>
          ))}
        </div>
      </Section>

      <Section id="emocional" title="Estado emocional" open={!!openSections.emocional} onToggle={toggleSection} onCopy={copiarSeccion} hasContent={hasEmocional(registro)}>
        <Field label="Ánimo">
          <ScalePicker value={registro.emocional.animo} onChange={(v) => update('emocional.animo', v)} />
        </Field>
        <Field label="Ansiedad">
          <ScalePicker value={registro.emocional.ansiedad} onChange={(v) => update('emocional.ansiedad', v)} />
        </Field>
        <Field label="Estrés">
          <ScalePicker value={registro.emocional.estres} onChange={(v) => update('emocional.estres', v)} />
        </Field>
        <Field label="Irritabilidad">
          <ScalePicker value={registro.emocional.irritabilidad} onChange={(v) => update('emocional.irritabilidad', v)} />
        </Field>
        <Field label="Energía">
          <ScalePicker value={registro.emocional.energia} onChange={(v) => update('emocional.energia', v)} />
        </Field>
        <TextInput placeholder="Reflexión (opcional)" value={registro.emocional.nota} onChange={(e) => update('emocional.nota', e.target.value)} />
      </Section>

      <Section id="sueno" title="Sueño" open={!!openSections.sueno} onToggle={toggleSection} onCopy={copiarSeccion} hasContent={hasSueno(registro)}>
        <BotonPolar
          onClick={() => sincronizarConPolar('sueno', 'sueno')}
          cargando={!!polarSincronizando.sueno}
          mensaje={polarMensaje.sueno}
        />
        {registro.sueno.fuente === 'polar' && (
          <div className="flex items-center justify-between bg-blue-50 rounded-xl p-2 text-xs text-gray-600">
            <div className="space-x-3">
              {!esVacio(registro.sueno.faseProfundoMin) && <span>Sueño profundo: {registro.sueno.faseProfundoMin} min</span>}
              {!esVacio(registro.sueno.faseREMMin) && <span>REM: {registro.sueno.faseREMMin} min</span>}
              {!esVacio(registro.sueno.puntuacion) && <span>Puntuación Polar: {registro.sueno.puntuacion}</span>}
            </div>
            <BadgePolar />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Horas dormidas">
            <TextInput type="number" step="0.5" value={registro.sueno.horas} onChange={(e) => update('sueno.horas', e.target.value)} />
          </Field>
          <Field label="Despertares">
            <TextInput type="number" value={registro.sueno.despertares} onChange={(e) => update('sueno.despertares', e.target.value)} />
          </Field>
        </div>
        <Field label="Calidad">
          <ScalePicker value={registro.sueno.calidad} onChange={(v) => update('sueno.calidad', v)} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={registro.sueno.dificultadConciliar}
            onChange={(e) => update('sueno.dificultadConciliar', e.target.checked)}
          />
          Dificultad para conciliar el sueño
        </label>
        <TextInput
          placeholder="Sensación al despertar"
          value={registro.sueno.sensacionAlDespertar}
          onChange={(e) => update('sueno.sensacionAlDespertar', e.target.value)}
        />
      </Section>

      <Section id="recuperacion" title="Recuperación nocturna" open={!!openSections.recuperacion} onToggle={toggleSection} onCopy={copiarSeccion} hasContent={hasRecuperacion(registro)}>
        <BotonPolar
          onClick={() => sincronizarConPolar('recuperacion', 'recuperacion')}
          cargando={!!polarSincronizando.recuperacion}
          mensaje={polarMensaje.recuperacion}
        />
        {hasRecuperacion(registro) || !esVacio(registro.sueno.puntuacion) ? (
          <div className="flex items-center justify-between bg-blue-50 rounded-xl p-3">
            <div className="text-sm text-gray-700 space-y-0.5">
              {!esVacio(registro.sueno.puntuacion) && <p>Sleep Score: {registro.sueno.puntuacion} / 100</p>}
              {!esVacio(registro.recuperacion.ansCharge) && <p>ANS Charge: {registro.recuperacion.ansCharge}</p>}
              {!esVacio(registro.recuperacion.hrvMs) && <p>HRV: {registro.recuperacion.hrvMs} ms</p>}
              {!esVacio(registro.recuperacion.frecuenciaRespiratoria) && (
                <p>Frecuencia respiratoria: {registro.recuperacion.frecuenciaRespiratoria} rpm</p>
              )}
            </div>
            <BadgePolar />
          </div>
        ) : (
          <p className="text-sm text-gray-400">Todavía no hay datos de recuperación traídos de Polar para este día.</p>
        )}
      </Section>

      <Section id="peso" title="Peso" open={!!openSections.peso} onToggle={toggleSection} onCopy={copiarSeccion} hasContent={hasPeso(registro)}>
        <TextInput type="number" step="0.1" placeholder="kg" value={registro.peso} onChange={(e) => update('peso', e.target.value)} />
      </Section>

      <Section id="nutricion" title="Alimentación" open={!!openSections.nutricion} onToggle={toggleSection} onCopy={copiarSeccion} hasContent={hasNutricion(registro)}>
        <Field label="Número de comidas">
          <ScalePicker value={registro.nutricion.comidas} onChange={(v) => update('nutricion.comidas', v)} max={5} />
        </Field>
        <Field label="Hambre / apetito">
          <ScalePicker value={registro.nutricion.hambre} onChange={(v) => update('nutricion.hambre', v)} />
        </Field>
      </Section>

      <Section id="transito" title="Tránsito intestinal" open={!!openSections.transito} onToggle={toggleSection} onCopy={copiarSeccion} hasContent={hasTransito(registro)}>
        <div className="space-y-3">
          {registro.transito.deposiciones.map((dep, i) => (
            <div key={i} className="border border-amber-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Deposición {i + 1}</span>
                <button type="button" onClick={() => removeDeposicion(i)} className="text-gray-400 text-sm">
                  Quitar
                </button>
              </div>
              <Field label="Hora">
                <TextInput type="time" className="w-32" value={dep.hora} onChange={(e) => updateDeposicion(i, { hora: e.target.value })} />
              </Field>
              <Field label="Escala de Bristol">
                <BristolPicker value={dep.tipoBristol} onChange={(v) => updateDeposicion(i, { tipoBristol: v })} />
              </Field>
              <Field label="Cantidad">
                <div className="flex gap-2">
                  {CANTIDAD_POPO.map((c) => (
                    <ToggleChip key={c} active={dep.cantidad === c} onClick={() => updateDeposicion(i, { cantidad: dep.cantidad === c ? null : c })}>
                      {c}
                    </ToggleChip>
                  ))}
                </div>
              </Field>
              <Field label="Color">
                <div className="flex flex-wrap gap-2">
                  {COLOR_POPO.map((c) => (
                    <ToggleChip key={c} active={dep.color === c} onClick={() => updateDeposicion(i, { color: dep.color === c ? null : c })}>
                      {c}
                    </ToggleChip>
                  ))}
                </div>
              </Field>
              <Field label="Evacuación">
                <div className="flex gap-2">
                  <ToggleChip active={dep.evacuacionCompleta === true} onClick={() => updateDeposicion(i, { evacuacionCompleta: dep.evacuacionCompleta === true ? null : true })}>
                    Completa
                  </ToggleChip>
                  <ToggleChip active={dep.evacuacionCompleta === false} onClick={() => updateDeposicion(i, { evacuacionCompleta: dep.evacuacionCompleta === false ? null : false })}>
                    Incompleta
                  </ToggleChip>
                </div>
              </Field>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={dep.dolor} onChange={(e) => updateDeposicion(i, { dolor: e.target.checked })} />
                Con dolor
              </label>
              <TextInput placeholder="Nota (opcional)" value={dep.nota} onChange={(e) => updateDeposicion(i, { nota: e.target.value })} />
            </div>
          ))}
          <button type="button" onClick={addDeposicion} className="text-sm text-rose-500 border border-rose-300 rounded-full px-3 py-1">
            + Añadir deposición
          </button>
        </div>

        <div className="pt-2 border-t border-gray-100 space-y-2">
          <div className="flex gap-4 text-sm text-gray-600">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={registro.transito.estrenimiento} onChange={(e) => update('transito.estrenimiento', e.target.checked)} />
              Estreñimiento
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={registro.transito.diarrea} onChange={(e) => update('transito.diarrea', e.target.checked)} />
              Diarrea
            </label>
          </div>
          <TextInput placeholder="Nota general (opcional)" value={registro.transito.nota} onChange={(e) => update('transito.nota', e.target.value)} />
        </div>
      </Section>

      <Section id="ejercicio" title="Ejercicio" open={!!openSections.ejercicio} onToggle={toggleSection} onCopy={copiarSeccion} hasContent={hasEjercicio(registro)}>
        <BotonPolar
          onClick={() => sincronizarConPolar('ejercicios', 'ejercicio')}
          cargando={!!polarSincronizando.ejercicios}
          mensaje={polarMensaje.ejercicios}
        />
        {registro.ejercicio.map((ej, i) => (
          <div key={i} className="border border-rose-100 rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              {ej.fuente === 'polar' ? <BadgePolar /> : <span />}
              <button type="button" onClick={() => removeItem('ejercicio', i)} className="text-gray-400 text-sm">Quitar</button>
            </div>
            <Field label="Tipo">
              <div className="flex flex-wrap gap-2">
                {EJERCICIO_TIPOS.map((tipo) => (
                  <ToggleChip key={tipo} active={ej.tipo === tipo} onClick={() => updateItem('ejercicio', i, { tipo })}>
                    {tipo}
                  </ToggleChip>
                ))}
              </div>
              {ej.fuente === 'polar' && ej.deportePolar && (
                <p className="text-xs text-gray-400 mt-1">Deporte según Polar: {ej.deportePolar}</p>
              )}
            </Field>
            <TextInput type="number" placeholder="Minutos" value={ej.duracion} onChange={(e) => updateItem('ejercicio', i, { duracion: e.target.value })} />
            <div className="flex gap-2">
              {['suave', 'moderada', 'intensa'].map((nivel) => (
                <ToggleChip key={nivel} active={ej.intensidad === nivel} onClick={() => updateItem('ejercicio', i, { intensidad: nivel })}>
                  {nivel}
                </ToggleChip>
              ))}
            </div>
            {ej.fuente === 'polar' && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-500 bg-blue-50 rounded-lg p-2">
                {ej.calorias != null && <span>Calorías: {ej.calorias}</span>}
                {ej.distanciaKm != null && <span>Distancia: {ej.distanciaKm} km</span>}
                {ej.fcMedia != null && <span>FC media: {ej.fcMedia}</span>}
                {ej.fcMaxima != null && <span>FC máxima: {ej.fcMaxima}</span>}
              </div>
            )}
            <TextInput placeholder="Molestias (opcional)" value={ej.molestias} onChange={(e) => updateItem('ejercicio', i, { molestias: e.target.value })} />
          </div>
        ))}
        <button type="button" onClick={() => addItem('ejercicio', { tipo: null, duracion: '', intensidad: 'moderada', sensaciones: '', molestias: '', fuente: 'manual' })} className="text-sm text-rose-500 border border-rose-300 rounded-full px-3 py-1">
          + Añadir ejercicio
        </button>
      </Section>

      <Section id="actividad" title="Actividad diaria" open={!!openSections.actividad} onToggle={toggleSection} onCopy={copiarSeccion} hasContent={hasActividad(registro)}>
        <BotonPolar
          onClick={() => sincronizarConPolar('actividad', 'actividad')}
          cargando={!!polarSincronizando.actividad}
          mensaje={polarMensaje.actividad}
        />
        {hasActividad(registro) ? (
          <div className="flex items-center justify-between bg-blue-50 rounded-xl p-3">
            <div className="text-sm text-gray-700 space-y-0.5">
              {!esVacio(registro.actividad.pasos) && <p>👣 {registro.actividad.pasos} pasos</p>}
              {!esVacio(registro.actividad.caloriasActivas) && <p>🔥 {registro.actividad.caloriasActivas} kcal activas</p>}
              {!esVacio(registro.actividad.porcentajeActividad) && <p>📊 {registro.actividad.porcentajeActividad}% de actividad diaria</p>}
            </div>
            <BadgePolar />
          </div>
        ) : (
          <p className="text-sm text-gray-400">Todavía no hay actividad traída de Polar para este día.</p>
        )}
      </Section>

      <Section id="sol" title="Exposición solar" open={!!openSections.sol} onToggle={toggleSection} onCopy={copiarSeccion} hasContent={hasSol(registro)}>
        {(() => {
          const totalDia = registro.exposicionSolar.reduce((suma, e) => suma + (e.vitaminaDIU || 0), 0);
          const porcentaje = Math.min(100, Math.round((totalDia / IU_MAXIMO_SESION) * 100));
          return (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Vitamina D de hoy</span>
                <span className="font-medium text-amber-700">
                  {totalDia.toLocaleString('es-ES')} / {IU_MAXIMO_SESION.toLocaleString('es-ES')} UI
                </span>
              </div>
              <div className="w-full bg-amber-100 rounded-full h-2.5">
                <div className="bg-amber-500 h-2.5 rounded-full transition-all" style={{ width: `${porcentaje}%` }} />
              </div>
              {totalDia >= IU_MAXIMO_SESION && (
                <p className="text-[11px] text-amber-700">Máximo diario alcanzado: la piel ya no produce más por hoy.</p>
              )}
            </div>
          );
        })()}
        {registro.exposicionSolar.map((s, i) => (
          <div key={i} className="border border-rose-100 rounded-xl p-3 space-y-2">
            <div className="flex justify-end">
              <button type="button" onClick={() => removeItem('exposicionSolar', i)} className="text-gray-400 text-sm">Quitar</button>
            </div>
            <div className="flex gap-2">
              {MOMENTOS.map((m) => (
                <ToggleChip key={m} active={s.momentoDia === m} onClick={() => updateItem('exposicionSolar', i, { momentoDia: m })}>
                  {m}
                </ToggleChip>
              ))}
            </div>
            <Field label="Ubicación">
              <select
                value={s.ubicacion || UBICACIONES[0]}
                onChange={(e) => {
                  updateItem('exposicionSolar', i, { ubicacion: e.target.value });
                  recalcularExposicion(i, { ubicacion: e.target.value });
                }}
                className="w-full text-sm rounded-lg border border-gray-300 px-3 py-1.5"
              >
                {UBICACIONES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <TextInput
                type="time"
                value={s.horaInicio}
                onChange={(e) => {
                  updateItem('exposicionSolar', i, { horaInicio: e.target.value });
                  recalcularExposicion(i, { horaInicio: e.target.value });
                }}
              />
              <TextInput
                type="number"
                placeholder="Minutos"
                value={s.duracion}
                onChange={(e) => {
                  updateItem('exposicionSolar', i, { duracion: e.target.value });
                  recalcularExposicion(i, { duracion: e.target.value });
                }}
              />
            </div>
            <Field label="Parte del cuerpo expuesta">
              <div className="flex flex-wrap gap-2">
                {PARTES_CUERPO_OPCIONES.map((op) => (
                  <ToggleChip
                    key={op.valor}
                    active={(s.bsaFraccion ?? BSA_POR_DEFECTO) === op.valor}
                    onClick={() => {
                      updateItem('exposicionSolar', i, { bsaFraccion: op.valor });
                      recalcularExposicion(i, { bsaFraccion: op.valor });
                    }}
                  >
                    {op.label}
                  </ToggleChip>
                ))}
              </div>
            </Field>
            {uvCargando[i] && <p className="text-xs text-gray-400">Calculando…</p>}
            {uvError[i] && <p className="text-xs text-red-500">{uvError[i]}</p>}
            {!uvCargando[i] && !uvError[i] && s.uvIndex != null && (
              <div className="text-xs text-amber-700 space-y-0.5 bg-amber-50 rounded-lg p-2">
                <p>Índice UV {Number(s.duracion) > 0 ? 'medio durante la exposición' : 'en ese momento'}: {s.uvIndex}</p>
                {s.porcentajeTiempoSeguro != null && <p>Tiempo seguro usado: {s.porcentajeTiempoSeguro}%</p>}
                {s.vitaminaDIU != null && <p>Vitamina D estimada: {s.vitaminaDIU} UI</p>}
                {(s.porcentajeTiempoSeguro == null || s.vitaminaDIU == null) && (!perfil?.fototipo || !perfil?.alturaCm) && (
                  <p className="text-gray-500">Añade altura y fototipo en Embarazo para calcular el % seguro y la vitamina D.</p>
                )}
                <p className="text-gray-400">(Estimación aproximada, no una medición clínica)</p>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={s.spf}
                onChange={(e) => {
                  updateItem('exposicionSolar', i, { spf: e.target.checked });
                  recalcularExposicion(i, { spf: e.target.checked });
                }}
              />
              Con protección solar
            </label>
            {s.spf && (
              <TextInput
                type="number"
                placeholder="Factor SPF"
                value={s.factorSpf}
                onChange={(e) => {
                  updateItem('exposicionSolar', i, { factorSpf: e.target.value });
                  recalcularExposicion(i, { factorSpf: e.target.value });
                }}
              />
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            addItem('exposicionSolar', {
              ubicacion: UBICACIONES[0],
              uvIndex: null,
              bsaFraccion: BSA_POR_DEFECTO,
              porcentajeTiempoSeguro: null,
              vitaminaDIU: null,
              horaInicio: '',
              duracion: '',
              momentoDia: 'mañana',
              spf: false,
              factorSpf: '',
              partesExpuestas: [],
              directa: true,
              nota: ''
            })
          }
          className="text-sm text-rose-500 border border-rose-300 rounded-full px-3 py-1"
        >
          + Añadir exposición solar
        </button>
      </Section>

      <Section id="medicacion" title="Medicación y suplementos" open={!!openSections.medicacion} onToggle={toggleSection} onCopy={copiarSeccion} hasContent={hasMedicacion(registro)}>
        {registro.medicacion.map((m, i) => (
          <div key={i} className="border border-rose-100 rounded-xl p-3 space-y-2">
            <div className="flex justify-end">
              <button type="button" onClick={() => removeItem('medicacion', i)} className="text-gray-400 text-sm">Quitar</button>
            </div>
            <TextInput placeholder="Nombre" value={m.nombre} onChange={(e) => updateItem('medicacion', i, { nombre: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <TextInput placeholder="Dosis" value={m.dosis} onChange={(e) => updateItem('medicacion', i, { dosis: e.target.value })} />
              <TextInput placeholder="Horario" value={m.horario} onChange={(e) => updateItem('medicacion', i, { horario: e.target.value })} />
            </div>
            <TextInput placeholder="Efectos secundarios (opcional)" value={m.efectosSecundarios} onChange={(e) => updateItem('medicacion', i, { efectosSecundarios: e.target.value })} />
          </div>
        ))}
        <button type="button" onClick={() => addItem('medicacion', { nombre: '', dosis: '', horario: '', motivo: '', efectosSecundarios: '' })} className="text-sm text-rose-500 border border-rose-300 rounded-full px-3 py-1">
          + Añadir medicación
        </button>
      </Section>

      <Section id="infusiones" title="Infusiones" open={!!openSections.infusiones} onToggle={toggleSection} onCopy={copiarSeccion} hasContent={hasInfusiones(registro)}>
        {registro.infusiones.map((inf, i) => (
          <div key={i} className="border border-rose-100 rounded-xl p-3 space-y-2">
            <div className="flex justify-end">
              <button type="button" onClick={() => removeItem('infusiones', i)} className="text-gray-400 text-sm">Quitar</button>
            </div>
            <Field label="Tipo (puedes elegir varias)">
              <div className="flex flex-wrap gap-2">
                {INFUSION_TIPOS.map((tipo) => (
                  <ToggleChip
                    key={tipo}
                    active={(inf.tipos || []).includes(tipo)}
                    onClick={() => updateItem('infusiones', i, { tipos: toggleArrayValue(inf.tipos, tipo) })}
                  >
                    {tipo}
                  </ToggleChip>
                ))}
              </div>
            </Field>
            <TextInput type="time" value={inf.hora} onChange={(e) => updateItem('infusiones', i, { hora: e.target.value })} />
            <TextInput placeholder="Efecto notado (opcional)" value={inf.efecto} onChange={(e) => updateItem('infusiones', i, { efecto: e.target.value })} />
          </div>
        ))}
        <button type="button" onClick={() => addItem('infusiones', { tipos: [], hora: '', efecto: '' })} className="text-sm text-rose-500 border border-rose-300 rounded-full px-3 py-1">
          + Añadir infusión
        </button>
      </Section>

      <Section id="miccion" title="Micción" open={!!openSections.miccion} onToggle={toggleSection} onCopy={copiarSeccion} hasContent={hasMiccion(registro)}>
        <Field label="Frecuencia (veces al día, opcional)">
          <TextInput type="number" value={registro.miccion.frecuencia} onChange={(e) => update('miccion.frecuencia', e.target.value)} />
        </Field>
        <TextInput placeholder="Otros cambios (opcional)" value={registro.miccion.nota} onChange={(e) => update('miccion.nota', e.target.value)} />
      </Section>

      <Section id="momentos" title="Mañana / Tarde / Noche" open={!!openSections.momentos} onToggle={toggleSection} onCopy={copiarSeccion} hasContent={hasMomentos(registro)}>
        {MOMENTOS.map((m) => {
          const key = MOMENTO_KEY_MAP[m];
          const momento = registro.momentos[key] || {};
          return (
            <div key={m} className="space-y-1">
              <span className="text-sm font-medium capitalize">{m}</span>
              <ScalePicker value={momento.energia} onChange={(v) => update(`momentos.${key}.energia`, v)} />
              <TextInput placeholder="Nota" value={momento.nota} onChange={(e) => update(`momentos.${key}.nota`, e.target.value)} />
            </div>
          );
        })}
      </Section>

      <Section id="diario" title="Diario personal" open={!!openSections.diario} onToggle={toggleSection} onCopy={copiarSeccion} hasContent={hasDiario(registro)}>
        <Field label="Cómo ha ido el día">
          <TextArea
            placeholder="Escribe libremente sobre tu día…"
            rows={5}
            value={registro.diario}
            onChange={(e) => update('diario', e.target.value)}
          />
        </Field>
        <Field label="Resumen del día (opcional)">
          <TextInput placeholder="Un resumen corto" value={registro.resumenDia} onChange={(e) => update('resumenDia', e.target.value)} />
        </Field>
      </Section>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <div className="fixed bottom-16 inset-x-0 px-4 z-20">
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={guardar}
            disabled={saving}
            className="w-full bg-rose-500 text-white rounded-xl py-3 font-semibold shadow-lg disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar día'}
          </button>
          {savedAt && (
            <p className="text-center text-xs text-white bg-gray-800/80 rounded-full mx-auto mt-1 px-2 py-0.5 w-fit">
              Guardado a las {savedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
