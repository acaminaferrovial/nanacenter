import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { addDays, calcularGestacion, fechaKey, formatFechaLarga, todayStr } from '../utils/date.js';

const TIPOS_CITA = ['Ecografía', 'Ginecología', 'Matrona', 'Analítica', 'Otra'];

function Card({ title, children }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      {title && <h2 className="font-semibold text-rose-600">{title}</h2>}
      {children}
    </section>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      value={props.value ?? ''}
      className={`w-full text-sm rounded-lg border border-gray-300 px-3 py-1.5 ${props.className || ''}`}
    />
  );
}

function citaVacia() {
  return { tipo: TIPOS_CITA[0], fecha: todayStr(), resumen: '', recomendaciones: '', documentos: [] };
}

function nombreDesdeUrl(url) {
  return decodeURIComponent(url.split('/').pop() || url);
}

export default function Embarazo() {
  const [perfil, setPerfil] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [fumInput, setFumInput] = useState('');
  const [fppInput, setFppInput] = useState('');
  const [savingPerfil, setSavingPerfil] = useState(false);

  const [formCita, setFormCita] = useState(null);
  const [editando, setEditando] = useState(null);
  const [savingCita, setSavingCita] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);

  async function cargarTodo() {
    const [p, r] = await Promise.all([api.getPerfil(), api.getRegistros()]);
    setPerfil(p);
    setRegistros(r);
    setFumInput(p.fechaUltimaRegla ? fechaKey(p.fechaUltimaRegla) : '');
    setFppInput(p.fechaProbableParto ? fechaKey(p.fechaProbableParto) : '');
  }

  useEffect(() => {
    let cancelled = false;
    cargarTodo()
      .catch((err) => !cancelled && setErrorMsg(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const gestacion = useMemo(
    () => (perfil ? calcularGestacion(perfil.fechaUltimaRegla, todayStr()) : null),
    [perfil]
  );

  const citas = useMemo(() => {
    const lista = [];
    registros.forEach((r) => {
      (r.citasMedicas || []).forEach((cita, idx) => {
        lista.push({ ...cita, _fecha: fechaKey(r.fecha), _idx: idx });
      });
    });
    return lista.sort((a, b) => (a.fecha || a._fecha).localeCompare(b.fecha || b._fecha));
  }, [registros]);

  function handleFumChange(value) {
    setFumInput(value);
    setFppInput(value ? addDays(value, 280) : '');
  }

  function handleFppChange(value) {
    setFppInput(value);
    setFumInput(value ? addDays(value, -280) : '');
  }

  async function guardarPerfil() {
    setSavingPerfil(true);
    setErrorMsg('');
    try {
      const p = await api.actualizarPerfil({
        fechaUltimaRegla: fumInput || null,
        fechaProbableParto: fppInput || null
      });
      setPerfil(p);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSavingPerfil(false);
    }
  }

  function abrirNuevaCita() {
    setEditando(null);
    setFormCita(citaVacia());
  }

  function abrirEditarCita(cita) {
    setEditando(cita);
    setFormCita({
      tipo: cita.tipo || TIPOS_CITA[0],
      fecha: cita.fecha ? fechaKey(cita.fecha) : cita._fecha,
      resumen: cita.resumen || '',
      recomendaciones: cita.recomendaciones || '',
      documentos: (cita.documentos || []).map((url) => ({ url, nombre: nombreDesdeUrl(url) }))
    });
  }

  function cerrarFormCita() {
    setFormCita(null);
    setEditando(null);
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    setSubiendoArchivo(true);
    setErrorMsg('');
    try {
      const resultado = await api.subirArchivo(file);
      setFormCita((f) => ({ ...f, documentos: [...f.documentos, { url: resultado.secure_url, nombre: file.name }] }));
    } catch (err) {
      setErrorMsg('No se pudo subir el archivo: ' + err.message);
    } finally {
      setSubiendoArchivo(false);
    }
  }

  function quitarDocumento(idx) {
    setFormCita((f) => ({ ...f, documentos: f.documentos.filter((_, i) => i !== idx) }));
  }

  async function guardarCita() {
    setSavingCita(true);
    setErrorMsg('');
    try {
      const nuevaFecha = formCita.fecha;
      const citaObj = {
        tipo: formCita.tipo,
        fecha: nuevaFecha,
        resumen: formCita.resumen,
        recomendaciones: formCita.recomendaciones,
        documentos: formCita.documentos.map((d) => d.url)
      };

      if (editando && editando._fecha !== nuevaFecha) {
        const viejo = await api.getRegistro(editando._fecha).catch(() => null);
        if (viejo) {
          const citasViejo = (viejo.citasMedicas || []).filter((_, i) => i !== editando._idx);
          await api.guardarRegistro({ fecha: editando._fecha, citasMedicas: citasViejo });
        }
      }

      const destino = await api.getRegistro(nuevaFecha).catch(() => null);
      const citasDestino = destino?.citasMedicas ? [...destino.citasMedicas] : [];
      if (editando && editando._fecha === nuevaFecha) {
        citasDestino[editando._idx] = citaObj;
      } else {
        citasDestino.push(citaObj);
      }
      await api.guardarRegistro({ fecha: nuevaFecha, citasMedicas: citasDestino });

      await cargarTodo();
      cerrarFormCita();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSavingCita(false);
    }
  }

  async function eliminarCita(cita) {
    setErrorMsg('');
    try {
      const registro = await api.getRegistro(cita._fecha).catch(() => null);
      if (!registro) return;
      const citasNuevas = (registro.citasMedicas || []).filter((_, i) => i !== cita._idx);
      await api.guardarRegistro({ fecha: cita._fecha, citasMedicas: citasNuevas });
      await cargarTodo();
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  if (loading) {
    return <div className="p-4 text-gray-500">Cargando…</div>;
  }

  return (
    <div className="p-4 pb-8 space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-rose-600">Embarazo</h1>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <Card>
        {gestacion ? (
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">Semana de embarazo</p>
            <p className="text-4xl font-bold text-rose-600">{gestacion.semanaEmbarazo}</p>
            <p className="text-sm text-gray-500">Día {gestacion.diaGestacion} de gestación</p>
            <div className="w-full bg-rose-100 rounded-full h-2 mt-2">
              <div
                className="bg-rose-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, (gestacion.semanaEmbarazo / 40) * 100)}%` }}
              />
            </div>
            {perfil.fechaProbableParto && (
              <p className="text-xs text-gray-400">FPP: {formatFechaLarga(fechaKey(perfil.fechaProbableParto))}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">
            Añade la fecha de última regla o la fecha probable de parto para ver la semana de embarazo.
          </p>
        )}
      </Card>

      <Card title="Fechas clave">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="block text-sm text-gray-600 mb-1">Última regla</span>
            <TextInput type="date" value={fumInput} onChange={(e) => handleFumChange(e.target.value)} />
          </div>
          <div>
            <span className="block text-sm text-gray-600 mb-1">Fecha probable de parto</span>
            <TextInput type="date" value={fppInput} onChange={(e) => handleFppChange(e.target.value)} />
          </div>
        </div>
        <button
          type="button"
          onClick={guardarPerfil}
          disabled={savingPerfil}
          className="w-full bg-rose-500 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
        >
          {savingPerfil ? 'Guardando…' : 'Guardar fechas'}
        </button>
      </Card>

      <Card title="Citas médicas">
        <div className="space-y-2">
          {citas.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Todavía no hay citas registradas.</p>}
          {citas.map((cita) => (
            <div key={`${cita._fecha}-${cita._idx}`} className="border border-rose-100 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  {cita.tipo} · {formatFechaLarga(cita.fecha ? fechaKey(cita.fecha) : cita._fecha)}
                </span>
                <div className="flex gap-2 text-xs">
                  <button type="button" onClick={() => abrirEditarCita(cita)} className="text-rose-500">
                    Editar
                  </button>
                  <button type="button" onClick={() => eliminarCita(cita)} className="text-gray-400">
                    Quitar
                  </button>
                </div>
              </div>
              {cita.resumen && <p className="text-sm text-gray-600">{cita.resumen}</p>}
              {cita.recomendaciones && <p className="text-xs text-gray-400">Recomendaciones: {cita.recomendaciones}</p>}
              {cita.documentos?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {cita.documentos.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-rose-500 underline truncate max-w-[140px]"
                    >
                      📎 {nombreDesdeUrl(url)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {formCita ? (
          <div className="border border-rose-200 rounded-xl p-3 space-y-2">
            <div>
              <span className="block text-sm text-gray-600 mb-1">Tipo</span>
              <div className="flex flex-wrap gap-2">
                {TIPOS_CITA.map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setFormCita((f) => ({ ...f, tipo }))}
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      formCita.tipo === tipo ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="block text-sm text-gray-600 mb-1">Fecha</span>
              <TextInput type="date" value={formCita.fecha} onChange={(e) => setFormCita((f) => ({ ...f, fecha: e.target.value }))} />
            </div>
            <TextInput placeholder="Resumen" value={formCita.resumen} onChange={(e) => setFormCita((f) => ({ ...f, resumen: e.target.value }))} />
            <TextInput
              placeholder="Recomendaciones (opcional)"
              value={formCita.recomendaciones}
              onChange={(e) => setFormCita((f) => ({ ...f, recomendaciones: e.target.value }))}
            />

            <div>
              <span className="block text-sm text-gray-600 mb-1">Documentos (ecografías, informes…)</span>
              {formCita.documentos.length > 0 && (
                <div className="space-y-1 mb-2">
                  {formCita.documentos.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-rose-50 rounded-lg px-2 py-1">
                      <a href={doc.url} target="_blank" rel="noreferrer" className="text-rose-600 truncate">
                        📎 {doc.nombre}
                      </a>
                      <button type="button" onClick={() => quitarDocumento(i)} className="text-gray-400 text-xs ml-2 shrink-0">
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={subiendoArchivo}
                className="text-sm"
              />
              {subiendoArchivo && <p className="text-xs text-gray-400 mt-1">Subiendo…</p>}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={guardarCita}
                disabled={savingCita}
                className="flex-1 bg-rose-500 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
              >
                {savingCita ? 'Guardando…' : 'Guardar cita'}
              </button>
              <button type="button" onClick={cerrarFormCita} className="px-4 rounded-lg border border-gray-300 text-sm text-gray-600">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={abrirNuevaCita} className="text-sm text-rose-500 border border-rose-300 rounded-full px-3 py-1">
            + Añadir cita
          </button>
        )}
      </Card>
    </div>
  );
}
