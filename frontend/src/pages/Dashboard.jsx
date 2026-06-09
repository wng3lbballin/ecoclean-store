import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Legend,
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ productos: 0, ventasHoy: 0, stockBajo: 0, ingresosMes: 0, clientes: 0, pendientes: 0 });
  const [ultimasVentas, setUltimasVentas] = useState([]);
  const [ventasMensuales, setVentasMensuales] = useState([]);
  const [ventasAnuales, setVentasAnuales] = useState([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const [reporteDesde, setReporteDesde] = useState('');
  const [reporteHasta, setReporteHasta] = useState('');
  const [reporteData, setReporteData] = useState(null);
  const [reporteLoading, setReporteLoading] = useState(false);
  const [reporteError, setReporteError] = useState('');
  const [analisisIA, setAnalisisIA] = useState('');
  const [analisisLoading, setAnalisisLoading] = useState(false);
  const [analisisError, setAnalisisError] = useState('');
  const [injectLoading, setInjectLoading] = useState(false);
  const [injectResult, setInjectResult] = useState('');

  const injectarDatos = async () => {
    if (!confirm('Esto generará ~250 ventas y ~50 compras históricas. ¿Continuar?')) return;
    setInjectLoading(true);
    setInjectResult('');
    try {
      const { data } = await api.post('/admin/injectar-datos');
      setInjectResult(`Listo: ${data.ventasCreadas} ventas y ${data.comprasCreadas} compras creadas. Recarga la página.`);
    } catch (err) {
      setInjectResult('Error: ' + (err.response?.data?.error || 'falló la inyección'));
    } finally {
      setInjectLoading(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, ventasRes, clientRes, mensualRes, anualRes] = await Promise.all([
          api.get('/productos'),
          api.get('/ventas'),
          api.get('/clientes'),
          api.get(`/estadisticas/ventas-mensuales?anio=${anioSeleccionado}`),
          api.get('/estadisticas/ventas-anuales'),
        ]);

        const productos = prodRes.data || [];
        const ventas = ventasRes.data || [];

        const hoy = new Date().toISOString().split('T')[0];
        const ventasHoy = ventas.filter((v) => v.fecha && v.fecha.startsWith(hoy)).length;

        const ingresosMes = ventas
          .filter((v) => {
            if (!v.fecha) return false;
            const fv = new Date(v.fecha); const ahora = new Date();
            return fv.getMonth() === ahora.getMonth() && fv.getFullYear() === ahora.getFullYear();
          })
          .reduce((sum, v) => sum + parseFloat(v.total || 0), 0);

        const pendientes = ventas.filter((v) => v.estado === 'pendiente').length;

        setStats({
          productos: productos.length,
          ventasHoy,
          stockBajo: productos.filter((p) => p.stock < 5).length,
          ingresosMes,
          clientes: (clientRes.data || []).length,
          pendientes,
        });

        setVentasMensuales(mensualRes.data.data || []);
        setVentasAnuales(anualRes.data || []);
        setUltimasVentas(ventas.slice(0, 5));
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [anioSeleccionado]);

  const cargarAnalisisIA = async () => {
    setAnalisisLoading(true);
    setAnalisisError('');
    setAnalisisIA('');
    try {
      const { data } = await api.post('/ia/analisis-ventas');
      setAnalisisIA(data.analysis);
    } catch (err) {
      setAnalisisError(err.response?.data?.error || 'Error al generar análisis');
    } finally {
      setAnalisisLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      cargarAnalisisIA();
    }
  }, [loading]);

  const generarReporte = async (e) => {
    e.preventDefault();
    setReporteError('');

    if (!reporteDesde || !reporteHasta) {
      setReporteError('Selecciona ambas fechas');
      return;
    }

    setReporteLoading(true);
    try {
      const { data } = await api.get('/estadisticas/reporte', {
        params: { desde: reporteDesde, hasta: reporteHasta },
      });
      setReporteData(data);
    } catch (err) {
      setReporteError(err.response?.data?.error || 'Error al generar reporte');
    } finally {
      setReporteLoading(false);
    }
  };

  const formatMoney = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(y);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Resumen general del sistema</p>
        </div>
        {user?.rol === 'admin' && (
          <button
            onClick={injectarDatos}
            disabled={injectLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            title="Genera datos históricos para gráficos y reportes"
          >
            {injectLoading ? 'Generando...' : 'Generar Datos Demo'}
          </button>
        )}
      </div>
      {injectResult && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2.5 rounded-lg">
          {injectResult}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Productos" value={stats.productos} icon="📦" color="emerald" />
        <StatCard title="Ventas Hoy" value={stats.ventasHoy} icon="🛒" color="blue" />
        <StatCard title="Stock Bajo" value={stats.stockBajo} icon="⚠️" color="amber" />
        <StatCard title="Ingresos del Mes" value={formatMoney(stats.ingresosMes)} icon="💰" color="purple" />
        <StatCard title="Clientes" value={stats.clientes} icon="👥" color="emerald" />
        <StatCard title="Pendientes" value={stats.pendientes} icon="⏳" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Ventas Mensuales</h3>
            <select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
              className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ventasMensuales} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                formatter={(value) => formatMoney(value)}
                contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="total" name="Ingresos" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Ventas Anuales</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={ventasAnuales} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="anio" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                formatter={(value) => formatMoney(value)}
                contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Area type="monotone" dataKey="total" name="Ingresos" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Reportes por Período</h3>
        <form onSubmit={generarReporte} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Desde</label>
            <input
              type="date"
              value={reporteDesde}
              onChange={(e) => setReporteDesde(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Hasta</label>
            <input
              type="date"
              value={reporteHasta}
              onChange={(e) => setReporteHasta(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={reporteLoading}
            className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {reporteLoading ? 'Generando...' : 'Generar Reporte'}
          </button>
        </form>

        {reporteError && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
            {reporteError}
          </div>
        )}

        {reporteData && (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                <p className="text-xs text-emerald-600 font-medium mb-1">Total Ventas</p>
                <p className="text-2xl font-bold text-emerald-700">{reporteData.resumen.total_ventas}</p>
              </div>
              <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
                <p className="text-xs text-violet-600 font-medium mb-1">Ingresos</p>
                <p className="text-2xl font-bold text-violet-700">{formatMoney(reporteData.resumen.ingresos)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-1">Ticket Promedio</p>
                <p className="text-2xl font-bold text-blue-700">{formatMoney(reporteData.resumen.ticket_promedio)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-600 uppercase mb-2">Ventas por Día</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={reporteData.ventasPorDia} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(value) => formatMoney(value)}
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="total" name="Ingresos" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-600 uppercase mb-2">Productos Más Vendidos</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Producto</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase text-center">Cantidad</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase text-right">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reporteData.productosMasVendidos.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-400">Sin datos en este período</td>
                      </tr>
                    ) : (
                      reporteData.productosMasVendidos.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 text-slate-700 font-medium">{p.nombre}</td>
                          <td className="px-4 py-2.5 text-center text-slate-600">{p.cantidad_total}</td>
                          <td className="px-4 py-2.5 text-right text-slate-700">{formatMoney(p.ingresos)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <h3 className="text-sm font-semibold text-slate-700">Proyecciones y Análisis IA</h3>
          </div>
          <button
            onClick={cargarAnalisisIA}
            disabled={analisisLoading}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
          >
            {analisisLoading ? 'Analizando...' : 'Actualizar análisis'}
          </button>
        </div>

        {analisisError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-2.5 rounded-lg">
            {analisisError}
          </div>
        )}

        {analisisLoading && !analisisIA && (
          <div className="flex items-center gap-3 text-sm text-slate-400 py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-600"></div>
            Generando análisis con inteligencia artificial...
          </div>
        )}

        {analisisIA && (
          <div className="prose prose-sm max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-violet-50 border border-violet-100 rounded-lg p-4">
            {analisisIA}
          </div>
        )}

        {!analisisIA && !analisisLoading && !analisisError && (
          <p className="text-sm text-slate-400 py-4">El análisis se cargará automáticamente. Si no aparece, verifica que DEEPSEEK_API_KEY esté configurada en el servidor.</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Últimas Ventas</h3>
          <Link to="/ventas" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            Ver todas →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase">ID</th>
                <th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                <th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase">Total</th>
                <th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ultimasVentas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <span className="text-3xl block mb-2">📋</span>
                    <span className="text-sm text-slate-400">No hay ventas registradas</span>
                  </td>
                </tr>
              ) : (
                ultimasVentas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-xs text-slate-500 font-mono">
                      {venta.id?.substring(0, 8)}...
                    </td>
                    <td className="px-5 py-3 text-slate-700">{formatDate(venta.fecha)}</td>
                    <td className="px-5 py-3 text-slate-700 font-medium">
                      {formatMoney(venta.total)}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        to="/ventas"
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
