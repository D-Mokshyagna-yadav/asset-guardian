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

// Module-level cache so we only fetch status styles once across all StatusBadge instances
let cachedStyles: Record<string, string> | null = null;
let fetchPromise: Promise<Record<string, string>> | null = null;

function getStatusStyles(): Promise<Record<string, string>> {
  if (cachedStyles) return Promise.resolve(cachedStyles);
  if (fetchPromise) return fetchPromise;

  fetchPromise = configurationApi.getStatusStyles()
    .then((response) => {
      const styles = response.data?.data || [];
      const styleMap: Record<string, string> = {};
      styles.forEach((style: StatusStyleConfig) => {
        styleMap[style.status] = style.classes;
      });
      cachedStyles = styleMap;
      return styleMap;
    })
    .catch((error) => {
      console.error('Error fetching status styles:', error);
      fetchPromise = null; // Allow retry on failure
      return DEFAULT_STATUS_STYLES;
    });

  return fetchPromise;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const [statusStyles, setStatusStyles] = useState<Record<string, string>>(cachedStyles || DEFAULT_STATUS_STYLES);

  useEffect(() => {
    let cancelled = false;
    getStatusStyles().then((styles) => {
      if (!cancelled) setStatusStyles(styles);
    });
    return () => { cancelled = true; };
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
