import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mockAssignments, mockDevices, mockDepartments, mockLocations, mockUsers } from '@/data/mockData';
import { Assignment } from '@/types';

export default function AssignmentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Find existing assignment if editing
  const existingAssignment = id ? mockAssignments.find(a => a.id === id) : null;

  const [formData, setFormData] = useState({
    deviceId: existingAssignment?.deviceId || '',
    departmentId: existingAssignment?.departmentId || '',
    locationId: existingAssignment?.locationId || '',
    userId: existingAssignment?.requestedBy || '',
    remarks: existingAssignment?.remarks || '',
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.deviceId) newErrors.deviceId = 'Device is required';
    if (!formData.departmentId) newErrors.departmentId = 'Department is required';
    if (!formData.locationId) newErrors.locationId = 'Location is required';
    if (!formData.userId) newErrors.userId = 'User is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const newAssignment: Assignment = {
        id: id || `assign-${Date.now()}`,
        deviceId: formData.deviceId,
        departmentId: formData.departmentId,
        locationId: formData.locationId,
        requestedBy: formData.userId,
        approvedBy: existingAssignment?.approvedBy,
        status: existingAssignment?.status || 'PENDING',
        remarks: formData.remarks || undefined,
        createdAt: existingAssignment?.createdAt || new Date().toISOString(),
      };

      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Assignment saved:', newAssignment);
      navigate('/assignments');
    } catch (error) {
      setErrors({ submit: 'Failed to save assignment. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/assignments')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignments
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{id ? 'Edit Assignment' : 'Create New Assignment'}</CardTitle>
            <CardDescription>
              {id ? 'Update device assignment' : 'Assign a device to a user and department'}
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
                    {mockDevices.map(device => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.deviceName} ({device.assetTag})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.deviceId && (
                  <p className="text-sm text-red-500">{errors.deviceId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="userId">Select User *</Label>
                <Select value={formData.userId} onValueChange={(value) => handleSelectChange('userId', value)}>
                  <SelectTrigger className={errors.userId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.userId && (
                  <p className="text-sm text-red-500">{errors.userId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="departmentId">Select Department *</Label>
                <Select value={formData.departmentId} onValueChange={(value) => handleSelectChange('departmentId', value)}>
                  <SelectTrigger className={errors.departmentId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Choose a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDepartments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.block})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && (
                  <p className="text-sm text-red-500">{errors.departmentId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationId">Select Location *</Label>
                <Select value={formData.locationId} onValueChange={(value) => handleSelectChange('locationId', value)}>
                  <SelectTrigger className={errors.locationId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Choose a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockLocations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.building} - {loc.floor} - {loc.room}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.locationId && (
                  <p className="text-sm text-red-500">{errors.locationId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Add any additional remarks about this assignment"
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : id ? 'Update Assignment' : 'Create Assignment'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/assignments')}
                  disabled={isLoading}
                >
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
