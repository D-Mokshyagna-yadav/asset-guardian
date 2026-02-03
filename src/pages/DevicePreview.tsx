import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { mockDepartments, mockLocations } from '@/data/mockData';
import { getDevices, getAssignments, getAvailableQuantity } from '@/data/store';
import { ArrowLeft, Edit, Trash2, Package, MapPin, DollarSign, Zap, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function DevicePreview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const devices = getDevices();
  const assignments = getAssignments();
  
  const device = devices.find(d => d.id === id);

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

  const getDepartmentName = (id?: string) => {
    return mockDepartments.find(d => d.id === id)?.name || '—';
  };

  const getLocationName = (id?: string) => {
    const loc = mockLocations.find(l => l.id === id);
    return loc ? `${loc.building}, ${loc.floor}, ${loc.room}` : '—';
  };

  const availableQty = getAvailableQuantity(device, assignments);
  const inUse = device.quantity - (availableQty > 0 ? availableQty : 0);
  const canEdit = user?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/20 to-muted/50 p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/inventory')}
          className="mb-4 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </Button>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Device Card */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-2 border-primary/20">
            <div className="h-64 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <Package className="h-32 w-32 text-primary/30" />
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Asset Tag</p>
                  <h1 className="text-3xl font-bold font-mono text-foreground">{device.assetTag}</h1>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Device Name</p>
                    <p className="text-lg font-semibold text-foreground">{device.deviceName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Category</p>
                    <p className="text-lg font-semibold text-foreground">{device.category}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Brand</p>
                    <p className="text-sm text-foreground">{device.brand}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Model</p>
                    <p className="text-sm text-foreground">{device.model}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Status</p>
              <StatusBadge status={device.status} />
            </CardContent>
          </Card>

          <Card className="bg-emerald-500/10 border-emerald-500/20">
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Available</p>
              <p className="text-3xl font-bold text-emerald-600">
                {availableQty > 0 ? availableQty : 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">units in stock</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">In Use</p>
              <p className="text-3xl font-bold text-blue-600">{inUse}</p>
              <p className="text-xs text-muted-foreground mt-1">units assigned</p>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total</p>
              <p className="text-3xl font-bold text-amber-600">{device.quantity}</p>
              <p className="text-xs text-muted-foreground mt-1">units total</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Technical Specifications */}
          <Card>
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
          <Card>
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
                  <p className="text-sm font-medium">{getDepartmentName(device.departmentId)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Location</p>
                  <p className="text-sm font-medium">{getLocationName(device.locationId)}</p>
                </div>
                {device.inchargeUserId && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">In-Charge User</p>
                    <p className="text-sm font-medium">{device.inchargeUserId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Purchase Date</p>
                    <p className="text-sm font-medium">{new Date(device.purchaseDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Arrival Date</p>
                    <p className="text-sm font-medium">{new Date(device.arrivalDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Cost</p>
                  <p className="text-2xl font-bold text-emerald-600">${device.cost.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Vendor</p>
                    <p className="text-sm font-medium">{device.vendor}</p>
                  </div>
                  {device.invoiceNumber && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Invoice #</p>
                      <p className="text-sm font-mono">{device.invoiceNumber}</p>
                    </div>
                  )}
                </div>
                {device.billDate && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Bill Date</p>
                      <p className="text-sm font-medium">{new Date(device.billDate).toLocaleDateString()}</p>
                    </div>
                    {device.billAmount && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Bill Amount</p>
                        <p className="text-sm font-medium">${device.billAmount.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Warranty */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Warranty Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {device.warrantyStart && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Warranty Start</p>
                    <p className="text-sm font-medium">{new Date(device.warrantyStart).toLocaleDateString()}</p>
                  </div>
                )}
                {device.warrantyEnd ? (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Warranty End</p>
                    <p className="text-sm font-medium text-emerald-600">{new Date(device.warrantyEnd).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Warranty</p>
                    <p className="text-sm text-muted-foreground">No warranty information</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Features */}
          {device.features && device.features.length > 0 && (
            <Card>
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
            <Card>
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
          {canEdit && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6 space-y-3">
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
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this device?')) {
                      // Delete functionality
                      navigate('/inventory');
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Device
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card className="text-xs">
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
                  <p className="text-foreground font-medium">{device.createdBy}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
