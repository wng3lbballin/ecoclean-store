import { useAuth } from '../../context/AuthContext';

const roleLabels = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
  revisor: 'Revisor',
};

const roleBadgeColors = {
  admin: 'bg-purple-100 text-purple-700',
  vendedor: 'bg-blue-100 text-blue-700',
  revisor: 'bg-slate-100 text-slate-700',
};

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm text-slate-500 hidden sm:inline">EcoClean Store</span>
        </div>

        <div className="flex items-center gap-4">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleBadgeColors[user?.rol] || 'bg-slate-100 text-slate-700'}`}>
            {roleLabels[user?.rol] || user?.rol}
          </span>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
