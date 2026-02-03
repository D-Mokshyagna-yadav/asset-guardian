import { cn } from '@/lib/utils';
import { DeviceStatus, AssignmentStatus } from '@/types';

interface StatusBadgeProps {
  status: DeviceStatus | AssignmentStatus;
  className?: string;
}

const statusStyles: Record<string, string> = {
  IN_STOCK: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ISSUED: 'bg-blue-100 text-blue-800 border-blue-200',
  INSTALLED: 'bg-teal-100 text-teal-800 border-teal-200',
  MAINTENANCE: 'bg-amber-100 text-amber-800 border-amber-200',
  SCRAPPED: 'bg-slate-100 text-slate-600 border-slate-200',
  REQUESTED: 'bg-purple-100 text-purple-800 border-purple-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const formattedStatus = status.replace(/_/g, ' ');
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusStyles[status] || 'bg-gray-100 text-gray-800 border-gray-200',
        className
      )}
    >
      {formattedStatus}
    </span>
  );
}
