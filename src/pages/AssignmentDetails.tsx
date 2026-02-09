import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { assignmentsApi } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  ClipboardList,
  Monitor,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Eye,
} from 'lucide-react';
import { Assignment, Device, Department, Location } from '@/types';

export default function AssignmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssignment = async () => {
      if (!id) return;
      try {
        const res = await assignmentsApi.getAssignmentById(id);
        setAssignment(res.data.data?.assignment || null);
      } catch (error) {
        console.error('Failed to load assignment:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAssignment();
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

  if (!assignment) {
    return (
      <div className="p-6 lg:p-8 animate-fade-in">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Assignment not found</p>
          <Button variant="outline" onClick={() => navigate('/assignments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>
        </div>
      </div>
    );
  }

  const device = typeof assignment.deviceId === 'object' ? (assignment.deviceId as Device) : null;
  const department = typeof assignment.departmentId === 'object' ? (assignment.departmentId as Department) : null;
  const location = typeof assignment.locationId === 'object' ? (assignment.locationId as Location) : null;

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assignments')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Assignment Details</h1>
                <p className="text-muted-foreground text-sm">Qty: {assignment.quantity ?? 1}</p>
              </div>
            </div>
          </div>
        </div>
        <StatusBadge status={assignment.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-5 w-5 text-primary" />
                Device Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {device ? (
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Device Name</p>
                      <p className="text-sm font-medium">{device.deviceName}</p>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Asset Tag</p>
                        <p className="text-sm font-mono">{device.assetTag}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Category</p>
                        <p className="text-sm">{device.category}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Current Status</p>
                        <StatusBadge status={device.status} />
                      </div>
                    </div>
                  </div>
                  <Link to={`/inventory/${device.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Device
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Device information not available</p>
              )}
            </CardContent>
          </Card>

          {/* Target Location */}
          {location && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Building</p>
                    <p className="text-sm font-medium">{location.building}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Floor</p>
                    <p className="text-sm font-medium">{location.floor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Room</p>
                    <p className="text-sm font-medium">{location.room}</p>
                  </div>
                  {location.rack && (
                    <div>
                      <p className="text-xs text-muted-foreground">Rack</p>
                      <p className="text-sm font-medium">{location.rack}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {assignment.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-muted/50 p-4 rounded-lg">{assignment.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Department */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              {department ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <Link to={`/departments/${department.id}`} className="text-sm font-medium text-primary hover:underline">
                      {department.name}
                    </Link>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Block</p>
                    <p className="text-sm font-medium">{department.block}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Department not found</p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Assigned</p>
                  <p className="text-sm font-medium">
                    {new Date(assignment.assignedAt || assignment.createdAt).toLocaleString()}
                  </p>
                </div>
                {assignment.returnedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Returned</p>
                    <p className="text-sm font-medium">{new Date(assignment.returnedAt).toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">{new Date(assignment.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
