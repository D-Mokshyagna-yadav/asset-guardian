import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auditLogsApi } from '@/lib/api';
import { AuditLog } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, FileText, Download, Eye } from 'lucide-react';

const actionTypes = ['All', 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'];
const entityTypes = ['All', 'Device', 'Assignment', 'Department'];

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [entityFilter, setEntityFilter] = useState('All');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const params: Record<string, string> = {};
        if (actionFilter !== 'All') params.action = actionFilter;
        if (entityFilter !== 'All') params.entityType = entityFilter;
        const res = await auditLogsApi.getAuditLogs({ ...params, limit: 200 } as any);
        setLogs(res.data.data?.auditLogs || []);
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.performedBy || '').toString().toLowerCase().includes(q) ||
      log.entityId.toLowerCase().includes(q)
    );
  });

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

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Complete history of all system changes</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user or entity ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action === 'All' ? 'All Actions' : action.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  {entityTypes.map((entity) => (
                    <SelectItem key={entity} value={entity}>
                      {entity === 'All' ? 'All Entities' : entity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading audit logs...</div>
      ) : (
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-6 table-row-hover">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-muted-foreground">{log.entityType}</span>
                      </div>
                      <p className="text-sm text-foreground">
                        <span className="font-medium">Admin</span>
                        {' '}performed {log.action.toLowerCase().replace(/_/g, ' ')} on{' '}
                        <span className="font-mono text-xs bg-muted px-1 rounded">{log.entityId}</span>
                      </p>
                      {(log.oldData || log.newData) && (
                        <div className="mt-2 p-3 rounded-lg bg-muted/50 text-xs font-mono">
                          {log.oldData && (
                            <div className="text-red-600">- {JSON.stringify(log.oldData)}</div>
                          )}
                          {log.newData && (
                            <div className="text-green-600">+ {JSON.stringify(log.newData)}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="text-right shrink-0">
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {log.ipAddress}
                      </p>
                    </div>
                    <Link to={`/audit-logs/${log.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No audit logs found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
