import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { api } from '../api/client.js';
import { addDays, fechaKey, formatFechaCorta, todayStr } from '../utils/date.js';
import { SINTOMA_TIPOS } from './RegistroDia.jsx';

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const RANGOS = [
  { id: '7', label: '7 días' },
  { id: '30', label: '30 días' },
  { id: 'todo', label: 'Todo' }
];

function Card({ title, children }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <h2 className="font-semibold text-rose-600">{title}</h2>
      {children}
    </section>
  );
}

function SinDatos() {
  return <p className="text-sm text-gray-400 py-8 text-center">Todavía no hay datos suficientes.</p>;
}

function StatTile({ label, value }) {
  return (
    <div className="bg-rose-50 rounded-xl px-3 py-2">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-rose-600">{value}</p>
    </div>
  );
}

function PesoTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-rose-100 rounded-lg px-2 py-1 text-xs shadow">
      <p className="font-medium">{d.fecha}</p>
      <p>Peso: {d.peso} kg</p>
      {d.semana != null && <p>Semana {d.semana} de gestación</p>}
    </div>
  );
}

function colorIntensidad(intensidad) {
  const clamped = Math.max(0, Math.min(10, intensidad));
  const hue = 120 - (clamped / 10) * 120; // 0 = verde, 10 = rojo
  return `hsl(${hue}, 70%, 45%)`;
}

function CalendarioSintomas({ registros }) {
  const [mes, setMes] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [sintoma, setSintoma] = useState(SINTOMA_TIPOS[0]);

  const intensidadPorFecha = useMemo(() => {
    const map = {};
    registros.forEach((r) => {
      (r.sintomas || [])
        .filter((s) => s.tipo === sintoma)
        .forEach((s) => {
          const key = fechaKey(r.fecha);
          const intensidad = s.intensidad ?? 0;
          if (map[key] === undefined || intensidad > map[key]) map[key] = intensidad;
        });
    });
    return map;
  }, [registros, sintoma]);

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

  const hoy = todayStr();
  const tituloMes = mes.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <Card title="Calendario por síntoma">
      <select
        value={sintoma}
        onChange={(e) => setSintoma(e.target.value)}
        className="w-full text-sm rounded-lg border border-gray-300 px-3 py-1.5"
      >
        {SINTOMA_TIPOS.map((tipo) => (
          <option key={tipo} value={tipo}>
            {tipo}
          </option>
        ))}
      </select>

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => cambiarMes(-1)} className="text-rose-500 px-2 text-lg">
          ‹
        </button>
        <span className="font-semibold capitalize text-sm">{tituloMes}</span>
        <button type="button" onClick={() => cambiarMes(1)} className="text-rose-500 px-2 text-lg">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-1">
        {DIAS_SEMANA.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {celdas.map((fecha, i) => {
          if (!fecha) return <div key={`blank-${i}`} />;
          const intensidad = intensidadPorFecha[fecha];
          const esHoy = fecha === hoy;
          const dia = Number(fecha.slice(-2));
          const tieneIntensidad = intensidad !== undefined;
          return (
            <div
              key={fecha}
              style={tieneIntensidad ? { backgroundColor: colorIntensidad(intensidad) } : undefined}
              className={`aspect-square rounded-lg flex items-center justify-center text-sm ${
                esHoy ? 'ring-2 ring-rose-500' : ''
              } ${tieneIntensidad ? 'text-white font-medium' : 'text-gray-400'}`}
            >
              {dia}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorIntensidad(0) }} /> Leve
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorIntensidad(5) }} /> Media
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorIntensidad(10) }} /> Fuerte
        </span>
      </div>
    </Card>
  );
}

