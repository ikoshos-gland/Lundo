import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppNavbar } from '@/components/app/AppNavbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950">
      <AppNavbar />
      <div className="max-w-7xl mx-auto">
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
