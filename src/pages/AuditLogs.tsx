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
import { Search, Filter, FileText, Download, Eye, Trash2, AlertTriangle } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

const actionTypes = ['All', 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'];
const entityTypes = ['All', 'Device', 'Assignment', 'Department'];

// Human-readable field labels
const fieldLabels: Record<string, string> = {
  deviceName: 'Device Name',
  assetTag: 'Asset Tag',
  deviceModel: 'Model',
  serialNumber: 'Serial Number',
  macAddress: 'MAC Address',
  ipAddress: 'IP Address',
  purchaseDate: 'Purchase Date',
  arrivalDate: 'Arrival Date',
  warrantyStart: 'Warranty Start',
  warrantyEnd: 'Warranty End',
  billDate: 'Bill Date',
  billAmount: 'Bill Amount',
  invoiceNumber: 'Invoice Number',
  departmentId: 'Department',
  locationId: 'Location',
  createdBy: 'Created By',
  createdAt: 'Created At',
  updatedAt: 'Updated At',
  hodName: 'HOD Name',
  hodEmail: 'HOD Email',
  hodPhone: 'HOD Phone',
  contactEmail: 'Contact Email',
  status: 'Status',
  quantity: 'Quantity',
  cost: 'Cost',
  brand: 'Brand',
  category: 'Category',
  vendor: 'Vendor',
  notes: 'Notes',
  features: 'Features',
  name: 'Name',
  block: 'Block',
  building: 'Building',
  floor: 'Floor',
  room: 'Room',
  rack: 'Rack',
};

const formatFieldName = (key: string) => fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ') || '—';
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    // Handle populated refs like { name: "CS", id: "..." }
    if (obj.name) return String(obj.name);
    if (obj.deviceName) return String(obj.deviceName);
    if (obj.building) return `${obj.building}, ${obj.floor || ''}, ${obj.room || ''}`.replace(/, ,/g, ',').replace(/,$/, '');
    return Object.values(obj).filter(v => v && typeof v !== 'object').join(', ') || '—';
  }
  const str = String(value);
  // Format ISO dates to readable
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    return new Date(str).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return str;
};

const summarizeChanges = (oldData?: Record<string, unknown>, newData?: Record<string, unknown>): string => {
  if (!oldData && newData) {
    // CREATE — just show key fields
    const parts: string[] = [];
    if (newData.deviceName) parts.push(`"${newData.deviceName}"`);
    else if (newData.name) parts.push(`"${newData.name}"`);
    if (newData.assetTag) parts.push(`(${newData.assetTag})`);
    if (newData.status) parts.push(`Status: ${String(newData.status).replace(/_/g, ' ')}`);
    return parts.length > 0 ? parts.join(' ') : 'New record created';
  }
  if (oldData && !newData) {
    return 'Record deleted';
  }
  if (oldData && newData) {
    // UPDATE — show changed fields
    const changes: string[] = [];
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    for (const key of allKeys) {
      if (['_id', 'id', '__v', 'createdAt', 'updatedAt', 'createdBy'].includes(key)) continue;
      const oldVal = formatValue(oldData[key]);
      const newVal = formatValue(newData[key]);
      if (oldVal !== newVal) {
        changes.push(`${formatFieldName(key)}: ${oldVal} → ${newVal}`);
      }
    }
    return changes.length > 0 ? changes.slice(0, 3).join(', ') + (changes.length > 3 ? ` (+${changes.length - 3} more)` : '') : 'No changes detected';
  }
  return '';
};

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [entityFilter, setEntityFilter] = useState('All');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  useEffect(() => {
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

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (actionFilter !== 'All') params.action = actionFilter;
      if (entityFilter !== 'All') params.entityType = entityFilter;
      const res = await auditLogsApi.getAuditLogs({ ...params, limit: 200 });
      setLogs(res.data.data?.auditLogs || []);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    const ok = await confirm({
      title: 'Delete Audit Log',
      description: 'Permanently delete this audit log entry? This cannot be undone.',
      confirmText: 'Delete',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await auditLogsApi.deleteAuditLog(logId);
      setLogs((prev) => prev.filter((l) => l.id !== logId));
      toast.success('Audit log deleted');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete audit log');
    }
  };

  const handleCleanupOldLogs = async () => {
    const ok = await confirm({
      title: 'Cleanup Old Logs',
      description: 'This will permanently delete all audit logs older than 90 days. This action cannot be undone.',
      confirmText: 'Yes, Clean Up',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      const res = await auditLogsApi.deleteOldAuditLogs(90);
      const count = (res.data as any).deletedCount || 0;
      toast.success(`Cleaned up ${count} old audit log${count !== 1 ? 's' : ''}`);
      fetchLogs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cleanup logs');
    }
  };

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
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Complete history of all system changes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="btn-press text-red-600 hover:text-red-700" onClick={handleCleanupOldLogs}>
            <AlertTriangle className="h-4 w-4 mr-1" />
            Cleanup 90d+
          </Button>
          <Button variant="outline" className="btn-press">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
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
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shimmer h-20 w-full rounded-lg" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : (
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border stagger-rows">
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
                        {' '}{log.action === 'CREATE' ? 'created' : log.action === 'UPDATE' ? 'updated' : log.action === 'DELETE' ? 'deleted' : log.action.toLowerCase().replace(/_/g, ' ')}{' '}
                        a <span className="font-medium">{log.entityType}</span>
                      </p>
                      {(log.oldData || log.newData) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {summarizeChanges(log.oldData, log.newData)}
                        </p>
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
                        <Eye className="h-4 w-4 hover:scale-110 transition-transform" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleDeleteLog(log.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 animate-empty">
              <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4 animate-float" />
              <p className="text-muted-foreground">No audit logs found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
