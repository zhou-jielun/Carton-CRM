import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import CampaignsPage from '@/pages/Campaigns';
import WhatsAppPage from '@/pages/WhatsAppPage';
import AcquisitionPage from '@/pages/Acquisition';
import CustomersPage from '@/pages/Customers';
import CustomerDetailPage from '@/pages/CustomerDetail';
import TasksPage from '@/pages/Tasks';
import SettingsPage from '@/pages/Settings';

const AnalyticsPage = lazy(() => import('@/pages/Analytics'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/acquisition" element={<AcquisitionPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/whatsapp" element={<WhatsAppPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/analytics" element={
            <Suspense fallback={<PageLoader />}>
              <AnalyticsPage />
            </Suspense>
          } />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
