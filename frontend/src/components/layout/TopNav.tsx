import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, Bell, Moon, Sun, Menu } from 'lucide-react';

interface TopNavProps {
  onMenuClick?: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <header className="fixed top-0 left-0 lg:left-[240px] right-0 z-20 h-16 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-apple-border/50 flex items-center justify-between px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-[10px] text-apple-secondary hover:text-apple-black hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-all duration-300"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop spacer */}
      <div className="hidden lg:block" />

      {/* Right actions */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-[10px] text-apple-secondary hover:text-apple-black dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-all duration-300"
          title={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notification bell */}
        <button className="relative p-2 rounded-[10px] text-apple-secondary hover:text-apple-black dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-all duration-300">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-apple-red rounded-full" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-caption font-medium text-apple-black dark:text-white">{user?.name || user?.email}</p>
            <p className="text-caption text-apple-secondary">{user?.companyName || '未设置公司'}</p>
          </div>
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-apple-blue/10 text-apple-blue text-caption">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Logout */}
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