export default function Evolucion() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [rango, setRango] = useState('30');

  useEffect(() => {
    let cancelled = false;
    api
      .getRegistros()
      .then((data) => !cancelled && setRegistros(data))
      .catch((err) => !cancelled && setErrorMsg(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const registrosFiltrados = useMemo(() => {
    if (rango === 'todo') return registros;
    const desde = addDays(todayStr(), -Number(rango));
    return registros.filter((r) => fechaKey(r.fecha) >= desde);
  }, [registros, rango]);

  const datosPeso = useMemo(
    () =>
      registrosFiltrados
        .filter((r) => r.peso != null && r.peso !== '')
        .map((r) => ({ fecha: formatFechaCorta(fechaKey(r.fecha)), peso: r.peso, semana: r.semanaEmbarazo ?? null })),
    [registrosFiltrados]
  );

  const registrosConPeso = useMemo(
    () =>
      registros
        .filter((r) => r.peso != null && r.peso !== '')
        .slice()
        .sort((a, b) => fechaKey(a.fecha).localeCompare(fechaKey(b.fecha))),
    [registros]
  );

  const pesoInicial = registrosConPeso[0]?.peso ?? null;
  const pesoActual = registrosConPeso[registrosConPeso.length - 1]?.peso ?? null;
  const variacionTotal = pesoInicial != null && pesoActual != null ? +(pesoActual - pesoInicial).toFixed(1) : null;

  const variacionSemanal = useMemo(() => {
    if (registrosConPeso.length === 0) return null;
    const ultimo = registrosConPeso[registrosConPeso.length - 1];
    const fechaLimite = addDays(fechaKey(ultimo.fecha), -7);
    const candidatos = registrosConPeso.filter((r) => fechaKey(r.fecha) <= fechaLimite);
    if (candidatos.length === 0) return null;
    const referencia = candidatos[candidatos.length - 1];
    return +(ultimo.peso - referencia.peso).toFixed(1);
  }, [registrosConPeso]);

  function formatoVariacion(v) {
    if (v == null) return '—';
    return `${v > 0 ? '+' : ''}${v} kg`;
  }

  const datosSueno = useMemo(
    () =>
      registrosFiltrados
        .filter((r) => r.sueno && (r.sueno.horas != null || r.sueno.calidad != null))
        .map((r) => ({
          fecha: formatFechaCorta(fechaKey(r.fecha)),
          horas: r.sueno.horas ?? null,
          calidad: r.sueno.calidad ?? null
        })),
    [registrosFiltrados]
  );

  const datosEmocional = useMemo(
    () =>
      registrosFiltrados
        .filter((r) => r.emocional && Object.values(r.emocional).some((v) => typeof v === 'number'))
        .map((r) => ({
          fecha: formatFechaCorta(fechaKey(r.fecha)),
          Ánimo: r.emocional.animo,
          Ansiedad: r.emocional.ansiedad,
          Estrés: r.emocional.estres,
          Irritabilidad: r.emocional.irritabilidad,
          Energía: r.emocional.energia
        })),
    [registrosFiltrados]
  );

  const datosSintomas = useMemo(() => {
    const conteo = {};
    registrosFiltrados.forEach((r) =>
      (r.sintomas || []).forEach((s) => {
        conteo[s.tipo] = (conteo[s.tipo] || 0) + 1;
      })
    );
    return Object.entries(conteo)
      .map(([tipo, veces]) => ({ tipo, veces }))
      .sort((a, b) => b.veces - a.veces)
      .slice(0, 8);
  }, [registrosFiltrados]);

  const datosNauseasVomitos = useMemo(
    () =>
      registrosFiltrados
        .map((r) => {
          const nauseas = (r.sintomas || []).filter((s) => s.tipo === 'Náuseas').length;
          const vomitos = (r.sintomas || []).filter((s) => s.tipo === 'Vómitos').length;
          return { fecha: formatFechaCorta(fechaKey(r.fecha)), Náuseas: nauseas, Vómitos: vomitos, total: nauseas + vomitos };
        })
        .filter((d) => d.total > 0),
    [registrosFiltrados]
  );

  const datosTransito = useMemo(
    () =>
      registrosFiltrados
        .filter((r) => r.transito?.deposiciones?.length > 0)
        .map((r) => ({ fecha: formatFechaCorta(fechaKey(r.fecha)), deposiciones: r.transito.deposiciones.length })),
    [registrosFiltrados]
  );

  if (loading) {
    return <div className="p-4 text-gray-500">Cargando…</div>;
  }

  return (
    <div className="p-4 pb-8 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-rose-600">Evolución</h1>
        <div className="flex gap-1">
          {RANGOS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRango(r.id)}
              className={`text-xs px-2.5 py-1 rounded-full border ${
                rango === r.id ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-500 border-gray-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <CalendarioSintomas registros={registros} />

      <Card title="Peso">
        <div className="grid grid-cols-2 gap-2">
          <StatTile label="Peso inicial" value={pesoInicial != null ? `${pesoInicial} kg` : '—'} />
          <StatTile label="Peso actual" value={pesoActual != null ? `${pesoActual} kg` : '—'} />
          <StatTile label="Variación semanal" value={formatoVariacion(variacionSemanal)} />
          <StatTile label="Variación total" value={formatoVariacion(variacionTotal)} />
        </div>
        {datosPeso.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={datosPeso}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8e8" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip content={<PesoTooltip />} />
              <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <SinDatos />
        )}
      </Card>

      <Card title="Sueño">
        {datosSueno.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={datosSueno}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8e8" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="horas" name="Horas" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="calidad" name="Calidad (0-10)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <SinDatos />
        )}
      </Card>

      <Card title="Estado emocional">
        {datosEmocional.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={datosEmocional}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8e8" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Ánimo" stroke="#e11d48" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="Ansiedad" stroke="#7c3aed" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="Estrés" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="Irritabilidad" stroke="#0891b2" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="Energía" stroke="#16a34a" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <SinDatos />
        )}
      </Card>

      <Card title="Síntomas más frecuentes">
        {datosSintomas.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(120, datosSintomas.length * 32)}>
            <BarChart data={datosSintomas} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8e8" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="tipo" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="veces" fill="#fb7185" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <SinDatos />
        )}
      </Card>

      <Card title="Náuseas y vómitos">
        {datosNauseasVomitos.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={datosNauseasVomitos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8e8" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Náuseas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Vómitos" fill="#e11d48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <SinDatos />
        )}
      </Card>

      <Card title="Tránsito intestinal">
        {datosTransito.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={datosTransito}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8e8" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="deposiciones" name="Deposiciones/día" fill="#92400e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <SinDatos />
        )}
      </Card>
    </div>
  );
}
