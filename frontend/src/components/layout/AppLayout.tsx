import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export function AppLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-apple-background dark:bg-[#1C1C1E]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-caption text-apple-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-apple-background dark:bg-[#1C1C1E]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopNav onMenuClick={() => setSidebarOpen(true)} />
      <main className="lg:pl-[240px] pt-16 min-h-screen">
        <div className="p-4 lg:p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
