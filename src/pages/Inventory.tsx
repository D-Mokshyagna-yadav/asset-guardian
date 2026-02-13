import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { devicesApi, departmentsApi } from '@/lib/api';
import { Device, Department, DeviceStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Search, Plus, Filter, Eye, Edit, Trash2, BarChart3 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useConfirm } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

export default function Inventory() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [devices, setDevices] = useState<Device[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const confirm = useConfirm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devRes, deptRes] = await Promise.all([
          devicesApi.getDevices({ limit: 500 }),
          departmentsApi.getDepartments({ limit: 100 }),
        ]);
        setDevices(devRes.data.data?.devices || []);
        setDepartments(deptRes.data.data?.departments || []);
      } catch (err) {
        console.error('Failed to load inventory', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statusOptions: DeviceStatus[] = ['IN_STOCK', 'ASSIGNED', 'MAINTENANCE', 'SCRAPPED'];

  const categories = useMemo(() => {
    const cats = new Set(devices.map(d => d.category));
    return Array.from(cats).sort();
  }, [devices]);

  const getMonthOptions = () => {
    const months = [{ value: 'all', label: 'All Months' }];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      months.push({ value, label });
    }
    return months;
  };

  const monthOptions = getMonthOptions();

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        device.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (device.serialNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || device.category === categoryFilter;

      let matchesMonth = true;
      if (monthFilter !== 'all') {
        const [filterYear, filterMonth] = monthFilter.split('-').map(Number);
        const deviceDate = new Date(device.purchaseDate || device.createdAt);
        matchesMonth = deviceDate.getFullYear() === filterYear && deviceDate.getMonth() + 1 === filterMonth;
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesMonth;
    });
  }, [devices, searchQuery, statusFilter, categoryFilter, monthFilter]);

  const getDepartmentName = (deptId?: string) => {
    if (!deptId) return '—';
    const dept = departments.find((d: any) => (d._id || d.id) === deptId);
    return dept?.name || '—';
  };

  const getDepartmentId = (dept: any) => dept._id || dept.id;

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
      setSelectedDevices(new Set(filteredDevices.map((d: any) => d._id || d.id)));
    }
  };

  const handleDelete = async (deviceId: string) => {
    const ok = await confirm({ title: 'Delete Device', description: 'This will permanently remove this device and all its data. Any linked assignments may also be affected. This action cannot be undone.', confirmText: 'Yes, Delete', variant: 'destructive' });
    if (!ok) return;
    try {
      await devicesApi.deleteDevice(deviceId);
      setDevices(prev => prev.filter((d: any) => (d._id || d.id) !== deviceId));
      setSelectedDevices(prev => { const next = new Set(prev); next.delete(deviceId); return next; });
      toast.success('Device deleted successfully.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete device. It may have active assignments.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDevices.size === 0) return;
    const ok = await confirm({ title: 'Bulk Delete Devices', description: `You are about to permanently delete ${selectedDevices.size} device(s). All associated data will be lost. This action cannot be undone.`, confirmText: 'Yes, Delete All', variant: 'destructive' });
    if (!ok) return;
    let successCount = 0;
    let failCount = 0;
    for (const deviceId of selectedDevices) {
      try {
        await devicesApi.deleteDevice(deviceId);
        successCount++;
      } catch {
        failCount++;
      }
    }
    try {
      const res = await devicesApi.getDevices({ limit: 500 });
      setDevices(res.data.data?.devices || []);
    } catch {}
    setSelectedDevices(new Set());
    if (failCount === 0) {
      toast.success(`${successCount} device(s) deleted successfully.`);
    } else {
      toast.error(`${successCount} deleted, ${failCount} failed (may have active assignments).`);
    }
  };

  const handleStatusChange = async (deviceId: string, newStatus: DeviceStatus) => {
    if (newStatus === 'SCRAPPED') {
      const ok = await confirm({ title: 'Scrap Device', description: 'This will mark the device as permanently decommissioned. It will be moved to the Scrapped section and can be restored later if needed.', confirmText: 'Yes, Scrap It', variant: 'warning' });
      if (!ok) return;
    }
    try {
      await devicesApi.updateDevice(deviceId, { status: newStatus });
      setDevices(prev => prev.map(d => (d.id === deviceId ? { ...d, status: newStatus } : d)));
      toast.success(`Device status changed to ${newStatus.replace(/_/g, ' ')}.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update device status.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="shimmer h-7 w-32" />
            <div className="shimmer h-4 w-56" />
          </div>
          <div className="shimmer h-10 w-28 rounded-md" />
        </div>
        <div className="shimmer h-14 w-full rounded-lg mb-6" />
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
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
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage all IT devices and equipment</p>
        </div>
        <Link to="/inventory/new">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground btn-press">
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, asset tag, or serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
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
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Purchase Month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="by-department">By Department</TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list">
          {selectedDevices.size > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 animate-slide-down">
              <Checkbox
                checked={selectedDevices.size === filteredDevices.length && filteredDevices.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">{selectedDevices.size} selected</span>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10 btn-press ml-auto"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete Selected
              </Button>
            </div>
          )}
          <Card>
            <CardContent className="p-0">
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
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Change Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border stagger-rows">
                    {filteredDevices.map((device: any) => {
                      const devId = device._id || device.id;
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
                          <td className="px-6 py-4">
                            <StatusBadge status={device.status} />
                          </td>
                          <td className="px-6 py-4">
                            <Select
                              value={device.status}
                              onValueChange={(val) => handleStatusChange(devId, val)}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="IN_STOCK">In Stock</SelectItem>
                                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                <SelectItem value="SCRAPPED">Scrapped</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:scale-110 transition-transform"
                                onClick={() => navigate(`/inventory/${devId}/preview`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Link to={`/inventory/${devId}/edit`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:scale-110 transition-transform">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:scale-110 transition-transform"
                                onClick={() => handleDelete(devId)}
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

              {filteredDevices.length === 0 && (
                <div className="text-center py-12 animate-empty">
                  <Search className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4 animate-float" />
                  <p className="text-muted-foreground">No devices found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Department View */}
        <TabsContent value="by-department">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept: any) => {
              const deptId = getDepartmentId(dept);
              const deptDevices = devices.filter((d: any) => d.departmentId === deptId);

              return (
                <Card key={deptId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{dept.block}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">HOD: {dept.hodName}</p>
                      <p className="text-xs text-muted-foreground">{dept.contactEmail}</p>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="text-2xl font-bold">{deptDevices.length}</div>
                      <p className="text-xs text-muted-foreground">Total Devices</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-blue-600">
                          {deptDevices.filter(d => d.status === 'ASSIGNED').length}
                        </p>
                        <p className="text-xs text-muted-foreground">Assigned</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-yellow-600">
                          {deptDevices.filter(d => d.status === 'IN_STOCK').length}
                        </p>
                        <p className="text-xs text-muted-foreground">In Stock</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-orange-600">
                          {deptDevices.filter(d => d.status === 'MAINTENANCE').length}
                        </p>
                        <p className="text-xs text-muted-foreground">Maintenance</p>
                      </div>
                    </div>

                    <Link to={`/departments/${deptId}`}>
                      <Button variant="outline" className="w-full mt-4">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
