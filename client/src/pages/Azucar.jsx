import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatFechaCorta, todayStr } from '../utils/date.js';

const OBJETIVO_AYUNAS = 95;
const OBJETIVO_POSTPRANDIAL = 140;

const CAMPOS_COMIDAS = [
  { key: 'antesDesayuno', label: 'Antes Desayuno', sub: 'ayunas', esAyunas: true, placeholder: '< 95', colorHeader: 'bg-rose-100/70 text-rose-900' },
  { key: 'despuesDesayuno', label: '1h Desayuno', sub: 'post 1h', esAyunas: false, placeholder: '< 140', colorHeader: 'bg-rose-100/70 text-rose-900' },
  { key: 'antesComida', label: 'Antes Comida', sub: 'pre', esAyunas: true, placeholder: '< 95', colorHeader: 'bg-amber-100/70 text-amber-900' },
  { key: 'despuesComida', label: '1h Comida', sub: 'post 1h', esAyunas: false, placeholder: '< 140', colorHeader: 'bg-amber-100/70 text-amber-900' },
  { key: 'antesCena', label: 'Antes Cena', sub: 'pre', esAyunas: true, placeholder: '< 95', colorHeader: 'bg-blue-100/70 text-blue-900' },
  { key: 'despuesCena', label: '1h Cena', sub: 'post 1h', esAyunas: false, placeholder: '< 140', colorHeader: 'bg-blue-100/70 text-blue-900' }
];

// Genera un rango de fechas en formato YYYY-MM-DD
function generarRangoFechas(desdeStr, hastaStr) {
  const fechas = [];
  const curr = new Date(desdeStr + 'T00:00:00');
  const fin = new Date(hastaStr + 'T00:00:00');

  while (curr <= fin) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    fechas.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }
  return fechas;
}

function esAlto(valor, esAyunas) {
  if (valor == null || valor === '') return false;
  const num = Number(valor);
  if (Number.isNaN(num)) return false;
  return esAyunas ? num > OBJETIVO_AYUNAS : num > OBJETIVO_POSTPRANDIAL;
}

function formatearDiaSemana(fechaStr) {
  const d = new Date(fechaStr + 'T00:00:00');
  const diaSemana = d.toLocaleDateString('es-ES', { weekday: 'short' });
  const diaMes = d.getDate();
  const mes = d.toLocaleDateString('es-ES', { month: 'short' });
  return `${diaSemana} ${diaMes} ${mes}`;
}

