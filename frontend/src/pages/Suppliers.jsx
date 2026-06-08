import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', email: '', direccion: '' });
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => { try { const { data } = await api.get('/proveedores'); setSuppliers(data); } catch { setError('Error al cargar'); } setLoading(false); };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setForm({ nombre: '', contacto: '', telefono: '', email: '', direccion: '' }); setError(''); setModalOpen(true); };
  const openEdit = (s) => { setEditingId(s.id); setForm({ nombre: s.nombre, contacto: s.contacto || '', telefono: s.telefono || '', email: s.email || '', direccion: s.direccion || '' }); setError(''); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return; }
    try { if (editingId) await api.put(`/proveedores/${editingId}`, form); else await api.post('/proveedores', form); setModalOpen(false); load(); }
    catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
  };

  const handleDelete = async () => { try { await api.delete(`/proveedores/${deleteId}`); setDeleteId(null); load(); } catch {} };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-800">Proveedores</h2><p className="text-sm text-slate-500 mt-1">Gestión de proveedores</p></div>
        <button onClick={openCreate} className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">+ Nuevo Proveedor</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-left"><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Nombre</th><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Contacto</th><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Teléfono</th><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center"><span className="text-3xl block mb-2">🚚</span><span className="text-sm text-slate-400">No hay proveedores registrados</span></td></tr> : suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50"><td className="px-5 py-3 font-medium text-slate-800">{s.nombre}</td><td className="px-5 py-3 text-slate-500">{s.contacto || '—'}</td><td className="px-5 py-3 text-slate-500">{s.telefono || '—'}</td><td className="px-5 py-3 text-slate-500">{s.email || '—'}</td><td className="px-5 py-3 text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button><button onClick={() => setDeleteId(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"><div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} /><div className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md p-6"><h3 className="text-lg font-semibold text-slate-800 mb-4">{editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3><form onSubmit={handleSubmit} className="space-y-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label><input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" autoFocus /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Contacto</label><input type="text" value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" /></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label><input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" /></div></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label><input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" /></div>{error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">{error}</div>}<div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button><button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Guardar</button></div></form></div></div>
      )}
      {deleteId && (<div className="fixed inset-0 z-50 flex items-center justify-center px-4"><div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} /><div className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm p-6"><h3 className="text-lg font-semibold text-slate-800 mb-2">Eliminar Proveedor</h3><p className="text-sm text-slate-500 mb-4">¿Estás seguro?</p><div className="flex justify-end gap-3"><button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button><button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Eliminar</button></div></div></div>)}
    </div>
  );
}
