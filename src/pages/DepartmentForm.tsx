import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, MapPin, Plus, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { departmentsApi, locationsApi } from '@/lib/api';
import { Location } from '@/types';

interface NewLocation {
  building: string;
  floor: string;
  room: string;
  rack: string;
}

const emptyLocation: NewLocation = { building: '', floor: '', room: '', rack: '' };

export default function DepartmentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(!!id);

  // Existing locations for this department (when editing)
  const [existingLocations, setExistingLocations] = useState<Location[]>([]);
  // IDs of existing locations marked for removal
  const [removedLocationIds, setRemovedLocationIds] = useState<string[]>([]);
  // New locations to create
  const [newLocations, setNewLocations] = useState<NewLocation[]>([]);
  // Current new location being typed
  const [currentLocation, setCurrentLocation] = useState<NewLocation>({ ...emptyLocation });

  const [formData, setFormData] = useState({
    name: '',
    block: '',
    hodName: '',
    hodPhone: '',
    hodEmail: '',
    contactEmail: '',
  });

  useEffect(() => {
    if (id) {
      const fetchDepartment = async () => {
        try {
          const res = await departmentsApi.getDepartmentById(id);
          const dept = res.data?.data?.department;
          const deptLocations: Location[] = res.data?.data?.locations || [];
          if (dept) {
            setFormData({
              name: dept.name || '',
              block: dept.block || '',
              hodName: dept.hodName || '',
              hodPhone: dept.hodPhone || '',
              hodEmail: dept.hodEmail || '',
              contactEmail: dept.contactEmail || '',
            });
            setExistingLocations(deptLocations);
          }
        } catch (error) {
          console.error('Failed to fetch department:', error);
        } finally {
          setFetchingData(false);
        }
      };
      fetchDepartment();
    }
  }, [id]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Department name is required';
    if (!formData.block.trim()) newErrors.block = 'Block/Building is required';
    if (!formData.hodName.trim()) newErrors.hodName = 'HOD name is required';
    if (!formData.hodPhone.trim()) newErrors.hodPhone = 'HOD phone is required';
    if (!formData.hodEmail.trim()) {
      newErrors.hodEmail = 'HOD email is required';
    } else if (!formData.hodEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.hodEmail = 'Please enter a valid email address';
    }
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!formData.contactEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let departmentId = id;
      if (id) {
        await departmentsApi.updateDepartment(id, formData);
      } else {
        const res = await departmentsApi.createDepartment(formData as any);
        departmentId = res.data?.data?.department?.id;
      }

      if (departmentId) {
        // Create new locations for this department
        if (newLocations.length > 0) {
          await Promise.all(
            newLocations.map(loc =>
              locationsApi.createLocation({
                building: loc.building,
                floor: loc.floor,
                room: loc.room,
                rack: loc.rack || undefined,
                departmentId,
              } as any)
            )
          );
        }

        // Remove locations that were deleted
        if (removedLocationIds.length > 0) {
          await Promise.all(
            removedLocationIds.map(lid =>
              locationsApi.updateLocation(lid, { departmentId: null } as any)
            )
          );
        }
      }

      navigate('/departments');
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || 'Failed to save department. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (fetchingData) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/departments')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Departments
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{id ? 'Edit Department' : 'Add New Department'}</CardTitle>
            <CardDescription>
              {id ? 'Update department and HOD information' : 'Create a new department with HOD details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errors.submit && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange}
                  placeholder="e.g., Computer Science" className={errors.name ? 'border-red-500' : ''} />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="block">Block/Building *</Label>
                <Input id="block" name="block" value={formData.block} onChange={handleChange}
                  placeholder="e.g., Block A" className={errors.block ? 'border-red-500' : ''} />
                {errors.block && <p className="text-sm text-red-500">{errors.block}</p>}
              </div>

              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <h3 className="font-semibold text-sm text-foreground">HOD Details</h3>

                <div className="space-y-2">
                  <Label htmlFor="hodName">HOD Name *</Label>
                  <Input id="hodName" name="hodName" value={formData.hodName} onChange={handleChange}
                    placeholder="e.g., Dr. John Smith" className={errors.hodName ? 'border-red-500' : ''} />
                  {errors.hodName && <p className="text-sm text-red-500">{errors.hodName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hodPhone">HOD Phone *</Label>
                  <Input id="hodPhone" name="hodPhone" value={formData.hodPhone} onChange={handleChange}
                    placeholder="e.g., +91 9876543210" className={errors.hodPhone ? 'border-red-500' : ''} />
                  {errors.hodPhone && <p className="text-sm text-red-500">{errors.hodPhone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hodEmail">HOD Email *</Label>
                  <Input id="hodEmail" name="hodEmail" type="email" value={formData.hodEmail} onChange={handleChange}
                    placeholder="e.g., hod.cs@college.edu" className={errors.hodEmail ? 'border-red-500' : ''} />
                  {errors.hodEmail && <p className="text-sm text-red-500">{errors.hodEmail}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Department Contact Email *</Label>
                <Input id="contactEmail" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange}
                  placeholder="e.g., cs@college.edu" className={errors.contactEmail ? 'border-red-500' : ''} />
                {errors.contactEmail && <p className="text-sm text-red-500">{errors.contactEmail}</p>}
              </div>

              {/* Locations Section */}
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Department Locations
                </h3>
                <p className="text-xs text-muted-foreground">
                  Create locations for this department. Only these locations will appear when this department is selected.
                </p>

                {/* Existing locations (edit mode) */}
                {existingLocations.filter(l => !removedLocationIds.includes(l.id || (l as any)._id)).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Existing Locations</p>
                    {existingLocations
                      .filter(l => !removedLocationIds.includes(l.id || (l as any)._id))
                      .map(loc => {
                        const locId = loc.id || (loc as any)._id;
                        return (
                          <div key={locId} className="flex items-center justify-between p-2 rounded bg-background border">
                            <span className="text-sm">
                              {loc.building} — {loc.floor} — {loc.room}
                              {loc.rack ? ` (Rack: ${loc.rack})` : ''}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setRemovedLocationIds(prev => [...prev, locId])}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* New locations to be created */}
                {newLocations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Locations</p>
                    {newLocations.map((loc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-sm">
                          {loc.building} — {loc.floor} — {loc.room}
                          {loc.rack ? ` (Rack: ${loc.rack})` : ''}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setNewLocations(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new location form */}
                <div className="border rounded-lg p-3 bg-background space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Add a Location</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Building *</Label>
                      <Input
                        placeholder="e.g., Block A"
                        value={currentLocation.building}
                        onChange={(e) => setCurrentLocation(prev => ({ ...prev, building: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Floor *</Label>
                      <Input
                        placeholder="e.g., 2nd Floor"
                        value={currentLocation.floor}
                        onChange={(e) => setCurrentLocation(prev => ({ ...prev, floor: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Room *</Label>
                      <Input
                        placeholder="e.g., Lab 201"
                        value={currentLocation.room}
                        onChange={(e) => setCurrentLocation(prev => ({ ...prev, room: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Rack (Optional)</Label>
                      <Input
                        placeholder="e.g., Rack A1"
                        value={currentLocation.rack}
                        onChange={(e) => setCurrentLocation(prev => ({ ...prev, rack: e.target.value }))}
                      />
                    </div>
                  </div>
                  {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (!currentLocation.building.trim() || !currentLocation.floor.trim() || !currentLocation.room.trim()) {
                        setErrors(prev => ({ ...prev, location: 'Building, Floor and Room are required' }));
                        return;
                      }
                      setErrors(prev => ({ ...prev, location: '' }));
                      setNewLocations(prev => [...prev, { ...currentLocation }]);
                      setCurrentLocation({ ...emptyLocation });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : id ? 'Update Department' : 'Create Department'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/departments')} disabled={isLoading}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
