require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const Token = require('../models/Token');
const TokenSequence = require('../models/TokenSequence');

async function seedDatabase() {
  try {
    await connectDB();
    console.log('[Seed] Seeding initial database data...');

    // Clear existing test collections
    await User.deleteMany({});
    await Service.deleteMany({});
    await Counter.deleteMany({});
    await Token.deleteMany({});
    await TokenSequence.deleteMany({});

    console.log('[Seed] Cleared existing records.');

    // 1. Seed Users (Admin & Staff)
    const salt = await bcrypt.genSalt(12);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);
    const staffPasswordHash = await bcrypt.hash('staff123', salt);

    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@smartqueue.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN'
    });

    const staff = await User.create({
      name: 'Sarah Jenkins',
      email: 'staff@smartqueue.com',
      passwordHash: staffPasswordHash,
      role: 'STAFF'
    });

    console.log(`[Seed] Created Users: Admin (${admin.email}), Staff (${staff.email})`);

    // 2. Seed Services
    const generalBanking = await Service.create({
      name: 'General Banking & Cashier',
      description: 'Cash deposits, withdrawals, drafts and teller requests',
      averageServiceTime: 8,
      isActive: true
    });

    const accountServices = await Service.create({
      name: 'Account & Card Services',
      description: 'Account opening, debit/credit cards, and KYC verification',
      averageServiceTime: 12,
      isActive: true
    });

    const loanAdvisory = await Service.create({
      name: 'Loan & Wealth Advisory',
      description: 'Personal loans, home loans, and investment advisory',
      averageServiceTime: 20,
      isActive: true
    });

    const opdConsultation = await Service.create({
      name: 'OPD Doctor Consultation',
      description: 'General physician checkup and triage consultation',
      averageServiceTime: 15,
      isActive: true
    });

    console.log('[Seed] Created 4 core service categories.');

    // 3. Seed Counters
    const counter1 = await Counter.create({
      name: 'Counter 1',
      serviceId: generalBanking._id,
      isActive: true
    });

    const counter2 = await Counter.create({
      name: 'Counter 2',
      serviceId: accountServices._id,
      isActive: true
    });

    const counter3 = await Counter.create({
      name: 'Counter 3',
      serviceId: loanAdvisory._id,
      isActive: true
    });

    const counter4 = await Counter.create({
      name: 'Counter 4',
      serviceId: opdConsultation._id,
      isActive: true
    });

    console.log('[Seed] Created 4 physical counter stations.');

    // 4. Seed Sample Tokens
    const now = new Date();
    const dateCode = now.toISOString().slice(0, 10);

    // Initial sequence tracker
    await TokenSequence.create({
      serviceId: generalBanking._id,
      dateCode,
      sequence: 3
    });

    await TokenSequence.create({
      serviceId: accountServices._id,
      dateCode,
      sequence: 2
    });

    // Tokens for General Banking
    await Token.create({
      tokenNumber: 'GB-001',
      customerName: 'Marcus Vance',
      serviceId: generalBanking._id,
      counterId: counter1._id,
      status: 'SERVING',
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
      calledAt: new Date(Date.now() - 5 * 60 * 1000)
    });

    await Token.create({
      tokenNumber: 'GB-002',
      customerName: 'Amina Al-Mansoor',
      serviceId: generalBanking._id,
      status: 'WAITING',
      createdAt: new Date(Date.now() - 15 * 60 * 1000)
    });

    await Token.create({
      tokenNumber: 'GB-003',
      customerName: 'Liam O\'Connor',
      serviceId: generalBanking._id,
      status: 'WAITING',
      createdAt: new Date(Date.now() - 10 * 60 * 1000)
    });

    // Tokens for Account Services
    await Token.create({
      tokenNumber: 'AC-001',
      customerName: 'Priya Sharma',
      serviceId: accountServices._id,
      counterId: counter2._id,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 40 * 60 * 1000),
      calledAt: new Date(Date.now() - 25 * 60 * 1000),
      completedAt: new Date(Date.now() - 12 * 60 * 1000)
    });

    await Token.create({
      tokenNumber: 'AC-002',
      customerName: 'Eleanor Sterling',
      serviceId: accountServices._id,
      status: 'WAITING',
      createdAt: new Date(Date.now() - 8 * 60 * 1000)
    });

    console.log('[Seed] Created initial sample tokens.');
    console.log('[Seed] Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
}

seedDatabase();
