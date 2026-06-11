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

const calcAntiguedad = (fechaIngreso) => {
  if (!fechaIngreso) return '—';
  const inicio = new Date(fechaIngreso.split('T')[0] || fechaIngreso);
  const hoy = new Date();
  const years = hoy.getFullYear() - inicio.getFullYear();
  const months = hoy.getMonth() - inicio.getMonth();
  const totalMeses = years * 12 + months + (hoy.getDate() >= inicio.getDate() ? 0 : -1);
  const a = Math.floor(totalMeses / 12);
  const m = totalMeses % 12;
  if (a > 0) return `${a} año${a > 1 ? 's' : ''} ${m > 0 ? `${m} m` : ''}`;
  return `${m} mes${m !== 1 ? 'es' : ''}`;
};

const areasPuestos = {
  'Administración': [
    { puesto: 'Gerente General', salarioBase: 5000 },
    { puesto: 'Recepcionista', salarioBase: 600 },
    { puesto: 'Asistente Administrativo', salarioBase: 800 },
    { puesto: 'Auxiliar de Oficina', salarioBase: 500 },
  ],
  'Ventas': [
    { puesto: 'Gerente de Tienda', salarioBase: 3000 },
    { puesto: 'Vendedor Senior', salarioBase: 1200 },
    { puesto: 'Vendedor', salarioBase: 800 },
    { puesto: 'Atención al Cliente', salarioBase: 700 },
  ],
  'Almacén': [
    { puesto: 'Jefe de Bodega', salarioBase: 1500 },
    { puesto: 'Auxiliar de Bodega', salarioBase: 700 },
    { puesto: 'Supervisor de Limpieza', salarioBase: 900 },
    { puesto: 'Operario', salarioBase: 600 },
  ],
  'Finanzas': [
    { puesto: 'Contador', salarioBase: 2000 },
    { puesto: 'Analista Financiero', salarioBase: 1800 },
    { puesto: 'Auxiliar Contable', salarioBase: 800 },
  ],
  'Operaciones': [
    { puesto: 'Gerente de Operaciones', salarioBase: 3500 },
    { puesto: 'Coordinador', salarioBase: 1500 },
    { puesto: 'Supervisor', salarioBase: 1200 },
    { puesto: 'Operario', salarioBase: 600 },
  ],
  'RRHH': [
    { puesto: 'Gerente de RRHH', salarioBase: 3000 },
    { puesto: 'Analista', salarioBase: 1500 },
    { puesto: 'Reclutador', salarioBase: 1200 },
    { puesto: 'Asistente de RRHH', salarioBase: 800 },
  ],
  'Marketing': [
    { puesto: 'Gerente de Marketing', salarioBase: 3000 },
    { puesto: 'Analista', salarioBase: 1500 },
    { puesto: 'Diseñador', salarioBase: 1200 },
    { puesto: 'Community Manager', salarioBase: 900 },
  ],
};
const areas = Object.keys(areasPuestos);

