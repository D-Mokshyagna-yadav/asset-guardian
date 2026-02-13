import { useAuth } from '@/contexts/AuthContext';
import { devicesApi, auditLogsApi, assignmentsApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Device, AuditLog, Assignment } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useCountUp } from '@/hooks/use-count-up';
import {
  Monitor,
  Package,
  Wrench,
  AlertTriangle,
  IndianRupee,
  ClipboardCheck,
  ArrowUpRight,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

function AnimatedStatValue({ value, formatAsPrice }: { value: number; formatAsPrice: boolean }) {
  const animated = useCountUp(value, 900, true);
  if (formatAsPrice) {
    return <>{`₹${animated.toLocaleString('en-IN')}`}</>;
  }
  return <>{animated.toLocaleString()}</>;
}

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
        setDevices(devRes.data.data?.devices || []);
        setAuditLogs(logRes.data.data?.auditLogs || []);
        setAssignments(Array.isArray(assignRes.data.data) ? assignRes.data.data : []);
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
    { title: 'Total Devices', value: stats.total, formatAsPrice: false, icon: Monitor, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { title: 'In Stock', value: stats.inStock, formatAsPrice: false, icon: Package, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    { title: 'Assigned', value: stats.assigned, formatAsPrice: false, icon: ClipboardCheck, color: 'text-teal-600', bgColor: 'bg-teal-100' },
    { title: 'Maintenance', value: stats.maintenance, formatAsPrice: false, icon: Wrench, color: 'text-amber-600', bgColor: 'bg-amber-100' },
    { title: 'Scrapped', value: stats.scrapped, formatAsPrice: false, icon: AlertTriangle, color: 'text-slate-600', bgColor: 'bg-slate-100' },
    { title: 'Total Value', value: stats.totalValue, formatAsPrice: true, icon: IndianRupee, color: 'text-green-600', bgColor: 'bg-green-100' },
  ];

  const recentDevices = devices.slice(0, 5);
  const activeAssignments = assignments.filter(a => a.status === 'ACTIVE');

  // Warranty expiry alerts: devices with warranty ending in next 90 days or already expired
  const now = new Date();
  const warrantyAlerts = devices
    .filter(d => d.warrantyEnd && d.status !== 'SCRAPPED')
    .map(d => {
      const end = new Date(d.warrantyEnd!);
      const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { ...d, daysLeft };
    })
    .filter(d => d.daysLeft <= 90)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-muted-foreground mt-1">Here's an overview of your IT inventory</p>
      </div>

      {loading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-6 shadow-sm" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="flex items-center gap-3">
                  <div className="shimmer h-9 w-9 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <div className="shimmer h-6 w-12" />
                    <div className="shimmer h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 shimmer h-64 rounded-lg" />
            <div className="shimmer h-64 rounded-lg" />
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 stagger-children">
            {statCards.map((stat) => (
              <Card key={stat.title} className="stat-card">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      <AnimatedStatValue value={stat.value} formatAsPrice={stat.formatAsPrice} />
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Devices */}
            <Card className="lg:col-span-2 card-hover">
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
                    <tbody className="divide-y divide-border stagger-rows">
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
              {/* Warranty Alerts */}
              {warrantyAlerts.length > 0 && (
                <Card className="card-hover border-amber-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-amber-600" />
                      <CardTitle className="text-lg font-semibold">Warranty Alerts</CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground">Expiring or expired warranties</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {warrantyAlerts.map((device) => (
                      <Link key={device.id} to={`/inventory/${device.id}`}>
                        <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-muted/50 ${device.daysLeft < 0 ? 'bg-red-50 border-red-200' : device.daysLeft <= 30 ? 'bg-amber-50 border-amber-200' : 'bg-yellow-50/50 border-yellow-200'}`}>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{device.deviceName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{device.assetTag}</p>
                          </div>
                          <span className={`text-xs font-medium whitespace-nowrap ml-2 px-2 py-0.5 rounded-full ${device.daysLeft < 0 ? 'bg-red-100 text-red-700' : device.daysLeft <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {device.daysLeft < 0 ? `Expired ${Math.abs(device.daysLeft)}d ago` : `${device.daysLeft}d left`}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Active Assignments */}
              {activeAssignments.length > 0 && (
                <Card className="card-hover">
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
              <Card className="card-hover">
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
