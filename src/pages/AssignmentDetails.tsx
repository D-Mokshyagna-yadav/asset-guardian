import { useParams, Link, useNavigate } from 'react-router-dom';
import { mockAssignments, mockDevices, mockDepartments, mockLocations, mockAuditLogs } from '@/data/mockData';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  ClipboardList,
  Monitor,
  Building2,
  MapPin,
  Calendar,
  User,
  Check,
  X,
  FileText,
  MessageSquare,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserType } from '@/types';

// Mock users for display
const mockUsers: UserType[] = [
  { id: '1', name: 'John Administrator', email: 'admin@college.edu', role: 'SUPER_ADMIN', isActive: true, createdAt: '2024-01-01' },
  { id: '2', name: 'Sarah Tech', email: 'staff@college.edu', role: 'IT_STAFF', isActive: true, createdAt: '2024-01-15' },
  { id: '3', name: 'Dr. Michael Dean', email: 'hod@college.edu', role: 'DEPARTMENT_INCHARGE', departmentId: 'dept-1', isActive: true, createdAt: '2024-02-01' },
];

export default function AssignmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const assignment = mockAssignments.find(a => a.id === id);
  const device = mockDevices.find(d => d.id === assignment?.deviceId);
  const department = mockDepartments.find(d => d.id === assignment?.departmentId);
  const location = mockLocations.find(l => l.id === assignment?.locationId);
  const requestedBy = mockUsers.find(u => u.id === assignment?.requestedBy);
  const approvedBy = mockUsers.find(u => u.id === assignment?.approvedBy);
  const assignmentLogs = mockAuditLogs.filter(log => log.entityId === id && log.entityType === 'Assignment');

  const canApprove = user?.role === 'SUPER_ADMIN';

  if (!assignment) {
    return (
      <div className="p-6 lg:p-8 animate-fade-in">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Assignment not found</p>
          <Button variant="outline" onClick={() => navigate('/assignments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assignments')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Assignment Details</h1>
                <p className="text-muted-foreground font-mono text-sm">{assignment.id}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={assignment.status} />
          {canApprove && assignment.status === 'PENDING' && (
            <div className="flex items-center gap-2">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-5 w-5 text-primary" />
                Device Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {device ? (
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Device Name</p>
                      <p className="text-sm font-medium">{device.deviceName}</p>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Asset Tag</p>
                        <p className="text-sm font-mono">{device.assetTag}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Category</p>
                        <p className="text-sm">{device.category}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Current Status</p>
                        <StatusBadge status={device.status} />
                      </div>
                    </div>
                  </div>
                  <Link to={`/inventory/${device.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Device
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Device information not available</p>
              )}
            </CardContent>
          </Card>

          {/* Target Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Target Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {location ? (
                <div className="grid sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Building</p>
                    <p className="text-sm font-medium">{location.building}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Floor</p>
                    <p className="text-sm font-medium">{location.floor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Room</p>
                    <p className="text-sm font-medium">{location.room}</p>
                  </div>
                  {location.rack && (
                    <div>
                      <p className="text-xs text-muted-foreground">Rack</p>
                      <p className="text-sm font-medium">{location.rack}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Location information not available</p>
              )}
            </CardContent>
          </Card>

          {/* Remarks */}
          {assignment.remarks && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Remarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-muted/50 p-4 rounded-lg">{assignment.remarks}</p>
              </CardContent>
            </Card>
          )}

          {/* Activity Log */}
          {assignmentLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Activity History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignmentLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                      <div className="p-1.5 rounded-full bg-muted">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{log.performedBy}</span>
                          <span className="text-muted-foreground"> performed </span>
                          <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Department */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              {department ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <Link to={`/departments/${department.id}`} className="text-sm font-medium text-primary hover:underline">
                      {department.name}
                    </Link>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Block</p>
                    <p className="text-sm font-medium">{department.block}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Department not found</p>
              )}
            </CardContent>
          </Card>

          {/* Requested By */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Requested By
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requestedBy ? (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Link to={`/users/${requestedBy.id}`} className="text-sm font-medium text-primary hover:underline">
                      {requestedBy.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{requestedBy.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">User not found</p>
              )}
            </CardContent>
          </Card>

          {/* Approved By */}
          {approvedBy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Check className="h-5 w-5 text-emerald-600" />
                  Approved By
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <Link to={`/users/${approvedBy.id}`} className="text-sm font-medium text-primary hover:underline">
                      {approvedBy.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{approvedBy.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">{new Date(assignment.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
