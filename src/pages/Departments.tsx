import { Link } from 'react-router-dom';
import { departmentsApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Department } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Users, Mail, Phone, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useConfirm } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set());
  const confirm = useConfirm();

  const fetchDepartments = async () => {
    try {
      const res = await departmentsApi.getDepartments({ limit: 100 });
      setDepartments(res.data.data?.departments || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete Department', description: 'This will permanently remove the department and its configuration. Devices and locations assigned to this department may also be affected. This action cannot be undone.', confirmText: 'Yes, Delete', variant: 'destructive' });
    if (!ok) return;
    try {
      await departmentsApi.deleteDepartment(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
      setSelectedDepts(prev => { const next = new Set(prev); next.delete(id); return next; });
      toast.success('Department deleted successfully.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete department. It may have devices or locations assigned.');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedDepts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedDepts.size === departments.length) {
      setSelectedDepts(new Set());
    } else {
      setSelectedDepts(new Set(departments.map(d => d.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDepts.size === 0) return;
    const ok = await confirm({ title: 'Bulk Delete Departments', description: `You are about to permanently delete ${selectedDepts.size} department(s). All their associated data may also be affected. This action cannot be undone.`, confirmText: 'Yes, Delete All', variant: 'destructive' });
    if (!ok) return;
    let successCount = 0;
    let failCount = 0;
    for (const id of selectedDepts) {
      try {
        await departmentsApi.deleteDepartment(id);
        successCount++;
      } catch {
        failCount++;
      }
    }
    await fetchDepartments();
    setSelectedDepts(new Set());
    if (failCount === 0) {
      toast.success(`${successCount} department(s) deleted successfully.`);
    } else {
      toast.error(`${successCount} deleted, ${failCount} failed (may have devices or locations).`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="shimmer h-7 w-36" />
            <div className="shimmer h-4 w-60" />
          </div>
          <div className="shimmer h-10 w-36 rounded-md" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-56 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Departments</h1>
          <p className="text-muted-foreground mt-1">Manage departments and HOD details</p>
        </div>
        <Link to="/departments/new">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground btn-press">
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </Link>
      </div>

      {departments.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-1">No departments yet</p>
          <p className="text-sm text-muted-foreground/80 mb-6">Create your first department to get started</p>
          <Link to="/departments/new">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {selectedDepts.size > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 animate-slide-down">
              <Checkbox
                checked={selectedDepts.size === departments.length && departments.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">{selectedDepts.size} selected</span>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10 btn-press ml-auto"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete Selected
              </Button>
            </div>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {departments.map((dept) => (
            <Card key={dept.id} className={`hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 ${selectedDepts.has(dept.id) ? 'ring-2 ring-primary/40 bg-primary/5' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedDepts.has(dept.id)}
                      onCheckedChange={() => toggleSelect(dept.id)}
                    />
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
        </>
      )}
    </div>
  );
}
