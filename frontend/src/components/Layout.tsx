import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 h-14 bg-gray-900 border-b border-gray-800">
        <Link to="/dashboard" className="text-white font-semibold text-lg tracking-tight">
          FinTrade
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            Dashboard
          </Link>
          <Link
            to="/portfolio"
            className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            Portfolio
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm truncate max-w-[180px]">{user?.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
