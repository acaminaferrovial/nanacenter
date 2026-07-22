import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { fechaKey, todayStr } from '../utils/date.js';

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const ESTADO_COLOR = {
  bien: 'bg-emerald-400',
  regular: 'bg-amber-400',
  mal: 'bg-rose-400',
  sinDatos: 'bg-gray-300'
};

function estadoDia(registro) {
  if (!registro) return null;
  const puntos = [];
  if (registro.emocional?.animo != null) puntos.push(registro.emocional.animo);
  if (registro.sueno?.calidad != null) puntos.push(registro.sueno.calidad);
  if (registro.sintomas?.length) {
    const media = registro.sintomas.reduce((s, x) => s + (x.intensidad || 0), 0) / registro.sintomas.length;
    puntos.push(6 - media / 2);
  }
  if (puntos.length === 0) return 'sinDatos';
  const media = puntos.reduce((a, b) => a + b, 0) / puntos.length;
  if (media >= 3.5) return 'bien';
  if (media >= 2.5) return 'regular';
  return 'mal';
}

export default function Calendario() {
  const [mes, setMes] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

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

  const registrosPorFecha = useMemo(() => {
    const map = {};
    for (const r of registros) map[fechaKey(r.fecha)] = r;
    return map;
  }, [registros]);

  const hoy = todayStr();

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

  const tituloMes = mes.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4 pb-8 space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-rose-600">Calendario</h1>

      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={() => cambiarMes(-1)} className="text-rose-500 px-2 text-lg">
            ‹
          </button>
          <span className="font-semibold capitalize">{tituloMes}</span>
          <button type="button" onClick={() => cambiarMes(1)} className="text-rose-500 px-2 text-lg">
            ›
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm text-center py-6">Cargando…</p>
        ) : (
          <>
            <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-1">
              {DIAS_SEMANA.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {celdas.map((fecha, i) => {
                if (!fecha) return <div key={`blank-${i}`} />;
                const registro = registrosPorFecha[fecha];
                const estado = estadoDia(registro);
                const esHoy = fecha === hoy;
                const dia = Number(fecha.slice(-2));
                return (
                  <Link
                    key={fecha}
                    to={`/dia/${fecha}`}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative ${
                      esHoy ? 'ring-2 ring-rose-500' : ''
                    } ${registro ? 'bg-rose-50' : 'hover:bg-gray-50'}`}
                  >
                    <span className={esHoy ? 'font-bold text-rose-600' : 'text-gray-700'}>{dia}</span>
                    {estado && <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${ESTADO_COLOR[estado]}`} />}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap px-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Buen día
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Regular
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-400" /> Día difícil
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-300" /> Registrado sin valorar
        </span>
      </div>
    </div>
  );
}
