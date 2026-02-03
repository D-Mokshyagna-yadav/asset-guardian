import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { mockDepartments, mockLocations } from '@/data/mockData';
import { Assignment, RequestReason } from '@/types';
import { getAssignments, getDevices, getAvailableQuantity, saveAssignments } from '@/data/store';
import { useAuth } from '@/contexts/AuthContext';

const REASON_LABELS: Record<RequestReason, string> = {
  INSTALLATION: 'Installation',
  MAINTENANCE: 'Maintenance',
  REPLACEMENT_MALFUNCTION: 'Replacement (Device Malfunction)',
  UPGRADE: 'Upgrade',
  NEW_REQUIREMENT: 'New Requirement',
  OTHER: 'Other',
};

export default function RequestDevice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const devices = getDevices();
  const assignments = getAssignments();

  const [formData, setFormData] = useState({
    deviceId: '',
    departmentId: user?.departmentId || '',
    locationId: '',
    quantity: '1',
    reason: 'NEW_REQUIREMENT',
    notes: '',
  });

  const selectedDevice = devices.find(d => d.id === formData.deviceId);
  const availableQty = selectedDevice ? getAvailableQuantity(selectedDevice, assignments) : 0;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.deviceId) newErrors.deviceId = 'Device is required';
    if (!formData.departmentId) newErrors.departmentId = 'Department is required';
    if (!formData.locationId) newErrors.locationId = 'Location is required';
    if (!formData.quantity || parseInt(formData.quantity) < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }
    if (selectedDevice && parseInt(formData.quantity) > availableQty) {
      newErrors.quantity = `Only ${availableQty} available in stock`;
    }
    if (!formData.reason) newErrors.reason = 'Request reason is required';
    if (!formData.notes.trim()) newErrors.notes = 'Please provide details about your request';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const newAssignment: Assignment = {
        id: `assign-${Date.now()}`,
        deviceId: formData.deviceId,
        departmentId: formData.departmentId,
        locationId: formData.locationId,
        requestedBy: user?.id || '',
        quantity: parseInt(formData.quantity),
        reason: formData.reason as RequestReason,
        notes: formData.notes,
        status: 'REQUESTED',
        createdAt: new Date().toISOString(),
      };

      await new Promise(resolve => setTimeout(resolve, 300));

      const nextAssignments = [...assignments, newAssignment];
      saveAssignments(nextAssignments);

      setSuccess(true);
      setTimeout(() => {
        navigate('/assignments');
      }, 2000);
    } catch (error) {
      setErrors({ submit: 'Failed to submit request. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <h2 className="text-2xl font-bold">Request Submitted</h2>
              <p className="text-muted-foreground">
                Your device request has been submitted successfully. The admin will review your request soon.
              </p>
              <Button onClick={() => navigate('/assignments')} className="w-full">
                View My Requests
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/assignments')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Request Device</CardTitle>
            <CardDescription>
              Submit a request for a device from inventory. Please provide all required information and details about your request.
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
              <div>
                <h3 className="text-lg font-semibold mb-4">Device Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="deviceId">Select Device *</Label>
                    <Select value={formData.deviceId} onValueChange={(value) => handleSelectChange('deviceId', value)}>
                      <SelectTrigger className={errors.deviceId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Choose an available device" />
                      </SelectTrigger>
                      <SelectContent>
                        {devices
                          .map(device => {
                            const available = getAvailableQuantity(device, assignments);
                            const disabled = available === 0 && device.status === 'IN_STOCK';
                            return (
                              <SelectItem key={device.id} value={device.id} disabled={disabled}>
                                <div className="flex items-center gap-2">
                                  <span>{device.deviceName} ({device.assetTag})</span>
                                  <Badge variant={available > 0 && device.status === 'IN_STOCK' ? 'default' : 'secondary'}>
                                    {available > 0 ? `${available} available` : 'Out of stock'}
                                  </Badge>
                                </div>
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                    {errors.deviceId && (
                      <p className="text-sm text-red-500">{errors.deviceId}</p>
                    )}
                    {selectedDevice && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                        <p><strong>Brand:</strong> {selectedDevice.brand} {selectedDevice.model}</p>
                        <p><strong>Serial:</strong> {selectedDevice.serialNumber}</p>
                        <p><strong>Available Stock:</strong> {availableQty > 0 ? availableQty : 'Out of stock'}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      max={availableQty || 1}
                      value={formData.quantity}
                      onChange={handleChange}
                      className={errors.quantity ? 'border-red-500' : ''}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-red-500">{errors.quantity}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Request Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="departmentId">Department *</Label>
                    <Select value={formData.departmentId} onValueChange={(value) => handleSelectChange('departmentId', value)}>
                      <SelectTrigger className={errors.departmentId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select department" />
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
                    <Label htmlFor="locationId">Installation Location *</Label>
                    <Select value={formData.locationId} onValueChange={(value) => handleSelectChange('locationId', value)}>
                      <SelectTrigger className={errors.locationId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select location" />
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
                    <Label htmlFor="reason">Request Reason *</Label>
                    <Select value={formData.reason} onValueChange={(value) => handleSelectChange('reason', value)}>
                      <SelectTrigger className={errors.reason ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INSTALLATION">📦 Installation - New device installation</SelectItem>
                        <SelectItem value="MAINTENANCE">🔧 Maintenance - Device maintenance required</SelectItem>
                        <SelectItem value="REPLACEMENT_MALFUNCTION">🔄 Replacement - Device malfunction/repair</SelectItem>
                        <SelectItem value="UPGRADE">⬆️ Upgrade - System/component upgrade</SelectItem>
                        <SelectItem value="NEW_REQUIREMENT">✨ New Requirement - New departmental need</SelectItem>
                        <SelectItem value="OTHER">❓ Other - Please specify in notes</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.reason && (
                      <p className="text-sm text-red-500">{errors.reason}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Detailed Request Information *</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Please provide detailed information about your request. Include any specific requirements, urgency, department needs, etc."
                      rows={5}
                      className={errors.notes ? 'border-red-500' : ''}
                    />
                    {errors.notes && (
                      <p className="text-sm text-red-500">{errors.notes}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading || (selectedDevice ? availableQty === 0 : false)}>
                  {isLoading ? 'Submitting...' : 'Submit Request'}
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
