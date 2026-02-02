import { Link } from 'react-router-dom';
import { mockAssignments, mockDevices, mockDepartments, mockLocations } from '@/data/mockData';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Check, X, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Assignments() {
  const { user } = useAuth();
  const canApprove = user?.role === 'SUPER_ADMIN';

  const getDeviceName = (id: string) => {
    return mockDevices.find(d => d.id === id)?.deviceName || 'Unknown Device';
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
          <p className="text-muted-foreground mt-1">Manage device assignments and approvals</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </div>

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
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Remarks</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Date</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockAssignments.map((assignment) => (
                  <tr key={assignment.id} className="table-row-hover">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">{getDeviceName(assignment.deviceId)}</p>
                    </td>
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
                        {canApprove && assignment.status === 'PENDING' && (
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

          {mockAssignments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No assignments found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
