import { useParams, Link, useNavigate } from 'react-router-dom';
import { auditLogsApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { AuditLog } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Globe,
  ArrowRight,
  Monitor,
  Building2,
  ClipboardList,
} from 'lucide-react';

const getActionColor = (action: string) => {
  switch (action) {
    case 'CREATE':
      return 'bg-emerald-100 text-emerald-800';
    case 'UPDATE':
    case 'STATUS_CHANGE':
      return 'bg-blue-100 text-blue-800';
    case 'DELETE':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case 'Device':
      return Monitor;
    case 'Department':
      return Building2;
    case 'Assignment':
      return ClipboardList;
    default:
      return FileText;
  }
};

const getEntityLink = (entityType: string, entityId: string) => {
  switch (entityType) {
    case 'Device':
      return `/inventory/${entityId}`;
    case 'Department':
      return `/departments/${entityId}`;
    case 'Assignment':
      return `/assignments/${entityId}`;
    case 'User':
      return null;
    default:
      return null;
  }
};

export default function AuditLogDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchLog = async () => {
      try {
        const res = await auditLogsApi.getAuditLogById(id);
        setLog(res.data.data || null);
      } catch {
        setLog(null);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [id]);

  if (loading) {
    return <div className="p-6 lg:p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!log) {
    return (
      <div className="p-6 lg:p-8 animate-fade-in">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Audit log not found</p>
          <Button variant="outline" onClick={() => navigate('/audit-logs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Audit Logs
          </Button>
        </div>
      </div>
    );
  }

  const EntityIcon = getEntityIcon(log.entityType);
  const entityLink = getEntityLink(log.entityType, log.entityId);

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/audit-logs')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Audit Log Details</h1>
                <p className="text-muted-foreground font-mono text-sm">{log.id}</p>
              </div>
            </div>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getActionColor(log.action)}`}>
          {log.action.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Action Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base">
                <span className="font-medium">Admin</span>
                <span className="text-muted-foreground"> performed </span>
                <span className={`px-2 py-0.5 rounded text-sm font-medium ${getActionColor(log.action)}`}>
                  {log.action.replace(/_/g, ' ')}
                </span>
                <span className="text-muted-foreground"> on </span>
                <span className="font-medium">{log.entityType}</span>
              </p>
            </CardContent>
          </Card>

          {/* Data Changes */}
          {(log.oldData || log.newData) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  Data Changes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Old Data */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Previous Values</p>
                    {log.oldData ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <pre className="text-sm text-red-800 whitespace-pre-wrap font-mono">
                          {JSON.stringify(log.oldData, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground">No previous data (new record)</p>
                      </div>
                    )}
                  </div>

                  {/* New Data */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">New Values</p>
                    {log.newData ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <pre className="text-sm text-emerald-800 whitespace-pre-wrap font-mono">
                          {JSON.stringify(log.newData, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground">No new data (deleted)</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Entity Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <EntityIcon className="h-5 w-5 text-primary" />
                Related Entity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium">{log.entityType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="text-sm font-mono">{log.entityId}</p>
                </div>
                {entityLink && (
                  <Link to={entityLink}>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      View {log.entityType}
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performed By */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Performed By
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Admin</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timestamp */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Timestamp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {new Date(log.timestamp).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(log.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* IP Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-primary" />
                Source IP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-mono">{log.ipAddress}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
