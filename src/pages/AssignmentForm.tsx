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

export default function AssignmentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [devices, setDevices] = useState<Device[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [existingAssignment, setExistingAssignment] = useState<Assignment | null>(null);

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
        const [devRes, deptRes, locRes] = await Promise.all([
          devicesApi.getDevices({ limit: 200 }),
          departmentsApi.getDepartments({ limit: 100 }),
          locationsApi.getLocations({ limit: 100 }),
        ]);
        setDevices(devRes.data.data || []);
        setDepartments(deptRes.data.data || []);
        setLocations(locRes.data.data || []);

        if (id) {
          const assignRes = await assignmentsApi.getAssignmentById(id);
          const assignment = assignRes.data.data?.assignment;
          if (assignment) {
            setExistingAssignment(assignment);
            setFormData({
              deviceId: typeof assignment.deviceId === 'object' ? assignment.deviceId.id : assignment.deviceId,
              departmentId: typeof assignment.departmentId === 'object' ? assignment.departmentId.id : assignment.departmentId,
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.deviceId) newErrors.deviceId = 'Device is required';
    if (!formData.departmentId) newErrors.departmentId = 'Department is required';
    if (!formData.quantity || parseInt(formData.quantity) < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }
    setErrors(newErrors);
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
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
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
              <Alert variant="destructive" className="mb-6">
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
                    {devices.map(device => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.deviceName} ({device.assetTag}) — Qty: {device.quantity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.deviceId && <p className="text-sm text-red-500">{errors.deviceId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
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
                <Select value={formData.locationId} onValueChange={(value) => handleSelectChange('locationId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.building} - {loc.floor} - {loc.room}
                      </SelectItem>
                    ))}
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : id ? 'Update Assignment' : 'Create Assignment'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/assignments')} disabled={isLoading}>
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
