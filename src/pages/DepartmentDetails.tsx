import { useParams, Link, useNavigate } from 'react-router-dom';
import { departmentsApi, devicesApi, assignmentsApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Department, Device, Assignment, Location, DeviceStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Edit,
  Building2,
  Users,
  Mail,
  Phone,
  Monitor,
  MapPin,
  Calendar,
  Eye,
  Undo2,
  Trash2,
  Wrench,
  IndianRupee,
  Filter,
} from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

export default function DepartmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [department, setDepartment] = useState<Department | null>(null);
  const [departmentDevices, setDepartmentDevices] = useState<Device[]>([]);
  const [departmentAssignments, setDepartmentAssignments] = useState<Assignment[]>([]);
  const [departmentLocations, setDepartmentLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null); // deviceId or 'bulk'
  const confirmDialog = useConfirm();

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const [deptRes, devicesRes, assignRes] = await Promise.all([
          departmentsApi.getDepartmentById(id),
          devicesApi.getDevices({ departmentId: id, limit: 100 }),
          assignmentsApi.getAssignments({ departmentId: id, limit: 100 }),
        ]);
        setDepartment(deptRes.data.data?.department || null);
        setDepartmentLocations(deptRes.data.data?.locations || []);
        setDepartmentDevices(devicesRes.data.data?.devices || []);
        setDepartmentAssignments(assignRes.data.data || []);
      } catch (error) {
        console.error('Failed to load department details:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const refreshData = async () => {
    if (!id) return;
    try {
      const [devicesRes, assignRes] = await Promise.all([
        devicesApi.getDevices({ departmentId: id, limit: 100 }),
        assignmentsApi.getAssignments({ departmentId: id, limit: 100 }),
      ]);
      setDepartmentDevices(devicesRes.data.data?.devices || []);
      setDepartmentAssignments(assignRes.data.data || []);
      setSelectedDevices(new Set());
    } catch {}
  };

  const handleUnassignDevice = async (deviceId: string) => {
    const ok = await confirmDialog({ title: 'Unassign Device', description: 'This will return the device to stock and mark the assignment as returned. The device will become available for new assignments.', confirmText: 'Yes, Unassign', variant: 'warning' });
    if (!ok) return;
    setActionLoading(deviceId);
    try {
      // Find active assignment for this device in this department
      const active = departmentAssignments.find(
        a => a.status === 'ACTIVE' && ((typeof a.deviceId === 'object' ? (a.deviceId as Device).id : a.deviceId) === deviceId)
      );
      if (!active) {
        toast.error('No active assignment found for this device.');
        return;
      }
      await assignmentsApi.unassignDevice(active.id);
      await refreshData();
      toast.success('Device unassigned and returned to stock.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to unassign device.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeStatus = async (deviceId: string, newStatus: DeviceStatus) => {
    if (newStatus === 'SCRAPPED') {
      const ok = await confirmDialog({ title: 'Scrap Device', description: 'This will mark the device as permanently decommissioned. It will be moved to the Scrapped section and can be restored later if needed.', confirmText: 'Yes, Scrap It', variant: 'warning' });
      if (!ok) return;
    }
    setActionLoading(deviceId);
    try {
      await devicesApi.updateDevice(deviceId, { status: newStatus });
      await refreshData();
      toast.success(`Device status changed to ${newStatus.replace(/_/g, ' ')}.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update device status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkUnassign = async () => {
    if (selectedDevices.size === 0) return;
    const ok = await confirmDialog({ title: 'Bulk Unassign', description: `This will return ${selectedDevices.size} device(s) to stock. They will become available for new assignments.`, confirmText: 'Yes, Unassign All', variant: 'warning' });
    if (!ok) return;
    setActionLoading('bulk');
    try {
      let successCount = 0;
      for (const deviceId of selectedDevices) {
        const active = departmentAssignments.find(
          a => a.status === 'ACTIVE' && ((typeof a.deviceId === 'object' ? (a.deviceId as Device).id : a.deviceId) === deviceId)
        );
        if (active) {
          await assignmentsApi.unassignDevice(active.id);
          successCount++;
        }
      }
      await refreshData();
      toast.success(`${successCount} device(s) unassigned and returned to stock.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed during bulk unassign.');
      await refreshData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkScrap = async () => {
    if (selectedDevices.size === 0) return;
    const ok = await confirmDialog({ title: 'Bulk Scrap', description: `This will mark ${selectedDevices.size} device(s) as permanently decommissioned. They will be moved to the Scrapped section.`, confirmText: 'Yes, Scrap All', variant: 'warning' });
    if (!ok) return;
    setActionLoading('bulk');
    try {
      let successCount = 0;
      for (const deviceId of selectedDevices) {
        // First unassign if active
        const active = departmentAssignments.find(
          a => a.status === 'ACTIVE' && ((typeof a.deviceId === 'object' ? (a.deviceId as Device).id : a.deviceId) === deviceId)
        );
        if (active) await assignmentsApi.unassignDevice(active.id);
        await devicesApi.updateDevice(deviceId, { status: 'SCRAPPED' });
        successCount++;
      }
      await refreshData();
      toast.success(`${successCount} device(s) scrapped successfully.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed during bulk scrap.');
      await refreshData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDevices.size === 0) return;
    const ok = await confirmDialog({ title: 'Bulk Delete Devices', description: `You are about to permanently delete ${selectedDevices.size} device(s). All associated data will be lost. This action cannot be undone.`, confirmText: 'Yes, Delete All', variant: 'destructive' });
    if (!ok) return;
    setActionLoading('bulk');
    try {
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
      await refreshData();
      setSelectedDevices(new Set());
      if (failCount === 0) {
        toast.success(`${successCount} device(s) deleted successfully.`);
      } else {
        toast.error(`${successCount} deleted, ${failCount} failed (may have active assignments).`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed during bulk delete.');
      await refreshData();
    } finally {
      setActionLoading(null);
    }
  };

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
      setSelectedDevices(new Set(filteredDevices.map(d => d.id)));
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="shimmer h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <div className="shimmer h-7 w-48" />
            <div className="shimmer h-4 w-28" />
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="shimmer h-40 rounded-lg" />
            <div className="shimmer h-48 rounded-lg" />
          </div>
          <div className="space-y-6">
            <div className="shimmer h-36 rounded-lg" />
            <div className="shimmer h-36 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Department not found</p>
          <Button variant="outline" onClick={() => navigate('/departments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Departments
          </Button>
        </div>
      </div>
    );
  }

  const devicesByStatus = {
    assigned: departmentDevices.filter(d => d.status === 'ASSIGNED').length,
    inStock: departmentDevices.filter(d => d.status === 'IN_STOCK').length,
    maintenance: departmentDevices.filter(d => d.status === 'MAINTENANCE').length,
    scrapped: departmentDevices.filter(d => d.status === 'SCRAPPED').length,
  };

  const totalValue = departmentDevices.reduce((sum, d) => sum + d.cost, 0);
  const activeAssignmentCount = departmentAssignments.filter(a => a.status === 'ACTIVE').length;

  const filteredDevices = statusFilter === 'ALL'
    ? departmentDevices
    : departmentDevices.filter(d => d.status === statusFilter);

  const hasActiveAssignment = (deviceId: string) =>
    departmentAssignments.some(
      a => a.status === 'ACTIVE' && ((typeof a.deviceId === 'object' ? (a.deviceId as Device).id : a.deviceId) === deviceId)
    );

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/departments')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{department.name}</h1>
                <p className="text-muted-foreground">{department.block}</p>
              </div>
            </div>
          </div>
        </div>
        <Link to={`/departments/${id}/edit`}>
          <Button variant="outline" className="btn-press">
            <Edit className="h-4 w-4 mr-2" />
            Edit Department
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 stagger-children">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Monitor className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{departmentDevices.length}</p>
                <p className="text-xs text-muted-foreground">Total Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Monitor className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{devicesByStatus.assigned}</p>
                <p className="text-xs text-muted-foreground">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Wrench className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{devicesByStatus.maintenance}</p>
                <p className="text-xs text-muted-foreground">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{devicesByStatus.scrapped}</p>
                <p className="text-xs text-muted-foreground">Scrapped</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <IndianRupee className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">₹{totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Devices */}
          <Card className="card-hover">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Monitor className="h-5 w-5 text-primary" />
                  Devices ({departmentDevices.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* Bulk Actions */}
                  {selectedDevices.size > 0 && (
                    <div className="flex items-center gap-2 animate-slide-up">
                      <span className="text-xs text-muted-foreground font-medium">{selectedDevices.size} selected</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50 btn-press"
                        onClick={handleBulkUnassign}
                        disabled={actionLoading === 'bulk'}
                      >
                        <Undo2 className="h-3.5 w-3.5 mr-1" />
                        Unassign
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10 btn-press"
                        onClick={handleBulkScrap}
                        disabled={actionLoading === 'bulk'}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Scrap
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="btn-press"
                        onClick={handleBulkDelete}
                        disabled={actionLoading === 'bulk'}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <Filter className="h-3.5 w-3.5 mr-1" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="ASSIGNED">Assigned</SelectItem>
                      <SelectItem value="IN_STOCK">In Stock</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="SCRAPPED">Scrapped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredDevices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 w-10">
                          <Checkbox
                            checked={selectedDevices.size === filteredDevices.length && filteredDevices.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Device</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Category</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Change Status</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border stagger-rows">
                      {filteredDevices.map((device) => {
                        const isActive = hasActiveAssignment(device.id);
                        const isLoading = actionLoading === device.id;
                        return (
                          <tr key={device.id} className={`table-row-hover ${selectedDevices.has(device.id) ? 'bg-primary/5' : ''}`}>
                            <td className="px-4 py-3">
                              <Checkbox
                                checked={selectedDevices.has(device.id)}
                                onCheckedChange={() => toggleSelect(device.id)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium">{device.deviceName}</p>
                                <p className="text-xs text-muted-foreground font-mono">{device.assetTag}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{device.category}</td>
                            <td className="px-4 py-3">
                              <StatusBadge status={device.status} />
                            </td>
                            <td className="px-4 py-3">
                              <Select
                                value={device.status}
                                onValueChange={(val) => handleChangeStatus(device.id, val)}
                                disabled={isLoading}
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
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Link to={`/inventory/${device.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:scale-110 transition-transform" title="View device">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                {isActive && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 hover:scale-110 transition-transform"
                                    onClick={() => handleUnassignDevice(device.id)}
                                    disabled={isLoading}
                                    title="Unassign device"
                                  >
                                    <Undo2 className="h-4 w-4" />
                                  </Button>
                                )}
                                {device.status !== 'SCRAPPED' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:scale-110 transition-transform"
                                    onClick={() => handleChangeStatus(device.id, 'SCRAPPED')}
                                    disabled={isLoading}
                                    title="Scrap device"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {statusFilter !== 'ALL' ? `No ${statusFilter.replace(/_/g, ' ').toLowerCase()} devices in this department` : 'No devices assigned to this department'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Assignments */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Assignments ({departmentAssignments.length})
                {activeAssignmentCount > 0 && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    ({activeAssignmentCount} active)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {departmentAssignments.length > 0 ? (
                <div className="space-y-3">
                  {departmentAssignments.map((assignment) => {
                    const deviceObj = typeof assignment.deviceId === 'object' ? assignment.deviceId : null;
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{(deviceObj as Device | null)?.deviceName || 'Device'}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {assignment.quantity}
                            {assignment.returnedAt && <span className="ml-2">• Returned {new Date(assignment.returnedAt).toLocaleDateString()}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={assignment.status} />
                          {assignment.status === 'ACTIVE' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 hover:scale-110 transition-transform"
                              onClick={() => handleUnassignDevice((deviceObj as Device | null)?.id || (typeof assignment.deviceId === 'string' ? assignment.deviceId : ''))}
                              title="Unassign"
                            >
                              <Undo2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Link to={`/assignments/${assignment.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:scale-110 transition-transform">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No assignments for this department</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 stagger-children">
          {/* HOD & Contact Information */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                HOD & Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Head of Department</p>
                  <p className="text-sm font-medium">{department.hodName}</p>
                </div>
                {department.hodPhone && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">HOD Phone</p>
                    <a href={`tel:${department.hodPhone}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {department.hodPhone}
                    </a>
                  </div>
                )}
                {department.hodEmail && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">HOD Email</p>
                    <a href={`mailto:${department.hodEmail}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {department.hodEmail}
                    </a>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Department Email</p>
                  <a href={`mailto:${department.contactEmail}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {department.contactEmail}
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Locations ({departmentLocations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Block</p>
                  <p className="text-sm font-medium">{department.block}</p>
                </div>
                {departmentLocations.length > 0 ? (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Assigned Locations</p>
                    {departmentLocations.map((loc) => (
                      <div key={loc.id || (loc as any)._id} className="p-2 rounded bg-muted/50 text-sm">
                        <p className="font-medium">{loc.building} - {loc.floor} - {loc.room}</p>
                        {loc.rack && <p className="text-xs text-muted-foreground">Rack: {loc.rack}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground pt-2 border-t">No locations assigned</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Created */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{new Date(department.createdAt).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
