import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import logo from '../assets/logo.jpg';

const tabs = [
  { to: '/', label: 'Hoy', icon: '📋' },
  { to: '/calendario', label: 'Calendario', icon: '📅' },
  { to: '/evolucion', label: 'Evolución', icon: '📈' },
  { to: '/embarazo', label: 'Embarazo', icon: '🤰' },
  { to: '/diario', label: 'Diario', icon: '📔' }
];

export default function Layout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [avisoPolar, setAvisoPolar] = useState('');
  const yaProcesado = useRef(false);

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
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-rose-600"
        >
          {user?.nombre && <span className="hidden sm:inline">{user.nombre}</span>}
          Salir
        </button>
      </header>
      {avisoPolar && (
        <div className="bg-amber-100 text-amber-800 text-sm text-center py-1.5 px-2">{avisoPolar}</div>
      )}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-rose-200 flex justify-around py-2">
        {tabs.map((tab) => (
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
      </nav>
    </div>
  );
}
