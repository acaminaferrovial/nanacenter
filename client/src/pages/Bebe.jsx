import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { api } from '../api/client.js';
import { formatFechaCorta, formatFechaLarga, todayStr } from '../utils/date.js';

// Calendario común de vacunación infantil en España (0 a 15 meses)
const CALENDARIO_VACUNAS = [
  {
    codigo: 'vrs-rn',
    edadRecomendada: 'Recién nacido',
    nombre: 'VRS (Nirsevimab)',
    dosis: 'Única',
    descripcion: 'Inmunización frente al Virus Respiratorio Sincitial'
  },
  {
    codigo: 'hexa-2m',
    edadRecomendada: '2 meses',
    nombre: 'Hexavalente',
    dosis: '1ª dosis',
    descripcion: 'Difteria, Tétanos, Tosferina, Polio, Hib, Hepatitis B'
  },
  {
    codigo: 'vnc-2m',
    edadRecomendada: '2 meses',
    nombre: 'Neumococo conjugada (VNC)',
    dosis: '1ª dosis',
    descripcion: 'Protección frente a enfermedad neumocócica'
  },
  {
    codigo: 'menb-2m',
    edadRecomendada: '2 meses',
    nombre: 'Meningococo B (MenB)',
    dosis: '1ª dosis',
    descripcion: 'Meningitis por serogrupo B'
  },
  {
    codigo: 'rv-2m',
    edadRecomendada: '2 meses',
    nombre: 'Rotavirus (RV)',
    dosis: '1ª dosis',
    descripcion: 'Vacuna oral frente a gastroenteritis por rotavirus'
  },
  {
    codigo: 'hexa-4m',
    edadRecomendada: '4 meses',
    nombre: 'Hexavalente',
    dosis: '2ª dosis',
    descripcion: 'Difteria, Tétanos, Tosferina, Polio, Hib, Hepatitis B'
  },
  {
    codigo: 'vnc-4m',
    edadRecomendada: '4 meses',
    nombre: 'Neumococo conjugada (VNC)',
    dosis: '2ª dosis',
    descripcion: 'Protección frente a enfermedad neumocócica'
  },
  {
    codigo: 'menb-4m',
    edadRecomendada: '4 meses',
    nombre: 'Meningococo B (MenB)',
    dosis: '2ª dosis',
    descripcion: 'Meningitis por serogrupo B'
  },
  {
    codigo: 'menc-4m',
    edadRecomendada: '4 meses',
    nombre: 'Meningococo C (MenC)',
    dosis: '1ª dosis',
    descripcion: 'Meningitis por serogrupo C'
  },
  {
    codigo: 'rv-4m',
    edadRecomendada: '4 meses',
    nombre: 'Rotavirus (RV)',
    dosis: '2ª dosis',
    descripcion: 'Vacuna oral frente a gastroenteritis por rotavirus'
  },
  {
    codigo: 'rv-6m',
    edadRecomendada: '6 meses',
    nombre: 'Rotavirus (RV)',
    dosis: '3ª dosis',
    descripcion: 'Solo si la pauta elegida es de 3 dosis (p. ej. RotaTeq)'
  },
  {
    codigo: 'gripe-6m',
    edadRecomendada: '6 meses',
    nombre: 'Gripe',
    dosis: 'Campaña anual',
    descripcion: 'A partir de los 6 meses en temporada de gripe'
  },
  {
    codigo: 'hexa-11m',
    edadRecomendada: '11 meses',
    nombre: 'Hexavalente',
    dosis: '3ª dosis',
    descripcion: 'Recuerdo DTPa, VPI, Hib, Hepatitis B'
  },
  {
    codigo: 'vnc-11m',
    edadRecomendada: '11 meses',
    nombre: 'Neumococo conjugada (VNC)',
    dosis: '3ª dosis',
    descripcion: 'Recuerdo neumococo'
  },
  {
    codigo: 'tv-12m',
    edadRecomendada: '12 meses',
    nombre: 'Triple Vírica (SRP)',
    dosis: '1ª dosis',
    descripcion: 'Sarampión, Rubéola y Parotiditis'
  },
  {
    codigo: 'menb-12m',
    edadRecomendada: '12 meses',
    nombre: 'Meningococo B (MenB)',
    dosis: '3ª dosis',
    descripcion: 'Recuerdo meningitis B'
  },
  {
    codigo: 'menacwy-12m',
    edadRecomendada: '12 meses',
    nombre: 'Meningococo ACWY',
    dosis: '1ª dosis',
    descripcion: 'Meningitis serogrupos A, C, W, Y'
  },
  {
    codigo: 'varicela-15m',
    edadRecomendada: '15 meses',
    nombre: 'Varicela (VVZ)',
    dosis: '1ª dosis',
    descripcion: 'Protección frente al virus varicela-zóster'
  }
];

const ORDEN_EDADES = ['Recién nacido', '2 meses', '4 meses', '6 meses', '11 meses', '12 meses', '15 meses', 'Otra'];

const CATEGORIAS_COMPRAS = [
  'Para el paseo',
  'Para la mamá',
  'Para el descanso',
  'Para la comida',
  'Para el baño',
  'Ropita',
  'Seguridad',
  'Otros'
];

