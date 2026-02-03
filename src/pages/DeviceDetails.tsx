import { useParams, Link, useNavigate } from 'react-router-dom';
import { departmentsApi, locationsApi, auditLogsApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Department, Location, AuditLog } from '@/types';
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
  DollarSign,
  Shield,
  Network,
  FileText,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAssignments, getAvailableQuantity, getDevices } from '@/data/store';

export default function DeviceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const devices = getDevices();
  const assignments = getAssignments();
  const device = devices.find(d => d.id === id);
  const department = mockDepartments.find(d => d.id === device?.departmentId);
  const location = mockLocations.find(l => l.id === device?.locationId);
  const deviceLogs = mockAuditLogs.filter(log => log.entityId === id && log.entityType === 'Device');

  const canEdit = user?.role === 'SUPER_ADMIN';
  const canDelete = user?.role === 'SUPER_ADMIN';

  if (!device) {
    return (
      <div className="p-6 lg:p-8 animate-fade-in">
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
    <div className="p-6 lg:p-8 animate-fade-in">
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
          {canEdit && (
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Device
            </Button>
          )}
          {canDelete && (
            <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Device Information */}
          <Card>
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
                  <p className="text-sm font-medium">{device.brand} {device.model}</p>
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Available</p>
                  <p className="text-sm font-medium">
                    {getAvailableQuantity(device, assignments) > 0
                      ? getAvailableQuantity(device, assignments)
                      : 'No stock'}
                  </p>
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
            <Card>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-primary" />
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
                  <p className="text-sm font-medium text-emerald-600">${device.cost.toLocaleString()}</p>
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
            <Card>
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
                          <span className="font-medium">{log.performedBy}</span>
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
        <div className="space-y-6">
          {/* Location Card */}
          <Card>
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
          <Card>
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
                    <Link to={`/departments/${department.id}`} className="text-sm font-medium text-primary hover:underline">
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
          <Card>
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
