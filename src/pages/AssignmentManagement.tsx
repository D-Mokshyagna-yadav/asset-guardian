import { useState } from 'react';
import { mockAssignments, mockDevices, mockUsers, mockDepartments, mockLocations } from '@/data/mockData';
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
import { AlertCircle, Check, X, Eye, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Assignment, AssignmentStatus } from '@/types';

export default function AssignmentManagement() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState(mockAssignments);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const canApprove = ['SUPER_ADMIN', 'MANAGER', 'IT_STAFF'].includes(user?.role || '');

  const filteredAssignments = filterStatus === 'all'
    ? assignments
    : assignments.filter(a => a.status === filterStatus);

  const getDeviceName = (id: string) => {
    return mockDevices.find(d => d.id === id)?.deviceName || 'Unknown';
  };

  const getDepartmentName = (id: string) => {
    return mockDepartments.find(d => d.id === id)?.name || 'Unknown';
  };

  const getLocationName = (id: string) => {
    const loc = mockLocations.find(l => l.id === id);
    return loc ? `${loc.building}, ${loc.room}` : 'Unknown';
  };

  const getRequestedByName = (id: string) => {
    return mockUsers.find(u => u.id === id)?.name || 'Unknown';
  };

  const handleApprove = () => {
    if (!selectedAssignment) return;

    const updatedAssignments = assignments.map(a => {
      if (a.id === selectedAssignment.id) {
        return {
          ...a,
          status: 'APPROVED' as AssignmentStatus,
          approvedBy: user?.id,
        };
      }
      return a;
    });

    setAssignments(updatedAssignments);
    setApprovalDialog(false);
    setSelectedAssignment(null);
    setActionType(null);
  };

  const handleReject = () => {
    if (!selectedAssignment) return;

    const updatedAssignments = assignments.map(a => {
      if (a.id === selectedAssignment.id) {
        return {
          ...a,
          status: 'REJECTED' as AssignmentStatus,
          remarks: rejectionReason || 'Request rejected',
          approvedBy: user?.id,
        };
      }
      return a;
    });

    setAssignments(updatedAssignments);
    setApprovalDialog(false);
    setSelectedAssignment(null);
    setActionType(null);
    setRejectionReason('');
  };

  const pendingCount = assignments.filter(a => a.status === 'PENDING').length;
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
                  <tr key={assignment.id} className="table-row-hover">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium">{getDeviceName(assignment.deviceId)}</p>
                      </div>
                    </td>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedAssignment(assignment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {canApprove && assignment.status === 'PENDING' && (
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
      <Dialog open={!!selectedAssignment && !approvalDialog} onOpenChange={() => selectedAssignment && !approvalDialog && setSelectedAssignment(null)}>
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
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    <span className="font-semibold">Device:</span> {getDeviceName(selectedAssignment.deviceId)}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Department:</span> {getDepartmentName(selectedAssignment.departmentId)}
                  </p>
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
                  <Alert>
                    <Check className="h-4 w-4" />
                    <AlertDescription>
                      This assignment will be approved and the device will be assigned to the department.
                    </AlertDescription>
                  </Alert>
                )}

                {actionType === 'reject' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This assignment will be rejected and the requester will be notified.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={actionType === 'approve' ? handleApprove : handleReject}
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
