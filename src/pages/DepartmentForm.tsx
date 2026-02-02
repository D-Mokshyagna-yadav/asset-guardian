import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mockDepartments } from '@/data/mockData';
import { Department } from '@/types';

export default function DepartmentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Find existing department if editing
  const existingDept = id ? mockDepartments.find(d => d.id === id) : null;

  const [formData, setFormData] = useState({
    name: existingDept?.name || '',
    block: existingDept?.block || '',
    hodName: existingDept?.hodName || '',
    contactEmail: existingDept?.contactEmail || '',
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    }
    if (!formData.block.trim()) {
      newErrors.block = 'Block/Building is required';
    }
    if (!formData.hodName.trim()) {
      newErrors.hodName = 'HOD name is required';
    }
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!formData.contactEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.contactEmail = 'Please enter a valid email address';
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
      // TODO: Replace with actual API call
      const newDepartment: Department = {
        id: id || `dept-${Date.now()}`,
        ...formData,
        createdAt: existingDept?.createdAt || new Date().toISOString().split('T')[0],
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Department saved:', newDepartment);
      navigate('/departments');
    } catch (error) {
      setErrors({ submit: 'Failed to save department. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/departments')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Departments
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{id ? 'Edit Department' : 'Add New Department'}</CardTitle>
            <CardDescription>
              {id ? 'Update department information' : 'Create a new department'}
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
                <Label htmlFor="name">Department Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="block">Block/Building *</Label>
                <Input
                  id="block"
                  name="block"
                  value={formData.block}
                  onChange={handleChange}
                  placeholder="e.g., Block A"
                  className={errors.block ? 'border-red-500' : ''}
                />
                {errors.block && (
                  <p className="text-sm text-red-500">{errors.block}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hodName">Head of Department (HOD) Name *</Label>
                <Input
                  id="hodName"
                  name="hodName"
                  value={formData.hodName}
                  onChange={handleChange}
                  placeholder="e.g., Dr. John Smith"
                  className={errors.hodName ? 'border-red-500' : ''}
                />
                {errors.hodName && (
                  <p className="text-sm text-red-500">{errors.hodName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="e.g., cs@college.edu"
                  className={errors.contactEmail ? 'border-red-500' : ''}
                />
                {errors.contactEmail && (
                  <p className="text-sm text-red-500">{errors.contactEmail}</p>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : id ? 'Update Department' : 'Create Department'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/departments')}
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
