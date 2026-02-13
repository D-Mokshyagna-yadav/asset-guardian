import { Link } from 'react-router-dom';
import { assignmentsApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Assignment, Department, Device } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Trash2, ClipboardList, Undo2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useConfirm } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());
  const confirm = useConfirm();

  const loadAssignments = async () => {
    try {
      const res = await assignmentsApi.getAssignments({ limit: 100 });
      setAssignments(res.data.data || []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAssignments(); }, []);

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete Assignment', description: 'This will permanently remove this assignment record. The device will not be automatically returned to stock. This action cannot be undone.', confirmText: 'Yes, Delete', variant: 'destructive' });
    if (!ok) return;
    try {
      await assignmentsApi.deleteAssignment(id);
      setAssignments(prev => prev.filter(a => a.id !== id));
      setSelectedAssignments(prev => { const next = new Set(prev); next.delete(id); return next; });
      toast.success('Assignment deleted.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete assignment.');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedAssignments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedAssignments.size === assignments.length) {
      setSelectedAssignments(new Set());
    } else {
      setSelectedAssignments(new Set(assignments.map(a => a.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAssignments.size === 0) return;
    const ok = await confirm({ title: 'Bulk Delete Assignments', description: `You are about to permanently delete ${selectedAssignments.size} assignment(s). This action cannot be undone.`, confirmText: 'Yes, Delete All', variant: 'destructive' });
    if (!ok) return;
    let successCount = 0;
    let failCount = 0;
    for (const id of selectedAssignments) {
      try {
        await assignmentsApi.deleteAssignment(id);
        successCount++;
      } catch {
        failCount++;
      }
    }
    await loadAssignments();
    setSelectedAssignments(new Set());
    if (failCount === 0) {
      toast.success(`${successCount} assignment(s) deleted successfully.`);
    } else {
      toast.error(`${successCount} deleted, ${failCount} failed.`);
    }
  };

  const handleUnassign = async (id: string) => {
    const ok = await confirm({ title: 'Unassign Device', description: 'This will mark this assignment as returned. The device will be moved back to stock and become available for new assignments.', confirmText: 'Yes, Unassign', variant: 'warning' });
    if (!ok) return;
    try {
      await assignmentsApi.unassignDevice(id);
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: 'RETURNED' as const, returnedAt: new Date().toISOString() } : a));
      toast.success('Device unassigned successfully. It has been returned to stock.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to unassign device.');
    }
  };

  const getDeviceName = (deviceId: string | Device) => {
    if (typeof deviceId === 'object' && deviceId) return deviceId.deviceName;
    return 'Device';
  };

  const getDepartmentName = (deptId: string | Department) => {
    if (typeof deptId === 'object' && deptId) return deptId.name;
    return '—';
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
          <p className="text-muted-foreground mt-1">Manage device assignments to departments</p>
        </div>
        <Link to="/assignments/new">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground btn-press">
            <Plus className="h-4 w-4 mr-2" />
            New Assignment
          </Button>
        </Link>
      </div>

      {/* Bulk Action Bar */}
      {selectedAssignments.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 animate-slide-down">
          <Checkbox
            checked={selectedAssignments.size === assignments.length && assignments.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm font-medium">{selectedAssignments.size} selected</span>
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

      {/* Assignments Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shimmer h-14 w-full" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left text-xs font-medium text-muted-foreground px-3 py-4 w-10">
                        <Checkbox
                          checked={selectedAssignments.size === assignments.length && assignments.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Device</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Qty</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Department</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Assigned</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border stagger-rows">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id} className={`table-row-hover ${selectedAssignments.has(assignment.id) ? 'bg-primary/5' : ''}`}>
                        <td className="px-3 py-4">
                          <Checkbox
                            checked={selectedAssignments.has(assignment.id)}
                            onCheckedChange={() => toggleSelect(assignment.id)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-foreground">{getDeviceName(assignment.deviceId)}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{assignment.quantity ?? 1}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {getDepartmentName(assignment.departmentId)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={assignment.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(assignment.assignedAt || assignment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Link to={`/assignments/${assignment.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:scale-110 transition-transform">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {assignment.status === 'ACTIVE' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 hover:scale-110 transition-transform"
                                onClick={() => handleUnassign(assignment.id)}
                                title="Unassign device"
                              >
                                <Undo2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:scale-110 transition-transform"
                              onClick={() => handleDelete(assignment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {assignments.length === 0 && (
                <div className="text-center py-16 animate-empty">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4 animate-float" />
                  <p className="text-lg font-medium text-muted-foreground mb-1">No assignments yet</p>
                  <p className="text-sm text-muted-foreground/80">Create your first device assignment to get started</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
