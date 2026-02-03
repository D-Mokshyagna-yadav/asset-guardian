import { Link } from 'react-router-dom';
import { mockDepartments, mockLocations } from '@/data/mockData';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Check, X, Eye, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAssignments, getDevices } from '@/data/store';

export default function Assignments() {
  const { user } = useAuth();
  const canApprove = user?.role === 'SUPER_ADMIN';
  const isITStaff = user?.role === 'IT_STAFF';
  const isDeptIncharge = user?.role === 'DEPARTMENT_INCHARGE';

  const devices = getDevices();
  const allAssignments = getAssignments();

  // Filter assignments based on role
  let assignments = allAssignments;
  if (isITStaff) {
    // IT_STAFF sees their own requests and department's approved assignments
    assignments = allAssignments.filter(a => 
      a.requestedBy === user?.id || 
      (a.status === 'APPROVED' && a.departmentId === user?.departmentId)
    );
  } else if (isDeptIncharge) {
    // DEPARTMENT_INCHARGE sees only their department's assignments
    assignments = allAssignments.filter(a => a.departmentId === user?.departmentId);
  }
  // SUPER_ADMIN sees all assignments

  const getDeviceName = (id: string) => {
    return devices.find(d => d.id === id)?.deviceName || 'Unknown Device';
  };

  const getDepartmentName = (id: string) => {
    return mockDepartments.find(d => d.id === id)?.name || 'Unknown';
  };

  const getLocationName = (id: string) => {
    const loc = mockLocations.find(l => l.id === id);
    return loc ? `${loc.building}, ${loc.room}` : 'Unknown';
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
          <p className="text-muted-foreground mt-1">
            {isITStaff ? 'View your device requests and approved assignments' : 
             isDeptIncharge ? 'View your department\'s device assignments' :
             'Manage device assignments and approvals'}
          </p>
        </div>
        {canApprove && (
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="h-4 w-4 mr-2" />
            <Link to="/assignments/new" className="no-underline">
              New Assignment
            </Link>
          </Button>
        )}
        {(isITStaff || isDeptIncharge) && (
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="h-4 w-4 mr-2" />
            <Link to="/request-device" className="no-underline">
              Request Device
            </Link>
          </Button>
        )}
      </div>

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
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Remarks</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Date</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="table-row-hover">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">{getDeviceName(assignment.deviceId)}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{assignment.quantity ?? 1}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {getDepartmentName(assignment.departmentId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {getLocationName(assignment.locationId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                      {assignment.remarks || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={assignment.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(assignment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/assignments/${assignment.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {isITStaff && assignment.status === 'APPROVED' && (
                          <Link to="/assignment-status">
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        {canApprove && assignment.status === 'REQUESTED' && (
                          <>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8">
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 h-8">
                              <X className="h-4 w-4 mr-1" />
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

          {assignments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No assignments found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
