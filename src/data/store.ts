import { Assignment, Device } from '@/types';

const DEVICES_KEY = 'asset-guardian-devices';
const ASSIGNMENTS_KEY = 'asset-guardian-assignments';
const CATEGORIES_KEY = 'asset-guardian-categories';
const GROUPS_KEY = 'asset-guardian-groups';

export interface DeviceGroup {
  id: string;
  name: string;
  description?: string;
  deviceIds: string[];
  createdAt: string;
  createdBy: string;
}

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const normalizeAssignments = (assignments: Assignment[]): Assignment[] =>
  assignments.map((assignment) => ({
    ...assignment,
    quantity: assignment.quantity ?? 1,
  }));

export const getDevices = (): Device[] => {
  if (!isBrowser) return [];
  const raw = window.localStorage.getItem(DEVICES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Device[];
  } catch {
    return [];
  }
};

export const saveDevices = (devices: Device[]) => {
  if (!isBrowser) return devices;
  window.localStorage.setItem(DEVICES_KEY, JSON.stringify(devices));
  return devices;
};

export const upsertDevice = (device: Device) => {
  const devices = getDevices();
  const index = devices.findIndex((d) => d.id === device.id);
  const next = index === -1
    ? [...devices, device]
    : devices.map((d, i) => (i === index ? device : d));
  return saveDevices(next);
};

export const getAssignments = (): Assignment[] => {
  if (!isBrowser) return [];
  const raw = window.localStorage.getItem(ASSIGNMENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Assignment[];
    return normalizeAssignments(parsed);
  } catch {
    return [];
  }
};

export const saveAssignments = (assignments: Assignment[]) => {
  if (!isBrowser) return assignments;
  window.localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
  return assignments;
};

export const addAssignment = (assignment: Assignment) => {
  const assignments = getAssignments();
  return saveAssignments([...assignments, assignment]);
};

export const getAssignedQuantity = (deviceId: string, assignments: Assignment[]) => {
  return assignments
    .filter((assignment) => 
      assignment.deviceId === deviceId && 
      (assignment.status === 'APPROVED' || assignment.status === 'COMPLETED')
    )
    .reduce((sum, assignment) => sum + (assignment.quantity ?? 1), 0);
};

export const getAvailableQuantity = (device: Device, assignments: Assignment[]) => {
  const assigned = getAssignedQuantity(device.id, assignments);
  return Math.max(device.quantity - assigned, 0);
};

// Categories management
const defaultCategories = [
  'Network Switch',
  'Wireless AP',
  'Server',
  'Printer',
  'Router',
  'Firewall',
  'Storage',
  'Desktop',
  'Laptop',
  'Tablet',
  'Mobile',
  'Networking Equipment',
];

export const getCategories = (): string[] => {
  if (!isBrowser) return defaultCategories;
  const raw = window.localStorage.getItem(CATEGORIES_KEY);
  if (!raw) return defaultCategories;
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return defaultCategories;
  }
};

export const saveCategories = (categories: string[]) => {
  if (!isBrowser) return categories;
  window.localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  return categories;
};

export const addCategory = (category: string) => {
  const categories = getCategories();
  if (categories.includes(category)) return categories;
  return saveCategories([...categories, category]);
};

export const deleteCategory = (category: string) => {
  const categories = getCategories();
  return saveCategories(categories.filter((c) => c !== category));
};

// Groups management
export const getGroups = (): DeviceGroup[] => {
  if (!isBrowser) return [];
  const raw = window.localStorage.getItem(GROUPS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DeviceGroup[];
  } catch {
    return [];
  }
};

export const saveGroups = (groups: DeviceGroup[]) => {
  if (!isBrowser) return groups;
  window.localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  return groups;
};

export const createGroup = (group: DeviceGroup) => {
  const groups = getGroups();
  const newGroup = {
    ...group,
    id: group.id || `group-${Date.now()}`,
    createdAt: group.createdAt || new Date().toISOString(),
  };
  return saveGroups([...groups, newGroup]);
};

export const updateGroup = (groupId: string, updates: Partial<DeviceGroup>) => {
  const groups = getGroups();
  const updated = groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g));
  return saveGroups(updated);
};

export const deleteGroup = (groupId: string) => {
  const groups = getGroups();
  return saveGroups(groups.filter((g) => g.id !== groupId));
};

export const addDeviceToGroup = (groupId: string, deviceId: string) => {
  const groups = getGroups();
  const updated = groups.map((g) => {
    if (g.id === groupId && !g.deviceIds.includes(deviceId)) {
      return { ...g, deviceIds: [...g.deviceIds, deviceId] };
    }
    return g;
  });
  return saveGroups(updated);
};

export const removeDeviceFromGroup = (groupId: string, deviceId: string) => {
  const groups = getGroups();
  const updated = groups.map((g) => {
    if (g.id === groupId) {
      return { ...g, deviceIds: g.deviceIds.filter((id) => id !== deviceId) };
    }
    return g;
  });
  return saveGroups(updated);
};
