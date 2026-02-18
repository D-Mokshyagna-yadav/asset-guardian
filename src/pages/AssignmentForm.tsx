import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { departmentsApi, locationsApi, devicesApi, assignmentsApi } from '@/lib/api';
import { Department, Location, Device, Assignment } from '@/types';
import { toast } from 'sonner';

export default function AssignmentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [devices, setDevices] = useState<Device[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [existingAssignment, setExistingAssignment] = useState<Assignment | null>(null);
  const [deviceAvailability, setDeviceAvailability] = useState<Record<string, number>>({});

  const [formData, setFormData] = useState({
    deviceId: '',
    departmentId: '',
    locationId: '',
    quantity: '1',
    notes: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [devRes, deptRes] = await Promise.all([
          devicesApi.getDevices({ limit: 200 }),
          departmentsApi.getDepartments({ limit: 100 }),
        ]);
        const allDevices = devRes.data.data?.devices || [];
        setDevices(allDevices);
        setDepartments(deptRes.data.data?.departments || []);

        // Fetch availability for all devices in parallel using the server endpoint
        const availResults = await Promise.all(
          allDevices.map(async (dev) => {
            try {
              const res = await devicesApi.getAvailableQuantity(dev.id);
              return { id: dev.id, available: res.data.data?.available ?? dev.quantity };
            } catch {
              return { id: dev.id, available: dev.quantity };
            }
          })
        );
        const availMap: Record<string, number> = {};
        for (const r of availResults) availMap[r.id] = r.available;
        setDeviceAvailability(availMap);

        if (id) {
          const assignDetailRes = await assignmentsApi.getAssignmentById(id);
          const assignment = assignDetailRes.data.data?.assignment;
          if (assignment) {
            setExistingAssignment(assignment);
            const devId = typeof assignment.deviceId === 'object' ? assignment.deviceId.id : assignment.deviceId;
            const deptId = typeof assignment.departmentId === 'object' ? assignment.departmentId.id : assignment.departmentId;
            // When editing, add back current assignment qty to available
            availMap[devId] = (availMap[devId] || 0) + (assignment.quantity || 0);
            setDeviceAvailability({ ...availMap });
            setFormData({
              deviceId: devId,
              departmentId: deptId,
              locationId: assignment.locationId
                ? (typeof assignment.locationId === 'object' ? assignment.locationId.id : assignment.locationId)
                : '',
              quantity: (assignment.quantity || 1).toString(),
              notes: assignment.notes || '',
            });
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, [id]);

  // Fetch locations filtered by selected department
  useEffect(() => {
    if (!formData.departmentId || formData.departmentId === 'none') {
      setLocations([]);
      return;
    }
    const fetchLocations = async () => {
      setLocationsLoading(true);
      try {
        const res = await locationsApi.getLocationsByDepartment(formData.departmentId);
        const locs = res.data.data?.locations;
        setLocations(Array.isArray(locs) ? locs : []);
      } catch (err) {
        console.error('Failed to load locations for department:', err);
        setLocations([]);
      } finally {
        setLocationsLoading(false);
      }
    };
    fetchLocations();
  }, [formData.departmentId]);

  const scrollToFirstError = (errorFields: Record<string, string>) => {
    const fieldNames = Object.keys(errorFields).filter(k => k !== 'submit');
    if (fieldNames.length === 0) return;
    for (const field of fieldNames) {
      const el = document.getElementById(field) || document.querySelector(`[name="${field}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          el.focus();
        }
        break;
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.deviceId) newErrors.deviceId = 'Device is required';
    if (!formData.departmentId) newErrors.departmentId = 'Department is required';
    const qty = parseInt(formData.quantity);
    if (!formData.quantity || qty < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    } else if (formData.deviceId) {
      const avail = deviceAvailability[formData.deviceId] ?? 0;
      if (qty > avail) {
        newErrors.quantity = `Only ${avail} available for this device`;
      }
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => scrollToFirstError(newErrors), 100);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = {
        deviceId: formData.deviceId,
        departmentId: formData.departmentId,
        locationId: formData.locationId || undefined,
        quantity: parseInt(formData.quantity),
        notes: formData.notes || undefined,
      };

      if (id && existingAssignment) {
        await assignmentsApi.updateAssignment(id, payload);
      } else {
        await assignmentsApi.createAssignment(payload);
      }
      navigate('/assignments');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to save assignment';
      setErrors({ submit: msg });
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Reset location when department changes
      if (name === 'departmentId') {
        updated.locationId = '';
      }
      return updated;
    });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="shimmer h-9 w-40 rounded-md mb-6" />
          <div className="bg-card border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <div className="shimmer h-5 w-24" />
              <div className="shimmer h-4 w-56" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="shimmer h-4 w-28" />
                <div className="shimmer h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto animate-slide-up">
        <Button variant="ghost" onClick={() => navigate('/assignments')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignments
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{id ? 'Edit Assignment' : 'Create New Assignment'}</CardTitle>
            <CardDescription>
              {id ? 'Update device assignment' : 'Assign a device to a department'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errors.submit && (
              <Alert variant="destructive" className="mb-6 animate-slide-down">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="deviceId">Select Device *</Label>
                <Select value={formData.deviceId} onValueChange={(value) => handleSelectChange('deviceId', value)}>
                  <SelectTrigger className={errors.deviceId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Choose a device" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices
                      .filter(d => d.status !== 'SCRAPPED')
                      .map(device => {
                      const avail = deviceAvailability[device.id] ?? 0;
                      const isOutOfStock = avail <= 0 && formData.deviceId !== device.id;
                      return (
                        <SelectItem key={device.id} value={device.id} disabled={isOutOfStock}>
                          <span className="flex items-center gap-2">
                            {device.deviceName} ({device.assetTag})
                            {isOutOfStock ? (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">Out of Stock</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">— {avail} of {device.quantity} available</span>
                            )}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {formData.deviceId && (
                  <p className="text-xs text-muted-foreground">
                    {(deviceAvailability[formData.deviceId] ?? 0) <= 0 ? (
                      <span className="font-semibold text-red-500">Out of Stock — All units are currently assigned</span>
                    ) : (
                      <>Available: <span className="font-semibold text-emerald-600">
                        {deviceAvailability[formData.deviceId] ?? 0}
                      </span> of {devices.find(d => d.id === formData.deviceId)?.quantity ?? 0}</>
                    )}
                  </p>
                )}
                {errors.deviceId && <p className="text-sm text-red-500">{errors.deviceId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  max={formData.deviceId ? Math.max(deviceAvailability[formData.deviceId] ?? 1, 1) : undefined}
                  value={formData.quantity}
                  onChange={handleChange}
                  className={errors.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="departmentId">Select Department *</Label>
                <Select value={formData.departmentId} onValueChange={(value) => handleSelectChange('departmentId', value)}>
                  <SelectTrigger className={errors.departmentId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Choose a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.block})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && <p className="text-sm text-red-500">{errors.departmentId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationId">Select Location (Optional)</Label>
                <Select
                  value={formData.locationId}
                  onValueChange={(value) => handleSelectChange('locationId', value)}
                  disabled={!formData.departmentId || locationsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={locationsLoading ? 'Loading locations...' : !formData.departmentId ? 'Select a department first' : 'Choose a location'} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.length === 0 ? (
                      <SelectItem value="none" disabled>No locations for this department</SelectItem>
                    ) : (
                      locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.building} - {loc.floor} - {loc.room}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any notes about this assignment"
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading} className="btn-press">
                  {isLoading ? 'Saving...' : id ? 'Update Assignment' : 'Create Assignment'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/assignments')} disabled={isLoading} className="btn-press">
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
