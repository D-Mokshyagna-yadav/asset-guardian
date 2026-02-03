import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Monitor,
  Building2,
  Users,
  ClipboardList,
  History,
  LogOut,
  Shield,
  Server,
  Send,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'IT_STAFF', 'DEPARTMENT_INCHARGE'] },
  { name: 'Inventory', href: '/inventory', icon: Monitor, roles: ['SUPER_ADMIN', 'IT_STAFF', 'DEPARTMENT_INCHARGE'] },
  { name: 'Departments', href: '/departments', icon: Building2, roles: ['SUPER_ADMIN', 'IT_STAFF'] },
  { name: 'Assignments', href: '/assignments', icon: ClipboardList, roles: ['SUPER_ADMIN', 'IT_STAFF'] },
  { name: 'Requests', href: '/assignment-management', icon: FileCheck, roles: ['SUPER_ADMIN'] },
  { name: 'Request Device', href: '/request-device', icon: Send, roles: ['IT_STAFF'] },
  { name: 'Update Status', href: '/assignment-status', icon: CheckCircle2, roles: ['IT_STAFF'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['SUPER_ADMIN'] },
  { name: 'Audit Logs', href: '/audit-logs', icon: History, roles: ['SUPER_ADMIN', 'IT_STAFF'] },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const filteredNavigation = navigation.filter(
    item => user && item.roles.includes(user.role)
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-500/20 text-red-300';
      case 'IT_STAFF':
        return 'bg-blue-500/20 text-blue-300';
      case 'DEPARTMENT_INCHARGE':
        return 'bg-amber-500/20 text-amber-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Server className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-sidebar-foreground">ITSS Manager</h1>
          <p className="text-xs text-sidebar-muted">Device Inventory</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'nav-link',
                isActive && 'nav-link-active'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent">
            <Shield className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name}
            </p>
            <span className={cn('status-badge text-[10px]', getRoleBadgeColor(user?.role || ''))}>
              {formatRole(user?.role || '')}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
