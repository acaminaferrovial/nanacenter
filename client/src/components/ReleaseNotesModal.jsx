import { useState } from 'react';
import { RELEASE_NOTES } from '../data/releaseNotes.js';
import { formatFechaLarga } from '../utils/date.js';

export default function ReleaseNotesModal({ open, onClose, initialShowAll = false }) {
  const [mostrarTodas, setMostrarTodas] = useState(initialShowAll);

  if (!open) return null;

  const notasVisibles = mostrarTodas ? RELEASE_NOTES : RELEASE_NOTES.slice(0, 1);
  const hayAnteriores = RELEASE_NOTES.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Notas de versión"
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-rose-200 max-w-md w-full max-h-[82vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-rose-100 bg-rose-50/60">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <h2 className="font-bold text-rose-600 text-base">
              {mostrarTodas ? 'Notas de versión' : '¡Novedades en Ñaña Center!'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {notasVisibles.map((nota, idx) => (
            <div
              key={nota.version}
              className={`rounded-xl border p-3.5 space-y-2 ${
                idx === 0 ? 'border-rose-200 bg-rose-50/30' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-xs font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                    v{nota.version}
                  </span>
                  {idx === 0 && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                      Última
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-gray-400">{formatFechaLarga(nota.fecha)}</span>
              </div>

              <h3 className="text-sm font-semibold text-gray-800">{nota.titulo}</h3>

              <ul className="space-y-1.5 text-xs text-gray-600">
                {nota.cambios.map((cambio, i) => (
                  <li key={i} className="leading-relaxed">
                    {cambio}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {hayAnteriores && (
            <button
              type="button"
              onClick={() => setMostrarTodas((v) => !v)}
              className="w-full text-xs text-rose-600 hover:underline py-1 font-medium"
            >
              {mostrarTodas
                ? 'Mostrar solo la última versión'
                : `Ver versiones anteriores (${RELEASE_NOTES.length - 1})`}
            </button>
          )}
        </div>

        <div className="px-4 py-3 border-t border-rose-100 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-2 text-sm font-semibold transition-colors"
          >
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  );
}
