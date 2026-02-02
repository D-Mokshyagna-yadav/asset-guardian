import { useState } from 'react';
import { mockDevices, mockUsers } from '@/data/mockData';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Edit, Delete, Plus, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Device } from '@/types';

export default function DeviceManagement() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    status: '',
    managerId: '',
  });

  const canManage = ['SUPER_ADMIN', 'MANAGER'].includes(user?.role || '');
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const managers = mockUsers.filter(u => u.role === 'MANAGER');

  const handleSelectDevice = (deviceId: string) => {
    const newSelected = new Set(selectedDevices);
    if (newSelected.has(deviceId)) {
      newSelected.delete(deviceId);
    } else {
      newSelected.add(deviceId);
    }
    setSelectedDevices(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDevices.size === devices.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(devices.map(d => d.id)));
    }
  };

  const handleBulkEdit = () => {
    if (!bulkEditData.status && !bulkEditData.managerId) {
      return;
    }

    const updatedDevices = devices.map(device => {
      if (selectedDevices.has(device.id)) {
        return {
          ...device,
          status: bulkEditData.status ? (bulkEditData.status as any) : device.status,
          managerId: bulkEditData.managerId || device.managerId,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return device;
    });

    setDevices(updatedDevices);
    setBulkEditOpen(false);
    setBulkEditData({ status: '', managerId: '' });
    setSelectedDevices(new Set());
  };

  const handleDeleteDevice = (deviceId: string) => {
    setDevices(devices.filter(d => d.id !== deviceId));
  };

  const getManagerName = (managerId?: string) => {
    if (!managerId) return '—';
    return managers.find(m => m.id === managerId)?.name || '—';
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Device Management</h1>
          <p className="text-muted-foreground mt-1">Manage and bulk update devices</p>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDevices.size > 0 && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold text-sm">{selectedDevices.size} device(s) selected</p>
                <p className="text-xs text-muted-foreground">Perform bulk actions on selected devices</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setBulkEditOpen(true)}
                  variant="default"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bulk Edit
                </Button>
                <Button
                  onClick={() => setSelectedDevices(new Set())}
                  variant="outline"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Devices ({devices.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedDevices.size === devices.length && devices.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="text-sm cursor-pointer">
                Select All
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-center text-xs font-medium text-muted-foreground px-4 py-4 w-12">
                    <Checkbox
                      checked={selectedDevices.size === devices.length && devices.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Device</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Asset Tag</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Manager</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Quantity</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Cost</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {devices.map((device) => (
                  <tr key={device.id} className="table-row-hover">
                    <td className="px-4 py-4 text-center">
                      <Checkbox
                        checked={selectedDevices.has(device.id)}
                        onCheckedChange={() => handleSelectDevice(device.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium">{device.deviceName}</p>
                        <p className="text-xs text-muted-foreground">{device.brand} {device.model}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{device.assetTag}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={device.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{getManagerName(device.managerId)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{device.quantity}</td>
                    <td className="px-6 py-4 text-sm font-medium">${device.cost.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            // Navigate to device details
                            window.location.href = `/inventory/${device.id}`;
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteDevice(device.id)}
                          >
                            <Delete className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {devices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No devices found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Edit Devices</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-status">Update Status</Label>
              <Select value={bulkEditData.status} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_STOCK">In Stock</SelectItem>
                  <SelectItem value="ISSUED">Issued</SelectItem>
                  <SelectItem value="INSTALLED">Installed</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="SCRAPPED">Scrapped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-manager">Assign to Manager</Label>
              <Select value={bulkEditData.managerId} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, managerId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map(manager => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Updates will be applied to {selectedDevices.size} selected device(s)
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkEdit}>
              <Check className="h-4 w-4 mr-2" />
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
