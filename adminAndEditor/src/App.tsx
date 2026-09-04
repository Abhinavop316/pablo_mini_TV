import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ShowsListPage } from './pages/ShowsListPage';
import { ShowFormPage } from './pages/ShowFormPage';
import { ShowDetailPage } from './pages/ShowDetailPage';
import { EpisodeFormPage } from './pages/EpisodeFormPage';
import { PublishPage } from './pages/PublishPage';
import { PublishHistoryPage } from './pages/PublishHistoryPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Admin/Editor CMS routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="shows" element={<ShowsListPage />} />
                <Route path="shows/new" element={<ShowFormPage />} />
                <Route path="shows/:id" element={<ShowDetailPage />} />
                <Route path="shows/:id/edit" element={<ShowFormPage />} />
                <Route path="episodes/new" element={<EpisodeFormPage />} />
                <Route path="episodes/:id/edit" element={<EpisodeFormPage />} />
                <Route path="publish" element={<PublishPage />} />
                <Route path="publish/history" element={<PublishHistoryPage />} />
              </Route>
            </Route>

            {/* Fallback redirect */}
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
