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
    await Category.create([
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
        key: 'STATUS_STYLES',
        statusStyles: [
          {
            status: 'IN_STOCK',
            classes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            label: 'In Stock',
          },
          {
            status: 'ASSIGNED',
            classes: 'bg-blue-100 text-blue-800 border-blue-200',
            label: 'Assigned',
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
            status: 'ACTIVE',
            classes: 'bg-green-100 text-green-800 border-green-200',
            label: 'Active',
          },
          {
            status: 'RETURNED',
            classes: 'bg-gray-100 text-gray-800 border-gray-200',
            label: 'Returned',
          },
        ],
      },
    ]);

    // Create single admin user
    console.log('Creating admin user...');
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@college.edu',
      password: 'demo1234',
      role: 'ADMIN',
      isActive: true,
    });

    // Create departments
    console.log('Creating departments...');
    const departments = await Department.create([
      {
        name: 'Computer Science',
        block: 'Block A',
        hodName: 'Dr. Michael Dean',
        hodPhone: '+91 9876543210',
        hodEmail: 'michael.dean@college.edu',
        contactEmail: 'cs@college.edu',
      },
      {
        name: 'Electrical Engineering',
        block: 'Block B',
        hodName: 'Dr. Sarah Lee',
        hodPhone: '+91 9876543211',
        hodEmail: 'sarah.lee@college.edu',
        contactEmail: 'ee@college.edu',
      },
      {
        name: 'Mechanical Engineering',
        block: 'Block C',
        hodName: 'Dr. James Wilson',
        hodPhone: '+91 9876543212',
        hodEmail: 'james.wilson@college.edu',
        contactEmail: 'me@college.edu',
      },
      {
        name: 'Administration',
        block: 'Main Building',
        hodName: 'Mr. Robert Brown',
        hodPhone: '+91 9876543213',
        hodEmail: 'robert.brown@college.edu',
        contactEmail: 'admin@college.edu',
      },
    ]);

    // Create locations
    console.log('Creating locations...');
    const locations = await Location.create([
      { building: 'Block A', floor: '1st Floor', room: 'Lab 101', rack: 'R-01' },
      { building: 'Block A', floor: '2nd Floor', room: 'Lab 201', rack: 'R-02' },
      { building: 'Block B', floor: '1st Floor', room: 'Server Room', rack: 'SR-01' },
      { building: 'Main Building', floor: 'Ground Floor', room: 'IT Office' },
      { building: 'Block B', floor: '2nd Floor', room: 'Faculty Room', rack: 'FR-01' },
      { building: 'Block C', floor: '1st Floor', room: 'Workshop Lab', rack: 'WL-01' },
      { building: 'Block C', floor: '2nd Floor', room: 'Conference Room' },
      { building: 'Library Building', floor: '1st Floor', room: 'Study Hall', rack: 'LB-01' },
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
        status: 'ASSIGNED',
        departmentId: departments[0]._id,
        locationId: locations[2]._id,
        features: ['48 Ports', 'PoE Support', '10Gbps Uplinks'],
        notes: 'Core network infrastructure device',
        createdBy: admin._id,
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
        status: 'ASSIGNED',
        departmentId: departments[0]._id,
        locationId: locations[0]._id,
        features: ['WiFi 6E', 'PoE Support'],
        notes: 'Lab access point for student Wi-Fi',
        createdBy: admin._id,
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
        createdBy: admin._id,
      },
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
        status: 'ASSIGNED',
        departmentId: departments[1]._id,
        locationId: locations[1]._id,
        features: ['Intel i5', '8GB RAM', '256GB SSD'],
        notes: 'Faculty laptop for EE department',
        createdBy: admin._id,
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
        features: ['A3 Printing', 'Network Capable', 'Duplex'],
        notes: 'Departmental printer - currently under service',
        createdBy: admin._id,
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
        createdBy: admin._id,
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
        createdBy: admin._id,
      },
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
        createdBy: admin._id,
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
        status: 'ASSIGNED',
        departmentId: departments[0]._id,
        features: ['4GB RAM', '32GB SD Card', 'Case & Power Supply'],
        notes: 'For student IoT projects',
        createdBy: admin._id,
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
        status: 'ASSIGNED',
        departmentId: departments[2]._id,
        locationId: locations[2]._id,
        features: ['1500VA', 'LCD Display', '10 Outlets'],
        notes: 'Backup power for server room',
        createdBy: admin._id,
      },
    ]);

    // Create assignments
    console.log('Creating assignments...');
    await Assignment.create([
      {
        deviceId: devices[0]._id,
        departmentId: departments[0]._id,
        locationId: locations[2]._id,
        quantity: 1,
        notes: 'Core switch installed in server room',
        status: 'ACTIVE',
        assignedAt: new Date('2024-01-16'),
      },
      {
        deviceId: devices[1]._id,
        departmentId: departments[0]._id,
        locationId: locations[0]._id,
        quantity: 1,
        notes: 'WiFi access point for Lab 101',
        status: 'ACTIVE',
        assignedAt: new Date('2024-02-03'),
      },
      {
        deviceId: devices[3]._id,
        departmentId: departments[1]._id,
        locationId: locations[1]._id,
        quantity: 1,
        notes: 'Faculty laptop for EE department',
        status: 'ACTIVE',
        assignedAt: new Date('2024-03-15'),
      },
      {
        deviceId: devices[8]._id,
        departmentId: departments[0]._id,
        locationId: locations[0]._id,
        quantity: 10,
        notes: 'Student project kits for IoT course',
        status: 'ACTIVE',
        assignedAt: new Date('2024-07-28'),
      },
      {
        deviceId: devices[9]._id,
        departmentId: departments[2]._id,
        locationId: locations[2]._id,
        quantity: 1,
        notes: 'Backup power for server room equipment',
        status: 'ACTIVE',
        assignedAt: new Date('2024-08-20'),
      },
    ]);

    // Create audit logs
    console.log('Creating audit logs...');
    await AuditLog.create([
      {
        entityType: 'Device',
        entityId: devices[0]._id.toString(),
        action: 'CREATE',
        performedBy: admin._id,
        newData: { deviceName: 'Core Switch 01', status: 'ASSIGNED' },
        ipAddress: '192.168.1.100',
        userAgent: 'System/Seeder',
        timestamp: new Date('2024-01-16'),
      },
      {
        entityType: 'Device',
        entityId: devices[3]._id.toString(),
        action: 'STATUS_CHANGE',
        performedBy: admin._id,
        oldData: { status: 'IN_STOCK' },
        newData: { status: 'ASSIGNED' },
        ipAddress: '192.168.1.100',
        userAgent: 'System/Seeder',
        timestamp: new Date('2024-03-15'),
      },
      {
        entityType: 'Assignment',
        entityId: '12345',
        action: 'CREATE',
        performedBy: admin._id,
        newData: { status: 'ACTIVE' },
        ipAddress: '192.168.1.100',
        userAgent: 'System/Seeder',
        timestamp: new Date('2024-05-25'),
      },
      {
        entityType: 'Device',
        entityId: devices[4]._id.toString(),
        action: 'STATUS_CHANGE',
        performedBy: admin._id,
        oldData: { status: 'ASSIGNED' },
        newData: { status: 'MAINTENANCE' },
        ipAddress: '192.168.1.100',
        userAgent: 'System/Seeder',
        timestamp: new Date('2024-04-10'),
      },
      {
        entityType: 'Device',
        entityId: devices[6]._id.toString(),
        action: 'STATUS_CHANGE',
        performedBy: admin._id,
        oldData: { status: 'IN_STOCK' },
        newData: { status: 'SCRAPPED' },
        ipAddress: '192.168.1.100',
        userAgent: 'System/Seeder',
        timestamp: new Date('2023-12-20'),
      },
    ]);

    console.log('\nDatabase seeded successfully!');
    console.log('\nAdmin Credentials: admin@college.edu / demo1234');
    console.log('\nSeeded Data Summary:');
    console.log('  4 Departments with HOD details');
    console.log('  8 Locations across campus');
    console.log('  1 Admin user');
    console.log('  10 Devices (IN_STOCK, ASSIGNED, MAINTENANCE, SCRAPPED)');
    console.log('  5 Active assignments');
    console.log('  5 Audit log entries');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();