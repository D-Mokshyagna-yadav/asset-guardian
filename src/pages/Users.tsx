import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Shield, UserCheck, UserX, Eye } from 'lucide-react';
import { User, UserRole } from '@/types';

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

export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage system users and their roles</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">User</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Role</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Created</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="table-row-hover">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeStyle(user.role)}`}>
                        {user.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
                          <UserCheck className="h-4 w-4" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          <UserX className="h-4 w-4" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/users/${user.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
