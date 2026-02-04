import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { departmentsApi, locationsApi, usersApi } from '@/lib/api';
import { Assignment, AssignmentStatus, Department, Location, User } from '@/types';
import { getAssignments, getDevices, saveAssignments } from '@/data/store';
import { useAuth } from '@/contexts/AuthContext';

export default function AssignmentStatusUpdate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState(getAssignments());
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const devices = getDevices();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadLookupData = async () => {
      try {
        const [deptRes, locRes, usersRes] = await Promise.all([
          departmentsApi.getDepartments({ limit: 100 }),
          locationsApi.getLocations({ limit: 100 }),
          usersApi.getUsers({ limit: 100 }),
        ]);
        setDepartments(deptRes.data.data);
        setLocations(locRes.data.data);
        setUsers(usersRes.data.data);
      } catch (error) {
        console.error('Failed to load lookup data:', error);
      }
    };

    loadLookupData();
  }, []);

  // Get IT_STAFF's approved assignments only
  const myApprovedAssignments = assignments.filter(
    a => a.requestedBy === user?.id && a.status === 'APPROVED'
  );

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [newStatus, setNewStatus] = useState<AssignmentStatus>('PENDING');
  const [remarks, setRemarks] = useState('');

  const selectedAssignment = assignments.find(a => a.id === selectedAssignmentId);
  const device = selectedAssignment ? devices.find(d => d.id === selectedAssignment.deviceId) : null;

  const getDepartmentName = (id: string | Department) => {
    if (typeof id === 'object') return id?.name || 'Unknown';
    return departments.find(d => d.id === id)?.name || 'Unknown';
  };

  const getLocationName = (id: string | Location) => {
    if (typeof id === 'object') {
      return id ? `${id.building}, ${id.room}` : 'Unknown';
    }
    const loc = locations.find(l => l.id === id);
    return loc ? `${loc.building}, ${loc.room}` : 'Unknown';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedAssignmentId) newErrors.assignment = 'Please select an assignment';
    if (!newStatus) newErrors.status = 'Status is required';
    if (!remarks.trim()) newErrors.remarks = 'Please provide remarks about the update';

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
      const updatedAssignments = assignments.map(a => {
        if (a.id === selectedAssignmentId) {
          return {
            ...a,
            status: newStatus,
            remarks: remarks,
          };
        }
        return a;
      });

      await new Promise(resolve => setTimeout(resolve, 300));
      saveAssignments(updatedAssignments);
      setAssignments(updatedAssignments);
      setSuccess(true);

      setTimeout(() => {
        navigate('/assignments');
      }, 2000);
    } catch (error) {
      setErrors({ submit: 'Failed to update assignment. Please try again.' });
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
              <h2 className="text-2xl font-bold">Status Updated</h2>
              <p className="text-muted-foreground">
                Your assignment status has been updated successfully.
              </p>
              <Button onClick={() => navigate('/assignments')} className="w-full">
                View My Assignments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (myApprovedAssignments.length === 0) {
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
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
                <h2 className="text-lg font-semibold">No Approved Assignments</h2>
                <p className="text-muted-foreground">
                  You don't have any approved assignments to update. Submit device requests and wait for admin approval.
                </p>
                <Button onClick={() => navigate('/assignments')}>
                  View My Requests
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
          Back to Assignments
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Update Assignment Status</CardTitle>
            <CardDescription>
              Update the status of your approved device assignments (Installation, Maintenance, Completed, etc.)
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
                <Label htmlFor="assignment">Select Assignment *</Label>
                <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                  <SelectTrigger className={errors.assignment ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Choose an assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    {myApprovedAssignments.map(assignment => {
                      const device = devices.find(d => d.id === assignment.deviceId);
                      return (
                        <SelectItem key={assignment.id} value={assignment.id}>
                          {device?.deviceName} - {getDepartmentName(assignment.departmentId)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {errors.assignment && (
                  <p className="text-sm text-red-500">{errors.assignment}</p>
                )}
              </div>

              {selectedAssignment && device && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-blue-900">Assignment Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700 font-medium">Device</p>
                      <p className="text-blue-600">{device.deviceName}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 font-medium">Quantity</p>
                      <p className="text-blue-600">{selectedAssignment.quantity}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 font-medium">Department</p>
                      <p className="text-blue-600">{getDepartmentName(selectedAssignment.departmentId)}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 font-medium">Location</p>
                      <p className="text-blue-600">{getLocationName(selectedAssignment.locationId)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-blue-700 font-medium">Request Reason</p>
                      <p className="text-blue-600">
                        {selectedAssignment.reason?.replace(/_/g, ' ') || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">Update Status *</Label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as AssignmentStatus)}>
                  <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">🟡 Pending - Work in progress</SelectItem>
                    <SelectItem value="COMPLETED">✅ Completed - Work finished</SelectItem>
                    <SelectItem value="MAINTENANCE">🔧 Maintenance - Device under maintenance</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-500">{errors.status}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Work Status Remarks *</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Provide details about the current status (e.g., Installation in progress, Maintenance completed, Issues encountered, etc.)"
                  rows={4}
                  className={errors.remarks ? 'border-red-500' : ''}
                />
                {errors.remarks && (
                  <p className="text-sm text-red-500">{errors.remarks}</p>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Updating...' : 'Update Status'}
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
