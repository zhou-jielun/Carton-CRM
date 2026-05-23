import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { X, LayoutDashboard, Users, Mail, MessageSquare, Search, Settings, BarChart3, Clock, Building2 } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/customers', icon: Users, label: '客户库' },
  { to: '/acquisition', icon: Search, label: 'AI获客' },
  { to: '/campaigns', icon: Mail, label: '邮件营销' },
  { to: '/whatsapp', icon: MessageSquare, label: 'WhatsApp' },
  { to: '/tasks', icon: Clock, label: '自动任务' },
  { to: '/analytics', icon: BarChart3, label: '数据分析' },
  { to: '/settings', icon: Settings, label: '系统设置' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#1C1C1E]">
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 px-6 h-16 border-b border-apple-border/50 dark:border-[#2C2C2E]">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-apple-blue" />
          <span className="text-subheading text-apple-black dark:text-white font-semibold tracking-tight">
            Carton CRM
          </span>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 rounded-md text-apple-secondary hover:text-apple-black dark:hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-body transition-all duration-300',
                isActive
                  ? 'bg-apple-blue/10 text-apple-blue font-medium'
                  : 'text-apple-secondary hover:text-apple-black dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-apple-border/50 dark:border-[#2C2C2E]">
        <p className="text-caption text-apple-secondary text-center">Carton CRM v1.0</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-30 h-screen w-[240px] flex-col border-r border-apple-border/50 dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E]">
        {sidebarContent}
      </aside>

      {/* Mobile overlay + drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          {/* Drawer */}
          <aside className="relative w-[280px] h-full shadow-apple-lg">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
