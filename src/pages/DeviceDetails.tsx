import { useParams, Link, useNavigate } from 'react-router-dom';
import { devicesApi, departmentsApi, locationsApi, auditLogsApi, assignmentsApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Device, Department, Location, AuditLog } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Monitor,
  MapPin,
  Building2,
  Calendar,
  IndianRupee,
  Shield,
  Network,
  FileText,
  Clock,
  Undo2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

export default function DeviceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [deviceLogs, setDeviceLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [unassigning, setUnassigning] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await devicesApi.getDeviceById(id);
        const dev = res.data.data?.device;
        if (!dev) { setLoading(false); return; }
        setDevice(dev);
        if (dev.departmentId) {
          try {
            const deptRes = await departmentsApi.getDepartmentById(dev.departmentId as string);
            setDepartment(deptRes.data.data?.department || null);
          } catch {}
        }
        if (dev.locationId) {
          try {
            const locRes = await locationsApi.getLocationById(dev.locationId as string);
            setLocation(locRes.data.data || null);
          } catch {}
        }
        try {
          const logsRes = await auditLogsApi.getAuditLogsByEntity('Device', id, { limit: 20 });
          setDeviceLogs(logsRes.data.data?.auditLogs || (Array.isArray(logsRes.data.data) ? logsRes.data.data : []));
        } catch {}
      } catch {
        setDevice(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    const ok = await confirm({ title: 'Delete Device', description: 'This will permanently remove this device and all its associated data from the system. Any linked assignments or audit records may also be affected. This action cannot be undone.', confirmText: 'Yes, Delete Device', variant: 'destructive' });
    if (!ok) return;
    try {
      await devicesApi.deleteDevice(id);
      toast.success('Device deleted successfully.');
      navigate('/inventory');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete device.');
    }
  };

  const handleUnassign = async () => {
    if (!id) return;
    const ok = await confirm({ title: 'Unassign Device', description: 'This will return all active assignments for this device back to stock. The device status will be updated accordingly.', confirmText: 'Yes, Unassign', variant: 'warning' });
    if (!ok) return;
    setUnassigning(true);
    try {
      const res = await assignmentsApi.getAssignments({ deviceId: id, status: 'ACTIVE', limit: 100 });
      const activeAssignments = res.data.data || [];
      if (activeAssignments.length === 0) {
        toast.error('No active assignments found for this device.');
        return;
      }
      await Promise.all(activeAssignments.map((a: any) => assignmentsApi.unassignDevice(a.id || a._id)));
      const devRes = await devicesApi.getDeviceById(id);
      const dev = devRes.data.data?.device;
      if (dev) setDevice(dev);
      toast.success(`Device unassigned successfully. ${activeAssignments.length} assignment(s) returned to stock.`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to unassign device.');
    } finally {
      setUnassigning(false);
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
            <div className="shimmer h-48 rounded-lg" />
            <div className="shimmer h-40 rounded-lg" />
          </div>
          <div className="space-y-6">
            <div className="shimmer h-40 rounded-lg" />
            <div className="shimmer h-40 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Device not found</p>
          <Button variant="outline" onClick={() => navigate('/inventory')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        </div>
      </div>
    );
  }

  const warrantyStatus = () => {
    if (!device.warrantyEnd) return null;
    const now = new Date();
    const end = new Date(device.warrantyEnd);
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { label: 'Expired', color: 'text-destructive' };
    if (daysLeft < 90) return { label: `${daysLeft} days left`, color: 'text-amber-600' };
    return { label: `${daysLeft} days left`, color: 'text-emerald-600' };
  };

  const warranty = warrantyStatus();

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/inventory')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{device.deviceName}</h1>
              <StatusBadge status={device.status} />
            </div>
            <p className="text-muted-foreground mt-1 font-mono">{device.assetTag}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {device.status === 'ASSIGNED' && (
            <Button
              variant="outline"
              className="text-orange-600 border-orange-300 hover:bg-orange-50 btn-press"
              onClick={handleUnassign}
              disabled={unassigning}
            >
              <Undo2 className="h-4 w-4 mr-2" />
              {unassigning ? 'Unassigning...' : 'Unassign'}
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(`/inventory/${id}/edit`)} className="btn-press">
            <Edit className="h-4 w-4 mr-2" />
            Edit Device
          </Button>
          <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 btn-press" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Device Information */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-5 w-5 text-primary" />
                Device Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Brand / Model</p>
                  <p className="text-sm font-medium">{device.brand} {device.deviceModel}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Category</p>
                  <p className="text-sm font-medium">{device.category}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Quantity</p>
                  <p className="text-sm font-medium">{device.quantity}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Serial Number</p>
                  <p className="text-sm font-mono">{device.serialNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Asset Tag</p>
                  <p className="text-sm font-mono">{device.assetTag}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Information */}
          {(device.macAddress || device.ipAddress) && (
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Network className="h-5 w-5 text-primary" />
                  Network Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-6">
                  {device.macAddress && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">MAC Address</p>
                      <p className="text-sm font-mono">{device.macAddress}</p>
                    </div>
                  )}
                  {device.ipAddress && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">IP Address</p>
                      <p className="text-sm font-mono">{device.ipAddress}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Purchase & Warranty */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <IndianRupee className="h-5 w-5 text-primary" />
                Purchase & Warranty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Purchase Date</p>
                  <p className="text-sm font-medium">{new Date(device.purchaseDate).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Cost</p>
                  <p className="text-sm font-medium text-emerald-600">₹{device.cost.toLocaleString('en-IN')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Vendor</p>
                  <p className="text-sm font-medium">{device.vendor}</p>
                </div>
                {device.invoiceNumber && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Invoice Number</p>
                    <p className="text-sm font-mono">{device.invoiceNumber}</p>
                  </div>
                )}
                {device.warrantyStart && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Warranty Start</p>
                    <p className="text-sm font-medium">{new Date(device.warrantyStart).toLocaleDateString()}</p>
                  </div>
                )}
                {device.warrantyEnd && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Warranty End</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{new Date(device.warrantyEnd).toLocaleDateString()}</p>
                      {warranty && (
                        <span className={`text-xs ${warranty.color}`}>({warranty.label})</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          {deviceLogs.length > 0 && (
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  Activity History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deviceLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                      <div className="p-1.5 rounded-full bg-muted">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">Admin</span>
                          <span className="text-muted-foreground"> performed </span>
                          <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 stagger-children">
          {/* Location Card */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {location ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Building</p>
                    <p className="text-sm font-medium">{location.building}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Floor</p>
                    <p className="text-sm font-medium">{location.floor}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Room</p>
                    <p className="text-sm font-medium">{location.room}</p>
                  </div>
                  {location.rack && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Rack</p>
                      <p className="text-sm font-medium">{location.rack}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No location assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Department Card */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              {department ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Name</p>
                    <Link to={`/departments/${(department as any)._id || department.id}`} className="text-sm font-medium text-primary hover:underline">
                      {department.name}
                    </Link>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Block</p>
                    <p className="text-sm font-medium">{department.block}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">HOD</p>
                    <p className="text-sm font-medium">{department.hodName}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No department assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">{new Date(device.createdAt).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium">{new Date(device.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
