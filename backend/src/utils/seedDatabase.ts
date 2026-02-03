import mongoose from 'mongoose';
import { config } from '../config';
import { User, Department, Location, Device, Assignment } from '../models';

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
    ]);

    // Create assignments
    console.log('Creating assignments...');
    await Assignment.create([
      {
        deviceId: devices[2]._id,
        departmentId: departments[1]._id,
        locationId: locations[2]._id,
        requestedBy: users[2]._id,
        quantity: 1,
        reason: 'NEW_REQUIREMENT',
        notes: 'Need server for new research project',
        status: 'REQUESTED',
      },
    ]);

    console.log('✅ Database seeded successfully!');
    console.log('\n📧 Login Credentials (all passwords: demo1234):');
    console.log('Super Admin: john@college.edu / demo1234');
    console.log('IT Staff: sarah@college.edu / demo1234');
    console.log('IT Staff: mike@college.edu / demo1234');
    console.log('Dept Incharge: emily@college.edu / demo1234');
    console.log('Dept Incharge: david@college.edu / demo1234');
    console.log('\n🔗 These match the frontend mock users exactly.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();