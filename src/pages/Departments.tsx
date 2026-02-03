import { Link } from 'react-router-dom';
import { departmentsApi, devicesApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Department, Device } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Users, Monitor, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Departments() {
  const { user } = useAuth();
  const canEdit = user?.role === 'SUPER_ADMIN';

  const getDepartmentDeviceCount = (deptId: string) => {
    return mockDevices.filter(d => d.departmentId === deptId).length;
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Departments</h1>
          <p className="text-muted-foreground mt-1">Manage departments and their device allocations</p>
        </div>
        {canEdit && (
          <Link to="/departments/new">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </Link>
        )}
      </div>

      {/* Department Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockDepartments.map((dept) => (
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
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">HOD:</span>
                <span className="font-medium">{dept.hodName}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{dept.contactEmail}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Devices:</span>
                <span className="font-medium">{getDepartmentDeviceCount(dept.id)}</span>
              </div>
              <div className="pt-3 border-t border-border">
                <Link to={`/departments/${dept.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
