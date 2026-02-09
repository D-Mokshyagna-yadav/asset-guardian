import { useParams, Link, useNavigate } from 'react-router-dom';
import { departmentsApi, devicesApi, assignmentsApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Department, Device, Assignment, Location } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Edit,
  Building2,
  Users,
  Mail,
  Phone,
  Monitor,
  MapPin,
  Calendar,
  Eye,
} from 'lucide-react';

export default function DepartmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [department, setDepartment] = useState<Department | null>(null);
  const [departmentDevices, setDepartmentDevices] = useState<Device[]>([]);
  const [departmentAssignments, setDepartmentAssignments] = useState<Assignment[]>([]);
  const [departmentLocations, setDepartmentLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const [deptRes, devicesRes, assignRes] = await Promise.all([
          departmentsApi.getDepartmentById(id),
          devicesApi.getDevices({ departmentId: id, limit: 100 }),
          assignmentsApi.getAssignments({ departmentId: id, limit: 100 }),
        ]);
        setDepartment(deptRes.data.data?.department || null);
        setDepartmentLocations(deptRes.data.data?.locations || []);
        setDepartmentDevices(devicesRes.data.data?.devices || []);
        setDepartmentAssignments(assignRes.data.data || []);
      } catch (error) {
        console.error('Failed to load department details:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 animate-fade-in">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="p-6 lg:p-8 animate-fade-in">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Department not found</p>
          <Button variant="outline" onClick={() => navigate('/departments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Departments
          </Button>
        </div>
      </div>
    );
  }

  const devicesByStatus = {
    assigned: departmentDevices.filter(d => d.status === 'ASSIGNED').length,
    inStock: departmentDevices.filter(d => d.status === 'IN_STOCK').length,
    maintenance: departmentDevices.filter(d => d.status === 'MAINTENANCE').length,
  };

  const totalValue = departmentDevices.reduce((sum, d) => sum + d.cost, 0);

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/departments')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{department.name}</h1>
                <p className="text-muted-foreground">{department.block}</p>
              </div>
            </div>
          </div>
        </div>
        <Link to={`/departments/${id}/edit`}>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Department
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Monitor className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{departmentDevices.length}</p>
                <p className="text-xs text-muted-foreground">Total Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Monitor className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{devicesByStatus.assigned}</p>
                <p className="text-xs text-muted-foreground">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Monitor className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{devicesByStatus.maintenance}</p>
                <p className="text-xs text-muted-foreground">In Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Monitor className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">${totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Devices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-5 w-5 text-primary" />
                Assigned Devices ({departmentDevices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {departmentDevices.length > 0 ? (
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
                      {departmentDevices.map((device) => (
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
                <p className="text-sm text-muted-foreground text-center py-8">No devices assigned to this department</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Assignments ({departmentAssignments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {departmentAssignments.length > 0 ? (
                <div className="space-y-3">
                  {departmentAssignments.map((assignment) => {
                    const deviceObj = typeof assignment.deviceId === 'object' ? assignment.deviceId : null;
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{deviceObj?.deviceName || 'Device'}</p>
                          <p className="text-xs text-muted-foreground">Qty: {assignment.quantity}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={assignment.status} />
                          <Link to={`/assignments/${assignment.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No assignments for this department</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* HOD & Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                HOD & Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Head of Department</p>
                  <p className="text-sm font-medium">{department.hodName}</p>
                </div>
                {department.hodPhone && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">HOD Phone</p>
                    <a href={`tel:${department.hodPhone}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {department.hodPhone}
                    </a>
                  </div>
                )}
                {department.hodEmail && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">HOD Email</p>
                    <a href={`mailto:${department.hodEmail}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {department.hodEmail}
                    </a>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Department Email</p>
                  <a href={`mailto:${department.contactEmail}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {department.contactEmail}
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Locations ({departmentLocations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Block</p>
                  <p className="text-sm font-medium">{department.block}</p>
                </div>
                {departmentLocations.length > 0 ? (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Assigned Locations</p>
                    {departmentLocations.map((loc) => (
                      <div key={loc.id || (loc as any)._id} className="p-2 rounded bg-muted/50 text-sm">
                        <p className="font-medium">{loc.building} - {loc.floor} - {loc.room}</p>
                        {loc.rack && <p className="text-xs text-muted-foreground">Rack: {loc.rack}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground pt-2 border-t">No locations assigned</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Created */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{new Date(department.createdAt).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
