import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Monitor,
  Building2,
  ClipboardList,
  History,
  LogOut,
  Shield,
  Server,
  UserCircle,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useEffect, useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Monitor },
  { name: 'Departments', href: '/departments', icon: Building2 },
  { name: 'Assignments', href: '/assignments', icon: ClipboardList },
  { name: 'Scrapped', href: '/scrapped', icon: Trash2 },
  { name: 'Audit Logs', href: '/audit-logs', icon: History },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ top: number; height: number } | null>(null);

  // Calculate active indicator position
  useEffect(() => {
    if (!navRef.current) return;
    const activeLink = navRef.current.querySelector('[data-active="true"]') as HTMLElement;
    if (activeLink) {
      const navRect = navRef.current.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      setIndicatorStyle({
        top: linkRect.top - navRect.top,
        height: linkRect.height,
      });
    } else {
      setIndicatorStyle(null);
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary animate-scale-in">
          <Server className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-sidebar-foreground">ITSS Manager</h1>
          <p className="text-xs text-sidebar-muted">Device Inventory</p>
        </div>
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="relative flex-1 space-y-1 px-3 py-4">
        {/* Sliding active indicator */}
        {indicatorStyle && (
          <div
            className="absolute left-0 w-1 bg-sidebar-primary rounded-r-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ top: indicatorStyle.top, height: indicatorStyle.height }}
          />
        )}
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              to={item.href}
              data-active={isActive}
              className={cn(
                'nav-link group',
                isActive && 'nav-link-active'
              )}
            >
              <item.icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-sidebar-border p-4">
        <Link to="/profile" className="flex items-center gap-3 mb-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors group">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent transition-transform duration-200 group-hover:scale-105">
            <Shield className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name}
            </p>
            <span className="status-badge text-[10px] bg-red-500/20 text-red-300">
              Admin
            </span>
          </div>
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors btn-press"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
