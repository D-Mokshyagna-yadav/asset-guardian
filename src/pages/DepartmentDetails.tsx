import { useParams, Link, useNavigate } from 'react-router-dom';
import { mockDepartments, mockDevices, mockLocations, mockAssignments } from '@/data/mockData';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Edit,
  Building2,
  Users,
  Mail,
  Monitor,
  MapPin,
  Calendar,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function DepartmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const department = mockDepartments.find(d => d.id === id);
  const departmentDevices = mockDevices.filter(d => d.departmentId === id);
  const departmentAssignments = mockAssignments.filter(a => a.departmentId === id);

  const canEdit = user?.role === 'SUPER_ADMIN';

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

  const getLocationName = (locId: string) => {
    const loc = mockLocations.find(l => l.id === locId);
    return loc ? `${loc.building}, ${loc.room}` : '—';
  };

  const devicesByStatus = {
    installed: departmentDevices.filter(d => d.status === 'INSTALLED').length,
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
        {canEdit && (
          <Link to={`/departments/${id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Department
            </Button>
          </Link>
        )}
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
                <p className="text-2xl font-bold">{devicesByStatus.installed}</p>
                <p className="text-xs text-muted-foreground">Installed</p>
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
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Location</th>
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
                          <td className="px-4 py-3 text-sm text-muted-foreground">{getLocationName(device.locationId || '')}</td>
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

          {/* Device Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Devices by Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {departmentDevices.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const devicesByLocation = departmentDevices.reduce((acc, device) => {
                      const locId = device.locationId || 'unassigned';
                      if (!acc[locId]) {
                        acc[locId] = [];
                      }
                      acc[locId].push(device);
                      return acc;
                    }, {} as Record<string, typeof departmentDevices>);

                    return Object.entries(devicesByLocation).map(([locId, devices]) => (
                      <div key={locId} className="p-4 rounded-lg border border-border bg-muted/30">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {getLocationName(locId === 'unassigned' ? '' : locId)}
                        </h4>
                        <div className="space-y-2">
                          {devices.map(device => (
                            <div key={device.id} className="flex items-center justify-between p-2 rounded bg-background text-xs">
                              <div>
                                <p className="font-medium">{device.deviceName}</p>
                                <p className="text-muted-foreground">{device.assetTag}</p>
                              </div>
                              <StatusBadge status={device.status} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No device locations assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Recent Assignments ({departmentAssignments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {departmentAssignments.length > 0 ? (
                <div className="space-y-3">
                  {departmentAssignments.map((assignment) => {
                    const device = mockDevices.find(d => d.id === assignment.deviceId);
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{device?.deviceName || 'Unknown Device'}</p>
                          <p className="text-xs text-muted-foreground">{getLocationName(assignment.locationId)}</p>
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
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Head of Department</p>
                  <p className="text-sm font-medium">{department.hodName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
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
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Block</p>
                <p className="text-sm font-medium">{department.block}</p>
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