const LISTA_COMPRAS_BASE = [
  // Para el paseo
  { codigo: 'paseo-cochecito', categoria: 'Para el paseo', nombre: 'Cochecito' },
  { codigo: 'paseo-silla-paseo', categoria: 'Para el paseo', nombre: 'Silla de paseo' },
  { codigo: 'paseo-silla-seguridad', categoria: 'Para el paseo', nombre: 'Silla de seguridad' },
  { codigo: 'paseo-saco-cochecito', categoria: 'Para el paseo', nombre: 'Saco para el cochecito' },
  { codigo: 'paseo-bolso-cochecito', categoria: 'Para el paseo', nombre: 'Bolso para el cochecito' },
  { codigo: 'paseo-cambiador-viaje', categoria: 'Para el paseo', nombre: 'Cambiador de viaje' },
  { codigo: 'paseo-neceser-aseo', categoria: 'Para el paseo', nombre: 'Neceser para cosas de aseo' },
  { codigo: 'paseo-plastico-lluvia', categoria: 'Para el paseo', nombre: 'Plástico de lluvia' },
  { codigo: 'paseo-mosquitera', categoria: 'Para el paseo', nombre: 'Mosquitera' },
  { codigo: 'paseo-sombrilla', categoria: 'Para el paseo', nombre: 'Sombrilla' },

  // Para la mamá
  { codigo: 'mama-braguitas', categoria: 'Para la mamá', nombre: 'Braguitas desechables' },
  { codigo: 'mama-discos-lactancia', categoria: 'Para la mamá', nombre: 'Discos de lactancia desechables y lavables' },
  { codigo: 'mama-pomada-antigrietas', categoria: 'Para la mamá', nombre: 'Pomada antigrietas' },
  { codigo: 'mama-sujetadores-lactancia', categoria: 'Para la mamá', nombre: 'Dos o más sujetadores de lactancia' },
  { codigo: 'mama-faja-postparto', categoria: 'Para la mamá', nombre: 'Faja postparto' },
  { codigo: 'mama-bata-camisones', categoria: 'Para la mamá', nombre: 'Bata, zapatillas y camisones' },
  { codigo: 'mama-camisetas-lactancia', categoria: 'Para la mamá', nombre: 'Camisetas de lactancia' },
  { codigo: 'mama-compresas', categoria: 'Para la mamá', nombre: 'Compresas' },
  { codigo: 'mama-mochila-porteo', categoria: 'Para la mamá', nombre: 'Mochila para llevar al bebé' },
  { codigo: 'mama-album-libro', categoria: 'Para la mamá', nombre: 'Álbum de fotos y libro del bebé' },

  // Para el descanso
  { codigo: 'descanso-moises', categoria: 'Para el descanso', nombre: 'Moisés minicuna' },
  { codigo: 'descanso-cuna', categoria: 'Para el descanso', nombre: 'Cuna' },
  { codigo: 'descanso-cuna-viaje', categoria: 'Para el descanso', nombre: 'Cuna de viaje' },
  { codigo: 'descanso-colchon', categoria: 'Para el descanso', nombre: 'Colchón' },
  { codigo: 'descanso-ropa-cama', categoria: 'Para el descanso', nombre: 'Ropa de cama (sábanas, mantas,...)' },
  { codigo: 'descanso-protector-colchon', categoria: 'Para el descanso', nombre: 'Protector impermeable de colchón' },
  { codigo: 'descanso-saco-dormir', categoria: 'Para el descanso', nombre: 'Saco de dormir' },
  { codigo: 'descanso-comoda', categoria: 'Para el descanso', nombre: 'Cómoda' },
  { codigo: 'descanso-armario', categoria: 'Para el descanso', nombre: 'Armario para la ropa' },
  { codigo: 'descanso-bolsa-canastilla', categoria: 'Para el descanso', nombre: 'Bolsa para la canastilla' },
  { codigo: 'descanso-humidificador', categoria: 'Para el descanso', nombre: 'Humidificador' },
  { codigo: 'descanso-luz-noche', categoria: 'Para el descanso', nombre: 'Luz de noche' },
  { codigo: 'descanso-carrusel', categoria: 'Para el descanso', nombre: 'Carrusel de cuna' },
  { codigo: 'descanso-almohada', categoria: 'Para el descanso', nombre: 'Almohada' },
  { codigo: 'descanso-edredon-protector', categoria: 'Para el descanso', nombre: 'Edredón y Protector' },

  // Para la comida
  { codigo: 'comida-extractor', categoria: 'Para la comida', nombre: 'Extractor de leche' },
  { codigo: 'comida-bolsas-congelacion', categoria: 'Para la comida', nombre: 'Bolsas de congelación' },
  { codigo: 'comida-biberones-tetinas', categoria: 'Para la comida', nombre: 'Biberones y tetinas' },
  { codigo: 'comida-limpiador-biberones', categoria: 'Para la comida', nombre: 'Limpiador de biberones' },
  { codigo: 'comida-esterilizador', categoria: 'Para la comida', nombre: 'Esterilizador' },
  { codigo: 'comida-calientabiberones', categoria: 'Para la comida', nombre: 'Calientabiberones' },
  { codigo: 'comida-termo', categoria: 'Para la comida', nombre: 'Termo de acero inoxidable' },
  { codigo: 'comida-dosificador', categoria: 'Para la comida', nombre: 'Dosificador de leche' },
  { codigo: 'comida-chupetes', categoria: 'Para la comida', nombre: 'Chupetes' },
  { codigo: 'comida-cadena-chupete', categoria: 'Para la comida', nombre: 'Cadena para el chupete' },
  { codigo: 'comida-cajita-chupete', categoria: 'Para la comida', nombre: 'Cajita portachupete' },
  { codigo: 'comida-trona', categoria: 'Para la comida', nombre: 'Trona' },
  { codigo: 'comida-trona-viaje', categoria: 'Para la comida', nombre: 'Trona de viaje' },
  { codigo: 'comida-bolsa-isotermica', categoria: 'Para la comida', nombre: 'Bolsa isotérmica' },
  { codigo: 'comida-robot-cocina', categoria: 'Para la comida', nombre: 'Robot de cocina' },
  { codigo: 'comida-vajilla', categoria: 'Para la comida', nombre: 'Vajilla infantil' },
  { codigo: 'comida-cojin-lactancia', categoria: 'Para la comida', nombre: 'Cojín de lactancia' }
];

const TIPOS_REVISION = ['Revisión rutinaria', 'Pediatra', 'Enfermería', 'Urgencias', 'Especialista', 'Otra'];

function nombreDesdeUrl(url) {
  return decodeURIComponent(url.split('/').pop() || url);
}

function Card({ title, right, collapsible = false, collapsed = false, onToggle, children }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-rose-100/70 p-4 space-y-3">
      {(title || right) &&
        (collapsible ? (
          <button
            type="button"
            onClick={onToggle}
            className="w-full flex items-center justify-between gap-2 text-left"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-rose-400 text-xs">{collapsed ? '▸' : '▾'}</span>
              {title && <h2 className="font-semibold text-rose-600 truncate">{title}</h2>}
            </div>
            {right}
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2">
            {title && <h2 className="font-semibold text-rose-600">{title}</h2>}
            {right}
          </div>
        ))}
      {(!collapsible || !collapsed) && children}
    </section>
  );
}

function StatTile({ label, value, sub }) {
  return (
    <div className="bg-rose-50/80 rounded-xl px-3 py-2">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-base font-bold text-rose-600">{value}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}

function PesoBebeTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-rose-100 rounded-lg px-2.5 py-1.5 text-xs shadow">
      <p className="font-semibold text-gray-800">{formatFechaLarga(d.fechaIso)}</p>
      <p className="text-rose-600 font-semibold">
        {d.peso} kg ({Math.round(d.peso * 1000)} g)
      </p>
    </div>
  );
}

function TamanoBebeTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-rose-100 rounded-lg px-2.5 py-1.5 text-xs shadow">
      <p className="font-semibold text-gray-800">{formatFechaLarga(d.fechaIso)}</p>
      <p className="text-indigo-600 font-semibold">{d.tamano} cm</p>
    </div>
  );
}

function PerimetroBebeTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-rose-100 rounded-lg px-2.5 py-1.5 text-xs shadow">
      <p className="font-semibold text-gray-800">{formatFechaLarga(d.fechaIso)}</p>
      <p className="text-teal-600 font-semibold">{d.perimetro} cm</p>
    </div>
  );
}

