import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
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

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/show/:id" element={<ShowDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
