import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { devicesApi, assignmentsApi, usersApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Device, Assignment, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Package, AlertCircle, Clock, CheckCircle, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ManagerDashboard() {
  const { user } = useAuth();

  const managerDevices = useMemo(() => {
    return mockDevices.filter(d => d.managerId === user?.id);
  }, [user?.id]);

  const managerAssignments = useMemo(() => {
    return mockAssignments.filter(a => {
      const device = mockDevices.find(d => d.id === a.deviceId);
      return device?.managerId === user?.id;
    });
  }, [user?.id]);

  const stats = {
    totalDevices: managerDevices.length,
    installedDevices: managerDevices.filter(d => d.status === 'INSTALLED').length,
    maintenanceDevices: managerDevices.filter(d => d.status === 'MAINTENANCE').length,
    pendingAssignments: managerAssignments.filter(a => a.status === 'PENDING').length,
    approvedAssignments: managerAssignments.filter(a => a.status === 'APPROVED').length,
    totalValue: managerDevices.reduce((sum, d) => sum + (d.cost * d.quantity), 0),
  };

  const recentAssignments = managerAssignments.slice(0, 5);

  const getDeviceName = (id: string) => {
    return mockDevices.find(d => d.id === id)?.deviceName || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.name}!</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.totalDevices}</p>
                <p className="text-xs text-muted-foreground">Devices Under Management</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-600">${(stats.totalValue / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground">Total Asset Value</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-100">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingAssignments}</p>
                <p className="text-xs text-muted-foreground">Pending Approvals</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.installedDevices}</p>
                <p className="text-xs text-muted-foreground">Installed Devices</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-100">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.maintenanceDevices}</p>
                <p className="text-xs text-muted-foreground">In Maintenance</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-100">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.approvedAssignments}</p>
                <p className="text-xs text-muted-foreground">Approved Assignments</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Device Status Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Managed Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {managerDevices.length > 0 ? (
              <div className="space-y-3">
                {managerDevices.map(device => (
                  <div key={device.id} className="p-3 border rounded-lg hover:bg-muted/50 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{device.deviceName}</p>
                        <p className="text-xs text-muted-foreground">{device.assetTag}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {device.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Qty: {device.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No devices assigned to you
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/device-management">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Manage Devices
              </Button>
            </Link>
            <Link to="/assignment-management">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Review Assignments
              </Button>
            </Link>
            <Link to="/inventory/new">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assignments */}
      {recentAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Assignments
              </CardTitle>
              <Link to="/assignment-management">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 font-semibold">Device</th>
                    <th className="text-left py-2 font-semibold">Status</th>
                    <th className="text-left py-2 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssignments.map(assignment => (
                    <tr key={assignment.id} className="border-t hover:bg-muted/50">
                      <td className="py-3">{getDeviceName(assignment.deviceId)}</td>
                      <td className="py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(assignment.status)}`}>
                          {assignment.status}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(assignment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
