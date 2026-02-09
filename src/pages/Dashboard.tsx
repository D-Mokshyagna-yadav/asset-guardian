import { useAuth } from '@/contexts/AuthContext';
import { devicesApi, auditLogsApi, assignmentsApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Device, AuditLog, Assignment } from '@/types';
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

export default function Dashboard() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [devRes, logRes, assignRes] = await Promise.all([
          devicesApi.getDevices({ limit: 100 }),
          auditLogsApi.getAuditLogs({ limit: 5 }),
          assignmentsApi.getAssignments({ limit: 100 }),
        ]);
        setDevices(devRes.data.data || []);
        setAuditLogs(logRes.data.data || []);
        setAssignments(assignRes.data.data || []);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = {
    total: devices.length,
    inStock: devices.filter(d => d.status === 'IN_STOCK').length,
    assigned: devices.filter(d => d.status === 'ASSIGNED').length,
    maintenance: devices.filter(d => d.status === 'MAINTENANCE').length,
    scrapped: devices.filter(d => d.status === 'SCRAPPED').length,
    totalValue: devices.reduce((sum, d) => sum + d.cost * d.quantity, 0),
  };

  const statCards = [
    { title: 'Total Devices', value: stats.total, icon: Monitor, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { title: 'In Stock', value: stats.inStock, icon: Package, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    { title: 'Assigned', value: stats.assigned, icon: ClipboardCheck, color: 'text-teal-600', bgColor: 'bg-teal-100' },
    { title: 'Maintenance', value: stats.maintenance, icon: Wrench, color: 'text-amber-600', bgColor: 'bg-amber-100' },
    { title: 'Scrapped', value: stats.scrapped, icon: AlertTriangle, color: 'text-slate-600', bgColor: 'bg-slate-100' },
    { title: 'Total Value', value: `$${stats.totalValue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-100' },
  ];

  const recentDevices = devices.slice(0, 5);
  const activeAssignments = assignments.filter(a => a.status === 'ACTIVE');

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-muted-foreground mt-1">Here's an overview of your IT inventory</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      ) : (
        <>
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

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Active Assignments */}
              {activeAssignments.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                      <CardTitle className="text-lg font-semibold">Active Assignments</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activeAssignments.slice(0, 5).map((assignment) => {
                      const deviceObj = typeof assignment.deviceId === 'object' ? assignment.deviceId : null;
                      return (
                        <Link key={assignment.id} to={`/assignments/${assignment.id}`}>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors">
                            <div>
                              <p className="text-sm font-medium text-foreground">{deviceObj?.deviceName || 'Device'}</p>
                              <p className="text-xs text-muted-foreground">Qty: {assignment.quantity}</p>
                            </div>
                            <StatusBadge status={assignment.status} />
                          </div>
                        </Link>
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
                  {auditLogs.length > 0 ? auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                      <div className="h-2 w-2 mt-2 rounded-full bg-accent flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{typeof log.performedBy === 'object' ? (log.performedBy as any)?.name : 'User'}</span>
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
                  )) : (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
