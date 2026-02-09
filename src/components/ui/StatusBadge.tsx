import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { DeviceStatus, AssignmentStatus } from '@/types';
import { configurationApi, type StatusStyleConfig } from '@/lib/api';

interface StatusBadgeProps {
  status: DeviceStatus | AssignmentStatus;
  className?: string;
}

const DEFAULT_STATUS_STYLES: Record<string, string> = {
  IN_STOCK: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  MAINTENANCE: 'bg-amber-100 text-amber-800 border-amber-200',
  SCRAPPED: 'bg-slate-100 text-slate-600 border-slate-200',
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  RETURNED: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const [statusStyles, setStatusStyles] = useState<Record<string, string>>(DEFAULT_STATUS_STYLES);

  useEffect(() => {
    const fetchStatusStyles = async () => {
      try {
        const response = await configurationApi.getStatusStyles();
        const styles = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        const styleMap: Record<string, string> = {};
        styles.forEach((style: StatusStyleConfig) => {
          styleMap[style.status] = style.classes;
        });
        setStatusStyles(styleMap);
      } catch (error) {
        console.error('Error fetching status styles:', error);
        // Fall back to defaults on error
        setStatusStyles(DEFAULT_STATUS_STYLES);
      }
    };

    fetchStatusStyles();
  }, []);

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
