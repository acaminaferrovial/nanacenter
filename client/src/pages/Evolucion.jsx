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
        .map((r) => ({ fecha: formatFechaCorta(fechaKey(r.fecha)), peso: r.peso })),
    [registrosFiltrados]
  );

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

      <Card title="Peso">
        {datosPeso.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={datosPeso}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8e8" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip />
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
              <Line type="monotone" dataKey="calidad" name="Calidad (1-5)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
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
              <YAxis tick={{ fontSize: 11 }} domain={[1, 5]} allowDecimals={false} />
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
