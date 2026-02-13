import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { ConfirmDialogProvider } from "@/components/ConfirmDialog";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import DeviceDetails from "./pages/DeviceDetails";
import DevicePreview from "./pages/DevicePreview";
import DeviceForm from "./pages/DeviceForm";
import Departments from "./pages/Departments";
import DepartmentDetails from "./pages/DepartmentDetails";
import DepartmentForm from "./pages/DepartmentForm";
import AuditLogs from "./pages/AuditLogs";
import AuditLogDetails from "./pages/AuditLogDetails";
import Assignments from "./pages/Assignments";
import AssignmentDetails from "./pages/AssignmentDetails";
import AssignmentForm from "./pages/AssignmentForm";
import Profile from './pages/Profile';
import Scrapped from './pages/Scrapped';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ConfirmDialogProvider>
          <Sonner position="top-right" richColors closeButton duration={4000} />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
                <Route path="/inventory/new" element={<DeviceForm />} />
                <Route path="/inventory/:id/preview" element={<DevicePreview />} />
                <Route path="/inventory/:id" element={<DeviceDetails />} />
                <Route path="/inventory/:id/edit" element={<DeviceForm />} />
                <Route path="/departments" element={<Departments />} />
                <Route path="/departments/new" element={<DepartmentForm />} />
                <Route path="/departments/:id" element={<DepartmentDetails />} />
                <Route path="/departments/:id/edit" element={<DepartmentForm />} />
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/assignments/new" element={<AssignmentForm />} />
                <Route path="/assignments/:id" element={<AssignmentDetails />} />
                <Route path="/assignments/:id/edit" element={<AssignmentForm />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/audit-logs/:id" element={<AuditLogDetails />} />
                <Route path="/scrapped" element={<Scrapped />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ConfirmDialogProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
