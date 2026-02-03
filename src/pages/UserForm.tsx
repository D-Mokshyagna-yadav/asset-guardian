import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ArrowLeft, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mockDepartments } from '@/data/mockData';
import { User, UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'IT_STAFF', label: 'IT Staff' },
  { value: 'DEPARTMENT_INCHARGE', label: 'Department In-charge' },
];

// Mock users for validation (in real app, this would come from API)
const mockUsers: User[] = [
  { id: '1', name: 'John Administrator', email: 'admin@college.edu', role: 'SUPER_ADMIN', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '2', name: 'Sarah Tech', email: 'staff@college.edu', role: 'IT_STAFF', isActive: true, createdAt: '2024-01-15', updatedAt: '2024-01-15' },
];

export default function UserForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Role-based access control
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const canCreateEditUser = isAdmin;
  
  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!canCreateEditUser) {
      navigate('/users');
    }
  }, [canCreateEditUser, navigate]);

  // Find existing user if editing
  const existingUser = id ? mockUsers.find(u => u.id === id) : null;
  const isEditing = !!existingUser;

  const [formData, setFormData] = useState({
    name: existingUser?.name || '',
    email: existingUser?.email || '',
    role: existingUser?.role || 'IT_STAFF',
    departmentId: typeof existingUser?.departmentId === 'string' ? existingUser.departmentId : existingUser?.departmentId?.id || '',
    isActive: existingUser?.isActive ?? true,
  });

  // Check for single admin restriction
  const existingAdmins = mockUsers.filter(u => u.role === 'SUPER_ADMIN' && u.id !== id);
  const hasMaxAdmins = existingAdmins.length >= 1;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Check for duplicate email (exclude current user if editing)
    const emailExists = mockUsers.some(u => u.email === formData.email && u.id !== id);
    if (emailExists) {
      newErrors.email = 'Email address already exists';
    }

    if (!formData.role.trim()) newErrors.role = 'Role is required';

    // Single admin restriction
    if (formData.role === 'SUPER_ADMIN' && hasMaxAdmins && !isEditing) {
      newErrors.role = 'Only one Super Admin is allowed in the system';
    }

    // Department validation for department in-charge
    if (formData.role === 'DEPARTMENT_INCHARGE' && !formData.departmentId) {
      newErrors.departmentId = 'Department is required for Department In-charge role';
    }

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
      // In real implementation, this would be an API call
      const userData = {
        ...formData,
        id: existingUser?.id || `user-${Date.now()}`,
        createdAt: existingUser?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        departmentId: formData.role === 'DEPARTMENT_INCHARGE' ? formData.departmentId : undefined,
      };

      console.log(isEditing ? 'Updating user:' : 'Creating user:', userData);
      
      // Navigate back to users list
      navigate('/users');
    } catch (error) {
      console.error('Error saving user:', error);
      setErrors({ submit: 'Failed to save user. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Clear department when role changes from DEPARTMENT_INCHARGE
    if (name === 'role' && value !== 'DEPARTMENT_INCHARGE') {
      setFormData(prev => ({
        ...prev,
        departmentId: '',
      }));
    }
  };

  if (!canCreateEditUser) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Edit User' : 'Create New User'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? 'Update user information and permissions' : 'Add a new user to the system'}
          </p>
        </div>
      </div>

      {/* Single Admin Warning */}
      {hasMaxAdmins && !isEditing && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Note: Only one Super Admin is allowed. There is already a Super Admin in the system.
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the user's personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter full name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="user@college.edu"
                />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role & Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Role & Permissions</CardTitle>
            <CardDescription>Define user access level and department assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">User Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem 
                        key={role.value} 
                        value={role.value}
                        disabled={role.value === 'SUPER_ADMIN' && hasMaxAdmins && !isEditing}
                      >
                        {role.label}
                        {role.value === 'SUPER_ADMIN' && hasMaxAdmins && !isEditing && ' (Limit reached)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.role}
                  </p>
                )}
              </div>

              {formData.role === 'DEPARTMENT_INCHARGE' && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) => handleInputChange('departmentId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockDepartments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.departmentId && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.departmentId}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded border border-input"
              />
              <Label htmlFor="isActive">Active user (can login to system)</Label>
            </div>
          </CardContent>
        </Card>

        {/* Submit Errors */}
        {errors.submit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/users')}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}