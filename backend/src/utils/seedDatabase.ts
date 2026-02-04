import mongoose from 'mongoose';
import { config } from '../config';
import { User, Department, Location, Device, Assignment, AuditLog, Category, Configuration } from '../models';

const connectDB = async () => {
  await mongoose.connect(config.mongodb.uri);
  console.log('Connected to MongoDB');
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Department.deleteMany({});
    await Location.deleteMany({});
    await Device.deleteMany({});
    await Assignment.deleteMany({});
    await AuditLog.deleteMany({});
    await Category.deleteMany({});
    await Configuration.deleteMany({});

    // Create categories
    console.log('Creating categories...');
    const categories = await Category.create([
      { name: 'Network Switch', description: 'Network switching equipment' },
      { name: 'Wireless AP', description: 'Wireless access points' },
      { name: 'Server', description: 'Server hardware' },
      { name: 'Printer', description: 'Printer devices' },
      { name: 'Router', description: 'Network routing equipment' },
      { name: 'Firewall', description: 'Firewall appliances' },
      { name: 'Storage', description: 'Storage devices and systems' },
      { name: 'Desktop', description: 'Desktop computers' },
      { name: 'Laptop', description: 'Laptop computers' },
      { name: 'Tablet', description: 'Tablet devices' },
      { name: 'Mobile', description: 'Mobile phones' },
      { name: 'Networking Equipment', description: 'Other networking equipment' },
    ]);

    // Create configuration
    console.log('Creating configuration...');
    await Configuration.create([
      {
        key: 'USER_ROLES',
        userRoles: [
          {
            value: 'SUPER_ADMIN',
            label: 'Super Admin',
            description: 'Full system access and administration capabilities',
          },
          {
            value: 'IT_STAFF',
            label: 'IT Staff',
            description: 'Device management and assignment capabilities',
          },
          {
            value: 'DEPARTMENT_INCHARGE',
            label: 'Department In-charge',
            description: 'Department-level management capabilities',
          },
        ],
      },
      {
        key: 'STATUS_STYLES',
        statusStyles: [
          {
            status: 'IN_STOCK',
            classes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            label: 'In Stock',
          },
          {
            status: 'ISSUED',
            classes: 'bg-blue-100 text-blue-800 border-blue-200',
            label: 'Issued',
          },
          {
            status: 'INSTALLED',
            classes: 'bg-teal-100 text-teal-800 border-teal-200',
            label: 'Installed',
          },
          {
            status: 'MAINTENANCE',
            classes: 'bg-amber-100 text-amber-800 border-amber-200',
            label: 'Maintenance',
          },
          {
            status: 'SCRAPPED',
            classes: 'bg-slate-100 text-slate-600 border-slate-200',
            label: 'Scrapped',
          },
          {
            status: 'REQUESTED',
            classes: 'bg-purple-100 text-purple-800 border-purple-200',
            label: 'Requested',
          },
          {
            status: 'PENDING',
            classes: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            label: 'Pending',
          },
          {
            status: 'APPROVED',
            classes: 'bg-green-100 text-green-800 border-green-200',
            label: 'Approved',
          },
          {
            status: 'COMPLETED',
            classes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            label: 'Completed',
          },
          {
            status: 'REJECTED',
            classes: 'bg-red-100 text-red-800 border-red-200',
            label: 'Rejected',
          },
        ],
      },
      {
        key: 'ROLE_COLORS',
        roleColors: [
          {
            role: 'SUPER_ADMIN',
            badgeColor: 'bg-red-500/20 text-red-300',
            displayLabel: 'Super Admin',
          },
          {
            role: 'IT_STAFF',
            badgeColor: 'bg-blue-500/20 text-blue-300',
            displayLabel: 'IT Staff',
          },
          {
            role: 'DEPARTMENT_INCHARGE',
            badgeColor: 'bg-amber-500/20 text-amber-300',
            displayLabel: 'Department In-charge',
          },
        ],
      },
    ]);

    // Create departments
    console.log('Creating departments...');
    const departments = await Department.create([
      {
        name: 'Computer Science',
        block: 'Block A',
        hodName: 'Dr. Michael Dean',
        contactEmail: 'cs@college.edu',
      },
      {
        name: 'Electrical Engineering',
        block: 'Block B',
        hodName: 'Dr. Sarah Lee',
        contactEmail: 'ee@college.edu',
      },
      {
        name: 'Mechanical Engineering',
        block: 'Block C',
        hodName: 'Dr. James Wilson',
        contactEmail: 'me@college.edu',
      },
      {
        name: 'Administration',
        block: 'Main Building',
        hodName: 'Mr. Robert Brown',
        contactEmail: 'admin@college.edu',
      },
    ]);

    // Create locations
    console.log('Creating locations...');
    const locations = await Location.create([
      {
        building: 'Block A',
        floor: '1st Floor',
        room: 'Lab 101',
        rack: 'R-01',
      },
      {
        building: 'Block A',
        floor: '2nd Floor',
        room: 'Lab 201',
        rack: 'R-02',
      },
      {
        building: 'Block B',
        floor: '1st Floor',
        room: 'Server Room',
        rack: 'SR-01',
      },
      {
        building: 'Main Building',
        floor: 'Ground Floor',
        room: 'IT Office',
      },
      // Additional locations for comprehensive testing
      {
        building: 'Block B',
        floor: '2nd Floor',
        room: 'Faculty Room',
        rack: 'FR-01',
      },
      {
        building: 'Block C',
        floor: '1st Floor',
        room: 'Workshop Lab',
        rack: 'WL-01',
      },
      {
        building: 'Block C',
        floor: '2nd Floor',
        room: 'Conference Room',
      },
      {
        building: 'Library Building',
        floor: '1st Floor',
        room: 'Study Hall',
        rack: 'LB-01',
      },
    ]);

    // Create users
    console.log('Creating users...');
    const users = await User.create([
      {
        name: 'John Administrator',
        email: 'john@college.edu',
        password: 'demo1234',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
      {
        name: 'Sarah Tech',
        email: 'sarah@college.edu',
        password: 'demo1234',
        role: 'IT_STAFF',
        departmentId: departments[0]._id,
        isActive: true,
      },
      {
        name: 'Mike Davis',
        email: 'mike@college.edu',
        password: 'demo1234',
        role: 'IT_STAFF',
        departmentId: departments[1]._id,
        isActive: true,
      },
      {
        name: 'Emily Brown',
        email: 'emily@college.edu',
        password: 'demo1234',
        role: 'DEPARTMENT_INCHARGE',
        departmentId: departments[0]._id,
        isActive: true,
      },
      {
        name: 'David Wilson',
        email: 'david@college.edu',
        password: 'demo1234',
        role: 'DEPARTMENT_INCHARGE',
        departmentId: departments[2]._id,
        isActive: true,
      },
    ]);

    // Create devices
    console.log('Creating devices...');
    const devices = await Device.create([
      {
        assetTag: 'AST-2024-001',
        deviceName: 'Core Switch 01',
        category: 'Network Switch',
        brand: 'Cisco',
        deviceModel: 'Catalyst 9300',
        serialNumber: 'CSC-98765432',
        macAddress: 'AA:BB:CC:DD:EE:01',
        ipAddress: '192.168.1.1',
        purchaseDate: new Date('2024-01-15'),
        arrivalDate: new Date('2024-01-16'),
        vendor: 'Tech Solutions Inc.',
        invoiceNumber: 'INV-2024-0001',
        billDate: new Date('2024-01-15'),
        billAmount: 12500,
        cost: 12500,
        quantity: 1,
        warrantyStart: new Date('2024-01-15'),
        warrantyEnd: new Date('2027-01-15'),
        status: 'INSTALLED',
        departmentId: departments[0]._id,
        locationId: locations[2]._id,
        inchargeUserId: users[1]._id,
        features: ['48 Ports', 'PoE Support', '10Gbps Uplinks'],
        notes: 'Core network infrastructure device',
        createdBy: users[0]._id,
      },
      {
        assetTag: 'AST-2024-002',
        deviceName: 'Access Point Lab-101',
        category: 'Wireless AP',
        brand: 'Ubiquiti',
        deviceModel: 'UniFi 6 Pro',
        serialNumber: 'UBQ-12345678',
        macAddress: 'AA:BB:CC:DD:EE:02',
        ipAddress: '192.168.1.50',
        purchaseDate: new Date('2024-02-01'),
        arrivalDate: new Date('2024-02-03'),
        vendor: 'Network Pros Ltd.',
        invoiceNumber: 'INV-2024-0015',
        billDate: new Date('2024-02-01'),
        billAmount: 450,
        cost: 450,
        quantity: 1,
        warrantyStart: new Date('2024-02-01'),
        warrantyEnd: new Date('2026-02-01'),
        status: 'INSTALLED',
        departmentId: departments[0]._id,
        locationId: locations[0]._id,
        inchargeUserId: users[1]._id,
        features: ['WiFi 6E', 'PoE Support'],
        notes: 'Lab access point for student Wi-Fi',
        createdBy: users[0]._id,
      },
      {
        assetTag: 'AST-2024-003',
        deviceName: 'Dell PowerEdge R740',
        category: 'Server',
        brand: 'Dell',
        deviceModel: 'PowerEdge R740',
        serialNumber: 'DELL-87654321',
        macAddress: 'AA:BB:CC:DD:EE:03',
        ipAddress: '192.168.1.10',
        purchaseDate: new Date('2024-01-20'),
        arrivalDate: new Date('2024-01-22'),
        vendor: 'Dell Technologies',
        cost: 25000,
        quantity: 1,
        status: 'IN_STOCK',
        createdBy: users[0]._id,
      },
      // Additional devices for comprehensive testing
      {
        assetTag: 'AST-2024-004',
        deviceName: 'HP ProBook 450 G9',
        category: 'Laptop',
        brand: 'HP',
        deviceModel: 'ProBook 450 G9',
        serialNumber: 'HP-LAP-001',
        purchaseDate: new Date('2024-03-10'),
        arrivalDate: new Date('2024-03-12'),
        vendor: 'HP Store',
        invoiceNumber: 'INV-2024-0025',
        billDate: new Date('2024-03-10'),
        billAmount: 950,
        cost: 950,
        quantity: 1,
        warrantyStart: new Date('2024-03-10'),
        warrantyEnd: new Date('2027-03-10'),
        status: 'ISSUED',
        departmentId: departments[1]._id,
        locationId: locations[1]._id,
        inchargeUserId: users[2]._id,
        features: ['Intel i5', '8GB RAM', '256GB SSD'],
        notes: 'Faculty laptop for EE department',
        createdBy: users[0]._id,
      },
      {
        assetTag: 'AST-2024-005',
        deviceName: 'Canon ImageRunner 2625i',
        category: 'Printer',
        brand: 'Canon',
        deviceModel: 'ImageRunner 2625i',
        serialNumber: 'CAN-PRT-001',
        purchaseDate: new Date('2024-04-05'),
        arrivalDate: new Date('2024-04-07'),
        vendor: 'Canon Authorized Dealer',
        invoiceNumber: 'INV-2024-0032',
        billDate: new Date('2024-04-05'),
        billAmount: 1200,
        cost: 1200,
        quantity: 1,
        warrantyStart: new Date('2024-04-05'),
        warrantyEnd: new Date('2026-04-05'),
        status: 'MAINTENANCE',
        departmentId: departments[2]._id,
        inchargeUserId: users[4]._id,
        features: ['A3 Printing', 'Network Capable', 'Duplex'],
        notes: 'Departmental printer - currently under service',
        createdBy: users[0]._id,
      },
      {
        assetTag: 'AST-2024-006',
        deviceName: 'Lenovo ThinkPad T14',
        category: 'Laptop',
        brand: 'Lenovo',
        deviceModel: 'ThinkPad T14 Gen 3',
        serialNumber: 'LEN-LAP-002',
        purchaseDate: new Date('2024-05-20'),
        arrivalDate: new Date('2024-05-22'),
        vendor: 'Lenovo Direct',
        invoiceNumber: 'INV-2024-0045',
        billDate: new Date('2024-05-20'),
        billAmount: 1100,
        cost: 1100,
        quantity: 1,
        warrantyStart: new Date('2024-05-20'),
        warrantyEnd: new Date('2027-05-20'),
        status: 'IN_STOCK',
        features: ['Intel i7', '16GB RAM', '512GB SSD'],
        notes: 'Available for assignment',
        createdBy: users[0]._id,
      },
      {
        assetTag: 'AST-2023-007',
        deviceName: 'Old Desktop PC',
        category: 'Desktop',
        brand: 'Dell',
        deviceModel: 'OptiPlex 7010',
        serialNumber: 'DELL-OLD-001',
        purchaseDate: new Date('2023-06-15'),
        arrivalDate: new Date('2023-06-17'),
        vendor: 'Dell Technologies',
        cost: 800,
        quantity: 1,
        status: 'SCRAPPED',
        notes: 'End of life - disposed safely',
        createdBy: users[0]._id,
      },
      // Devices for different months to test monthly filtering
      {
        assetTag: 'AST-2024-008',
        deviceName: 'Samsung Monitor 24"',
        category: 'Monitor',
        brand: 'Samsung',
        deviceModel: 'F24T450FQU',
        serialNumber: 'SAM-MON-001',
        purchaseDate: new Date('2024-06-10'),
        arrivalDate: new Date('2024-06-12'),
        vendor: 'Samsung Electronics',
        cost: 180,
        quantity: 5,
        status: 'IN_STOCK',
        features: ['24 inch', 'Full HD', 'IPS Panel'],
        notes: 'Bulk purchase for lab upgrade',
        createdBy: users[0]._id,
      },
      {
        assetTag: 'AST-2024-009',
        deviceName: 'Raspberry Pi 4 Kit',
        category: 'SBC',
        brand: 'Raspberry Pi',
        deviceModel: 'Pi 4 Model B',
        serialNumber: 'RPI-KIT-001',
        purchaseDate: new Date('2024-07-25'),
        arrivalDate: new Date('2024-07-27'),
        vendor: 'Pi Shop',
        cost: 120,
        quantity: 10,
        status: 'ISSUED',
        departmentId: departments[0]._id,
        inchargeUserId: users[1]._id,
        features: ['4GB RAM', '32GB SD Card', 'Case & Power Supply'],
        notes: 'For student IoT projects',
        createdBy: users[0]._id,
      },
      {
        assetTag: 'AST-2024-010',
        deviceName: 'UPS APC 1500VA',
        category: 'UPS',
        brand: 'APC',
        deviceModel: 'Back-UPS Pro 1500',
        serialNumber: 'APC-UPS-001',
        purchaseDate: new Date('2024-08-15'),
        arrivalDate: new Date('2024-08-17'),
        vendor: 'Power Solutions Inc.',
        cost: 300,
        quantity: 1,
        status: 'INSTALLED',
        departmentId: departments[2]._id,
        locationId: locations[2]._id,
        inchargeUserId: users[4]._id,
        features: ['1500VA', 'LCD Display', '10 Outlets'],
        notes: 'Backup power for server room',
        createdBy: users[0]._id,
      },
    ]);

    // Create assignments
    console.log('Creating assignments...');
    await Assignment.create([
      {
        deviceId: devices[2]._id, // Dell PowerEdge R740
        departmentId: departments[1]._id, // Electrical Engineering
        locationId: locations[2]._id, // Server Room
        requestedBy: users[2]._id, // Mike Davis
        quantity: 1,
        reason: 'NEW_REQUIREMENT',
        notes: 'Need server for new research project on power systems',
        status: 'REQUESTED',
      },
      {
        deviceId: devices[5]._id, // Lenovo ThinkPad T14
        departmentId: departments[0]._id, // Computer Science
        locationId: locations[4]._id, // Faculty Room
        requestedBy: users[3]._id, // Emily Brown
        approvedBy: users[0]._id, // John Administrator
        quantity: 1,
        reason: 'REPLACEMENT_MALFUNCTION',
        notes: 'Replace old faculty laptop',
        status: 'APPROVED',
        approvedAt: new Date('2024-05-25'),
      },
      {
        deviceId: devices[7]._id, // Samsung Monitor 24"
        departmentId: departments[2]._id, // Mechanical Engineering
        locationId: locations[5]._id, // Workshop Lab
        requestedBy: users[4]._id, // David Wilson
        approvedBy: users[0]._id, // John Administrator
        completedBy: users[1]._id, // Sarah Tech
        quantity: 3,
        reason: 'UPGRADE',
        notes: 'Lab workstation monitor upgrade',
        status: 'COMPLETED',
        approvedAt: new Date('2024-06-15'),
        completedAt: new Date('2024-06-18'),
      },
      {
        deviceId: devices[8]._id, // Raspberry Pi 4 Kit
        departmentId: departments[0]._id, // Computer Science
        locationId: locations[0]._id, // Lab 101
        requestedBy: users[1]._id, // Sarah Tech
        quantity: 10,
        reason: 'NEW_REQUIREMENT',
        notes: 'Student project kits for IoT course',
        rejectedBy: users[0]._id, // John Administrator
        status: 'REJECTED',
        rejectedAt: new Date('2024-07-30'),
        rejectionReason: 'Budget constraints - resubmit next quarter',
      },
      {
        deviceId: devices[3]._id, // HP ProBook 450 G9
        departmentId: departments[1]._id, // Electrical Engineering
        locationId: locations[1]._id, // Lab 201
        requestedBy: users[2]._id, // Mike Davis
        approvedBy: users[0]._id, // John Administrator
        quantity: 1,
        reason: 'NEW_REQUIREMENT',
        notes: 'Additional laptop for lab demonstrations',
        status: 'APPROVED',
        approvedAt: new Date('2024-03-15'),
      },
      {
        deviceId: devices[9]._id, // UPS APC 1500VA
        departmentId: departments[2]._id, // Mechanical Engineering
        locationId: locations[2]._id, // Server Room
        requestedBy: users[4]._id, // David Wilson
        approvedBy: users[0]._id, // John Administrator
        completedBy: users[1]._id, // Sarah Tech
        quantity: 1,
        reason: 'MAINTENANCE',
        notes: 'Backup power protection for critical equipment',
        status: 'COMPLETED',
        approvedAt: new Date('2024-08-18'),
        completedAt: new Date('2024-08-20'),
      },
    ]);
    // Create audit logs
    console.log('Creating audit logs...');
    await AuditLog.create([
      {
        entityType: 'Device',
        entityId: devices[0]._id.toString(),
        action: 'CREATE',
        performedBy: users[0]._id,
        newData: { deviceName: 'Core Switch 01', status: 'INSTALLED' },
        ipAddress: '192.168.1.100',
        userAgent: 'System/Seeder',
        timestamp: new Date('2024-01-16'),
      },
      {
        entityType: 'Device',
        entityId: devices[3]._id.toString(),
        action: 'STATUS_CHANGE',
        performedBy: users[1]._id,
        oldData: { status: 'IN_STOCK' },
        newData: { status: 'ISSUED' },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 System Admin',
        timestamp: new Date('2024-03-15'),
      },
      {
        entityType: 'Assignment',
        entityId: '12345',
        action: 'APPROVED',
        performedBy: users[0]._id,
        oldData: { status: 'REQUESTED' },
        newData: { status: 'APPROVED' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Chrome Admin',
        timestamp: new Date('2024-05-25'),
      },
      {
        entityType: 'Device',
        entityId: devices[4]._id.toString(),
        action: 'STATUS_CHANGE',
        performedBy: users[2]._id,
        oldData: { status: 'INSTALLED' },
        newData: { status: 'MAINTENANCE' },
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 Firefox Staff',
        timestamp: new Date('2024-04-10'),
      },
      {
        entityType: 'User',
        entityId: users[1]._id.toString(),
        action: 'LOGIN',
        performedBy: users[1]._id,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 Chrome',
        timestamp: new Date('2024-08-15'),
      },
      {
        entityType: 'Device',
        entityId: devices[6]._id.toString(),
        action: 'STATUS_CHANGE',
        performedBy: users[0]._id,
        oldData: { status: 'INSTALLED' },
        newData: { status: 'SCRAPPED' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Admin Panel',
        timestamp: new Date('2023-12-20'),
      },
      {
        entityType: 'Assignment',
        entityId: '67890',
        action: 'REJECTED',
        performedBy: users[0]._id,
        oldData: { status: 'REQUESTED' },
        newData: { status: 'REJECTED', rejectionReason: 'Budget constraints' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 System Admin',
        timestamp: new Date('2024-07-30'),
      },
    ]);
    console.log('Database seeded successfully!');
    console.log('\nLogin Credentials (all passwords: demo1234):');
    console.log('Super Admin: john@college.edu / demo1234');
    console.log('IT Staff: sarah@college.edu / demo1234');
    console.log('IT Staff: mike@college.edu / demo1234');
    console.log('Dept Incharge: emily@college.edu / demo1234');
    console.log('Dept Incharge: david@college.edu / demo1234');
    console.log('\nThese match the frontend mock users exactly.');    
    console.log('\n📊 Seeded Data Summary:');
    console.log(`• ${4} Departments with different blocks`);
    console.log(`• ${8} Locations across campus buildings`);
    console.log(`• ${5} Users with different roles and permissions`);
    console.log(`• ${10} Devices with various statuses (IN_STOCK, ISSUED, INSTALLED, MAINTENANCE, SCRAPPED)`);
    console.log(`• ${6} Assignments with different statuses (REQUESTED, APPROVED, REJECTED, COMPLETED)`);
    console.log(`• ${7} Audit log entries for tracking system activities`);
    
    console.log('\n🧪 Features to Test:');
    console.log('✓ Role-based access control (Admin, IT Staff, Department Incharge)');
    console.log('✓ Device inventory with filtering and status management');
    console.log('✓ Monthly purchase filtering (Jan-Aug 2024 data available)');
    console.log('✓ Assignment workflow (Request → Approve → Complete/Reject)');
    console.log('✓ User management with single admin restriction');
    console.log('✓ Department and location management');
    console.log('✓ Audit logging for all major operations');
    console.log('✓ Device status transitions and tracking');
    
    console.log('\n🚀 Ready for comprehensive testing!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();