// Mock Data for SmartQueue UI

export const INITIAL_SERVICES = [
  {
    id: 'srv-1',
    name: 'General Banking & Cashier',
    code: 'A',
    description: 'Cash deposits, withdrawals, demand drafts, and check clearing.',
    estimatedTime: 8, // minutes
    iconName: 'CreditCard',
    color: 'emerald'
  },
  {
    id: 'srv-2',
    name: 'Account & Card Services',
    code: 'B',
    description: 'New account opening, debit/credit cards, KYC verification.',
    estimatedTime: 12,
    iconName: 'UserCheck',
    color: 'purple'
  },
  {
    id: 'srv-3',
    name: 'Loan & Wealth Advisory',
    code: 'C',
    description: 'Home loans, personal loans, mutual funds, and fixed deposits.',
    estimatedTime: 20,
    iconName: 'Briefcase',
    color: 'indigo'
  },
  {
    id: 'srv-4',
    name: 'OPD Doctor Consultation',
    code: 'D',
    description: 'General physician checkup, vitals triage, specialist referral.',
    estimatedTime: 15,
    iconName: 'Stethoscope',
    color: 'rose'
  },
  {
    id: 'srv-5',
    name: 'Student Admissions & Fees',
    code: 'E',
    description: 'Document verification, semester fee payment, transcript request.',
    estimatedTime: 10,
    iconName: 'GraduationCap',
    color: 'amber'
  }
];

export const INITIAL_COUNTERS = [
  {
    id: 'cnt-1',
    number: 'Counter 1',
    name: 'Cashier & Express Desk',
    staffName: 'Sarah Jenkins',
    supportedServiceIds: ['srv-1'],
    status: 'OPEN',
    currentToken: 'A-101'
  },
  {
    id: 'cnt-2',
    number: 'Counter 2',
    name: 'Customer Service & KYC',
    staffName: 'David Chen',
    supportedServiceIds: ['srv-2'],
    status: 'OPEN',
    currentToken: 'B-102'
  },
  {
    id: 'cnt-3',
    number: 'Counter 3',
    name: 'Loan & Financial Desk',
    staffName: 'Elena Rostova',
    supportedServiceIds: ['srv-3'],
    status: 'OPEN',
    currentToken: 'C-084'
  },
  {
    id: 'cnt-4',
    number: 'Counter 4',
    name: 'Medical Triage / OPD',
    staffName: 'Dr. Michael Ray',
    supportedServiceIds: ['srv-4'],
    status: 'ON_BREAK',
    currentToken: null
  }
];

