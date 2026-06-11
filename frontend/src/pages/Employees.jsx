import { useState, useEffect } from 'react';
import api from '../services/api';

const formatMoney = (v) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(v || 0);

const formatDate = (d) => {
  if (!d) return '—';
  const parts = d.split('T')[0]?.split('-') || d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
};

const areas = ['Administración', 'Ventas', 'Almacén', 'Finanzas', 'Operaciones', 'RRHH', 'Marketing'];
const puestos = ['Gerente General', 'Gerente de Tienda', 'Vendedor Senior', 'Vendedor', 'Auxiliar de Bodega', 'Contador', 'Atención al Cliente', 'Supervisor de Limpieza', 'Analista', 'Coordinador'];

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', puesto: 'Vendedor', area: 'Ventas', salario: '', fecha_ingreso: '' });
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    try { const { data } = await api.get('/empleados'); setEmployees(data); } catch { setError('Error al cargar empleados'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setForm({ nombre: '', email: '', telefono: '', puesto: 'Vendedor', area: 'Ventas', salario: '', fecha_ingreso: '' }); setError(''); setModalOpen(true); };
  const openEdit = (e) => { setEditingId(e.id); setForm({ nombre: e.nombre, email: e.email || '', telefono: e.telefono || '', puesto: e.puesto, area: e.area, salario: e.salario || '', fecha_ingreso: e.fecha_ingreso ? e.fecha_ingreso.split('T')[0] : '' }); setError(''); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.nombre.trim() || !form.email.trim() || !form.puesto || !form.area) {
      setError('Nombre, email, puesto y área son requeridos');
      return;
    }
    try {
      if (editingId) await api.put(`/empleados/${editingId}`, form);
      else await api.post('/empleados', form);
      setModalOpen(false); load();
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
  };

  const handleDeactivate = async () => {
    try { await api.delete(`/empleados/${deleteId}`); setDeleteId(null); load(); } catch (err) { setError(err.response?.data?.error || 'Error al desactivar'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-800">Talento Humano</h2><p className="text-sm text-slate-500 mt-1">Gestión de empleados, sueldos y puestos</p></div>
        <button onClick={openCreate} className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">+ Nuevo Empleado</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium">Total Empleados</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{employees.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium">Activos</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{employees.filter((e) => e.activo).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium">Nómina Mensual</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">{formatMoney(employees.filter((e) => e.activo).reduce((s, e) => s + parseFloat(e.salario || 0), 0))}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium">Áreas</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{new Set(employees.filter((e) => e.activo).map((e) => e.area)).size}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-left"><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nombre</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Puesto</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Área</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Salario</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ingreso</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Estado</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {employees.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center"><span className="text-3xl block mb-2">👤</span><span className="text-sm text-slate-400">No hay empleados registrados</span></td></tr> : employees.map((emp) => (
                <tr key={emp.id} className={`hover:bg-slate-50/50 ${!emp.activo ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-medium text-slate-800">{emp.nombre}<div className="text-xs text-slate-400">{emp.email}</div></td>
                  <td className="px-4 py-3 text-slate-600">{emp.puesto}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{emp.area}</span></td>
                  <td className="px-4 py-3 text-right text-slate-700 font-medium">{formatMoney(emp.salario)}</td>
                  <td className="px-4 py-3 text-slate-500 text-sm">{formatDate(emp.fecha_ingreso)}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emp.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{emp.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(emp)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Editar"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      {emp.activo && <button onClick={() => setDeleteId(emp.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Desactivar"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{editingId ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" autoFocus />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                  <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Puesto</label>
                  <select value={form.puesto} onChange={(e) => setForm({ ...form, puesto: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    {puestos.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Área</label>
                  <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Salario (USD)</label>
                  <input type="number" step="0.01" min="0" value={form.salario} onChange={(e) => setForm({ ...form, salario: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Ingreso</label>
                  <input type="date" value={form.fecha_ingreso} onChange={(e) => setForm({ ...form, fecha_ingreso: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">{error}</div>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Desactivar Empleado</h3>
            <p className="text-sm text-slate-500 mb-4">¿Estás seguro de desactivar este empleado? Ya no aparecerá como activo.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
              <button onClick={handleDeactivate} className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Desactivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
