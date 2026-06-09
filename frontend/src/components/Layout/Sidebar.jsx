import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'vendedor', 'revisor'] },
  { to: '/ventas', label: 'Facturación', icon: '🧾', roles: ['admin', 'vendedor', 'revisor'] },
  { to: '/productos', label: 'Productos', icon: '📦', roles: ['admin', 'vendedor', 'revisor'] },
  { to: '/categorias', label: 'Categorías', icon: '🏷️', roles: ['admin'] },
  { to: '/clientes', label: 'Clientes', icon: '👥', roles: ['admin', 'vendedor', 'revisor'] },
  { to: '/proveedores', label: 'Proveedores', icon: '🚚', roles: ['admin', 'vendedor', 'revisor'] },
  { to: '/compras', label: 'Compras', icon: '📥', roles: ['admin'] },
  { to: '/usuarios', label: 'Usuarios', icon: '👤', roles: ['admin'] },
  { to: '/logs', label: 'Auditoría', icon: '📋', roles: ['admin', 'revisor'] },
];

const roleLabels = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
  revisor: 'Revisor',
};

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  const filteredNav = navItems.filter((item) => item.roles.includes(user?.rol));

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-64 bg-slate-800 text-white flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <span className="text-2xl">🍃</span>
          <div>
            <h1 className="text-lg font-semibold text-white">EcoClean</h1>
            <p className="text-xs text-slate-400">Store</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-semibold">
              {user?.nombre?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.nombre}</p>
              <p className="text-xs text-slate-400">{roleLabels[user?.rol] || user?.rol}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
