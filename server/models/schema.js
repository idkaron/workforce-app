import mongoose from 'mongoose';

// Base options to include virtuals when converting to JSON
const opts = { toJSON: { virtuals: true }, toObject: { virtuals: true } };

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'employee'], required: true },
  dept: { type: String },
  position: { type: String },
  managerId: { type: String, default: null },
  color: { type: String },
  techStatus: { type: String }
}, opts);

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  desc: { type: String },
  priority: { type: String },
  status: { type: String },
  deadline: { type: String },
  assignedTo: { type: String },
  createdBy: { type: String },
  progress: { type: Number, default: 0 },
  delayReason: { type: String, default: null },
  submittedAt: { type: String, default: null },
  approvedAt: { type: String, default: null },
  createdAt: { type: String }
}, opts);

const requestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String }, // 'extension', 'submission'
  taskId: { type: String },
  employeeId: { type: String },
  managerId: { type: String },
  justification: { type: String },
  status: { type: String, default: 'pending' }, // 'pending', 'approved', 'rejected'
  managerComment: { type: String, default: null },
  newDeadline: { type: String, default: null },
  createdAt: { type: String }
}, opts);

const customerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  company: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  hasAMC: { type: Boolean, default: false },
  createdAt: { type: String }
}, opts);

const jobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  customerId: { type: String },
  assignedTo: { type: String },
  priority: { type: String },
  status: { type: String }, // 'In Progress', 'Scheduled', 'Completed'
  deadline: { type: String },
  missedReason: { type: String, default: null },
  reportId: { type: String, default: null },
  createdAt: { type: String }
}, opts);

const quotationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerId: { type: String },
  items: [{ desc: String, qty: Number, rate: Number }],
  totalAmount: { type: Number },
  status: { type: String }, // 'Draft', 'Sent', 'Approved', 'Rejected'
  invoiceId: { type: String, default: null },
  createdAt: { type: String }
}, opts);

const invoiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerId: { type: String },
  quotationId: { type: String, default: null },
  totalAmount: { type: Number },
  status: { type: String }, // 'Pending', 'Paid', 'Overdue'
  dueDate: { type: String },
  createdAt: { type: String }
}, opts);

const contractSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerId: { type: String },
  startDate: { type: String },
  endDate: { type: String },
  totalVisits: { type: Number },
  completedVisits: { type: Number, default: 0 }
}, opts);

const reportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  jobId: { type: String },
  techId: { type: String },
  date: { type: String },
  details: { type: String },
  status: { type: String } // 'Pending', 'Approved'
}, opts);

export const User = mongoose.model('User', userSchema);
export const Task = mongoose.model('Task', taskSchema);
export const Request = mongoose.model('Request', requestSchema);
export const Customer = mongoose.model('Customer', customerSchema);
export const Job = mongoose.model('Job', jobSchema);
export const Quotation = mongoose.model('Quotation', quotationSchema);
export const Invoice = mongoose.model('Invoice', invoiceSchema);
export const Contract = mongoose.model('Contract', contractSchema);
export const Report = mongoose.model('Report', reportSchema);
