import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ desde: '', hasta: '' });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (filters.desde) params.desde = filters.desde;
      if (filters.hasta) params.hasta = filters.hasta;

      const { data } = await api.get('/logs', { params });
      setLogs(data.data);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError('Error al cargar logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page]);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const roleBadge = (accion) => {
    if (accion.includes('inició sesión')) return 'bg-blue-100 text-blue-700';
    if (accion.includes('registró venta')) return 'bg-emerald-100 text-emerald-700';
    if (accion.includes('registró compra')) return 'bg-violet-100 text-violet-700';
    if (accion.includes('creó')) return 'bg-emerald-100 text-emerald-700';
    if (accion.includes('editó')) return 'bg-amber-100 text-amber-700';
    if (accion.includes('eliminó') || accion.includes('desactivó')) return 'bg-red-100 text-red-700';
    if (accion.includes('cambió')) return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Logs de Auditoría</h2>
        <p className="text-sm text-slate-500 mt-1">Registro de acciones en el sistema</p>
      </div>

      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Desde</label>
          <input
            type="date"
            value={filters.desde}
            onChange={(e) => setFilters({ ...filters, desde: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Hasta</label>
          <input
            type="date"
            value={filters.hasta}
            onChange={(e) => setFilters({ ...filters, hasta: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <button
          type="submit"
          className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Filtrar
        </button>
        {(filters.desde || filters.hasta) && (
          <button
            type="button"
            onClick={() => { setFilters({ desde: '', hasta: '' }); setPage(1); setTimeout(loadLogs, 0); }}
            className="text-sm text-slate-500 hover:text-slate-700 py-2"
          >
            Limpiar filtros
          </button>
        )}
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Usuario</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-12 text-center">
                    <span className="text-3xl block mb-2">📋</span>
                    <span className="text-sm text-slate-400">No hay registros de auditoría</span>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-700 whitespace-nowrap">
                      {log.usuario_nombre}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge(log.accion)}`}>
                        {log.accion}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
