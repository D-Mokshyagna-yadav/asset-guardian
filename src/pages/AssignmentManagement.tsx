import { useState, useEffect } from 'react';
import { departmentsApi, locationsApi, usersApi } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check, X, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Assignment, AssignmentStatus, Device, Department, Location, User } from '@/types';
import { getAssignments, getDevices, saveAssignments, upsertDevice } from '@/data/store';

export default function AssignmentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState(getAssignments());
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const devices = getDevices();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [viewDetailsDialog, setViewDetailsDialog] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

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

  const canApprove = user?.role === 'SUPER_ADMIN';

  // Debug logging
  if (!canApprove) {
    console.warn('User cannot approve - role:', user?.role, 'user:', user);
  }

  const filteredAssignments = filterStatus === 'all'
    ? assignments
    : assignments.filter(a => a.status === filterStatus);

  const getDeviceName = (id: string | Device) => {
    if (typeof id === 'object') return id?.deviceName || 'Unknown';
    return devices.find(d => d.id === id)?.deviceName || 'Unknown';
  };

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

  const getRequestedByName = (id: string | User) => {
    if (typeof id === 'object') return id?.name || 'Unknown';
    return users.find(u => u.id === id)?.name || 'Unknown';
  };

  const handleApprove = () => {
    if (!selectedAssignment) return;

    const updatedAssignment = {
      ...selectedAssignment,
      status: 'APPROVED' as AssignmentStatus,
      approvedBy: user?.id,
    };

    const updatedAssignments = assignments.map(a => {
      if (a.id === selectedAssignment.id) {
        return updatedAssignment;
      }
      return a;
    });

    // Update the device with department and location info
    const currentDevices = getDevices();
    const deviceIdString = typeof selectedAssignment.deviceId === 'object' 
      ? selectedAssignment.deviceId.id 
      : selectedAssignment.deviceId;
    const deviceToUpdate = currentDevices.find(d => d.id === deviceIdString);
    if (deviceToUpdate) {
      const departmentIdString = typeof selectedAssignment.departmentId === 'object' 
        ? selectedAssignment.departmentId.id 
        : selectedAssignment.departmentId;
      const locationIdString = typeof selectedAssignment.locationId === 'object' 
        ? selectedAssignment.locationId.id 
        : selectedAssignment.locationId;
      
      const updatedDevice = {
        ...deviceToUpdate,
        departmentId: departmentIdString,
        locationId: locationIdString,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      upsertDevice(updatedDevice);
    }

    setAssignments(updatedAssignments);
    saveAssignments(updatedAssignments);
    
    // Show success notification
    toast({
      title: 'Success',
      description: 'Assignment approved successfully',
      duration: 3000,
    });
    
    // Close dialogs and reset state
    setViewDetailsDialog(false);
    setApprovalDialog(false);
    setSelectedAssignment(null);
    setActionType(null);
    setRejectionReason('');
  };

  const handleReject = () => {
    if (!selectedAssignment) return;

    const updatedAssignment = {
      ...selectedAssignment,
      status: 'REJECTED' as AssignmentStatus,
      remarks: rejectionReason || 'Request rejected',
      approvedBy: user?.id,
    };

    const updatedAssignments = assignments.map(a => {
      if (a.id === selectedAssignment.id) {
        return updatedAssignment;
      }
      return a;
    });

    setAssignments(updatedAssignments);
    saveAssignments(updatedAssignments);
    
    // Show success notification
    toast({
      title: 'Success',
      description: 'Assignment rejected successfully',
      duration: 3000,
    });
    
    // Close dialogs and reset state
    setViewDetailsDialog(false);
    setApprovalDialog(false);
    setSelectedAssignment(null);
    setActionType(null);
    setRejectionReason('');
  };

  const pendingCount = assignments.filter(a => a.status === 'REQUESTED').length;
  const approvedCount = assignments.filter(a => a.status === 'APPROVED').length;
  const rejectedCount = assignments.filter(a => a.status === 'REJECTED').length;

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assignment Management</h1>
        <p className="text-muted-foreground mt-1">Review and manage device assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-2xl font-bold text-blue-600">{assignments.length}</p>
              <p className="text-xs text-muted-foreground">Total Assignments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="REQUESTED">Requested</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Device</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Qty</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Department</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Location</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Requested By</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Date</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAssignments.map((assignment) => (
                  <tr
                    key={assignment.id}
                    className="table-row-hover cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setViewDetailsDialog(true);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium">{getDeviceName(assignment.deviceId)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{assignment.quantity ?? 1}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {getDepartmentName(assignment.departmentId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {getLocationName(assignment.locationId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {getRequestedByName(assignment.requestedBy)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={assignment.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(assignment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {canApprove && assignment.status === 'REQUESTED' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setActionType('approve');
                                setApprovalDialog(true);
                              }}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10 h-8 text-xs"
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setActionType('reject');
                                setApprovalDialog(true);
                              }}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No assignments found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Details Dialog */}
      <Dialog open={viewDetailsDialog} onOpenChange={setViewDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <div className="grid grid-cols-2 gap-6 py-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Device</p>
                <p className="text-sm font-medium">{getDeviceName(selectedAssignment.deviceId)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm font-medium">{getDepartmentName(selectedAssignment.departmentId)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium">{getLocationName(selectedAssignment.locationId)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Requested By</p>
                <p className="text-sm font-medium">{getRequestedByName(selectedAssignment.requestedBy)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <StatusBadge status={selectedAssignment.status} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Request Date</p>
                <p className="text-sm font-medium">{new Date(selectedAssignment.createdAt).toLocaleDateString()}</p>
              </div>
              {selectedAssignment.remarks && (
                <div className="col-span-2 space-y-1">
                  <p className="text-xs text-muted-foreground">Remarks</p>
                  <p className="text-sm">{selectedAssignment.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval/Rejection Dialog */}
      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Assignment' : 'Reject Assignment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedAssignment && (
              <>
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Device</p>
                    <p className="text-sm font-semibold">{getDeviceName(selectedAssignment.deviceId)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Department</p>
                      <p className="text-sm font-semibold">{getDepartmentName(selectedAssignment.departmentId)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Location</p>
                      <p className="text-sm font-semibold">{getLocationName(selectedAssignment.locationId)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Quantity</p>
                    <p className="text-sm font-semibold">{selectedAssignment.quantity ?? 1} unit(s)</p>
                  </div>
                </div>

                {actionType === 'reject' && (
                  <div className="space-y-2">
                    <Label htmlFor="rejection-reason">Rejection Reason</Label>
                    <Textarea
                      id="rejection-reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this assignment is being rejected"
                      rows={3}
                    />
                  </div>
                )}

                {actionType === 'approve' && (
                  <Alert className="border-emerald-200 bg-emerald-50">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-emerald-800">
                      This assignment will be <span className="font-semibold">approved</span>. The device will be assigned to <span className="font-semibold">{getDepartmentName(selectedAssignment.departmentId)}</span> at <span className="font-semibold">{getLocationName(selectedAssignment.locationId)}</span>.
                    </AlertDescription>
                  </Alert>
                )}

                {actionType === 'reject' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This assignment will be <span className="font-semibold">rejected</span> and the requester will be notified.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setApprovalDialog(false);
              setRejectionReason('');
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (actionType === 'reject' && !rejectionReason.trim()) {
                  return;
                }
                if (actionType === 'approve') {
                  handleApprove();
                } else {
                  handleReject();
                }
              }}
              disabled={actionType === 'reject' && !rejectionReason.trim()}
              className={actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-destructive hover:bg-destructive/90'}
            >
              {actionType === 'approve' ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
