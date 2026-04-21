import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import ZonesPage from './pages/ZonesPage';
import GasPricesPage from './pages/GasPricesPage';
import ModerationPage from './pages/ModerationPage';
import ArticlesPage from './pages/ArticlesPage';
import PromotionsPage from './pages/PromotionsPage';
import UserDetailPage from './pages/UserDetailPage';

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/"           element={<DashboardPage />} />
            <Route path="/users"      element={<UsersPage />} />
            <Route path="/users/:id"  element={<UserDetailPage />} />
            <Route path="/zones"      element={<ZonesPage />} />
            <Route path="/gas-prices" element={<GasPricesPage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/moderation" element={<ModerationPage />} />
            <Route path="/articles"   element={<ArticlesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
