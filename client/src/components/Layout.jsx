import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import logo from '../assets/logo.jpg';

const tabsPrincipales = [
  { to: '/', label: 'Hoy', icon: '📋' },
  { to: '/bebe', label: 'Bebé', icon: '👶' },
  { to: '/calendario', label: 'Calendario', icon: '📅' },
  { to: '/embarazo', label: 'Embarazo', icon: '🤰' },
  { to: '/diario', label: 'Diario', icon: '📔' }
];

const tabsOtros = [
  { to: '/azucar', label: 'Azúcar', icon: '🩸' },
  { to: '/evolucion', label: 'Evolución', icon: '📈' }
];

export default function Layout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [avisoPolar, setAvisoPolar] = useState('');
  const [otrosAbierto, setOtrosAbierto] = useState(false);
  const [modoNoche, setModoNoche] = useState(() => localStorage.getItem('gestabien_dark_mode') === 'true');
  const yaProcesado = useRef(false);

  const esRutaOtros = tabsOtros.some((t) => location.pathname === t.to || location.pathname.startsWith(`${t.to}/`));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', modoNoche);
    localStorage.setItem('gestabien_dark_mode', String(modoNoche));
  }, [modoNoche]);

  useEffect(() => {
    setOtrosAbierto(false);
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (!code || yaProcesado.current) return;
    yaProcesado.current = true;

    api
      .conectarPolarConCodigo(code)
      .then(() => setAvisoPolar('Cuenta de Polar Flow conectada correctamente.'))
      .catch((err) => setAvisoPolar('No se pudo conectar con Polar: ' + err.message))
      .finally(() => {
        navigate(location.pathname, { replace: true });
        setTimeout(() => setAvisoPolar(''), 5000);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col bg-rose-50">
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-rose-100">
        <span className="flex items-center gap-2">
          <img src={logo} alt="" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-bold text-rose-600">Ñaña Center</span>
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setModoNoche((v) => !v)}
            title={modoNoche ? 'Cambiar a modo claro' : 'Cambiar a modo noche'}
            aria-label={modoNoche ? 'Cambiar a modo claro' : 'Cambiar a modo noche'}
            className="text-lg leading-none px-2 py-1 rounded-lg border border-rose-100 hover:bg-rose-50 transition-colors"
          >
            {modoNoche ? '☀️' : '🌙'}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-rose-600"
          >
            {user?.nombre && <span className="hidden sm:inline">{user.nombre}</span>}
            Salir
          </button>
        </div>
      </header>
      {avisoPolar && (
        <div className="bg-amber-100 text-amber-800 text-sm text-center py-1.5 px-2">{avisoPolar}</div>
      )}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {otrosAbierto && (
        <div
          className="fixed inset-0 z-30 bg-black/15"
          onClick={() => setOtrosAbierto(false)}
          aria-hidden="true"
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-rose-200 flex justify-around py-2">
        {tabsPrincipales.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs px-2 py-1 rounded-lg ${
                isActive ? 'text-rose-600 font-semibold' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}

        <div className="relative flex flex-col items-center">
          {otrosAbierto && (
            <div className="absolute bottom-full right-0 mb-3 bg-white border border-rose-200 rounded-2xl shadow-lg p-2 flex gap-2 min-w-max z-50">
              {tabsOtros.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  onClick={() => setOtrosAbierto(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center text-xs px-3.5 py-2 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-rose-50 text-rose-600 font-semibold border border-rose-200'
                        : 'text-gray-600 hover:bg-rose-50/60'
                    }`
                  }
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="mt-0.5">{tab.label}</span>
                </NavLink>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setOtrosAbierto((prev) => !prev)}
            aria-expanded={otrosAbierto}
            className={`flex flex-col items-center text-xs px-2 py-1 rounded-lg transition-colors ${
              otrosAbierto || esRutaOtros ? 'text-rose-600 font-semibold' : 'text-gray-500'
            }`}
          >
            <span className="text-xl leading-7">⋯</span>
            Otros
          </button>
        </div>
      </nav>
    </div>
  );
}
