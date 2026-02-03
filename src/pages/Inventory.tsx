import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockDepartments, mockLocations } from '@/data/mockData';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  getAssignments,
  getAvailableQuantity,
  getDevices,
  getCategories,
  addCategory,
  deleteCategory,
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  addDeviceToGroup,
  removeDeviceFromGroup,
  DeviceGroup,
} from '@/data/store';

export default function Inventory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initialDevices = getDevices();
  const initialAssignments = getAssignments();
  const initialCategories = getCategories();
  const initialGroups = getGroups();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [devices] = useState<Device[]>(initialDevices);
  const [assignments] = useState(initialAssignments);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [groups, setGroups] = useState<DeviceGroup[]>(initialGroups);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [manageGroupOpen, setManageGroupOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeGroupSelection, setActiveGroupSelection] = useState<string[]>([]);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);

  const isAdmin = user?.role === 'SUPER_ADMIN';
  const isITStaff = user?.role === 'IT_STAFF';
  const canViewDetails = isAdmin || isITStaff; // Both ADMIN and IT_STAFF can view
  const canEdit = isAdmin; // Only SUPER_ADMIN can edit/create
  const canDelete = isAdmin; // Only SUPER_ADMIN can delete
  const canManageCategories = isAdmin; // Only SUPER_ADMIN can manage categories
  const canManageGroups = isAdmin; // Only SUPER_ADMIN can manage groups

  const statusOptions: DeviceStatus[] = ['IN_STOCK', 'ISSUED', 'INSTALLED', 'MAINTENANCE', 'SCRAPPED'];

  // Generate month options for the last 12 months
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
        device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || device.category === categoryFilter;
      
      let matchesMonth = true;
      if (monthFilter !== 'all') {
        const [filterYear, filterMonth] = monthFilter.split('-').map(Number);
        const deviceDate = new Date(device.purchaseDate || device.arrivalDate || device.createdAt);
        const deviceYear = deviceDate.getFullYear();
        const deviceMonth = deviceDate.getMonth() + 1;
        matchesMonth = deviceYear === filterYear && deviceMonth === filterMonth;
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesMonth;
    });
  }, [devices, searchQuery, statusFilter, categoryFilter, monthFilter]);

  const getDepartmentName = (id?: string) => {
    return mockDepartments.find(d => d.id === id)?.name || '—';
  };

  const getLocationName = (id?: string) => {
    const loc = mockLocations.find(l => l.id === id);
    return loc ? `${loc.building}, ${loc.room}` : '—';
  };

  const openManageDevices = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    setActiveGroupId(groupId);
    setActiveGroupSelection(group?.deviceIds || []);
    setManageGroupOpen(true);
  };

  const handleToggleDevice = (deviceId: string, checked: boolean) => {
    setActiveGroupSelection((prev) => {
      if (checked) return [...new Set([...prev, deviceId])];
      return prev.filter((id) => id !== deviceId);
    });
  };

  const handleSaveGroupDevices = () => {
    if (!activeGroupId) return;
    const updatedGroup = groups.find((g) => g.id === activeGroupId);
    if (updatedGroup) {
      updateGroup(activeGroupId, { deviceIds: activeGroupSelection });
      setGroups(getGroups());
    }
    setManageGroupOpen(false);
  };

  const handleCreateGroup = () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) return;

    const exists = groups.some((g) => g.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) return;

    const newGroup: DeviceGroup = {
      id: `grp-${Date.now()}`,
      name: trimmedName,
      description: newGroupDescription.trim() || undefined,
      deviceIds: [],
      createdAt: new Date().toISOString(),
      createdBy: user?.id || '1',
    };

    createGroup(newGroup);
    setGroups(getGroups());
    setNewGroupName('');
    setNewGroupDescription('');
    setCreateGroupOpen(false);
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? 'Manage all IT devices and equipment' : 'View available devices'}
          </p>
        </div>
        {isAdmin && (
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
              {canManageCategories && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewCategoryOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" /> Add Category
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="by-department">By Department</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
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
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Quantity</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Available</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Department</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Location</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredDevices.map((device) => {
                      const availableQty = getAvailableQuantity(device, assignments);
                      return (
                        <tr key={device.id} className="table-row-hover">
                          <td className="px-6 py-4 text-sm font-mono text-foreground">{device.assetTag}</td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-foreground">{device.deviceName}</p>
                              <p className="text-xs text-muted-foreground">{device.brand} {device.model}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{device.category}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{device.quantity}</td>
                          <td className="px-6 py-4 text-sm">
                            {availableQty > 0 ? (
                              <span className="text-emerald-600 font-medium">{availableQty}</span>
                            ) : (
                              <span className="text-destructive font-medium">No stock</span>
                            )}
                          </td>
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
                                onClick={() => navigate(`/inventory/${device.id}/preview`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {isAdmin && (
                                <Link to={`/inventory/${device.id}/edit`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                              {isAdmin && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
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
              const deptAllDevices = devices.filter(d => d.departmentId === dept.id);
              
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

        {/* Groups View */}
        <TabsContent value="groups">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold">Device Groups</h2>
              <p className="text-sm text-muted-foreground">Create groups and assign devices (e.g., Networking = Router, Switch)</p>
            </div>
            {canEdit && (
              <Button onClick={() => setCreateGroupOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Group
              </Button>
            )}
          </div>

          {groups.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No groups created yet. Create one to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => {
                const groupDevices = devices.filter((d) => group.deviceIds.includes(d.id));

                return (
                  <Card key={group.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{group.description || '—'}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-2xl font-bold">{groupDevices.length}</div>
                        <p className="text-xs text-muted-foreground">Devices in group</p>
                      </div>

                      <div className="space-y-2">
                        {groupDevices.length === 0 && (
                          <p className="text-xs text-muted-foreground">No devices assigned yet.</p>
                        )}
                        {groupDevices.slice(0, 4).map((d) => (
                          <div key={d.id} className="text-xs text-muted-foreground">
                            • {d.deviceName} ({d.category})
                          </div>
                        ))}
                        {groupDevices.length > 4 && (
                          <p className="text-xs text-muted-foreground">+{groupDevices.length - 4} more</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {canEdit && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => openManageDevices(group.id)}
                            >
                              Manage
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                deleteGroup(group.id);
                                setGroups(getGroups());
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Group Dialog */}
      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="e.g., Networking"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-desc">Description</Label>
              <Input
                id="group-desc"
                placeholder="Optional description"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGroup}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Group Devices Dialog */}
      <Dialog open={manageGroupOpen} onOpenChange={setManageGroupOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Group Devices</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
              {devices.map((device) => {
                const checked = activeGroupSelection.includes(device.id);
                return (
                  <label key={device.id} className="flex items-start gap-3 p-3 rounded border border-border/60">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => handleToggleDevice(device.id, Boolean(value))}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{device.deviceName}</p>
                      <p className="text-xs text-muted-foreground">{device.category} • {device.assetTag}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setManageGroupOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveGroupDevices}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                placeholder="e.g., Switch, Router, Firewall"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            </div>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto border rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground">Existing Categories:</p>
              {categories.map((cat) => (
                <div key={cat} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                  <span>{cat}</span>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        deleteCategory(cat);
                        setCategories(getCategories());
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewCategoryOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (newCategory.trim()) {
                    addCategory(newCategory.trim());
                    setCategories(getCategories());
                    setNewCategory('');
                    setNewCategoryOpen(false);
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
