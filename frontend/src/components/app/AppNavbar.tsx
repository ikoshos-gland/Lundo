import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export const AppNavbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/app" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center shadow-sm">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <span className="text-warm-800 dark:text-warm-50 font-semibold text-lg">
            Cognit
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warm-100 dark:bg-warm-800">
            <User className="h-4 w-4 text-warm-600 dark:text-warm-400" />
            <span className="text-sm text-warm-800 dark:text-warm-50">
              {user?.full_name}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};
