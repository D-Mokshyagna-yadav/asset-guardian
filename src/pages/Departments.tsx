import { Link } from 'react-router-dom';
import { departmentsApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Department } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Users, Mail, Phone, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const fetchDepartments = async () => {
    try {
      const res = await departmentsApi.getDepartments({ limit: 100 });
      const data = res.data?.data;
      setDepartments(Array.isArray(data) ? data : (data as any)?.departments || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await departmentsApi.deleteDepartment(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
      setAlertMessage({ type: 'success', text: 'Department deleted successfully.' });
      setTimeout(() => setAlertMessage(null), 4000);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to delete department. It may have devices or locations assigned.';
      setAlertMessage({ type: 'error', text: msg });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setAlertMessage(null), 6000);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Departments</h1>
          <p className="text-muted-foreground mt-1">Manage departments and HOD details</p>
        </div>
        <Link to="/departments/new">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </Link>
      </div>

      {/* Alert Messages */}
      {alertMessage && (
        <Alert variant={alertMessage.type === 'error' ? 'destructive' : 'default'} className={`mb-6 ${alertMessage.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : ''}`}>
          {alertMessage.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
          <AlertDescription>{alertMessage.text}</AlertDescription>
        </Alert>
      )}

      {departments.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No departments yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Card key={dept.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{dept.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{dept.block}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(dept.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">HOD:</span>
                  <span className="font-medium">{dept.hodName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{dept.hodPhone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{dept.hodEmail}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Dept Email:</span>
                  <span className="truncate">{dept.contactEmail}</span>
                </div>
                <div className="pt-3 border-t border-border flex gap-2">
                  <Link to={`/departments/${dept.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">View Details</Button>
                  </Link>
                  <Link to={`/departments/${dept.id}/edit`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
