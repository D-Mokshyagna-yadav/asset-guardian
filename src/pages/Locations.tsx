import { useState, useEffect, useMemo } from 'react';
import { locationsApi, departmentsApi } from '@/lib/api';
import { Location, Department } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  MapPin,
  Building2,
  Trash2,
  Edit,
  Filter,
  Layers,
} from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

interface LocationFormData {
  building: string;
  floor: string;
  room: string;
  rack: string;
  departmentId: string;
}

const emptyForm: LocationFormData = { building: '', floor: '', room: '', rack: '', departmentId: '' };

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [buildings, setBuildings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LocationFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const confirm = useConfirm();

  const fetchData = async () => {
    try {
      const [locRes, deptRes, bldRes] = await Promise.all([
        locationsApi.getLocations({ limit: 500 }),
        departmentsApi.getDepartments({ limit: 100 }),
        locationsApi.getBuildingList(),
      ]);
      setLocations(locRes.data.data?.locations || []);
      setDepartments(deptRes.data.data?.departments || []);
      setBuildings(bldRes.data.data || []);
    } catch (err) {
      console.error('Failed to load locations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesSearch = !searchQuery ||
        loc.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.floor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.rack || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBuilding = buildingFilter === 'All' || loc.building === buildingFilter;
      return matchesSearch && matchesBuilding;
    });
  }, [locations, searchQuery, buildingFilter]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEdit = (loc: Location) => {
    setEditingId(loc.id);
    const deptId = typeof loc.departmentId === 'object' ? loc.departmentId?.id || '' : loc.departmentId || '';
    setFormData({
      building: loc.building,
      floor: loc.floor,
      room: loc.room,
      rack: loc.rack || '',
      departmentId: deptId,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.building.trim()) errs.building = 'Building is required';
    if (!formData.floor.trim()) errs.floor = 'Floor is required';
    if (!formData.room.trim()) errs.room = 'Room is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload: Record<string, string | undefined> = {
        building: formData.building.trim(),
        floor: formData.floor.trim(),
        room: formData.room.trim(),
        rack: formData.rack.trim() || undefined,
        departmentId: formData.departmentId || undefined,
      };
      if (editingId) {
        await locationsApi.updateLocation(editingId, payload as any);
        toast.success('Location updated successfully');
      } else {
        await locationsApi.createLocation(payload as any);
        toast.success('Location created successfully');
      }
      setDialogOpen(false);
      setLoading(true);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.errors?.[0]?.message || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (loc: Location) => {
    const ok = await confirm({
      title: 'Delete Location',
      description: `Delete "${loc.building} / ${loc.floor} / ${loc.room}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await locationsApi.deleteLocation(loc.id);
      toast.success('Location deleted');
      setLocations((prev) => prev.filter((l) => l.id !== loc.id));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete location');
    }
  };

  const getDeptName = (deptId: string | Department | undefined) => {
    if (!deptId) return '—';
    if (typeof deptId === 'object') return deptId.name;
    const dept = departments.find((d) => d.id === deptId);
    return dept?.name || '—';
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Locations</h1>
          <p className="text-muted-foreground mt-1">
            Manage buildings, floors, and rooms
          </p>
        </div>
        <Button onClick={openCreate} className="btn-press">
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={buildingFilter} onValueChange={setBuildingFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Building" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Buildings</SelectItem>
                {buildings.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 stagger-children">
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{locations.length}</p>
              <p className="text-xs text-muted-foreground">Total Locations</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{buildings.length}</p>
              <p className="text-xs text-muted-foreground">Buildings</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100">
              <Layers className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {new Set(locations.map((l) => l.floor)).size}
              </p>
              <p className="text-xs text-muted-foreground">Unique Floors</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100">
              <Layers className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {new Set(locations.map((l) => l.room)).size}
              </p>
              <p className="text-xs text-muted-foreground">Unique Rooms</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-16 w-full rounded-lg" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Building</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Floor</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Room</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Rack</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Department</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border stagger-rows">
                  {filteredLocations.map((loc) => (
                    <tr key={loc.id} className="table-row-hover">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {loc.building}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{loc.floor}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{loc.room}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{loc.rack || '—'}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{getDeptName(loc.departmentId)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(loc)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleDelete(loc)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredLocations.length === 0 && (
              <div className="text-center py-12 animate-empty">
                <MapPin className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4 animate-float" />
                <p className="text-muted-foreground">No locations found</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Location' : 'Add Location'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the location details below.' : 'Fill in the details to create a new location.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="building">Building *</Label>
              <Input
                id="building"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                placeholder="e.g., Main Block"
                className={formErrors.building ? 'border-red-500' : ''}
              />
              {formErrors.building && <p className="text-xs text-red-500">{formErrors.building}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="floor">Floor *</Label>
                <Input
                  id="floor"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="e.g., G, 1, 2"
                  className={formErrors.floor ? 'border-red-500' : ''}
                />
                {formErrors.floor && <p className="text-xs text-red-500">{formErrors.floor}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="room">Room *</Label>
                <Input
                  id="room"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="e.g., 101, Lab-A"
                  className={formErrors.room ? 'border-red-500' : ''}
                />
                {formErrors.room && <p className="text-xs text-red-500">{formErrors.room}</p>}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rack">Rack (optional)</Label>
              <Input
                id="rack"
                value={formData.rack}
                onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                placeholder="e.g., Rack-01"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department (optional)</Label>
              <Select value={formData.departmentId || 'none'} onValueChange={(v) => setFormData({ ...formData, departmentId: v === 'none' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
