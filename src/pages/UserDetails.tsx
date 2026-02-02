import { useParams, Link, useNavigate } from 'react-router-dom';
import { mockDepartments, mockAuditLogs, mockDevices } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Edit,
  Shield,
  Mail,
  Building2,
  Calendar,
  UserCheck,
  UserX,
  Monitor,
  FileText,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

// Mock users data (same as in Users.tsx)
const mockUsers: User[] = [
  { id: '1', name: 'John Administrator', email: 'admin@college.edu', role: 'SUPER_ADMIN', isActive: true, createdAt: '2024-01-01' },
  { id: '2', name: 'Sarah Tech', email: 'staff@college.edu', role: 'IT_STAFF', isActive: true, createdAt: '2024-01-15' },
  { id: '3', name: 'Dr. Michael Dean', email: 'hod@college.edu', role: 'DEPARTMENT_INCHARGE', departmentId: 'dept-1', isActive: true, createdAt: '2024-02-01' },
  { id: '4', name: 'Alex Johnson', email: 'alex@college.edu', role: 'IT_STAFF', isActive: true, createdAt: '2024-03-01' },
  { id: '5', name: 'Maria Garcia', email: 'maria@college.edu', role: 'DEPARTMENT_INCHARGE', departmentId: 'dept-2', isActive: false, createdAt: '2024-02-15' },
];

const getRoleBadgeStyle = (role: UserRole) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'IT_STAFF':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'DEPARTMENT_INCHARGE':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const userProfile = mockUsers.find(u => u.id === id);
  const department = mockDepartments.find(d => d.id === userProfile?.departmentId);
  const userLogs = mockAuditLogs.filter(log => log.performedBy === userProfile?.name);
  const assignedDevices = mockDevices.filter(d => d.inchargeUserId === id);

  if (!userProfile) {
    return (
      <div className="p-6 lg:p-8 animate-fade-in">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">User not found</p>
          <Button variant="outline" onClick={() => navigate('/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{userProfile.name}</h1>
                {userProfile.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <UserCheck className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <UserX className="h-3 w-3" />
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">{userProfile.email}</p>
            </div>
          </div>
        </div>
        {currentUser?.role === 'SUPER_ADMIN' && (
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
            <Button variant="outline" className={userProfile.isActive ? 'text-destructive border-destructive/30 hover:bg-destructive/10' : 'text-emerald-600 border-emerald-300 hover:bg-emerald-50'}>
              {userProfile.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Devices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-5 w-5 text-primary" />
                Devices In Charge ({assignedDevices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedDevices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Device</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Category</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {assignedDevices.map((device) => (
                        <tr key={device.id} className="table-row-hover">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium">{device.deviceName}</p>
                              <p className="text-xs text-muted-foreground font-mono">{device.assetTag}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{device.category}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={device.status} />
                          </td>
                          <td className="px-4 py-3">
                            <Link to={`/inventory/${device.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No devices assigned to this user</p>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Recent Activity ({userLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userLogs.length > 0 ? (
                <div className="space-y-4">
                  {userLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-full bg-background">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                            <span className="text-muted-foreground"> on </span>
                            <span className="font-mono text-xs bg-muted px-1 rounded">{log.entityType}/{log.entityId}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(log.timestamp).toLocaleString()} • {log.ipAddress}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No activity recorded for this user</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Role */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Role & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Role</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeStyle(userProfile.role)}`}>
                    {userProfile.role.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Permissions</p>
                  <ul className="text-sm space-y-1">
                    {userProfile.role === 'SUPER_ADMIN' && (
                      <>
                        <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Full system access</li>
                        <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> User management</li>
                        <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Approve assignments</li>
                      </>
                    )}
                    {userProfile.role === 'IT_STAFF' && (
                      <>
                        <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Device management</li>
                        <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> View all departments</li>
                        <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Create assignments</li>
                      </>
                    )}
                    {userProfile.role === 'DEPARTMENT_INCHARGE' && (
                      <>
                        <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> View department devices</li>
                        <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Request assignments</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-primary" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a href={`mailto:${userProfile.email}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {userProfile.email}
              </a>
            </CardContent>
          </Card>

          {/* Department */}
          {department && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link to={`/departments/${department.id}`} className="text-sm font-medium text-primary hover:underline">
                  {department.name}
                </Link>
                <p className="text-xs text-muted-foreground mt-1">{department.block}</p>
              </CardContent>
            </Card>
          )}

          {/* Created */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Account Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{new Date(userProfile.createdAt).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
