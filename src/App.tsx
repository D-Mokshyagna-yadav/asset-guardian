import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import DeviceDetails from "./pages/DeviceDetails";
import DevicePreview from "./pages/DevicePreview";
import DeviceForm from "./pages/DeviceForm";
import DeviceManagement from "./pages/DeviceManagement";
import Departments from "./pages/Departments";
import DepartmentDetails from "./pages/DepartmentDetails";
import DepartmentForm from "./pages/DepartmentForm";
import Users from "./pages/Users";
import UserDetails from "./pages/UserDetails";
import UserForm from "./pages/UserForm";
import AuditLogs from "./pages/AuditLogs";
import AuditLogDetails from "./pages/AuditLogDetails";
import Assignments from "./pages/Assignments";
import AssignmentDetails from "./pages/AssignmentDetails";
import AssignmentForm from "./pages/AssignmentForm";
import AssignmentManagement from "./pages/AssignmentManagement";
import AssignmentStatusUpdate from "./pages/AssignmentStatusUpdate";
import RequestDevice from "./pages/RequestDevice";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route
                path="/inventory/new"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <DeviceForm />
                  </ProtectedRoute>
                }
              />
              <Route path="/inventory/:id/preview" element={<DevicePreview />} />
              <Route path="/inventory/:id" element={<DeviceDetails />} />
              <Route
                path="/inventory/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <DeviceForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/device-management"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <DeviceManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/departments"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_STAFF', 'DEPARTMENT_INCHARGE']}>
                    <Departments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/departments/new"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_STAFF']}>
                    <DepartmentForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/departments/:id"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_STAFF', 'DEPARTMENT_INCHARGE']}>
                    <DepartmentDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/departments/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_STAFF']}>
                    <DepartmentForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assignments"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_STAFF', 'DEPARTMENT_INCHARGE']}>
                    <Assignments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assignment-management"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <AssignmentManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assignments/new"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_STAFF']}>
                    <AssignmentForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/request-device"
                element={
                  <ProtectedRoute allowedRoles={['IT_STAFF', 'DEPARTMENT_INCHARGE']}>
                    <RequestDevice />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assignment-status"
                element={
                  <ProtectedRoute allowedRoles={['IT_STAFF']}>
                    <AssignmentStatusUpdate />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assignments/:id"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_STAFF', 'DEPARTMENT_INCHARGE']}>
                    <AssignmentDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assignments/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_STAFF']}>
                    <AssignmentForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/new"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <UserForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/:id"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <UserDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <UserForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_STAFF']}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit-logs/:id"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_STAFF']}>
                    <AuditLogDetails />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
