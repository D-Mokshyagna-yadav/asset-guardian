import { useAuth } from '@/contexts/AuthContext';
import { getDeviceStats, mockDevices, mockAuditLogs, mockAssignments } from '@/data/mockData';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Monitor,
  Package,
  Wrench,
  AlertTriangle,
  DollarSign,
  ClipboardCheck,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const stats = getDeviceStats();

const statCards = [
  { title: 'Total Devices', value: stats.total, icon: Monitor, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { title: 'In Stock', value: stats.inStock, icon: Package, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  { title: 'Installed', value: stats.installed, icon: Monitor, color: 'text-teal-600', bgColor: 'bg-teal-100' },
  { title: 'Maintenance', value: stats.maintenance, icon: Wrench, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { title: 'Scrapped', value: stats.scrapped, icon: AlertTriangle, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  { title: 'Total Value', value: `$${stats.totalValue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-100' },
];

export default function Dashboard() {
  const { user } = useAuth();

  const recentDevices = mockDevices.slice(0, 5);
  const recentLogs = mockAuditLogs.slice(0, 5);
  const pendingAssignments = mockAssignments.filter(a => a.status === 'PENDING');

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-muted-foreground mt-1">Here's an overview of your IT inventory</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Devices */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Recent Devices</CardTitle>
            <Link 
              to="/inventory" 
              className="text-sm text-accent hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Asset Tag</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Device</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Category</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentDevices.map((device) => (
                    <tr key={device.id} className="table-row-hover">
                      <td className="px-6 py-4 text-sm font-mono text-foreground">{device.assetTag}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">{device.deviceName}</p>
                          <p className="text-xs text-muted-foreground">{device.brand} {device.model}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{device.category}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={device.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals & Recent Activity */}
        <div className="space-y-6">
          {/* Pending Approvals */}
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'IT_STAFF') && pendingAssignments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-lg font-semibold">Pending Approvals</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingAssignments.map((assignment) => {
                  const device = mockDevices.find(d => d.id === assignment.deviceId);
                  return (
                    <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div>
                        <p className="text-sm font-medium text-foreground">{device?.deviceName}</p>
                        <p className="text-xs text-muted-foreground">{assignment.remarks}</p>
                      </div>
                      <StatusBadge status={assignment.status} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="h-2 w-2 mt-2 rounded-full bg-accent flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{log.performedBy}</span>
                      {' '}{log.action.toLowerCase().replace(/_/g, ' ')}{' '}
                      <span className="text-muted-foreground">{log.entityType}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(log.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
