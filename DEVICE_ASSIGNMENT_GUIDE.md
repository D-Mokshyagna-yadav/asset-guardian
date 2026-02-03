# Device Assignment to Department - Implementation Guide

## Overview
Devices are assigned to departments through a request-approval workflow. When an admin approves an assignment, the device is automatically updated with the department and location information.

## How Device Assignment Works

### 1. **Device Request (IT_STAFF)**
   - IT_STAFF submits a device request via "Request Device" page
   - Specifies:
     - Which device they need
     - Quantity
     - Department to assign to
     - Location where it will be installed
     - Reason (Installation, Maintenance, Replacement, etc.)
     - Additional notes

### 2. **Admin Approval (SUPER_ADMIN)**
   - Admin reviews pending requests in "Requests" tab
   - Can view full assignment details including:
     - Device name & asset tag
     - Department & location details
     - Quantity requested
     - Reason & notes from requester
   
### 3. **Device Assignment Update**
   When admin **APPROVES** an assignment:
   ```
   ✅ Assignment Status → APPROVED
   ✅ Device.departmentId → Updated to requesting department
   ✅ Device.locationId → Updated to specified location
   ✅ Timestamp → createdAt field updated
   ```

### 4. **After Approval**
   - Device appears in the department's inventory
   - Device status may change based on department needs
   - IT_STAFF can track the device in their "Assignments" page
   - Device availability count is updated automatically

## Key Components

### Assignment Record Fields
```typescript
{
  id: string;              // Unique assignment ID
  deviceId: string;        // Which device
  departmentId: string;    // Which department (assignment target)
  locationId: string;      // Which location (assignment target)
  requestedBy: string;     // Who requested it
  quantity: number;        // How many units
  reason: RequestReason;   // Why they need it
  notes?: string;         // Additional information
  status: AssignmentStatus; // REQUESTED → APPROVED → (or REJECTED)
  approvedBy?: string;    // Admin who approved
  remarks?: string;       // Rejection reason if rejected
  createdAt: string;      // When requested
}
```

### Device Fields Updated on Approval
```typescript
{
  departmentId?: string;   // Set from Assignment.departmentId
  locationId?: string;     // Set from Assignment.locationId
  updatedAt: string;       // Updated timestamp
}
```

## Workflow Diagram

```
┌─────────────────────────────────────────────────┐
│  IT_STAFF: Request Device                       │
│  - Select device                                │
│  - Choose department & location                 │
│  - Specify reason & notes                       │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  Status: REQUESTED                              │
│  Assignment created but not confirmed           │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  SUPER_ADMIN: Review Request                    │
│  View in "Requests" tab                         │
│  - Check device details                         │
│  - Check department & location                  │
│  - Review reason & notes                        │
└──────────────────────┬──────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
   ┌─────────────┐           ┌──────────────┐
   │  APPROVE    │           │   REJECT     │
   └──────┬──────┘           └──────┬───────┘
          │                         │
          ▼                         ▼
   ┌─────────────────────┐  ┌──────────────────┐
   │ Update Device:      │  │ Status: REJECTED │
   │ • Set departmentId  │  │ • Add remarks    │
   │ • Set locationId    │  │ • Notify requester
   │ • Update timestamp  │  └──────────────────┘
   │ Status: APPROVED    │
   └──────┬──────────────┘
          │
          ▼
   ┌─────────────────────┐
   │  Device now belongs │
   │  to Department &    │
   │  Location           │
   └─────────────────────┘
```

## Code Implementation

### Approval Handler (AssignmentManagement.tsx)
```typescript
const handleApprove = () => {
  if (!selectedAssignment) return;

  // Update assignment status
  const updatedAssignments = assignments.map(a => {
    if (a.id === selectedAssignment.id) {
      return {
        ...a,
        status: 'APPROVED' as AssignmentStatus,
        approvedBy: user?.id,
      };
    }
    return a;
  });

  // Update the device with department and location info
  const devices = getDevices();
  const deviceToUpdate = devices.find(d => d.id === selectedAssignment.deviceId);
  if (deviceToUpdate) {
    const updatedDevice = {
      ...deviceToUpdate,
      departmentId: selectedAssignment.departmentId,
      locationId: selectedAssignment.locationId,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    upsertDevice(updatedDevice);  // Updates device storage
  }

  // Save assignment
  setAssignments(updatedAssignments);
  saveAssignments(updatedAssignments);
};
```

## Availability Tracking

Devices show availability based on:
- **Total Quantity**: All units of a device type
- **Assigned Quantity**: Units already assigned via approved assignments
- **Available**: Total - Assigned = Available

### Example
- Device "Laptop XPS-15": 10 units total
- 3 units assigned to IT Department
- 2 units assigned to Admin Department
- **Available: 5 units**

## Key Features

✅ **Automatic Device Updates**: When admin approves, device is auto-updated
✅ **Quantity Tracking**: System prevents over-assignment
✅ **Audit Trail**: All assignments tracked with dates and approvers
✅ **Department Accountability**: Easy to see what devices are where
✅ **Rejection Workflow**: Can reject with detailed reasons
✅ **Status Visibility**: Clear status indicators (Requested, Approved, Rejected)

## Best Practices

1. **Review Request Information**: Always check reason and notes before approving
2. **Verify Department & Location**: Ensure correct target department/location
3. **Monitor Availability**: Keep track of device stock levels
4. **Document Rejections**: Provide clear reasons when rejecting requests
5. **Update Device Details**: Keep device information current in inventory
