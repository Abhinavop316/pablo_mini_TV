import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ShowDetailPage } from './pages/ShowDetailPage';
import { SearchPage } from './pages/SearchPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RedirectToAdminSetup: React.FC = () => {
  React.useEffect(() => {
    window.location.href = `http://localhost:5174/setup-password${window.location.search}`;
  }, []);
  return (
    <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <h2>Redirecting to Editor & Admin Portal...</h2>
      <p>Please wait while we redirect you to set your credentials.</p>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#ffffff' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/setup-password" element={<RedirectToAdminSetup />} />
              <Route path="/shows" element={<SearchPage />} />
              <Route path="/show" element={<SearchPage />} />
              <Route path="/search" element={<Navigate to="/shows" replace />} />
              <Route path="/show/:id" element={<ShowDetailPage />} />
              <Route path="/shows/:id" element={<ShowDetailPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