export const INITIAL_TOKENS = [
  {
    id: 'tok-1',
    tokenNumber: 'A-101',
    customerName: 'Marcus Vance',
    phone: '+1 555-0192',
    serviceId: 'srv-1',
    serviceName: 'General Banking & Cashier',
    counterId: 'cnt-1',
    counterNumber: 'Counter 1',
    status: 'SERVING', // WAITING, SERVING, COMPLETED, SKIPPED
    priority: 'NORMAL',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    calledAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    waitMinutes: 21,
    serviceMinutes: 4
  },
  {
    id: 'tok-2',
    tokenNumber: 'B-102',
    customerName: 'Priya Sharma',
    phone: '+1 555-0844',
    serviceId: 'srv-2',
    serviceName: 'Account & Card Services',
    counterId: 'cnt-2',
    counterNumber: 'Counter 2',
    status: 'SERVING',
    priority: 'PRIORITY',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    calledAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    waitMinutes: 12,
    serviceMinutes: 6
  },
  {
    id: 'tok-3',
    tokenNumber: 'C-084',
    customerName: 'Robert Hayes',
    phone: '+1 555-0329',
    serviceId: 'srv-3',
    serviceName: 'Loan & Wealth Advisory',
    counterId: 'cnt-3',
    counterNumber: 'Counter 3',
    status: 'SERVING',
    priority: 'NORMAL',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    calledAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    waitMinutes: 20,
    serviceMinutes: 10
  },
  {
    id: 'tok-4',
    tokenNumber: 'A-102',
    customerName: 'Amina Al-Mansoor',
    phone: '+1 555-0911',
    serviceId: 'srv-1',
    serviceName: 'General Banking & Cashier',
    counterId: null,
    counterNumber: null,
    status: 'WAITING',
    priority: 'NORMAL',
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    calledAt: null,
    waitMinutes: 14,
    serviceMinutes: 0
  },
  {
    id: 'tok-5',
    tokenNumber: 'A-103',
    customerName: 'Liam O\'Connor',
    phone: '+1 555-0456',
    serviceId: 'srv-1',
    serviceName: 'General Banking & Cashier',
    counterId: null,
    counterNumber: null,
    status: 'WAITING',
    priority: 'NORMAL',
    createdAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    calledAt: null,
    waitMinutes: 11,
    serviceMinutes: 0
  },
  {
    id: 'tok-6',
    tokenNumber: 'B-103',
    customerName: 'Eleanor Sterling (Senior Citizen)',
    phone: '+1 555-0678',
    serviceId: 'srv-2',
    serviceName: 'Account & Card Services',
    counterId: null,
    counterNumber: null,
    status: 'WAITING',
    priority: 'PRIORITY',
    createdAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    calledAt: null,
    waitMinutes: 9,
    serviceMinutes: 0
  },
  {
    id: 'tok-7',
    tokenNumber: 'C-085',
    customerName: 'Daniel Kim',
    phone: '+1 555-0233',
    serviceId: 'srv-3',
    serviceName: 'Loan & Wealth Advisory',
    counterId: null,
    counterNumber: null,
    status: 'WAITING',
    priority: 'NORMAL',
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    calledAt: null,
    waitMinutes: 6,
    serviceMinutes: 0
  },
  {
    id: 'tok-8',
    tokenNumber: 'E-045',
    customerName: 'Chloe Bennett',
    phone: '+1 555-0782',
    serviceId: 'srv-5',
    serviceName: 'Student Admissions & Fees',
    counterId: null,
    counterNumber: null,
    status: 'WAITING',
    priority: 'NORMAL',
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    calledAt: null,
    waitMinutes: 3,
    serviceMinutes: 0
  },
  // Completed tokens for history
  {
    id: 'tok-9',
    tokenNumber: 'A-099',
    customerName: 'Carlos Gomez',
    phone: '+1 555-0112',
    serviceId: 'srv-1',
    serviceName: 'General Banking & Cashier',
    counterId: 'cnt-1',
    counterNumber: 'Counter 1',
    status: 'COMPLETED',
    priority: 'NORMAL',
    createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    calledAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    waitMinutes: 17,
    serviceMinutes: 9
  },
  {
    id: 'tok-10',
    tokenNumber: 'A-100',
    customerName: 'Samantha Wu',
    phone: '+1 555-0554',
    serviceId: 'srv-1',
    serviceName: 'General Banking & Cashier',
    counterId: 'cnt-1',
    counterNumber: 'Counter 1',
    status: 'COMPLETED',
    priority: 'NORMAL',
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    calledAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    waitMinutes: 15,
    serviceMinutes: 8
  },
  {
    id: 'tok-11',
    tokenNumber: 'B-101',
    customerName: 'James Wilson',
    phone: '+1 555-0993',
    serviceId: 'srv-2',
    serviceName: 'Account & Card Services',
    counterId: 'cnt-2',
    counterNumber: 'Counter 2',
    status: 'SKIPPED',
    priority: 'NORMAL',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    calledAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    waitMinutes: 23,
    serviceMinutes: 0
  },
  {
    id: 'tok-12',
    tokenNumber: 'C-083',
    customerName: 'Grace Hopper',
    phone: '+1 555-0812',
    serviceId: 'srv-3',
    serviceName: 'Loan & Wealth Advisory',
    counterId: 'cnt-3',
    counterNumber: 'Counter 3',
    status: 'COMPLETED',
    priority: 'NORMAL',
    createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    calledAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    waitMinutes: 30,
    serviceMinutes: 18
  }
];
