import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { devicesApi, departmentsApi, locationsApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Device, Department, Location } from '@/types';
import { ArrowLeft, Edit, Trash2, Package, MapPin, IndianRupee, Zap, FileText, Calendar, Shield, AlertTriangle, CheckCircle2, Clock, Eye } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

export default function DevicePreview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [device, setDevice] = useState<Device | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
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
      } catch {
        setDevice(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/20 to-muted/50 p-6 lg:p-8">
        <div className="shimmer h-9 w-28 rounded-md mb-8" />
        <div className="shimmer h-56 rounded-xl mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="shimmer h-48 rounded-lg" />
            <div className="shimmer h-40 rounded-lg" />
          </div>
          <div className="space-y-8">
            <div className="shimmer h-56 rounded-lg" />
            <div className="shimmer h-40 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="p-6 lg:p-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-2">Device Not Found</h1>
          <p className="text-muted-foreground">The device you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const getDepartmentName = () => {
    return department?.name || '—';
  };

  const getLocationName = () => {
    return location ? `${location.building}, ${location.floor}, ${location.room}` : '—';
  };

  const getWarrantyStatus = () => {
    if (!device.warrantyEnd) return { status: 'unknown', text: 'Unknown', color: 'text-muted-foreground' };
    
    const now = new Date();
    const warrantyEnd = new Date(device.warrantyEnd);
    const daysRemaining = Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      return { status: 'expired', text: 'Expired', color: 'text-red-600', icon: AlertTriangle };
    } else if (daysRemaining <= 30) {
      return { status: 'expiring', text: `${daysRemaining} days left`, color: 'text-amber-600', icon: Clock };
    } else {
      return { status: 'active', text: `${daysRemaining} days left`, color: 'text-emerald-600', icon: CheckCircle2 };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const isAssigned = device.status === 'ASSIGNED';
  const finalAvailable = isAssigned ? 0 : device.quantity;
  const finalInUse = isAssigned ? device.quantity : 0;
  
  const canEdit = true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/20 to-muted/50 p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/inventory')}
          className="mb-4 hover:bg-muted btn-press"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </Button>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Device Card */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-2 border-primary/20 shadow-lg card-hover">
            <div className="h-64 bg-gradient-to-br from-primary/10 via-primary/5 to-background flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
              <Package className="h-32 w-32 text-primary/30 relative z-10" />
              <div className="absolute top-4 right-4">
                {(() => {
                  const warrantyStatus = getWarrantyStatus();
                  const Icon = warrantyStatus.icon;
                  return (
                    <Badge variant={warrantyStatus.status === 'active' ? 'default' : warrantyStatus.status === 'expiring' ? 'secondary' : 'destructive'} className="flex items-center gap-1">
                      {Icon && <Icon className="h-3 w-3" />}
                      {warrantyStatus.text}
                    </Badge>
                  );
                })()}
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="text-center border-b pb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Asset Tag</p>
                  <h1 className="text-4xl font-bold font-mono text-foreground bg-muted/30 px-4 py-2 rounded-lg inline-block">{device.assetTag}</h1>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Device Name</p>
                  <p className="text-2xl font-bold text-foreground mb-3">{device.deviceName}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{device.category}</Badge>
                    <Badge variant="outline">{device.brand} {device.deviceModel}</Badge>
                    <StatusBadge status={device.status} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4 stagger-children">
          <Card className="card-hover">
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Status</p>
              <StatusBadge status={device.status} />
            </CardContent>
          </Card>

          <Card className="bg-emerald-500/10 border-emerald-500/20 card-hover">
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Available</p>
              <p className="text-3xl font-bold text-emerald-600">
                {finalAvailable}
              </p>
              <p className="text-xs text-muted-foreground mt-1">units ready for assignment</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/20 card-hover">
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Assigned</p>
              <p className="text-3xl font-bold text-blue-600">{finalInUse}</p>
              <p className="text-xs text-muted-foreground mt-1">units currently assigned</p>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/10 border-amber-500/20 card-hover">
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total</p>
              <p className="text-3xl font-bold text-amber-600">{device.quantity}</p>
              <p className="text-xs text-muted-foreground mt-1">units in inventory</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Technical Specifications */}
          <Card className="card-hover">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Technical Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Serial Number</p>
                  <p className="text-sm font-mono font-medium">{device.serialNumber}</p>
                </div>
                {device.macAddress && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">MAC Address</p>
                    <p className="text-sm font-mono">{device.macAddress}</p>
                  </div>
                )}
                {device.ipAddress && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">IP Address</p>
                    <p className="text-sm font-mono">{device.ipAddress}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location & Assignment */}
          <Card className="card-hover">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location & Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Department</p>
                  <p className="text-sm font-medium">{getDepartmentName()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Location</p>
                  <p className="text-sm font-medium">{getLocationName()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card className="card-hover">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-primary" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="text-center bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Cost</p>
                  <p className="text-3xl font-bold text-emerald-600">{formatCurrency(device.cost)}</p>
                  {device.billAmount && device.billAmount !== device.cost && (
                    <p className="text-xs text-muted-foreground mt-1">Bill Amount: {formatCurrency(device.billAmount)}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Purchase Date
                    </p>
                    <p className="text-sm font-medium">{new Date(device.purchaseDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Arrival Date
                    </p>
                    <p className="text-sm font-medium">{new Date(device.arrivalDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Vendor</p>
                    <p className="text-sm font-medium">{device.vendor}</p>
                  </div>
                  {device.invoiceNumber && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Invoice #</p>
                      <p className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">{device.invoiceNumber}</p>
                    </div>
                  )}
                </div>
                {device.billDate && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Bill Date</p>
                    <p className="text-sm font-medium">{new Date(device.billDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Warranty */}
          <Card className="card-hover">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Warranty Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {device.warrantyStart || device.warrantyEnd ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    {device.warrantyStart && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Warranty Start</p>
                        <p className="text-sm font-medium">{new Date(device.warrantyStart).toLocaleDateString()}</p>
                      </div>
                    )}
                    {device.warrantyEnd && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Warranty End</p>
                        <p className="text-sm font-medium">{new Date(device.warrantyEnd).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  {device.warrantyEnd && (
                    <div className="pt-4 border-t">
                      {(() => {
                        const warrantyStatus = getWarrantyStatus();
                        const Icon = warrantyStatus.icon;
                        return (
                          <div className={`flex items-center gap-2 p-3 rounded-lg ${
                            warrantyStatus.status === 'active' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                            warrantyStatus.status === 'expiring' ? 'bg-amber-500/10 border border-amber-500/20' :
                            'bg-red-500/10 border border-red-500/20'
                          }`}>
                            {Icon && <Icon className={`h-4 w-4 ${warrantyStatus.color}`} />}
                            <span className={`text-sm font-medium ${warrantyStatus.color}`}>
                              {warrantyStatus.status === 'expired' ? 'Warranty Expired' :
                               warrantyStatus.status === 'expiring' ? `Warranty Expiring Soon (${warrantyStatus.text})` :
                               `Warranty Active (${warrantyStatus.text})`}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No warranty information available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Features */}
          {device.features && device.features.length > 0 && (
            <Card className="card-hover">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Features</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2">
                  {device.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {device.notes && (
            <Card className="card-hover">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {device.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card className={canEdit ? "border-primary/20 bg-primary/5" : "border-muted/20 bg-muted/5"}>
            <CardContent className="p-6 space-y-3">
              {canEdit ? (
                <>
                  <Button
                    onClick={() => navigate(`/inventory/${device.id}/edit`)}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Device
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={async () => {
                      if (!id) return;
                      const ok = await confirm({ title: 'Delete Device', description: 'This will permanently remove this device and all its data from the system. This action cannot be undone.', confirmText: 'Yes, Delete', variant: 'destructive' });
                      if (!ok) return;
                      try {
                        await devicesApi.deleteDevice(id);
                        toast.success('Device deleted successfully.');
                        navigate('/inventory');
                      } catch (err: any) {
                        toast.error(err?.response?.data?.message || 'Failed to delete device.');
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Device
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground font-medium">View Only Access</p>
                  <p className="text-xs text-muted-foreground mt-1">Contact administrator for modifications</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="text-xs card-hover">
            <CardHeader className="border-b py-3">
              <p className="text-muted-foreground uppercase tracking-wider font-semibold">Metadata</p>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {device.createdAt && (
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider mb-1">Created</p>
                  <p className="text-foreground font-medium">
                    {new Date(device.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {device.updatedAt && (
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider mb-1">Updated</p>
                  <p className="text-foreground font-medium">
                    {new Date(device.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {device.createdBy && (
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider mb-1">Created By</p>
                  <p className="text-foreground font-medium">
                    {typeof device.createdBy === 'object' ? (device.createdBy as any).name || (device.createdBy as any).email : device.createdBy}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
