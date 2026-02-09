import { Link } from 'react-router-dom';
import { assignmentsApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Assignment, Department, Device } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

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
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await assignmentsApi.deleteAssignment(id);
      setAssignments(prev => prev.filter(a => a.id !== id));
      setAlertMessage({ type: 'success', text: 'Assignment deleted successfully.' });
      setTimeout(() => setAlertMessage(null), 4000);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to delete assignment.';
      setAlertMessage({ type: 'error', text: msg });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setAlertMessage(null), 6000);
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
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
          <p className="text-muted-foreground mt-1">Manage device assignments to departments</p>
        </div>
        <Link to="/assignments/new">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="h-4 w-4 mr-2" />
            New Assignment
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

      {/* Assignments Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Device</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Qty</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Department</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Assigned</th>
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
                        <td className="px-6 py-4">
                          <StatusBadge status={assignment.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(assignment.assignedAt || assignment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link to={`/assignments/${assignment.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
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
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No assignments found</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
