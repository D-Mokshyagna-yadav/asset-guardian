import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { devicesApi, departmentsApi } from '@/lib/api';
import { Device, Department } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useConfirm } from '@/components/ConfirmDialog';
import { toast } from 'sonner';
import {
  Search,
  Trash2,
  Eye,
  Edit,
  Undo2,
  AlertTriangle,
  IndianRupee,
  Package,
  Filter,
} from 'lucide-react';

export default function Scrapped() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [devices, setDevices] = useState<Device[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirm = useConfirm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devRes, deptRes] = await Promise.all([
          devicesApi.getDevices({ limit: 500, status: 'SCRAPPED' }),
          departmentsApi.getDepartments({ limit: 100 }),
        ]);
        setDevices(devRes.data.data?.devices || []);
        setDepartments(deptRes.data.data?.departments || []);
      } catch (err) {
        console.error('Failed to load scrapped devices', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(devices.map(d => d.category));
    return Array.from(cats).sort();
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        device.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (device.serialNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || device.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [devices, searchQuery, categoryFilter]);

  const getDepartmentName = (deptId?: string | Department) => {
    if (!deptId) return '—';
    if (typeof deptId === 'object') return deptId.name;
    const dept = departments.find((d: any) => (d._id || d.id) === deptId);
    return dept?.name || '—';
  };

  const totalScrappedValue = devices.reduce((sum, d) => sum + d.cost * d.quantity, 0);

  const toggleSelect = (deviceId: string) => {
    setSelectedDevices(prev => {
      const next = new Set(prev);
      if (next.has(deviceId)) next.delete(deviceId);
      else next.add(deviceId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedDevices.size === filteredDevices.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(filteredDevices.map((d) => d.id)));
    }
  };

  const handleRestore = async (deviceId: string) => {
    const ok = await confirm({
      title: 'Restore Device',
      description: 'Are you sure you want to restore this device? It will be moved back to In Stock status.',
      confirmText: 'Restore',
      variant: 'default',
    });
    if (!ok) return;
    setActionLoading(deviceId);
    try {
      await devicesApi.updateDevice(deviceId, { status: 'IN_STOCK' });
      setDevices(prev => prev.filter((d) => d.id !== deviceId));
      setSelectedDevices(prev => { const next = new Set(prev); next.delete(deviceId); return next; });
      toast.success('Device restored to In Stock.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to restore device.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (deviceId: string) => {
    const ok = await confirm({
      title: 'Permanently Delete Device',
      description: 'Are you sure you want to permanently delete this scrapped device? This action cannot be undone.',
      confirmText: 'Delete Permanently',
      variant: 'destructive',
    });
    if (!ok) return;
    setActionLoading(deviceId);
    try {
      await devicesApi.deleteDevice(deviceId);
      setDevices(prev => prev.filter((d) => d.id !== deviceId));
      setSelectedDevices(prev => { const next = new Set(prev); next.delete(deviceId); return next; });
      toast.success('Device permanently deleted.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete device.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedDevices.size === 0) return;
    const ok = await confirm({
      title: 'Bulk Restore Devices',
      description: `Restore ${selectedDevices.size} device(s) to In Stock status?`,
      confirmText: 'Restore All',
      variant: 'default',
    });
    if (!ok) return;
    setActionLoading('bulk');
    let successCount = 0;
    let failCount = 0;
    for (const id of selectedDevices) {
      try {
        await devicesApi.updateDevice(id, { status: 'IN_STOCK' });
        successCount++;
      } catch {
        failCount++;
      }
    }
    // Refresh list
    try {
      const res = await devicesApi.getDevices({ limit: 500, status: 'SCRAPPED' });
      setDevices(res.data.data?.devices || []);
    } catch {}
    setSelectedDevices(new Set());
    setActionLoading(null);
    if (failCount === 0) {
      toast.success(`${successCount} device(s) restored to In Stock.`);
    } else {
      toast.error(`${successCount} restored, ${failCount} failed.`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDevices.size === 0) return;
    const ok = await confirm({
      title: 'Bulk Delete Devices',
      description: `Permanently delete ${selectedDevices.size} scrapped device(s)? This action cannot be undone.`,
      confirmText: 'Delete All',
      variant: 'destructive',
    });
    if (!ok) return;
    setActionLoading('bulk');
    let successCount = 0;
    let failCount = 0;
    for (const id of selectedDevices) {
      try {
        await devicesApi.deleteDevice(id);
        successCount++;
      } catch {
        failCount++;
      }
    }
    try {
      const res = await devicesApi.getDevices({ limit: 500, status: 'SCRAPPED' });
      setDevices(res.data.data?.devices || []);
    } catch {}
    setSelectedDevices(new Set());
    setActionLoading(null);
    if (failCount === 0) {
      toast.success(`${successCount} device(s) permanently deleted.`);
    } else {
      toast.error(`${successCount} deleted, ${failCount} failed.`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="shimmer h-7 w-44" />
            <div className="shimmer h-4 w-64" />
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shimmer h-24 rounded-lg" />
          ))}
        </div>
        <div className="shimmer h-14 w-full rounded-lg mb-4" />
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-14 w-full" style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-slate-500" />
            Scrapped Devices
          </h1>
          <p className="text-muted-foreground mt-1">View and manage decommissioned devices</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6 stagger-children">
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100">
              <Package className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{devices.length}</p>
              <p className="text-xs text-muted-foreground">Total Scrapped</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100">
              <IndianRupee className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">₹{totalScrappedValue.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground">Total Value Lost</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{categories.length}</p>
              <p className="text-xs text-muted-foreground">Categories Affected</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scrapped devices by name, asset tag, or serial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {selectedDevices.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 animate-slide-down">
          <Checkbox
            checked={selectedDevices.size === filteredDevices.length && filteredDevices.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm font-medium">{selectedDevices.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 btn-press"
              onClick={handleBulkRestore}
              disabled={actionLoading === 'bulk'}
            >
              <Undo2 className="h-3.5 w-3.5 mr-1" />
              Restore Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 btn-press"
              onClick={handleBulkDelete}
              disabled={actionLoading === 'bulk'}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete Permanently
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredDevices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-4 w-10">
                      <Checkbox
                        checked={selectedDevices.size === filteredDevices.length && filteredDevices.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Asset Tag</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Device</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Category</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Qty</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Department</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Cost</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border stagger-rows">
                  {filteredDevices.map((device: any) => {
                    const devId = device._id || device.id;
                    const isLoading = actionLoading === devId;
                    return (
                      <tr key={devId} className={`table-row-hover ${selectedDevices.has(devId) ? 'bg-primary/5' : ''}`}>
                        <td className="px-3 py-4">
                          <Checkbox
                            checked={selectedDevices.has(devId)}
                            onCheckedChange={() => toggleSelect(devId)}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-foreground">{device.assetTag}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">{device.deviceName}</p>
                            <p className="text-xs text-muted-foreground">{device.brand} {device.deviceModel}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{device.category}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{device.quantity}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{getDepartmentName(device.departmentId)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-red-600">₹{(device.cost * device.quantity).toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={device.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:scale-110 transition-transform"
                              onClick={() => navigate(`/inventory/${devId}/preview`)}
                              title="View device"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:scale-110 transition-transform"
                              onClick={() => handleRestore(devId)}
                              disabled={isLoading}
                              title="Restore to In Stock"
                            >
                              <Undo2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:scale-110 transition-transform"
                              onClick={() => handleDelete(devId)}
                              disabled={isLoading}
                              title="Delete permanently"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 animate-empty">
              <AlertTriangle className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4 animate-float" />
              <p className="text-lg font-medium text-muted-foreground mb-1">No scrapped devices</p>
              <p className="text-sm text-muted-foreground/80">
                {searchQuery || categoryFilter !== 'All'
                  ? 'No scrapped devices match your search criteria'
                  : 'All devices are active. Scrapped devices will appear here.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
