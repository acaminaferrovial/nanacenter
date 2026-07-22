import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Hoy from './pages/Hoy.jsx';
import RegistroDia from './pages/RegistroDia.jsx';
import Calendario from './pages/Calendario.jsx';
import Evolucion from './pages/Evolucion.jsx';
import Embarazo from './pages/Embarazo.jsx';
import Diario from './pages/Diario.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Hoy />} />
        <Route path="/dia/:fecha" element={<RegistroDia />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/evolucion" element={<Evolucion />} />
        <Route path="/embarazo" element={<Embarazo />} />
        <Route path="/diario" element={<Diario />} />
      </Route>
    </Routes>
  );
}
