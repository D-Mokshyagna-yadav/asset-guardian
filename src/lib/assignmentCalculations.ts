import { Device, Assignment } from '@/types';

/**
 * Calculates device quantity statistics based on assignment status
 * Only counts APPROVED and COMPLETED assignments as actually assigned
 */
export const calculateDeviceQuantities = (device: Device, assignments: Assignment[]) => {
  // Get assignments for this specific device
  const deviceAssignments = assignments.filter(a => a.deviceId === device.id);
  
  // Only count approved and completed assignments as actually assigned
  const assignedQuantity = deviceAssignments
    .filter(a => a.status === 'APPROVED' || a.status === 'COMPLETED')
    .reduce((sum, a) => sum + (a.quantity ?? 1), 0);
  
  // Calculate available quantity (never negative)
  const availableQuantity = Math.max(device.quantity - assignedQuantity, 0);
  
  // Get pending requests for informational purposes
  const pendingQuantity = deviceAssignments
    .filter(a => a.status === 'REQUESTED' || a.status === 'PENDING')
    .reduce((sum, a) => sum + (a.quantity ?? 1), 0);
  
  return {
    total: device.quantity,
    assigned: Math.min(assignedQuantity, device.quantity), // Cap at total quantity
    available: availableQuantity,
    pending: pendingQuantity,
    // Validation check
    isValid: assignedQuantity + availableQuantity === device.quantity
  };
};

/**
 * Get human-readable status descriptions for assignments
 */
export const getAssignmentStatusInfo = (status: string) => {
  const statusMap = {
    REQUESTED: { 
      label: 'Requested', 
      description: 'Request submitted, awaiting review',
      countsAsAssigned: false 
    },
    PENDING: { 
      label: 'Pending', 
      description: 'Under review by administrators',
      countsAsAssigned: false 
    },
    APPROVED: { 
      label: 'Approved', 
      description: 'Assignment approved and active',
      countsAsAssigned: true 
    },
    COMPLETED: { 
      label: 'Completed', 
      description: 'Assignment completed successfully',
      countsAsAssigned: true 
    },
    REJECTED: { 
      label: 'Rejected', 
      description: 'Request was rejected',
      countsAsAssigned: false 
    },
    MAINTENANCE: { 
      label: 'Maintenance', 
      description: 'Device is under maintenance',
      countsAsAssigned: false 
    }
  };
  
  return statusMap[status as keyof typeof statusMap] || { 
    label: status, 
    description: 'Unknown status',
    countsAsAssigned: false 
  };
};