import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatCard from '../components/ui/StatCard';

export default function Dashboard() {
  const [stats, setStats] = useState({ productos: 0, ventasHoy: 0, stockBajo: 0, ingresosMes: 0, clientes: 0, pendientes: 0 });
  const [ultimasVentas, setUltimasVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, ventasRes, clientRes] = await Promise.all([
          api.get('/productos'),
          api.get('/ventas'),
          api.get('/clientes'),
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

        setUltimasVentas(ventas.slice(0, 5));
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const formatMoney = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Productos" value={stats.productos} icon="📦" color="emerald" />
        <StatCard title="Ventas Hoy" value={stats.ventasHoy} icon="🛒" color="blue" />
        <StatCard title="Stock Bajo" value={stats.stockBajo} icon="⚠️" color="amber" />
        <StatCard title="Ingresos del Mes" value={formatMoney(stats.ingresosMes)} icon="💰" color="purple" />
        <StatCard title="Clientes" value={stats.clientes} icon="👥" color="emerald" />
        <StatCard title="Pendientes" value={stats.pendientes} icon="⏳" color="amber" />
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
