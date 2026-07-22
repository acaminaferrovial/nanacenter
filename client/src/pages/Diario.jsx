import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { fechaKey, formatFechaLarga } from '../utils/date.js';

export default function Diario() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [busqueda, setBusqueda] = useState('');

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

  const entradas = useMemo(
    () =>
      registros
        .filter((r) => (r.diario && r.diario.trim() !== '') || (r.resumenDia && r.resumenDia.trim() !== ''))
        .map((r) => ({ fecha: fechaKey(r.fecha), diario: r.diario || '', resumenDia: r.resumenDia || '' }))
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [registros]
  );

  const entradasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return entradas;
    return entradas.filter((e) => e.diario.toLowerCase().includes(q) || e.resumenDia.toLowerCase().includes(q));
  }, [entradas, busqueda]);

  if (loading) {
    return <div className="p-4 text-gray-500">Cargando…</div>;
  }

  return (
    <div className="p-4 pb-8 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-rose-600">Diario</h1>
        <Link to="/" className="text-sm text-rose-500 border border-rose-300 rounded-full px-3 py-1 whitespace-nowrap">
          Escribir hoy
        </Link>
      </div>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <input
        type="text"
        placeholder="Buscar en el diario…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2"
      />

      {entradasFiltradas.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          {entradas.length === 0 ? 'Todavía no hay entradas en el diario.' : 'No hay resultados para esa búsqueda.'}
        </p>
      ) : (
        <div className="space-y-3">
          {entradasFiltradas.map((entrada) => (
            <Link
              key={entrada.fecha}
              to={`/dia/${entrada.fecha}`}
              className="block bg-white rounded-2xl shadow-sm p-4 space-y-1"
            >
              <p className="text-sm font-semibold text-rose-600">{formatFechaLarga(entrada.fecha)}</p>
              {entrada.resumenDia && <p className="text-sm text-gray-700 font-medium">{entrada.resumenDia}</p>}
              {entrada.diario && <p className="text-sm text-gray-500 line-clamp-3">{entrada.diario}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