const getSalarioBase = (area, puesto) => {
  const puestos = areasPuestos[area];
  if (!puestos) return 0;
  const encontrado = puestos.find((p) => p.puesto === puesto);
  return encontrado ? encontrado.salarioBase : 0;
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', puesto: 'Vendedor', area: 'Ventas', salario: '', fecha_ingreso: '', bono: '', nss: '', seguro_social: true });
  const [aumento, setAumento] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialData, setHistorialData] = useState([]);
  const [historialEmp, setHistorialEmp] = useState('');

  const load = async () => {
    try { const { data } = await api.get('/empleados'); setEmployees(data); } catch { setError('Error al cargar empleados'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setForm({ nombre: '', email: '', telefono: '', puesto: 'Vendedor', area: 'Ventas', salario: getSalarioBase('Ventas', 'Vendedor'), fecha_ingreso: '', bono: '', nss: '', seguro_social: true }); setAumento(''); setError(''); setModalOpen(true); };
  const openEdit = (e) => { setEditingId(e.id); setForm({ nombre: e.nombre, email: e.email || '', telefono: e.telefono || '', puesto: e.puesto, area: e.area, salario: e.salario || '', fecha_ingreso: e.fecha_ingreso ? e.fecha_ingreso.split('T')[0] : '', bono: '', nss: e.nss || '', seguro_social: e.seguro_social !== false }); setAumento(''); setError(''); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.nombre.trim() || !form.email.trim() || !form.puesto || !form.area) {
      setError('Nombre, email, puesto y área son requeridos');
      return;
    }
    try {
      const payload = { ...form };
      if (editingId && aumento) {
        const aumentoDecimal = parseFloat(aumento) / 100;
        const nuevoSalario = Math.round((parseFloat(form.salario) || 0) * (1 + aumentoDecimal) * 100) / 100;
        payload.salario = nuevoSalario;
      }
      if (editingId) await api.put(`/empleados/${editingId}`, payload);
      else await api.post('/empleados', payload);
      setModalOpen(false); load();
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
  };

  const handleDeactivate = async () => {
    try { await api.delete(`/empleados/${deleteId}`); setDeleteId(null); load(); } catch (err) { setError(err.response?.data?.error || 'Error al desactivar'); }
  };

  const openHistorial = async (emp) => {
    setHistorialEmp(emp.nombre);
    setHistorialData([]);
    setHistorialOpen(true);
    try {
      const { data } = await api.get(`/empleados/${emp.id}/historial`);
      setHistorialData(data);
    } catch { setHistorialData([]); }
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
            <thead><tr className="bg-slate-50 text-left"><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nombre</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Puesto</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Área</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Salario</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">NSS</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ingreso</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Antigüedad</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Estado</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {employees.length === 0 ? <tr><td colSpan={9} className="px-4 py-12 text-center"><span className="text-3xl block mb-2">👤</span><span className="text-sm text-slate-400">No hay empleados registrados</span></td></tr> : employees.map((emp) => (
                <tr key={emp.id} className={`hover:bg-slate-50/50 ${!emp.activo ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-medium text-slate-800">{emp.nombre}<div className="text-xs text-slate-400">{emp.email}</div></td>
                  <td className="px-4 py-3 text-slate-600">{emp.puesto}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{emp.area}</span></td>
                  <td className="px-4 py-3 text-right text-slate-700 font-medium">{formatMoney(emp.salario)}</td>
                  <td className="px-4 py-3 text-slate-500 text-sm">{emp.nss || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-sm">{formatDate(emp.fecha_ingreso)}</td>
                  <td className="px-4 py-3 text-slate-600 text-sm">{calcAntiguedad(emp.fecha_ingreso)}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emp.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{emp.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openHistorial(emp)} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Ver historial"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                      <button onClick={() => openEdit(emp)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Editar"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      {emp.activo && <button onClick={() => setDeleteId(emp.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Desactivar"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></button>}
      {historialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setHistorialOpen(false)} />
          <div className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Historial de {historialEmp}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Cambios de puesto, área, salario y ascensos</p>
              </div>
              <button onClick={() => setHistorialOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {historialData.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl block mb-2">📋</span>
                <p className="text-sm text-slate-400">Sin historial de cambios</p>
                <p className="text-xs text-slate-300 mt-1">Los cambios de puesto, área o salario aparecerán aquí</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-200"></div>
                <div className="space-y-4">
                  {historialData.map((h) => (
                    <div key={h.id} className="flex gap-4">
                      <div className={`w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0 text-sm z-10 ${h.motivo === 'Ascenso' ? 'bg-emerald-100 text-emerald-700' : h.motivo === 'Aumento' ? 'bg-blue-100 text-blue-700' : h.motivo === 'Rotación' ? 'bg-amber-100 text-amber-700' : h.motivo === 'Bono' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                        {h.motivo === 'Ascenso' ? '↑' : h.motivo === 'Aumento' ? '$' : h.motivo === 'Rotación' ? '↻' : h.motivo === 'Bono' ? '🎁' : '•'}
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${h.motivo === 'Ascenso' ? 'bg-emerald-100 text-emerald-700' : h.motivo === 'Aumento' ? 'bg-blue-100 text-blue-700' : h.motivo === 'Rotación' ? 'bg-amber-100 text-amber-700' : h.motivo === 'Bono' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'}`}>{h.motivo}</span>
                          <span className="text-xs text-slate-400">{formatDate(h.fecha_cambio)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div><span className="text-slate-400">Puesto:</span> <span className="text-slate-300 line-through mr-1">{h.puesto_anterior}</span> <span className="text-slate-700 font-medium">{h.puesto_nuevo}</span></div>
                          <div><span className="text-slate-400">Área:</span> <span className="text-slate-300 line-through mr-1">{h.area_anterior}</span> <span className="text-slate-700 font-medium">{h.area_nueva}</span></div>
                          <div className="col-span-2"><span className="text-slate-400">{h.motivo === 'Bono' ? 'Bono:' : 'Salario:'}</span> <span className="text-slate-300 line-through mr-1">{formatMoney(h.salario_anterior)}</span> <span className="text-slate-700 font-medium">{formatMoney(h.salario_nuevo)}</span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Área</label>
                  <select
                    value={form.area}
                    onChange={(e) => {
                      const newArea = e.target.value;
                      const puestosArea = areasPuestos[newArea] || [];
                      const newPuesto = puestosArea.length > 0 ? puestosArea[0].puesto : '';
                      const newSalario = !editingId ? getSalarioBase(newArea, newPuesto) : form.salario;
                      setForm({ ...form, area: newArea, puesto: newPuesto, salario: newSalario });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Puesto</label>
                  <select
                    value={form.puesto}
                    onChange={(e) => {
                      const newPuesto = e.target.value;
                      const newSalario = !editingId ? getSalarioBase(form.area, newPuesto) : form.salario;
                      setForm({ ...form, puesto: newPuesto, salario: newSalario });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {(areasPuestos[form.area] || []).map((p) => <option key={p.puesto} value={p.puesto}>{p.puesto} — {formatMoney(p.salarioBase)} base</option>)}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NSS</label>
                  <input type="text" value={form.nss} onChange={(e) => setForm({ ...form, nss: e.target.value })} placeholder="Ej: 12345678901" maxLength={20} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.seguro_social}
                      onChange={(e) => setForm({ ...form, seguro_social: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Seguro Social</span>
                  </label>
                </div>
              </div>
              {editingId && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
                  <p className="text-xs font-semibold text-slate-600 uppercase">Ajustes Salariales</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Aumento (%)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={aumento}
                          onChange={(e) => setAumento(e.target.value)}
                          placeholder="Ej: 10"
                          className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <span className="text-sm text-slate-400">%</span>
                        <div className="flex gap-1">
                          {[5, 10, 15, 20].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setAumento(pct.toString())}
                              className={`text-xs px-2 py-1 rounded border transition-colors ${aumento === pct.toString() ? 'bg-primary-100 border-primary-400 text-primary-700' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                            >
                              +{pct}%
                            </button>
                          ))}
                        </div>
                      </div>
                      {aumento && (
                        <p className="text-xs text-emerald-600 mt-1">
                          Nuevo salario: {formatMoney(Math.round((parseFloat(form.salario) || 0) * (1 + parseFloat(aumento) / 100) * 100) / 100)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Bono (USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.bono}
                        onChange={(e) => setForm({ ...form, bono: e.target.value })}
                        placeholder="Ej: 500"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>
              )}
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
