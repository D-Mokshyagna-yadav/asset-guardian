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
import Departments from "./pages/Departments";
import DepartmentDetails from "./pages/DepartmentDetails";
import Users from "./pages/Users";
import UserDetails from "./pages/UserDetails";
import AuditLogs from "./pages/AuditLogs";
import AuditLogDetails from "./pages/AuditLogDetails";
import Assignments from "./pages/Assignments";
import AssignmentDetails from "./pages/AssignmentDetails";
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
              <Route path="/inventory/:id" element={<DeviceDetails />} />
              <Route
                path="/departments"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_STAFF']}>
                    <Departments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/departments/:id"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_STAFF']}>
                    <DepartmentDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assignments"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_STAFF']}>
                    <Assignments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assignments/:id"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_STAFF']}>
                    <AssignmentDetails />
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
                path="/users/:id"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <UserDetails />
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
