import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Public pages
import { LandingPage } from '@/pages/public/LandingPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';

// App pages
import { DashboardPage } from '@/pages/app/DashboardPage';
import { ChildrenPage } from '@/pages/app/ChildrenPage';
import { ConversationPage } from '@/pages/app/ConversationPage';
import { InsightsPage } from '@/pages/app/InsightsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'children',
        element: <ChildrenPage />,
      },
      {
        path: 'chat',
        element: <ConversationPage />,
      },
      {
        path: 'children/:id/insights',
        element: <InsightsPage />,
      },
      {
        path: 'children/:id',
        element: <Navigate to="insights" replace />,
      },
    ],
  },
]);
