import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MAIN_ADMIN_EMAIL = 'admin@ecoclean.com';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'vendedor', activo: true });
  const [deleteId, setDeleteId] = useState(null);

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/usuarios');
      setUsers(data);
    } catch (err) {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ nombre: '', email: '', password: '', rol: 'vendedor', activo: true });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditingId(u.id);
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol, activo: u.activo });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.nombre.trim() || !form.email.trim() || !form.rol) {
      setError('Nombre, email y rol son requeridos');
      return;
    }

    if (!editingId && (!form.password || form.password.length < 6)) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/usuarios/${editingId}`, {
          nombre: form.nombre,
          email: form.email,
          rol: form.rol,
          activo: form.activo,
        });
      } else {
        await api.post('/usuarios', {
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          rol: form.rol,
        });
      }
      setModalOpen(false);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDeactivate = async () => {
    try {
      await api.delete(`/usuarios/${deleteId}`);
      setDeleteId(null);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al desactivar');
    }
  };

  const roleBadge = (rol) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700',
      vendedor: 'bg-blue-100 text-blue-700',
      revisor: 'bg-slate-100 text-slate-700',
    };
    return colors[rol] || 'bg-slate-100 text-slate-700';
  };

  const isMainAdmin = (u) => u.email === MAIN_ADMIN_EMAIL;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Usuarios</h2>
          <p className="text-sm text-slate-500 mt-1">Administrar cuentas de acceso al sistema</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo Usuario
        </button>
      </div>

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
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Nombre</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Rol</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Estado</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <span className="text-3xl block mb-2">👤</span>
                    <span className="text-sm text-slate-400">No hay usuarios registrados</span>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-50/50 ${!u.activo ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {u.nombre}
                      {isMainAdmin(u) && (
                        <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Principal</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge(u.rol)}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isMainAdmin(u) && (
                          <>
                            <button
                              onClick={() => openEdit(u)}
                              className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {u.activo && u.id !== currentUser?.id && (
                              <button
                                onClick={() => setDeleteId(u.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Desactivar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                <select
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="admin">Administrador</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="revisor">Revisor</option>
                </select>
              </div>

              {editingId && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={form.activo}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="activo" className="text-sm text-slate-700">Usuario activo</label>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Desactivar Usuario</h3>
            <p className="text-sm text-slate-500 mb-4">¿Estás seguro de desactivar este usuario? No podrá iniciar sesión.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeactivate}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
