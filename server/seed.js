import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './db.js';
import { User, Task, Request, Customer, Job, Quotation, Invoice, Contract, Report } from './models/schema.js';

dotenv.config();

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0,10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0,10);

const SEED = {
  users: [
    { id:'u001', name:'Sarah Chen',      email:'admin@company.com',  password:'admin123',   role:'admin',    dept:'Executive',    position:'System Administrator',   managerId:null,  color:'#8B5CF6' },
    { id:'u002', name:'Alex Johnson',    email:'alex@company.com',   password:'manager123', role:'manager',  dept:'Engineering',  position:'Engineering Manager',    managerId:null,  color:'#4F6EF7' },
    { id:'u003', name:'Maria Garcia',    email:'maria@company.com',  password:'manager123', role:'manager',  dept:'Operations',   position:'Operations Manager',     managerId:null,  color:'#F59E0B' },
    { id:'u004', name:'James Wilson',    email:'james@company.com',  password:'manager123', role:'manager',  dept:'Sales',        position:'Sales Manager',          managerId:null,  color:'#10B981' },
    { id:'u005', name:'David Kumar',     email:'david@company.com',  password:'emp123',     role:'employee', dept:'Engineering',  position:'Senior Developer',       managerId:'u002',color:'#4F6EF7', techStatus:'Available' },
    { id:'u006', name:'Emma Rodriguez',  email:'emma@company.com',   password:'emp123',     role:'employee', dept:'Engineering',  position:'Frontend Developer',     managerId:'u002',color:'#EC4899', techStatus:'On Job' },
    { id:'u007', name:'Ryan Patel',      email:'ryan@company.com',   password:'emp123',     role:'employee', dept:'Engineering',  position:'Backend Developer',      managerId:'u002',color:'#06B6D4', techStatus:'Available' },
    { id:'u008', name:'Chris Lee',       email:'chris@company.com',  password:'emp123',     role:'employee', dept:'Operations',   position:'Operations Analyst',     managerId:'u003',color:'#F59E0B', techStatus:'Off Duty' },
    { id:'u009', name:'Lisa Thompson',   email:'lisa@company.com',   password:'emp123',     role:'employee', dept:'Operations',   position:'Field Coordinator',      managerId:'u003',color:'#84CC16', techStatus:'On Job' },
    { id:'u010', name:'Tom Anderson',    email:'tom@company.com',    password:'emp123',     role:'employee', dept:'Operations',   position:'Site Supervisor',        managerId:'u003',color:'#F97316', techStatus:'Available' },
    { id:'u011', name:'Priya Singh',     email:'priya@company.com',  password:'emp123',     role:'employee', dept:'Sales',        position:'Sales Executive',        managerId:'u004',color:'#A855F7', techStatus:'Available' },
    { id:'u012', name:'Kevin Brown',     email:'kevin@company.com',  password:'emp123',     role:'employee', dept:'Sales',        position:'Account Manager',        managerId:'u004',color:'#14B8A6', techStatus:'On Job' },
    { id:'u013', name:'Nina Okafor',     email:'nina@company.com',   password:'emp123',     role:'employee', dept:'Sales',        position:'Business Development',   managerId:'u004',color:'#F43F5E', techStatus:'Available' },
  ],
  tasks: [
    { id:'t001', title:'Design System Architecture',    desc:'Build the core design token system and component library.',        priority:'high',     status:'in_progress', deadline:daysFromNow(5),  assignedTo:'u005', createdBy:'u002', progress:65, delayReason:null, submittedAt:null, approvedAt:null, createdAt:daysAgo(12) },
    { id:'t002', title:'API Integration — Auth Module', desc:'Integrate JWT auth with the new identity provider.',               priority:'critical',  status:'submitted',   deadline:daysFromNow(2),  assignedTo:'u006', createdBy:'u002', progress:100,delayReason:null, submittedAt:daysAgo(1), approvedAt:null, createdAt:daysAgo(20) },
    { id:'t003', title:'Database Migration Scripts',    desc:'Write and test migration scripts for the new schema.',             priority:'high',     status:'assigned',    deadline:daysFromNow(10), assignedTo:'u007', createdBy:'u002', progress:20, delayReason:null, submittedAt:null, approvedAt:null, createdAt:daysAgo(3)  },
    { id:'t004', title:'Quarterly Report — Q1',         desc:'Compile and review Q1 operational data for board presentation.',   priority:'medium',   status:'overdue',     deadline:daysAgo(3),      assignedTo:'u008', createdBy:'u003', progress:40, delayReason:null, submittedAt:null, approvedAt:null, createdAt:daysAgo(18) },
    { id:'t005', title:'Supplier Contract Renewals',    desc:'Renew 6 expiring supplier contracts before end of month.',         priority:'high',     status:'in_progress', deadline:daysFromNow(7),  assignedTo:'u009', createdBy:'u003', progress:75, delayReason:null, submittedAt:null, approvedAt:null, createdAt:daysAgo(10) },
    { id:'t006', title:'Field Inspection Report',       desc:'Conduct and document inspection of all active field sites.',       priority:'low',      status:'closed',      deadline:daysAgo(5),      assignedTo:'u010', createdBy:'u003', progress:100,delayReason:null, submittedAt:daysAgo(6), approvedAt:daysAgo(4), createdAt:daysAgo(25) },
    { id:'t007', title:'CRM Data Cleanup',              desc:'Deduplicate and enrich the customer database records.',            priority:'medium',   status:'in_progress', deadline:daysFromNow(4),  assignedTo:'u011', createdBy:'u004', progress:50, delayReason:null, submittedAt:null, approvedAt:null, createdAt:daysAgo(8)  },
    { id:'t008', title:'Q2 Sales Pitch Decks',          desc:'Prepare pitch decks for the 5 key accounts targeted in Q2.',      priority:'high',     status:'assigned',    deadline:daysFromNow(14), assignedTo:'u012', createdBy:'u004', progress:10, delayReason:null, submittedAt:null, approvedAt:null, createdAt:daysAgo(2)  },
    { id:'t009', title:'Lead Generation Campaign',      desc:'Run LinkedIn + email outreach for 200 new leads.',                priority:'medium',   status:'approved',    deadline:daysAgo(7),      assignedTo:'u013', createdBy:'u004', progress:100,delayReason:null, submittedAt:daysAgo(8), approvedAt:daysAgo(6), createdAt:daysAgo(30) },
    { id:'t010', title:'Performance Testing Suite',     desc:'Run load tests against the new payment gateway endpoints.',        priority:'critical',  status:'overdue',     deadline:daysAgo(2),      assignedTo:'u005', createdBy:'u002', progress:30, delayReason:null, submittedAt:null, approvedAt:null, createdAt:daysAgo(14) },
  ],
  requests: [
    { id:'r001', type:'extension',   taskId:'t001', employeeId:'u005', managerId:'u002', justification:'Scope grew significantly — added 3 new component types.', status:'pending',  managerComment:null,              newDeadline:daysFromNow(12), createdAt:daysAgo(1)  },
    { id:'r002', type:'submission',  taskId:'t002', employeeId:'u006', managerId:'u002', justification:'All tests passing. Ready for review.',                    status:'pending',  managerComment:null,              newDeadline:null,            createdAt:daysAgo(1)  },
    { id:'r003', type:'extension',   taskId:'t004', employeeId:'u008', managerId:'u003', justification:'Awaiting data from Finance team — ETA 2 days.',           status:'approved', managerComment:'Approved. Keep me posted.', newDeadline:daysFromNow(4), createdAt:daysAgo(4) },
    { id:'r004', type:'extension',   taskId:'t010', employeeId:'u005', managerId:'u002', justification:'Test environment was down for 3 days due to infra issues.', status:'rejected', managerComment:'Cannot approve — escalate to DevOps.', newDeadline:daysFromNow(1), createdAt:daysAgo(3) },
  ],
  customers: [
    { id:'c001', name:'TechNova Ltd',       company:'TechNova',      email:'contact@technova.com', phone:'+91-9812345670', address:'12 Innovation Park, Bangalore', hasAMC:true,  createdAt:daysAgo(180) },
    { id:'c002', name:'Meridian Builders',  company:'Meridian',      email:'info@meridian.in',     phone:'+91-9823456781', address:'45 Business Hub, Hyderabad',    hasAMC:true,  createdAt:daysAgo(120) },
    { id:'c003', name:'Sunrise Hospitals',  company:'Sunrise Group',  email:'ops@sunrise.org',      phone:'+91-9834567892', address:'77 Medical Lane, Chennai',      hasAMC:false, createdAt:daysAgo(90)  },
    { id:'c004', name:'Coastal Logistics',  company:'CoastLog',      email:'fleet@coastlog.com',   phone:'+91-9845678903', address:'3 Port Road, Mumbai',           hasAMC:true,  createdAt:daysAgo(60)  },
    { id:'c005', name:'GreenField Estates', company:'GreenField',    email:'admin@gfe.in',         phone:'+91-9856789014', address:'19 Garden Blvd, Pune',          hasAMC:false, createdAt:daysAgo(30)  },
    { id:'c006', name:'Delta Manufacturing',company:'Delta Mfg',     email:'purchase@delta.com',   phone:'+91-9867890125', address:'88 Industrial Zone, Surat',     hasAMC:true,  createdAt:daysAgo(15)  },
  ],
  jobs: [
    { id:'j001', title:'Fire Suppression Install — TechNova',   customerId:'c001', assignedTo:'u009', priority:'High',   status:'In Progress', deadline:daysFromNow(3),  missedReason:null, reportId:null, createdAt:daysAgo(5)  },
    { id:'j002', title:'Annual Inspection — Meridian HQ',        customerId:'c002', assignedTo:'u010', priority:'Medium', status:'Scheduled',   deadline:daysFromNow(10), missedReason:null, reportId:null, createdAt:daysAgo(2)  },
    { id:'j003', title:'Sprinkler Maintenance — Sunrise',        customerId:'c003', assignedTo:'u009', priority:'High',   status:'Completed',   deadline:daysAgo(2),      missedReason:null, reportId:'rp001', createdAt:daysAgo(15) },
    { id:'j004', title:'Emergency Alarm Service — Delta Mfg',   customerId:'c006', assignedTo:'u010', priority:'High',   status:'Scheduled',   deadline:daysAgo(1),      missedReason:null, reportId:null, createdAt:daysAgo(7)  },
    { id:'j005', title:'AMC Visit #3 — Coastal Logistics',       customerId:'c004', assignedTo:'u008', priority:'Low',    status:'Completed',   deadline:daysAgo(5),      missedReason:null, reportId:'rp002', createdAt:daysAgo(12) },
  ],
  quotations: [
    { id:'q001', customerId:'c001', items:[{desc:'Fire Panel Installation',qty:1,rate:45000},{desc:'Smoke Detectors x20',qty:20,rate:1200}], totalAmount:69000, status:'Approved', invoiceId:'inv001', createdAt:daysAgo(20) },
    { id:'q002', customerId:'c002', items:[{desc:'Annual Inspection Service',qty:1,rate:12000}], totalAmount:12000, status:'Sent',     invoiceId:null,     createdAt:daysAgo(9) },
    { id:'q003', customerId:'c003', items:[{desc:'Sprinkler System Upgrade',qty:1,rate:78000}], totalAmount:78000, status:'Draft',    invoiceId:null,     createdAt:daysAgo(3) },
    { id:'q004', customerId:'c005', items:[{desc:'Fire Extinguisher Supply x10',qty:10,rate:3500}], totalAmount:35000, status:'Sent', invoiceId:null,     createdAt:daysAgo(12) },
    { id:'q005', customerId:'c006', items:[{desc:'Emergency Alarm System',qty:1,rate:55000}], totalAmount:55000, status:'Rejected', invoiceId:null,    createdAt:daysAgo(18) },
  ],
  invoices: [
    { id:'inv001', customerId:'c001', quotationId:'q001', totalAmount:69000, status:'Paid',    dueDate:daysAgo(5),      createdAt:daysAgo(18) },
    { id:'inv002', customerId:'c004', quotationId:null,   totalAmount:24000, status:'Pending', dueDate:daysFromNow(5),  createdAt:daysAgo(10) },
    { id:'inv003', customerId:'c006', quotationId:null,   totalAmount:15500, status:'Overdue', dueDate:daysAgo(3),      createdAt:daysAgo(25) },
  ],
  contracts: [
    { id:'ct001', customerId:'c001', startDate:daysAgo(300), endDate:daysFromNow(65),  totalVisits:4, completedVisits:3 },
    { id:'ct002', customerId:'c002', startDate:daysAgo(200), endDate:daysFromNow(165), totalVisits:6, completedVisits:4 },
    { id:'ct003', customerId:'c004', startDate:daysAgo(100), endDate:daysFromNow(20),  totalVisits:4, completedVisits:4 },
    { id:'ct004', customerId:'c006', startDate:daysAgo(30),  endDate:daysFromNow(335), totalVisits:8, completedVisits:1 },
  ],
  reports: [
    { id:'rp001', jobId:'j003', techId:'u009', date:daysAgo(2),  details:'Sprinkler maintenance completed. All 12 heads checked and pressure tested. System operational.', status:'Approved' },
    { id:'rp002', jobId:'j005', techId:'u008', date:daysAgo(5),  details:'AMC Visit #3 completed. Fire extinguishers recharged, exit signs checked, alarm panel tested.', status:'Pending'  },
  ],
};

const importData = async () => {
  try {
    await connectDB();

    await User.deleteMany();
    await Task.deleteMany();
    await Request.deleteMany();
    await Customer.deleteMany();
    await Job.deleteMany();
    await Quotation.deleteMany();
    await Invoice.deleteMany();
    await Contract.deleteMany();
    await Report.deleteMany();

    await User.insertMany(SEED.users);
    await Task.insertMany(SEED.tasks);
    await Request.insertMany(SEED.requests);
    await Customer.insertMany(SEED.customers);
    await Job.insertMany(SEED.jobs);
    await Quotation.insertMany(SEED.quotations);
    await Invoice.insertMany(SEED.invoices);
    await Contract.insertMany(SEED.contracts);
    await Report.insertMany(SEED.reports);

    console.log('Data Imported successfully into MongoDB!');
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error}`);
    process.exit(1);
  }
};

importData();