export default function Bebe() {
  const [vista, setVista] = useState('crecimiento'); // 'crecimiento' | 'revisiones' | 'vacunas' | 'compras'
  const [registros, setRegistros] = useState([]);
  const [vacunasBD, setVacunasBD] = useState([]);
  const [comprasBD, setComprasBD] = useState([]);
  const [revisiones, setRevisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Formulario de nueva medición (se guarda por separado en BD: peso, tamaño, perímetro cefálico y comentario)
  const [fecha, setFecha] = useState(todayStr());
  const [peso, setPeso] = useState('');
  const [tamano, setTamano] = useState('');
  const [perimetroCefalico, setPerimetroCefalico] = useState('');
  const [comentario, setComentario] = useState('');
  const [guardandoMedicion, setGuardandoMedicion] = useState(false);

  // Estado de revisiones pediátricas
  const [formRevision, setFormRevision] = useState(null);
  const [editandoRevisionId, setEditandoRevisionId] = useState(null);
  const [guardandoRevision, setGuardandoRevision] = useState(false);
  const [subiendoDocRevision, setSubiendoDocRevision] = useState(false);

  // Estado de edición de vacunas y colapso por edad
  const [vacunaEditando, setVacunaEditando] = useState(null);
  const [guardandoVacuna, setGuardandoVacuna] = useState(false);
  const [nuevaVacunaForm, setNuevaVacunaForm] = useState(null);
  const [edadesColapsadas, setEdadesColapsadas] = useState({});

  // Estado de lista de compras y colapso por categoría
  const [filtroCompras, setFiltroCompras] = useState('todos'); // 'todos' | 'pendientes' | 'comprados'
  const [compraEditando, setCompraEditando] = useState(null);
  const [guardandoCompra, setGuardandoCompra] = useState(false);
  const [nuevaCompraForm, setNuevaCompraForm] = useState(null);
  const [categoriasColapsadas, setCategoriasColapsadas] = useState({});

  async function cargarDatos() {
    setErrorMsg('');
    const [regs, vacs, comps, revs] = await Promise.all([
      api.getBebeRegistros(),
      api.getBebeVacunas(),
      api.getBebeCompras(),
      api.getBebeRevisiones()
    ]);
    setRegistros(regs || []);
    setVacunasBD(vacs || []);
    setComprasBD(comps || []);
    setRevisiones(revs || []);
  }

  useEffect(() => {
    let cancelled = false;
    cargarDatos()
      .catch((err) => !cancelled && setErrorMsg(err.message || 'Error al cargar los datos del bebé'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Series separadas para gráficas (aprovechando que se guardan por separado)
  const registrosPeso = useMemo(
    () =>
      registros
        .filter((r) => r.tipo === 'peso' && r.valor != null)
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [registros]
  );

  const registrosTamano = useMemo(
    () =>
      registros
        .filter((r) => r.tipo === 'tamano' && r.valor != null)
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [registros]
  );

  const registrosPerimetro = useMemo(
    () =>
      registros
        .filter((r) => r.tipo === 'perimetroCefalico' && r.valor != null)
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [registros]
  );

  const datosGraficaPeso = useMemo(
    () =>
      registrosPeso.map((r) => ({
        fecha: formatFechaCorta(r.fecha),
        fechaIso: r.fecha,
        peso: r.valor
      })),
    [registrosPeso]
  );

  const datosGraficaTamano = useMemo(
    () =>
      registrosTamano.map((r) => ({
        fecha: formatFechaCorta(r.fecha),
        fechaIso: r.fecha,
        tamano: r.valor
      })),
    [registrosTamano]
  );

  const datosGraficaPerimetro = useMemo(
    () =>
      registrosPerimetro.map((r) => ({
        fecha: formatFechaCorta(r.fecha),
        fechaIso: r.fecha,
        perimetro: r.valor
      })),
    [registrosPerimetro]
  );

  const ultimoPeso = registrosPeso.length > 0 ? registrosPeso[registrosPeso.length - 1] : null;
  const primerPeso = registrosPeso.length > 0 ? registrosPeso[0] : null;
  const variacionPeso =
    ultimoPeso && primerPeso && registrosPeso.length > 1
      ? +(ultimoPeso.valor - primerPeso.valor).toFixed(2)
      : null;

  const ultimoTamano = registrosTamano.length > 0 ? registrosTamano[registrosTamano.length - 1] : null;

  // Historial agrupado visualmente por grupoId (pero cada dato existe como registro independiente)
  const historialAgrupado = useMemo(() => {
    const grupos = new Map();
    registros.forEach((r) => {
      const clave = r.grupoId || r._id;
      if (!grupos.has(clave)) {
        grupos.set(clave, {
          clave,
          grupoId: r.grupoId,
          fecha: r.fecha,
          createdAt: r.createdAt,
          peso: null,
          tamano: null,
          perimetroCefalico: null,
          comentario: null
        });
      }
      const g = grupos.get(clave);
      if (r.tipo === 'peso') g.peso = r;
      if (r.tipo === 'tamano') g.tamano = r;
      if (r.tipo === 'perimetroCefalico') g.perimetroCefalico = r;
      if (r.tipo === 'comentario') g.comentario = r;
    });

    return Array.from(grupos.values()).sort((a, b) => {
      const cmp = b.fecha.localeCompare(a.fecha);
      if (cmp !== 0) return cmp;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [registros]);

  // Combinar calendario oficial con vacunas guardadas en BD
  const listaVacunas = useMemo(() => {
    const mapaBD = new Map();
    vacunasBD.forEach((v) => mapaBD.set(v.codigo, v));

    const combinadas = CALENDARIO_VACUNAS.map((base) => {
      const guardada = mapaBD.get(base.codigo);
      return {
        ...base,
        estado: guardada?.estado || 'pendiente',
        fechaAplicacion: guardada?.fechaAplicacion || '',
        lote: guardada?.lote || '',
        notas: guardada?.notas || '',
        personalizada: false
      };
    });

    const codigosBase = new Set(CALENDARIO_VACUNAS.map((v) => v.codigo));
    vacunasBD.forEach((v) => {
      if (!codigosBase.has(v.codigo)) {
        combinadas.push({
          ...v,
          personalizada: true
        });
      }
    });

    return combinadas;
  }, [vacunasBD]);

  const vacunasPorEdad = useMemo(() => {
    const mapa = new Map();
    ORDEN_EDADES.forEach((e) => mapa.set(e, []));

    listaVacunas.forEach((v) => {
      const edad = mapa.has(v.edadRecomendada) ? v.edadRecomendada : 'Otra';
      mapa.get(edad).push(v);
    });

    return Array.from(mapa.entries()).filter(([, items]) => items.length > 0);
  }, [listaVacunas]);

  const statsVacunas = useMemo(() => {
    const aplicables = listaVacunas.filter((v) => v.estado !== 'no_aplica');
    const puestas = aplicables.filter((v) => v.estado === 'puesta').length;
    return { puestas, total: aplicables.length };
  }, [listaVacunas]);

  // Combinar lista base de compras con las guardadas en BD
  const listaCompras = useMemo(() => {
    const mapaBD = new Map();
    comprasBD.forEach((c) => mapaBD.set(c.codigo, c));

    const combinadas = LISTA_COMPRAS_BASE.map((base) => {
      const guardada = mapaBD.get(base.codigo);
      if (guardada?.eliminado) return null;
      return {
        ...base,
        nombre: guardada?.nombre?.trim() || base.nombre,
        categoria: guardada?.categoria || base.categoria,
        comprado: guardada ? !!guardada.comprado : false,
        descartado: !!guardada?.descartado,
        notas: guardada?.notas || '',
        personalizada: false
      };
  }).filter(Boolean);

    const codigosBase = new Set(LISTA_COMPRAS_BASE.map((c) => c.codigo));
    comprasBD.forEach((c) => {
      if (!codigosBase.has(c.codigo) && !c.eliminado) {
        combinadas.push({
          ...c,
          nombre: c.nombre?.trim() || 'Artículo',
          personalizada: true
        });
      }
    });

  return combinadas;
}, [comprasBD]);

const statsCompras = useMemo(() => {
  const activos = listaCompras.filter((c) => !c.descartado);
  const comprados = activos.filter((c) => c.comprado).length;
  return { comprados, total: activos.length };
}, [listaCompras]);

const comprasPorCategoria = useMemo(() => {
  const mapa = new Map();
  CATEGORIAS_COMPRAS.forEach((cat) => mapa.set(cat, []));

  listaCompras.forEach((item) => {
    if (filtroCompras === 'pendientes' && (item.comprado || item.descartado)) return;
    if (filtroCompras === 'comprados' && !item.comprado) return;

    const cat = mapa.has(item.categoria) ? item.categoria : 'Otros';
    mapa.get(cat).push(item);
  });

  return Array.from(mapa.entries()).filter(([, items]) => items.length > 0);
}, [listaCompras, filtroCompras]);

async function handleGuardarMedicion(e) {
  e.preventDefault();
  if (peso === '' && tamano === '' && perimetroCefalico === '' && comentario.trim() === '') {
    setErrorMsg('Introduce al menos el peso, el tamaño, el perímetro cefálico o un comentario.');
    return;
  }

  setGuardandoMedicion(true);
  setErrorMsg('');
  try {
    await api.guardarBebeMedicion({
      fecha,
      peso: peso === '' ? null : Number(peso),
      tamano: tamano === '' ? null : Number(tamano),
      perimetroCefalico: perimetroCefalico === '' ? null : Number(perimetroCefalico),
      comentario: comentario.trim()
    });
    setPeso('');
    setTamano('');
    setPerimetroCefalico('');
    setComentario('');
    await cargarDatos();
  } catch (err) {
    setErrorMsg(err.message || 'No se pudo guardar el registro');
  } finally {
    setGuardandoMedicion(false);
  }
}

async function handleEliminarEntrada(entrada) {
  setErrorMsg('');
  try {
    if (entrada.grupoId) {
      await api.eliminarBebeGrupo(entrada.grupoId);
    } else {
      const reg = entrada.peso || entrada.tamano || entrada.perimetroCefalico || entrada.comentario;
      if (reg?._id) await api.eliminarBebeRegistro(reg._id);
    }
    await cargarDatos();
  } catch (err) {
    setErrorMsg(err.message || 'No se pudo eliminar el registro');
  }
}

function abrirNuevaRevision() {
  setEditandoRevisionId(null);
  setFormRevision({
    fecha: todayStr(),
    tipo: TIPOS_REVISION[0],
    profesional: '',
    resumen: '',
    recomendaciones: '',
    proximaRevision: '',
    documentos: []
  });
}

function abrirEditarRevision(rev) {
  setEditandoRevisionId(rev._id);
  setFormRevision({
    fecha: rev.fecha,
    tipo: rev.tipo || TIPOS_REVISION[0],
    profesional: rev.profesional || '',
    resumen: rev.resumen || '',
    recomendaciones: rev.recomendaciones || '',
    proximaRevision: rev.proximaRevision || '',
    documentos: (rev.documentos || []).map((url) => ({ url, nombre: nombreDesdeUrl(url) }))
  });
}

function cerrarFormRevision() {
  setFormRevision(null);
  setEditandoRevisionId(null);
}

async function handleArchivoRevision(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;

  setSubiendoDocRevision(true);
  setErrorMsg('');
  try {
    const resultado = await api.subirArchivo(file);
    setFormRevision((f) => ({
      ...f,
      documentos: [...f.documentos, { url: resultado.secure_url, nombre: file.name }]
    }));
  } catch (err) {
    setErrorMsg('No se pudo subir el archivo: ' + err.message);
  } finally {
    setSubiendoDocRevision(false);
  }
}

async function handleGuardarRevision(e) {
  e.preventDefault();
  if (!formRevision) return;
  setGuardandoRevision(true);
  setErrorMsg('');
  try {
    const payload = {
      fecha: formRevision.fecha,
      tipo: formRevision.tipo,
      profesional: formRevision.profesional,
      resumen: formRevision.resumen,
      recomendaciones: formRevision.recomendaciones,
      proximaRevision: formRevision.proximaRevision || '',
      documentos: formRevision.documentos.map((d) => d.url)
    };

    if (editandoRevisionId) {
      await api.actualizarBebeRevision(editandoRevisionId, payload);
    } else {
      await api.crearBebeRevision(payload);
    }
    await cargarDatos();
    cerrarFormRevision();
  } catch (err) {
    setErrorMsg(err.message || 'No se pudo guardar la revisión');
  } finally {
    setGuardandoRevision(false);
  }
}

async function handleEliminarRevision(id) {
  setErrorMsg('');
  try {
    await api.eliminarBebeRevision(id);
    await cargarDatos();
  } catch (err) {
    setErrorMsg(err.message || 'No se pudo eliminar la revisión');
  }
}

function toggleCategoriaCompra(cat) {
  setCategoriasColapsadas((prev) => ({ ...prev, [cat]: !prev[cat] }));
}

function toggleTodasCategoriasCompras() {
  const todasColapsadas =
    comprasPorCategoria.length > 0 && comprasPorCategoria.every(([cat]) => !!categoriasColapsadas[cat]);
  const next = {};
  comprasPorCategoria.forEach(([cat]) => {
    next[cat] = !todasColapsadas;
  });
  setCategoriasColapsadas(next);
}

function toggleEdadVacuna(edad) {
  setEdadesColapsadas((prev) => ({ ...prev, [edad]: !prev[edad] }));
}

async function handleToggleRapidoVacuna(vacuna) {
  setErrorMsg('');
  const nuevoEstado = vacuna.estado === 'puesta' ? 'pendiente' : 'puesta';
  try {
    await api.guardarBebeVacuna({
      ...vacuna,
      estado: nuevoEstado,
      fechaAplicacion: nuevoEstado === 'puesta' ? vacuna.fechaAplicacion || todayStr() : ''
    });
    await cargarDatos();
  } catch (err) {
    setErrorMsg(err.message || 'No se pudo actualizar la vacuna');
  }
}

async function handleGuardarEdicionVacuna(e) {
  e.preventDefault();
  if (!vacunaEditando) return;
  setGuardandoVacuna(true);
  setErrorMsg('');
  try {
    await api.guardarBebeVacuna(vacunaEditando);
    setVacunaEditando(null);
    await cargarDatos();
  } catch (err) {
    setErrorMsg(err.message || 'No se pudo guardar la vacuna');
  } finally {
    setGuardandoVacuna(false);
  }
}

async function handleGuardarNuevaVacuna(e) {
  e.preventDefault();
  if (!nuevaVacunaForm?.nombre?.trim()) return;
  setGuardandoVacuna(true);
  setErrorMsg('');
  try {
    await api.guardarBebeVacuna({
      ...nuevaVacunaForm,
      personalizada: true
    });
    setNuevaVacunaForm(null);
    await cargarDatos();
  } catch (err) {
    setErrorMsg(err.message || 'No se pudo añadir la vacuna');
  } finally {
    setGuardandoVacuna(false);
  }
}

async function handleEliminarVacuna(codigo) {
  setErrorMsg('');
  try {
    await api.eliminarBebeVacuna(codigo);
    setVacunaEditando(null);
    await cargarDatos();
  } catch (err) {
    setErrorMsg(err.message || 'No se pudo eliminar la vacuna');
  }
}

async function handleToggleRapidoCompra(item) {
  setErrorMsg('');
  try {
    await api.guardarBebeCompra({
      ...item,
      comprado: !item.comprado,
      descartado: !item.comprado ? false : item.descartado
    });
    await cargarDatos();
  } catch (err) {
    setErrorMsg(err.message || 'No se pudo actualizar el artículo');
  }
}

async function handleGuardarEdicionCompra(e) {
  e.preventDefault();
  if (!compraEditando) return;
  setGuardandoCompra(true);
  setErrorMsg('');
  try {
    await api.guardarBebeCompra(compraEditando);
    setCompraEditando(null);
    await cargarDatos();
  } catch (err) {
    setErrorMsg(err.message || 'No se pudo guardar el artículo');
  } finally {
    setGuardandoCompra(false);
  }
}

async function handleGuardarNuevaCompra(e) {
  e.preventDefault();
  if (!nuevaCompraForm?.nombre?.trim()) return;
  setGuardandoCompra(true);
  setErrorMsg('');
  try {
    await api.guardarBebeCompra({
      ...nuevaCompraForm,
      personalizada: true
    });
    setNuevaCompraForm(null);
    await cargarDatos();
  } catch (err) {
    setErrorMsg(err.message || 'No se pudo añadir el artículo');
  } finally {
    setGuardandoCompra(false);
  }
}

async function handleEliminarCompra(codigo) {
  if (!window.confirm('¿Seguro que quieres borrar este artículo de la lista?')) return;
  setErrorMsg('');
  try {
    await api.eliminarBebeCompra(codigo);
    setCompraEditando(null);
    await cargarDatos();
  } catch (err) {
    setErrorMsg(err.message || 'No se pudo eliminar el artículo');
  }
}

if (loading) {
  return <div className="p-4 text-gray-500">Cargando…</div>;
}

return (
  <div className="p-4 pb-8 space-y-4 max-w-lg mx-auto">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">👶</span>
        <h1 className="text-xl font-bold text-rose-600">Bebé</h1>
      </div>
    </div>

    {errorMsg && (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{errorMsg}</div>
    )}

    {/* Resumen rápido */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <StatTile
        label="Último peso"
        value={ultimoPeso ? `${ultimoPeso.valor} kg` : '—'}
        sub={
          variacionPeso != null
            ? `${variacionPeso > 0 ? '+' : ''}${variacionPeso} kg total`
            : ultimoPeso
              ? formatFechaCorta(ultimoPeso.fecha)
              : 'Sin registros'
        }
      />
      <StatTile
        label="Último tamaño"
        value={ultimoTamano ? `${ultimoTamano.valor} cm` : '—'}
        sub={ultimoTamano ? formatFechaCorta(ultimoTamano.fecha) : 'Sin registros'}
      />
      <StatTile
        label="Vacunas"
        value={`${statsVacunas.puestas}/${statsVacunas.total}`}
        sub="Cartilla"
      />
      <StatTile
        label="Compras"
        value={`${statsCompras.comprados}/${statsCompras.total}`}
        sub="Lista bebé"
      />
    </div>

    {/* Selector de subsección */}
    <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-2xl border border-rose-100 shadow-sm">
      <button
        type="button"
        onClick={() => setVista('crecimiento')}
        className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold transition-colors ${vista === 'crecimiento'
            ? 'bg-rose-500 text-white shadow-sm'
            : 'text-gray-600 hover:bg-rose-50'
          }`}
      >
        📏 Crecim.
      </button>
      <button
        type="button"
        onClick={() => setVista('revisiones')}
        className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold transition-colors ${vista === 'revisiones'
            ? 'bg-rose-500 text-white shadow-sm'
            : 'text-gray-600 hover:bg-rose-50'
          }`}
      >
        🩺 Revis.
      </button>
      <button
        type="button"
        onClick={() => setVista('vacunas')}
        className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold transition-colors ${vista === 'vacunas'
            ? 'bg-rose-500 text-white shadow-sm'
            : 'text-gray-600 hover:bg-rose-50'
          }`}
      >
        💉 Vacunas
      </button>
      <button
        type="button"
        onClick={() => setVista('compras')}
        className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold transition-colors ${vista === 'compras'
            ? 'bg-rose-500 text-white shadow-sm'
            : 'text-gray-600 hover:bg-rose-50'
          }`}
      >
        🛒 Compras
      </button>
    </div>

    {vista === 'crecimiento' && (
      <>
        {/* Formulario de nuevo registro */}
        <Card title="Nuevo registro">
          <form onSubmit={handleGuardarMedicion} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Día</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full text-sm rounded-lg border border-gray-300 px-3 py-1.5"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  placeholder="Ej. 3.45"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-300 px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tamaño (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  inputMode="decimal"
                  placeholder="Ej. 51.5"
                  value={tamano}
                  onChange={(e) => setTamano(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-300 px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">P. cefálico (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  inputMode="decimal"
                  placeholder="Ej. 35.0"
                  value={perimetroCefalico}
                  onChange={(e) => setPerimetroCefalico(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-300 px-2.5 py-1.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Comentarios</label>
              <textarea
                rows={2}
                placeholder="Revisión pediátrica, sensaciones, notas…"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-300 px-3 py-1.5"
              />
            </div>

            <button
              type="submit"
              disabled={guardandoMedicion}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {guardandoMedicion ? 'Guardando…' : 'Guardar registro'}
            </button>
          </form>
        </Card>

        {/* Gráfica de evolución de peso */}
        <Card title="Evolución del peso (kg)">
          {datosGraficaPeso.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={datosGraficaPeso}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e8e8" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip content={<PesoBebeTooltip />} />
                <Line
                  type="monotone"
                  dataKey="peso"
                  name="Peso (kg)"
                  stroke="#e11d48"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#e11d48' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              Añade el primer peso del bebé para ver la curva de evolución.
            </p>
          )}
        </Card>

        {/* Gráfica de tamaño (si hay datos) */}
        {datosGraficaTamano.length > 0 && (
          <Card title="Evolución del tamaño (cm)">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={datosGraficaTamano}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e8e8" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip content={<TamanoBebeTooltip />} />
                <Line
                  type="monotone"
                  dataKey="tamano"
                  name="Tamaño (cm)"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366f1' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Gráfica de perímetro cefálico (si hay datos) */}
        {datosGraficaPerimetro.length > 0 && (
          <Card title="Evolución del perímetro cefálico (cm)">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={datosGraficaPerimetro}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e8e8" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip content={<PerimetroBebeTooltip />} />
                <Line
                  type="monotone"
                  dataKey="perimetro"
                  name="Perímetro cefálico (cm)"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#14b8a6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Historial de mediciones */}
        <Card title="Historial de registros">
          {historialAgrupado.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Todavía no hay registros guardados.</p>
          ) : (
            <div className="space-y-2.5">
              {historialAgrupado.map((entrada) => (
                <div
                  key={entrada.clave}
                  className="border border-rose-100 rounded-xl p-3 space-y-1.5 bg-rose-50/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-700">
                      {formatFechaLarga(entrada.fecha)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEliminarEntrada(entrada)}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Quitar
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {entrada.peso && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full">
                        ⚖️ {entrada.peso.valor} kg
                      </span>
                    )}
                    {entrada.tamano && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                        📏 {entrada.tamano.valor} cm
                      </span>
                    )}
                    {entrada.perimetroCefalico && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-teal-100 text-teal-700 px-2.5 py-0.5 rounded-full">
                        🧠 {entrada.perimetroCefalico.valor} cm
                      </span>
                    )}
                  </div>

                  {entrada.comentario?.texto && (
                    <p className="text-xs text-gray-600 pt-0.5">{entrada.comentario.texto}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </>
    )}

    {vista === 'revisiones' && (
      <Card
        title="Revisiones pediátricas"
        right={
          !formRevision && (
            <button
              type="button"
              onClick={abrirNuevaRevision}
              className="text-xs font-semibold text-rose-600 border border-rose-300 rounded-full px-3 py-1 hover:bg-rose-50"
            >
              + Añadir revisión
            </button>
          )
        }
      >
        {formRevision && (
          <form
            onSubmit={handleGuardarRevision}
            className="border border-rose-200 rounded-xl p-3 space-y-2.5 bg-rose-50/30"
          >
            <p className="text-xs font-semibold text-rose-700">
              {editandoRevisionId ? 'Editar revisión pediátrica' : 'Nueva revisión pediátrica'}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {TIPOS_REVISION.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFormRevision((f) => ({ ...f, tipo }))}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${formRevision.tipo === tipo
                      ? 'bg-rose-500 text-white border-rose-500 font-medium'
                      : 'bg-white text-gray-600 border-gray-300'
                    }`}
                >
                  {tipo}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">Fecha</label>
                <input
                  type="date"
                  required
                  value={formRevision.fecha}
                  onChange={(e) => setFormRevision((f) => ({ ...f, fecha: e.target.value }))}
                  className="w-full text-xs rounded-lg border border-gray-300 px-2.5 py-1.5 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">Próxima revisión (opc.)</label>
                <input
                  type="date"
                  value={formRevision.proximaRevision}
                  onChange={(e) => setFormRevision((f) => ({ ...f, proximaRevision: e.target.value }))}
                  className="w-full text-xs rounded-lg border border-gray-300 px-2.5 py-1.5 bg-white"
                />
              </div>
            </div>

            <input
              type="text"
              placeholder="Pediatra / Centro de salud (opcional)"
              value={formRevision.profesional}
              onChange={(e) => setFormRevision((f) => ({ ...f, profesional: e.target.value }))}
              className="w-full text-sm rounded-lg border border-gray-300 px-3 py-1.5 bg-white"
            />

            <textarea
              rows={2}
              placeholder="Resumen de la consulta (peso/talla comentados, hitos, exploración…)"
              value={formRevision.resumen}
              onChange={(e) => setFormRevision((f) => ({ ...f, resumen: e.target.value }))}
              className="w-full text-sm rounded-lg border border-gray-300 px-3 py-1.5 bg-white"
            />

            <textarea
              rows={2}
              placeholder="Recomendaciones / pautas (opcional)"
              value={formRevision.recomendaciones}
              onChange={(e) => setFormRevision((f) => ({ ...f, recomendaciones: e.target.value }))}
              className="w-full text-sm rounded-lg border border-gray-300 px-3 py-1.5 bg-white"
            />

            <div>
              <span className="block text-xs text-gray-600 mb-1">Documentos (informes, recetas, fotos…)</span>
              {formRevision.documentos.length > 0 && (
                <div className="space-y-1 mb-2">
                  {formRevision.documentos.map((doc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs bg-rose-50 rounded-lg px-2 py-1"
                    >
                      <a href={doc.url} target="_blank" rel="noreferrer" className="text-rose-600 truncate">
                        📎 {doc.nombre}
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          setFormRevision((f) => ({
                            ...f,
                            documentos: f.documentos.filter((_, idx) => idx !== i)
                          }))
                        }
                        className="text-gray-400 ml-2 shrink-0"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleArchivoRevision}
                disabled={subiendoDocRevision}
                className="text-xs"
              />
              {subiendoDocRevision && <p className="text-xs text-gray-400 mt-1">Subiendo…</p>}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={guardandoRevision}
                className="flex-1 bg-rose-500 text-white rounded-lg py-1.5 text-sm font-semibold disabled:opacity-50"
              >
                {guardandoRevision ? 'Guardando…' : 'Guardar revisión'}
              </button>
              <button
                type="button"
                onClick={cerrarFormRevision}
                className="px-3 rounded-lg border border-gray-300 text-sm text-gray-600 bg-white"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {revisiones.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Todavía no hay revisiones pediátricas registradas.
          </p>
        ) : (
          <div className="space-y-2.5">
            {revisiones.map((rev) => (
              <div key={rev._id} className="border border-rose-100 rounded-xl p-3 space-y-1.5 bg-rose-50/20">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {rev.tipo} · {formatFechaLarga(rev.fecha)}
                    </p>
                    {rev.profesional && <p className="text-xs text-gray-500">👩‍⚕️ {rev.profesional}</p>}
                  </div>
                  <div className="flex gap-2 text-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => abrirEditarRevision(rev)}
                      className="text-rose-500 font-medium"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarRevision(rev._id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      Quitar
                    </button>
                  </div>
                </div>

                {rev.resumen && <p className="text-xs text-gray-700">{rev.resumen}</p>}
                {rev.recomendaciones && (
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Recomendaciones:</span> {rev.recomendaciones}
                  </p>
                )}
                {rev.proximaRevision && (
                  <p className="text-xs text-rose-600 font-medium">
                    📅 Próxima revisión: {formatFechaLarga(rev.proximaRevision)}
                  </p>
                )}
                {rev.documentos?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {rev.documentos.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-rose-500 underline truncate max-w-[160px]"
                      >
                        📎 {nombreDesdeUrl(url)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    )}

    {vista === 'vacunas' && (
      <>
        <Card
          title="Cartilla de vacunación"
          right={
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
              {statsVacunas.puestas} / {statsVacunas.total} puestas
            </span>
          }
        >
          <div className="w-full bg-rose-100 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{
                width: `${statsVacunas.total > 0 ? Math.round((statsVacunas.puestas / statsVacunas.total) * 100) : 0}%`
              }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-500">
              Pulsa el círculo para marcarla como puesta o en «Detalles» para añadir fecha, lote y notas.
            </p>
          </div>

          {nuevaVacunaForm ? (
            <form
              onSubmit={handleGuardarNuevaVacuna}
              className="border border-rose-200 rounded-xl p-3 space-y-2 bg-rose-50/30"
            >
              <p className="text-xs font-semibold text-rose-700">Añadir vacuna personalizada</p>
              <input
                type="text"
                required
                placeholder="Nombre de la vacuna (ej. Meningococo, Gripe…)"
                value={nuevaVacunaForm.nombre}
                onChange={(e) => setNuevaVacunaForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full text-sm rounded-lg border border-gray-300 px-3 py-1.5 bg-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={nuevaVacunaForm.edadRecomendada}
                  onChange={(e) => setNuevaVacunaForm((f) => ({ ...f, edadRecomendada: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-gray-300 px-2.5 py-1.5 bg-white"
                >
                  {ORDEN_EDADES.map((edad) => (
                    <option key={edad} value={edad}>
                      {edad}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Dosis (ej. 1ª dosis)"
                  value={nuevaVacunaForm.dosis}
                  onChange={(e) => setNuevaVacunaForm((f) => ({ ...f, dosis: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-gray-300 px-3 py-1.5 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={nuevaVacunaForm.estado}
                  onChange={(e) => setNuevaVacunaForm((f) => ({ ...f, estado: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-gray-300 px-2.5 py-1.5 bg-white"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="puesta">Puesta</option>
                </select>
                <input
                  type="date"
                  value={nuevaVacunaForm.fechaAplicacion}
                  onChange={(e) => setNuevaVacunaForm((f) => ({ ...f, fechaAplicacion: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-gray-300 px-2.5 py-1.5 bg-white"
                />
              </div>
              <input
                type="text"
                placeholder="Lote (opcional)"
                value={nuevaVacunaForm.lote}
                onChange={(e) => setNuevaVacunaForm((f) => ({ ...f, lote: e.target.value }))}
                className="w-full text-sm rounded-lg border border-gray-300 px-3 py-1.5 bg-white"
              />
              <input
                type="text"
                placeholder="Notas (opcional)"
                value={nuevaVacunaForm.notas}
                onChange={(e) => setNuevaVacunaForm((f) => ({ ...f, notas: e.target.value }))}
                className="w-full text-sm rounded-lg border border-gray-300 px-3 py-1.5 bg-white"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={guardandoVacuna}
                  className="flex-1 bg-rose-500 text-white rounded-lg py-1.5 text-sm font-semibold disabled:opacity-50"
                >
                  {guardandoVacuna ? 'Guardando…' : 'Guardar vacuna'}
                </button>
                <button
                  type="button"
                  onClick={() => setNuevaVacunaForm(null)}
                  className="px-3 rounded-lg border border-gray-300 text-sm text-gray-600 bg-white"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() =>
                setNuevaVacunaForm({
                  nombre: '',
                  edadRecomendada: 'Otra',
                  dosis: '',
                  descripcion: '',
                  estado: 'pendiente',
                  fechaAplicacion: '',
                  lote: '',
                  notas: ''
                })
              }
              className="text-xs font-semibold text-rose-600 border border-rose-300 rounded-full px-3 py-1.5 hover:bg-rose-50"
            >
              + Añadir vacuna
            </button>
          )}
        </Card>

        {vacunasPorEdad.map(([edad, items]) => {
          const puestasEdad = items.filter((v) => v.estado === 'puesta').length;
          const aplicablesEdad = items.filter((v) => v.estado !== 'no_aplica').length;
          return (
            <Card
              key={edad}
              title={edad}
              collapsible
              collapsed={!!edadesColapsadas[edad]}
              onToggle={() => toggleEdadVacuna(edad)}
              right={
                <span className="text-[11px] font-medium text-gray-500">
                  {puestasEdad}/{aplicablesEdad}
                </span>
              }
            >
              <div className="space-y-2">
                {items.map((v) => {
                  const estaEditando = vacunaEditando?.codigo === v.codigo;
                  const esPuesta = v.estado === 'puesta';
                  const esNoAplica = v.estado === 'no_aplica';

                  return (
                    <div
                      key={v.codigo}
                      className={`rounded-xl border p-3 transition-colors ${esPuesta
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : esNoAplica
                            ? 'bg-gray-50 border-gray-200 opacity-65'
                            : 'bg-white border-rose-100'
                        }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleRapidoVacuna(v)}
                          title={esPuesta ? 'Marcar como pendiente' : 'Marcar como puesta'}
                          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${esPuesta
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-gray-300 text-transparent hover:border-rose-400'
                            }`}
                        >
                          ✓
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm font-semibold ${esPuesta ? 'text-emerald-900' : 'text-gray-800'}`}>
                              {v.nombre}{' '}
                              {v.dosis && <span className="text-xs font-normal text-gray-500">· {v.dosis}</span>}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setVacunaEditando(estaEditando ? null : { ...v })
                              }
                              className="text-xs text-rose-500 font-medium shrink-0"
                            >
                              {estaEditando ? 'Cerrar' : 'Detalles'}
                            </button>
                          </div>

                          {v.descripcion && <p className="text-xs text-gray-500 mt-0.5">{v.descripcion}</p>}

                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${esPuesta
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : esNoAplica
                                    ? 'bg-gray-200 text-gray-600'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                            >
                              {esPuesta ? 'Puesta' : esNoAplica ? 'No aplica' : 'Pendiente'}
                            </span>
                            {v.fechaAplicacion && (
                              <span className="text-[11px] text-gray-600">
                                📅 {formatFechaLarga(v.fechaAplicacion)}
                              </span>
                            )}
                            {v.lote && <span className="text-[11px] text-gray-500">Lote: {v.lote}</span>}
                          </div>

                          {v.notas && <p className="text-xs text-gray-600 mt-1 italic">{v.notas}</p>}
                        </div>
                      </div>

                      {estaEditando && (
                        <form
                          onSubmit={handleGuardarEdicionVacuna}
                          className="mt-3 pt-3 border-t border-rose-100 space-y-2"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] text-gray-500 mb-0.5">Estado</label>
                              <select
                                value={vacunaEditando.estado}
                                onChange={(e) =>
                                  setVacunaEditando((prev) => ({
                                    ...prev,
                                    estado: e.target.value,
                                    fechaAplicacion:
                                      e.target.value === 'puesta' && !prev.fechaAplicacion
                                        ? todayStr()
                                        : prev.fechaAplicacion
                                  }))
                                }
                                className="w-full text-xs rounded-lg border border-gray-300 px-2 py-1.5 bg-white"
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="puesta">Puesta</option>
                                <option value="no_aplica">No aplica</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] text-gray-500 mb-0.5">Fecha de aplicación</label>
                              <input
                                type="date"
                                value={vacunaEditando.fechaAplicacion || ''}
                                onChange={(e) =>
                                  setVacunaEditando((prev) => ({ ...prev, fechaAplicacion: e.target.value }))
                                }
                                className="w-full text-xs rounded-lg border border-gray-300 px-2 py-1.5 bg-white"
                              />
                            </div>
                          </div>

                          <input
                            type="text"
                            placeholder="Lote (opcional)"
                            value={vacunaEditando.lote || ''}
                            onChange={(e) => setVacunaEditando((prev) => ({ ...prev, lote: e.target.value }))}
                            className="w-full text-xs rounded-lg border border-gray-300 px-2.5 py-1.5 bg-white"
                          />

                          <input
                            type="text"
                            placeholder="Notas (reacción, centro de salud, pediatra…)"
                            value={vacunaEditando.notas || ''}
                            onChange={(e) => setVacunaEditando((prev) => ({ ...prev, notas: e.target.value }))}
                            className="w-full text-xs rounded-lg border border-gray-300 px-2.5 py-1.5 bg-white"
                          />

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="submit"
                              disabled={guardandoVacuna}
                              className="flex-1 bg-rose-500 text-white rounded-lg py-1.5 text-xs font-semibold disabled:opacity-50"
                            >
                              {guardandoVacuna ? 'Guardando…' : 'Guardar'}
                            </button>
                            {v.personalizada && (
                              <button
                                type="button"
                                onClick={() => handleEliminarVacuna(v.codigo)}
                                className="px-3 py-1.5 rounded-lg border border-red-200 text-xs text-red-600 bg-white"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </>
    )}

    {vista === 'compras' && (
      <>
        <Card
          title="Lista de cosas para el bebé"
          right={
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
              {statsCompras.comprados} / {statsCompras.total} comprados
            </span>
          }
        >
          <div className="w-full bg-rose-100 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{
                width: `${statsCompras.total > 0 ? Math.round((statsCompras.comprados / statsCompras.total) * 100) : 0
                  }%`
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
            <div className="flex gap-1">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'pendientes', label: 'Pendientes' },
                { id: 'comprados', label: 'Comprados' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltroCompras(f.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filtroCompras === f.id
                      ? 'bg-rose-500 text-white border-rose-500 font-medium'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-rose-50'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              {comprasPorCategoria.length > 0 && (
                <button
                  type="button"
                  onClick={toggleTodasCategoriasCompras}
                  className="text-xs text-gray-600 border border-gray-200 rounded-full px-2.5 py-1 hover:bg-rose-50"
                >
                  {comprasPorCategoria.every(([cat]) => !!categoriasColapsadas[cat])
                    ? 'Desplegar todas'
                    : 'Plegar todas'}
                </button>
              )}
              {!nuevaCompraForm && (
                <button
                  type="button"
                  onClick={() =>
                    setNuevaCompraForm({
                      nombre: '',
                      categoria: 'Para el paseo',
                      comprado: false,
                      descartado: false,
                      notas: ''
                    })
                  }
                  className="text-xs font-semibold text-rose-600 border border-rose-300 rounded-full px-3 py-1 hover:bg-rose-50"
                >
                  + Añadir artículo
                </button>
              )}
            </div>
          </div>

          {nuevaCompraForm && (
            <form
              onSubmit={handleGuardarNuevaCompra}
              className="border border-rose-200 rounded-xl p-3 space-y-2 bg-rose-50/30"
            >
              <p className="text-xs font-semibold text-rose-700">Añadir artículo a la lista</p>
              <input
                type="text"
                required
                placeholder="Nombre del artículo (ej. Bañera, Termómetro…)"
                value={nuevaCompraForm.nombre}
                onChange={(e) => setNuevaCompraForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full text-sm rounded-lg border border-gray-300 px-3 py-1.5 bg-white"
              />
              <select
                value={nuevaCompraForm.categoria}
                onChange={(e) => setNuevaCompraForm((f) => ({ ...f, categoria: e.target.value }))}
                className="w-full text-sm rounded-lg border border-gray-300 px-2.5 py-1.5 bg-white"
              >
                {CATEGORIAS_COMPRAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Notas (marca, tienda, quién lo regala…)"
                value={nuevaCompraForm.notas}
                onChange={(e) => setNuevaCompraForm((f) => ({ ...f, notas: e.target.value }))}
                className="w-full text-sm rounded-lg border border-gray-300 px-3 py-1.5 bg-white"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={guardandoCompra}
                  className="flex-1 bg-rose-500 text-white rounded-lg py-1.5 text-sm font-semibold disabled:opacity-50"
                >
                  {guardandoCompra ? 'Guardando…' : 'Guardar artículo'}
                </button>
                <button
                  type="button"
                  onClick={() => setNuevaCompraForm(null)}
                  className="px-3 rounded-lg border border-gray-300 text-sm text-gray-600 bg-white"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </Card>

        {comprasPorCategoria.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-400 text-center py-4">
              No hay artículos en este filtro.
            </p>
          </Card>
        ) : (
          comprasPorCategoria.map(([categoria, items]) => {
            const activosCat = items.filter((i) => !i.descartado);
            const compradosCat = activosCat.filter((i) => i.comprado).length;

            return (
              <Card
                key={categoria}
                title={categoria}
                collapsible
                collapsed={!!categoriasColapsadas[categoria]}
                onToggle={() => toggleCategoriaCompra(categoria)}
                right={
                  <span className="text-[11px] font-medium text-gray-500">
                    {compradosCat}/{activosCat.length}
                  </span>
                }
              >
                <div className="space-y-1.5">
                  {items.map((item) => {
                    const estaEditando = compraEditando?.codigo === item.codigo;

                    return (
                      <div
                        key={item.codigo}
                        className={`rounded-xl border px-3 py-2 transition-colors ${item.comprado
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : item.descartado
                              ? 'bg-gray-50 border-gray-200 opacity-60'
                              : 'bg-white border-rose-100'
                          }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleRapidoCompra(item)}
                            title={item.comprado ? 'Marcar como pendiente' : 'Marcar como comprado'}
                            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${item.comprado
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-gray-300 text-transparent hover:border-rose-400'
                              }`}
                          >
                            ✓
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-sm ${item.comprado
                                    ? 'line-through text-emerald-800/80'
                                    : item.descartado
                                      ? 'line-through text-gray-400'
                                      : 'text-gray-800 font-medium'
                                  }`}
                              >
                                {item.nombre}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setCompraEditando(estaEditando ? null : { ...item })}
                                  className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-xs text-rose-600 font-medium transition-colors"
                                >
                                  {estaEditando ? 'Cerrar' : 'Editar'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEliminarCompra(item.codigo)}
                                  className="px-2.5 py-1 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs text-red-600 font-medium transition-colors"
                                  title="Borrar artículo"
                                >
                                  Borrar
                                </button>
                              </div>
                            </div>

                            {item.descartado && (
                              <span className="inline-block text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded mt-0.5">
                                No necesario
                              </span>
                            )}

                            {item.notas && (
                              <p className="text-xs text-gray-500 mt-0.5 italic">{item.notas}</p>
                            )}
                          </div>
                        </div>

                        {estaEditando && (
                            <form
                              onSubmit={handleGuardarEdicionCompra}
                              className="mt-2.5 pt-2.5 border-t border-rose-100 space-y-2.5"
                            >
                              <div>
                                <label className="block text-[11px] text-gray-500 mb-0.5">Nombre del artículo</label>
                                <input
                                  type="text"
                                  required
                                  value={compraEditando.nombre || ''}
                                  onChange={(e) =>
                                    setCompraEditando((prev) => ({ ...prev, nombre: e.target.value }))
                                  }
                                  className="w-full text-xs rounded-lg border border-gray-300 px-2.5 py-1.5 bg-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] text-gray-500 mb-0.5">Notas</label>
                                <input
                                  type="text"
                                  placeholder="Nota (modelo, tienda, precio, regalo…)"
                                  value={compraEditando.notas || ''}
                                  onChange={(e) =>
                                    setCompraEditando((prev) => ({ ...prev, notas: e.target.value }))
                                  }
                                  className="w-full text-xs rounded-lg border border-gray-300 px-2.5 py-1.5 bg-white"
                                />
                              </div>

                              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                                <label className="flex items-center gap-1.5 text-xs text-gray-700 font-medium cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={!!compraEditando.comprado}
                                    onChange={(e) =>
                                      setCompraEditando((prev) => ({
                                        ...prev,
                                        comprado: e.target.checked,
                                        descartado: e.target.checked ? false : prev.descartado
                                      }))
                                    }
                                    className="rounded"
                                  />
                                  <span>Comprado / Conseguido</span>
                                </label>

                                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={!!compraEditando.descartado}
                                    onChange={(e) =>
                                      setCompraEditando((prev) => ({
                                        ...prev,
                                        descartado: e.target.checked,
                                        comprado: e.target.checked ? false : prev.comprado
                                      }))
                                    }
                                    className="rounded"
                                  />
                                  <span>Marcar como «No necesario»</span>
                                </label>
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="submit"
                                  disabled={guardandoCompra}
                                  className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-1.5 text-xs font-semibold disabled:opacity-50 transition-colors"
                                >
                                  {guardandoCompra ? 'Guardando…' : 'Guardar'}
                                </button>
                              </div>
                            </form>
                          )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })
        )}
      </>
    )}
  </div>
);
}