export default function Azucar() {
  const { user } = useAuth();
  const [registrosBD, setRegistrosBD] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [estadoGuardado, setEstadoGuardado] = useState('sincronizado'); // 'sincronizado' | 'guardando' | 'pendiente'
  const [errorMsg, setErrorMsg] = useState('');

  // Rango de fechas visibles en la hoja de cálculo
  // Por petición: desde el 5 de octubre hasta el 30 de noviembre de 2026
  const [fechaInicio, setFechaInicio] = useState('2026-10-05');
  const [fechaFin, setFechaFin] = useState('2026-11-30');

  // Estado local editable de la tabla: { [fecha]: { antesDesayuno, despuesDesayuno, ... , nota, modificado } }
  const [filas, setFilas] = useState({});
  const filasRef = useRef(filas);
  filasRef.current = filas;

  // Refs para celdas para navegación con flechas tipo Excel
  // inputRefs.current[`${fecha}_${campo}`]
  const inputRefs = useRef({});

  useEffect(() => {
    cargarDatos();
  }, [fechaInicio, fechaFin]);

  async function cargarDatos() {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await api.getAzucar();
      setRegistrosBD(data || []);

      // Generar todas las fechas del rango
      const todasFechas = new Set(generarRangoFechas(fechaInicio, fechaFin));
      // Incluir también cualquier fecha que ya tenga registros guardados en la BD
      (data || []).forEach((r) => todasFechas.add(r.fecha));

      const fechasOrdenadas = Array.from(todasFechas).sort();

      // Construir mapa de filas
      const mapa = {};
      const mapaRegistros = {};
      (data || []).forEach((r) => {
        mapaRegistros[r.fecha] = r;
      });

      fechasOrdenadas.forEach((f) => {
        const reg = mapaRegistros[f];
        const g = reg?.glucosa || {};
        mapa[f] = {
          fecha: f,
          semanaEmbarazo: reg?.semanaEmbarazo ?? null,
          antesDesayuno: g.antesDesayuno != null ? String(g.antesDesayuno) : '',
          despuesDesayuno: g.despuesDesayuno != null ? String(g.despuesDesayuno) : '',
          antesComida: g.antesComida != null ? String(g.antesComida) : '',
          despuesComida: g.despuesComida != null ? String(g.despuesComida) : '',
          antesCena: g.antesCena != null ? String(g.antesCena) : '',
          despuesCena: g.despuesCena != null ? String(g.despuesCena) : '',
          nota: g.nota || '',
          modificado: false
        };
      });

      setFilas(mapa);
      setEstadoGuardado('sincronizado');
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar las mediciones');
    } finally {
      setLoading(false);
    }
  }

  // Lista ordenada de fechas a mostrar en la tabla
  const listaFechas = useMemo(() => {
    return Object.keys(filas).sort();
  }, [filas]);

  // Actualizar una celda específica
  function handleCeldaChange(fecha, campo, valor) {
    setFilas((prev) => {
      const filaActual = prev[fecha] || { fecha };
      return {
        ...prev,
        [fecha]: {
          ...filaActual,
          [campo]: valor,
          modificado: true
        }
      };
    });
    setEstadoGuardado('pendiente');
  }

  // Guardar una fila individual al hacer onBlur (salir de la celda)
  async function guardarFila(fecha) {
    const fila = filasRef.current[fecha];
    if (!fila || !fila.modificado) return;

    setEstadoGuardado('guardando');
    try {
      const resp = await api.guardarAzucar({
        fecha,
        antesDesayuno: fila.antesDesayuno,
        despuesDesayuno: fila.despuesDesayuno,
        antesComida: fila.antesComida,
        despuesComida: fila.despuesComida,
        antesCena: fila.antesCena,
        despuesCena: fila.despuesCena,
        nota: fila.nota
      });

      setFilas((prev) => ({
        ...prev,
        [fecha]: {
          ...prev[fecha],
          semanaEmbarazo: resp.semanaEmbarazo ?? prev[fecha].semanaEmbarazo,
          modificado: false
        }
      }));

      // Actualizar registrosBD para gráfico y estadísticas
      setRegistrosBD((prev) => {
        const idx = prev.findIndex((r) => r.fecha === fecha);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = resp;
          return next;
        }
        return [...prev, resp].sort((a, b) => b.fecha.localeCompare(a.fecha));
      });

      setEstadoGuardado('sincronizado');
    } catch (err) {
      setErrorMsg(`Error al guardar el día ${fecha}: ${err.message}`);
      setEstadoGuardado('pendiente');
    }
  }

  // Guardar todos los cambios pendientes a la vez (Botón manual)
  async function guardarTodo() {
    const modificadas = Object.values(filas).filter((f) => f.modificado);
    if (modificadas.length === 0) {
      setEstadoGuardado('sincronizado');
      return;
    }

    setGuardando(true);
    setEstadoGuardado('guardando');
    setErrorMsg('');

    try {
      const items = modificadas.map((f) => ({
        fecha: f.fecha,
        antesDesayuno: f.antesDesayuno,
        despuesDesayuno: f.despuesDesayuno,
        antesComida: f.antesComida,
        despuesComida: f.despuesComida,
        antesCena: f.antesCena,
        despuesCena: f.despuesCena,
        nota: f.nota
      }));

      const resps = await api.guardarAzucarBatch(items);

      // Limpiar flags modificado
      setFilas((prev) => {
        const next = { ...prev };
        modificadas.forEach((f) => {
          if (next[f.fecha]) next[f.fecha].modificado = false;
        });
        return next;
      });

      // Recargar datos actualizados
      const data = await api.getAzucar();
      setRegistrosBD(data || []);
      setEstadoGuardado('sincronizado');
    } catch (err) {
      setErrorMsg(`Error al guardar: ${err.message}`);
      setEstadoGuardado('pendiente');
    } finally {
      setGuardando(false);
    }
  }

  // Navegación con teclado estilo Excel
  function handleKeyDown(e, fecha, campoIndex) {
    const camposKeys = CAMPOS_COMIDAS.map((c) => c.key);
    const campo = camposKeys[campoIndex];
    const fechaIndex = listaFechas.indexOf(fecha);

    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      // Moverse al mismo campo en el día siguiente
      if (fechaIndex < listaFechas.length - 1) {
        const sigFecha = listaFechas[fechaIndex + 1];
        const ref = inputRefs.current[`${sigFecha}_${campo}`];
        if (ref) ref.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Moverse al mismo campo en el día anterior
      if (fechaIndex > 0) {
        const prevFecha = listaFechas[fechaIndex - 1];
        const ref = inputRefs.current[`${prevFecha}_${campo}`];
        if (ref) ref.focus();
      }
    } else if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length) {
      // Moverse al siguiente campo del mismo día
      if (campoIndex < camposKeys.length - 1) {
        const sigCampo = camposKeys[campoIndex + 1];
        const ref = inputRefs.current[`${fecha}_${sigCampo}`];
        if (ref) ref.focus();
      }
    } else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
      // Moverse al campo anterior del mismo día
      if (campoIndex > 0) {
        const prevCampo = camposKeys[campoIndex - 1];
        const ref = inputRefs.current[`${fecha}_${prevCampo}`];
        if (ref) ref.focus();
      }
    }
  }

  // Extender rango de fechas
  function agregarSemana(delta) {
    if (delta > 0) {
      const d = new Date(fechaFin + 'T00:00:00');
      d.setDate(d.getDate() + 7);
      setFechaFin(d.toISOString().slice(0, 10));
    } else {
      const d = new Date(fechaInicio + 'T00:00:00');
      d.setDate(d.getDate() - 7);
      setFechaInicio(d.toISOString().slice(0, 10));
    }
  }

  // Datos para el gráfico en tiempo real
  const datosGrafico = useMemo(() => {
    return listaFechas
      .map((fecha) => {
        const f = filas[fecha];
        if (!f) return null;
        const tieneValores =
          f.antesDesayuno !== '' ||
          f.despuesDesayuno !== '' ||
          f.antesComida !== '' ||
          f.despuesComida !== '' ||
          f.antesCena !== '' ||
          f.despuesCena !== '';

        if (!tieneValores) return null;

        return {
          fecha: formatFechaCorta(fecha),
          'Antes Desayuno': f.antesDesayuno !== '' ? Number(f.antesDesayuno) : null,
          '1h Desayuno': f.despuesDesayuno !== '' ? Number(f.despuesDesayuno) : null,
          'Antes Comida': f.antesComida !== '' ? Number(f.antesComida) : null,
          '1h Comida': f.despuesComida !== '' ? Number(f.despuesComida) : null,
          'Antes Cena': f.antesCena !== '' ? Number(f.antesCena) : null,
          '1h Cena': f.despuesCena !== '' ? Number(f.despuesCena) : null
        };
      })
      .filter(Boolean);
  }, [filas, listaFechas]);

  // Estadísticas calculadas en vivo
  const estadisticas = useMemo(() => {
    let totalBasal = 0;
    let countBasal = 0;
    let totalPost = 0;
    let countPost = 0;
    let fueraRangoCount = 0;
    let totalTomas = 0;
    let diasConTomas = 0;

    Object.values(filas).forEach((f) => {
      let diaTieneAlgo = false;
      [f.antesDesayuno, f.antesComida, f.antesCena].forEach((v) => {
        if (v !== '' && v != null) {
          const num = Number(v);
          totalBasal += num;
          countBasal++;
          totalTomas++;
          diaTieneAlgo = true;
          if (num > OBJETIVO_AYUNAS) fueraRangoCount++;
        }
      });
      [f.despuesDesayuno, f.despuesComida, f.despuesCena].forEach((v) => {
        if (v !== '' && v != null) {
          const num = Number(v);
          totalPost += num;
          countPost++;
          totalTomas++;
          diaTieneAlgo = true;
          if (num > OBJETIVO_POSTPRANDIAL) fueraRangoCount++;
        }
      });
      if (diaTieneAlgo) diasConTomas++;
    });

    return {
      mediaBasal: countBasal > 0 ? Math.round(totalBasal / countBasal) : null,
      mediaPost: countPost > 0 ? Math.round(totalPost / countPost) : null,
      totalTomas,
      diasConTomas,
      fueraRangoCount
    };
  }, [filas]);

  // Exportar PDF limpio y médico
  function exportarPDF() {
    const filasConDatos = listaFechas
      .map((fecha) => filas[fecha])
      .filter((f) =>
        f &&
        (f.antesDesayuno !== '' ||
          f.despuesDesayuno !== '' ||
          f.antesComida !== '' ||
          f.despuesComida !== '' ||
          f.antesCena !== '' ||
          f.despuesCena !== '' ||
          (f.nota && f.nota.trim() !== ''))
      );

    if (filasConDatos.length === 0) {
      alert('No hay mediciones introducidas para exportar.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Cabecera color burdeos / rose
    doc.setFillColor(225, 29, 72);
    doc.rect(0, 0, 297, 18, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRO Y CONTROL DE GLUCOSA — GESTABIEN', 14, 12);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Paciente: ${user?.nombre || 'Cristina'}`, 220, 12);

    // Subtítulo con fecha y objetivos clínicos
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9.5);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 25);
    doc.text(`Valores objetivo en gestación: Ayunas / Antes comidas < 95 mg/dL  |  1h Postprandial < 140 mg/dL`, 14, 30);

    // Resumen estadístico
    if (estadisticas.totalTomas > 0) {
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(14, 33, 269, 11, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(159, 18, 57);
      doc.text(
        `Días con tomas: ${estadisticas.diasConTomas}   |   Total mediciones: ${estadisticas.totalTomas}   |   Media basal/preprandial: ${estadisticas.mediaBasal ?? '—'} mg/dL   |   Media 1h postprandial: ${estadisticas.mediaPost ?? '—'} mg/dL`,
        18,
        40
      );
    }

    const head = [
      [
        'Fecha',
        'Semana',
        'Antes Desayuno\n(< 95)',
        '1h Desayuno\n(< 140)',
        'Antes Comida\n(< 95)',
        '1h Comida\n(< 140)',
        'Antes Cena\n(< 95)',
        '1h Cena\n(< 140)',
        'Observaciones'
      ]
    ];

    const body = filasConDatos.map((f) => {
      const sem = f.semanaEmbarazo != null ? `Sem ${f.semanaEmbarazo}` : '—';
      return [
        formatearDiaSemana(f.fecha),
        sem,
        f.antesDesayuno || '—',
        f.despuesDesayuno || '—',
        f.antesComida || '—',
        f.despuesComida || '—',
        f.antesCena || '—',
        f.despuesCena || '—',
        f.nota || ''
      ];
    });

    autoTable(doc, {
      startY: 47,
      head,
      body,
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 2.2,
        halign: 'center',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [225, 29, 72],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', cellWidth: 32 },
        1: { cellWidth: 18 },
        2: { cellWidth: 26 },
        3: { cellWidth: 26 },
        4: { cellWidth: 26 },
        5: { cellWidth: 26 },
        6: { cellWidth: 26 },
        7: { cellWidth: 26 },
        8: { halign: 'left' }
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const col = data.column.index;
          const valor = Number(data.cell.raw);
          if (!Number.isNaN(valor) && valor > 0) {
            if ([2, 4, 6].includes(col) && valor > OBJETIVO_AYUNAS) {
              data.cell.styles.fillColor = [254, 226, 226];
              data.cell.styles.textColor = [185, 28, 28];
              data.cell.styles.fontStyle = 'bold';
            } else if ([3, 5, 7].includes(col) && valor > OBJETIVO_POSTPRANDIAL) {
              data.cell.styles.fillColor = [254, 226, 226];
              data.cell.styles.textColor = [185, 28, 28];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      }
    });

    doc.save(`Control_Glucosa_${user?.nombre || 'Cristina'}_${todayStr()}.pdf`);
  }

  const hoy = todayStr();

  return (
    <div className="p-3 sm:p-5 pb-24 space-y-4 max-w-6xl mx-auto">
      {/* Barra superior con título y acciones principales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-rose-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🩸</span>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Hoja de Control de Azúcar
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Modo tabla directa (tipo Excel). Escribe los valores celda a celda; se guardan automáticamente. Usa las flechas ↑ ↓ para moverte de día.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Indicador de sincronización */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-gray-50 border border-gray-200">
            {estadoGuardado === 'guardando' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-700 font-medium">Guardando…</span>
              </>
            )}
            {estadoGuardado === 'sincronizado' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-700 font-medium">Guardado</span>
              </>
            )}
            {estadoGuardado === 'pendiente' && (
              <>
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-blue-700 font-medium">Cambios pendientes</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={guardarTodo}
            disabled={guardando || estadoGuardado === 'sincronizado'}
            className="bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm transition-colors"
          >
            {guardando ? 'Guardando…' : '💾 Guardar'}
          </button>

          <button
            type="button"
            onClick={exportarPDF}
            className="bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-1"
          >
            <span>📄</span> PDF
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-semibold px-3 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-1 print:hidden"
          >
            <span>🖨️</span> Imprimir
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{errorMsg}</div>
      )}

      {/* Tarjetas resumen con métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm">
          <span className="text-[11px] text-gray-500 block">Objetivo Ayunas / Pre</span>
          <span className="text-base font-bold text-rose-600">&lt; 95 mg/dL</span>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            Media actual: {estadisticas.mediaBasal ? `${estadisticas.mediaBasal} mg/dL` : '—'}
          </span>
        </div>
        <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm">
          <span className="text-[11px] text-gray-500 block">Objetivo 1h Post</span>
          <span className="text-base font-bold text-rose-600">&lt; 140 mg/dL</span>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            Media actual: {estadisticas.mediaPost ? `${estadisticas.mediaPost} mg/dL` : '—'}
          </span>
        </div>
        <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm">
          <span className="text-[11px] text-gray-500 block">Días con registros</span>
          <span className="text-base font-bold text-gray-800">{estadisticas.diasConTomas}</span>
          <span className="text-[10px] text-gray-400 block mt-0.5">{estadisticas.totalTomas} tomas en total</span>
        </div>
        <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm">
          <span className="text-[11px] text-gray-500 block">Fuera de objetivo</span>
          <span className={`text-base font-bold ${estadisticas.fueraRangoCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {estadisticas.fueraRangoCount}
          </span>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            {estadisticas.totalTomas > 0
              ? `${Math.round(((estadisticas.totalTomas - estadisticas.fueraRangoCount) / estadisticas.totalTomas) * 100)}% en rango`
              : '—'}
          </span>
        </div>
      </div>

      {/* Selector de rango de fechas de la tabla */}
      <div className="bg-white px-4 py-2.5 rounded-xl border border-rose-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700">Período en pantalla:</span>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs"
          />
          <span className="text-gray-400">hasta</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap print:hidden">
          <button
            type="button"
            onClick={() => agregarSemana(-1)}
            className="px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
            title="Añadir 7 días antes"
          >
            ← +7 días antes
          </button>
          <button
            type="button"
            onClick={() => {
              setFechaInicio('2026-10-05');
              setFechaFin('2026-10-31');
            }}
            className={`px-2 py-1 rounded border font-medium ${fechaInicio === '2026-10-05' && fechaFin === '2026-10-31'
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            Octubre
          </button>
          <button
            type="button"
            onClick={() => {
              setFechaInicio('2026-11-01');
              setFechaFin('2026-11-30');
            }}
            className={`px-2 py-1 rounded border font-medium ${fechaInicio === '2026-11-01' && fechaFin === '2026-11-30'
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            Noviembre
          </button>
          <button
            type="button"
            onClick={() => {
              setFechaInicio('2026-10-05');
              setFechaFin('2026-11-30');
            }}
            className={`px-2 py-1 rounded border font-medium ${fechaInicio === '2026-10-05' && fechaFin === '2026-11-30'
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            Oct + Nov
          </button>
          <button
            type="button"
            onClick={() => agregarSemana(1)}
            className="px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
            title="Añadir 7 días después"
          >
            +7 días después →
          </button>
        </div>
      </div>

      {/* TABLA PRINCIPAL ESTILO EXCEL */}
      <div className="bg-white rounded-2xl shadow-sm border border-rose-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              {/* Fila superior de grupos */}
              <tr className="border-b border-rose-200 text-center font-bold text-[11px]">
                <th className="py-2 px-3 text-left bg-gray-50 text-gray-700 w-36 border-r border-gray-200">
                  Día / Fecha
                </th>
                <th colSpan={2} className="py-1.5 px-2 bg-rose-100 text-rose-900 border-r border-rose-200">
                  🥐 Desayuno
                </th>
                <th colSpan={2} className="py-1.5 px-2 bg-amber-100 text-amber-900 border-r border-amber-200">
                  🥗 Comida
                </th>
                <th colSpan={2} className="py-1.5 px-2 bg-blue-100 text-blue-900 border-r border-blue-200">
                  🍲 Cena
                </th>
                <th className="py-2 px-3 text-left bg-gray-50 text-gray-700">
                  Observaciones / Notas
                </th>
              </tr>

              {/* Fila inferior de columnas individuales */}
              <tr className="border-b border-rose-200 text-center text-[10px] font-semibold text-gray-600">
                <th className="py-1.5 px-3 text-left bg-gray-50 border-r border-gray-200">
                  Semana de gestación
                </th>
                {CAMPOS_COMIDAS.map((c) => (
                  <th key={c.key} className={`py-1.5 px-1 w-24 border-r border-gray-100 ${c.colorHeader}`}>
                    <div className="font-bold">{c.label}</div>
                    <div className="text-[9px] opacity-75 font-normal">Obj: {c.placeholder}</div>
                  </th>
                ))}
                <th className="py-1.5 px-3 text-left bg-gray-50">
                  Comida, paseos, sensaciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-400">
                    Cargando hoja de datos…
                  </td>
                </tr>
              ) : (
                listaFechas.map((fecha) => {
                  const f = filas[fecha] || { fecha };
                  const esHoy = fecha === hoy;

                  return (
                    <tr
                      key={fecha}
                      className={`hover:bg-rose-50/20 transition-colors ${esHoy ? 'bg-rose-50/40 font-medium' : ''
                        }`}
                    >
                      {/* Columna Día */}
                      <td className="py-1.5 px-3 text-left whitespace-nowrap border-r border-gray-200 bg-gray-50/50">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-800 text-xs">
                            {formatearDiaSemana(fecha)}
                          </span>
                          {esHoy && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-100 rounded px-1">
                              Hoy
                            </span>
                          )}
                        </div>
                        {f.semanaEmbarazo != null && (
                          <span className="text-[10px] text-gray-400">
                            Semana {f.semanaEmbarazo}
                          </span>
                        )}
                      </td>

                      {/* 6 Columnas de tomas tipo Excel */}
                      {CAMPOS_COMIDAS.map((c, colIdx) => {
                        const valor = f[c.key] ?? '';
                        const alto = esAlto(valor, c.esAyunas);

                        return (
                          <td key={c.key} className="p-0 border-r border-gray-100 text-center">
                            <input
                              ref={(el) => (inputRefs.current[`${fecha}_${c.key}`] = el)}
                              type="number"
                              inputMode="decimal"
                              placeholder="—"
                              value={valor}
                              onChange={(e) => handleCeldaChange(fecha, c.key, e.target.value)}
                              onBlur={() => guardarFila(fecha)}
                              onKeyDown={(e) => handleKeyDown(e, fecha, colIdx)}
                              className={`w-full h-9 text-center text-xs font-semibold transition-colors outline-none focus:ring-2 focus:ring-rose-500 focus:z-10 ${alto
                                  ? 'bg-amber-100 text-amber-900 font-bold border-2 border-amber-300'
                                  : valor !== ''
                                    ? 'bg-white text-gray-800'
                                    : 'bg-transparent text-gray-400 hover:bg-gray-50'
                                }`}
                            />
                          </td>
                        );
                      })}

                      {/* Columna Notas */}
                      <td className="p-1">
                        <input
                          type="text"
                          placeholder="Nota (opcional)"
                          value={f.nota ?? ''}
                          onChange={(e) => handleCeldaChange(fecha, 'nota', e.target.value)}
                          onBlur={() => guardarFila(fecha)}
                          className="w-full h-8 text-xs px-2 rounded border border-transparent hover:border-gray-200 focus:border-rose-400 focus:bg-white bg-transparent outline-none text-gray-700"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico de Evolución */}
      <section className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📈</span>
            <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
              Gráfico de Evolución del Azúcar
            </h2>
          </div>
          <span className="text-xs text-gray-400">
            {datosGrafico.length} días graficados
          </span>
        </div>

        {datosGrafico.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={datosGrafico} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8e8" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis domain={[60, 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {/* Líneas de corte clínico */}
              <ReferenceLine y={OBJETIVO_AYUNAS} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Obj. Basal (95)', fontSize: 9, fill: '#f59e0b', position: 'insideTopLeft' }} />
              <ReferenceLine y={OBJETIVO_POSTPRANDIAL} stroke="#e11d48" strokeDasharray="4 4" label={{ value: 'Obj. 1h (140)', fontSize: 9, fill: '#e11d48', position: 'insideTopLeft' }} />

              <Line type="monotone" dataKey="Antes Desayuno" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="1h Desayuno" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Antes Comida" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="1h Comida" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Antes Cena" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="1h Cena" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 py-8 text-center">
            Introduce los primeros valores en la tabla superior para ver la gráfica de evolución.
          </p>
        )}
      </section>
    </div>
  );
}
