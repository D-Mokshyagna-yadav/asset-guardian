import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { mockDevices, mockDepartments, mockLocations } from '@/data/mockData';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Search, Plus, Filter, Eye, Edit, Trash2, BarChart3 } from 'lucide-react';
import { DeviceStatus, Device } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const statusOptions: DeviceStatus[] = ['IN_STOCK', 'ISSUED', 'INSTALLED', 'MAINTENANCE', 'SCRAPPED'];
const categoryOptions = ['All', 'Network Switch', 'Wireless AP', 'Server', 'Printer', 'Router'];

export default function Inventory() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'IT_STAFF';
  const canDelete = user?.role === 'SUPER_ADMIN';

  const filteredDevices = useMemo(() => {
    return mockDevices.filter((device) => {
      const matchesSearch =
        device.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || device.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchQuery, statusFilter, categoryFilter]);

  const getDepartmentName = (id?: string) => {
    return mockDepartments.find(d => d.id === id)?.name || '—';
  };

  const getLocationName = (id?: string) => {
    const loc = mockLocations.find(l => l.id === id);
    return loc ? `${loc.building}, ${loc.room}` : '—';
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage all IT devices and equipment</p>
        </div>
        {canEdit && (
          <Link to="/inventory/new">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </Link>
        )}
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
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
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
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Asset Tag</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Device</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Category</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Department</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Location</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredDevices.map((device) => (
                      <tr key={device.id} className="table-row-hover">
                        <td className="px-6 py-4 text-sm font-mono text-foreground">{device.assetTag}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">{device.deviceName}</p>
                            <p className="text-xs text-muted-foreground">{device.brand} {device.model}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{device.category}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{getDepartmentName(device.departmentId)}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{getLocationName(device.locationId)}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={device.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedDevice(device)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEdit && (
                              <Link to={`/inventory/${device.id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            {canDelete && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredDevices.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No devices found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Department View */}
        <TabsContent value="by-department">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockDepartments.map((dept) => {
              const deptDevices = filteredDevices.filter(d => d.departmentId === dept.id);
              const deptAllDevices = mockDevices.filter(d => d.departmentId === dept.id);
              
              return (
                <Card key={dept.id} className="hover:shadow-lg transition-shadow">
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
                      <div className="text-2xl font-bold">{deptAllDevices.length}</div>
                      <p className="text-xs text-muted-foreground">Total Devices</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-blue-600">
                          {deptAllDevices.filter(d => d.status === 'INSTALLED').length}
                        </p>
                        <p className="text-xs text-muted-foreground">Installed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-yellow-600">
                          {deptAllDevices.filter(d => d.status === 'IN_STOCK').length}
                        </p>
                        <p className="text-xs text-muted-foreground">In Stock</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-orange-600">
                          {deptAllDevices.filter(d => d.status === 'MAINTENANCE').length}
                        </p>
                        <p className="text-xs text-muted-foreground">Maintenance</p>
                      </div>
                    </div>

                    <Link to={`/departments/${dept.id}`}>
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

      {/* Device Details Dialog */}
      <Dialog open={!!selectedDevice} onOpenChange={() => setSelectedDevice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Device Details</DialogTitle>
          </DialogHeader>
          {selectedDevice && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Asset Tag</p>
                <p className="text-sm font-mono font-medium">{selectedDevice.assetTag}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Device Name</p>
                <p className="text-sm font-medium">{selectedDevice.deviceName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Brand / Model</p>
                <p className="text-sm">{selectedDevice.brand} {selectedDevice.model}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm">{selectedDevice.category}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Serial Number</p>
                <p className="text-sm font-mono">{selectedDevice.serialNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <StatusBadge status={selectedDevice.status} />
              </div>
              {selectedDevice.macAddress && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">MAC Address</p>
                  <p className="text-sm font-mono">{selectedDevice.macAddress}</p>
                </div>
              )}
              {selectedDevice.ipAddress && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">IP Address</p>
                  <p className="text-sm font-mono">{selectedDevice.ipAddress}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm">{getDepartmentName(selectedDevice.departmentId)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm">{getLocationName(selectedDevice.locationId)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Purchase Date</p>
                <p className="text-sm">{new Date(selectedDevice.purchaseDate).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Cost</p>
                <p className="text-sm font-medium">${selectedDevice.cost.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Vendor</p>
                <p className="text-sm">{selectedDevice.vendor}</p>
              </div>
              {selectedDevice.warrantyEnd && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Warranty Until</p>
                  <p className="text-sm">{new Date(selectedDevice.warrantyEnd).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
