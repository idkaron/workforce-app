// ─── Workforce Ops Platform — Store (Optimistic MongoDB Sync) ────────────────
const PFX = 'wop_';

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

// Determine API base URL. If on localhost, use Express server. In production, use Netlify functions.
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : '/.netlify/functions/api';

const read  = (k) => { try { return JSON.parse(localStorage.getItem(PFX+k) || 'null') ?? []; } catch { return []; } };
const write = (k, v) => localStorage.setItem(PFX+k, JSON.stringify(v));

// ─── Sync with MongoDB Server ────────────────────────────────────────────────
export const syncWithServer = async () => {
  const collections = ['users', 'tasks', 'requests', 'customers', 'jobs', 'quotations', 'invoices', 'contracts', 'reports'];
  
  try {
    for (const collection of collections) {
      const response = await fetch(`${API_BASE}/${collection}`);
      if (response.ok) {
        const data = await response.json();
        write(collection, data);
      }
    }
    console.log('Successfully synced data from MongoDB Atlas');
    // Dispatch an event so components know to re-render with fresh data
    window.dispatchEvent(new Event('wop_sync_complete'));
  } catch (error) {
    console.error('Failed to sync with MongoDB:', error);
  }
};

// ─── Generic CRUD (Optimistic) ───────────────────────────────────────────────
export const getAll   = (k) => read(k);
export const getById  = (k, id) => read(k).find(x => x.id === id) || null;

export const create = (k, data) => { 
  const rows = read(k); 
  const item = { id: uid(), createdAt: now(), ...data }; 
  rows.push(item); 
  write(k, rows); // Save locally instantly
  
  // Save to MongoDB in background
  fetch(`${API_BASE}/${k}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  }).catch(err => console.error(`Failed to sync ${k} creation:`, err));

  return item; 
};

export const update = (k, id, patch) => { 
  const rows = read(k).map(x => x.id === id ? { ...x, ...patch } : x); 
  write(k, rows); // Save locally instantly
  const updatedItem = rows.find(x => x.id === id);

  // Update MongoDB in background
  fetch(`${API_BASE}/${k}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedItem)
  }).catch(err => console.error(`Failed to sync ${k} update:`, err));

  return updatedItem; 
};

export const remove = (k, id) => { 
  const rows = read(k).filter(x => x.id !== id); 
  write(k, rows); // Save locally instantly

  // Delete from MongoDB in background
  fetch(`${API_BASE}/${k}/${id}`, {
    method: 'DELETE'
  }).catch(err => console.error(`Failed to sync ${k} deletion:`, err));
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function login(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!res.ok) throw new Error('Invalid email or password');
    const safe = await res.json();
    sessionStorage.setItem('wop_session', JSON.stringify(safe));
    return safe;
  } catch (error) {
    // Fallback to local auth if server is unreachable
    const users = read('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) throw new Error('Invalid email or password');
    const { password: _, ...safe } = user;
    sessionStorage.setItem('wop_session', JSON.stringify(safe));
    return safe;
  }
}
export function logout() { sessionStorage.removeItem('wop_session'); }
export function getSession() { try { return JSON.parse(sessionStorage.getItem('wop_session')); } catch { return null; } }
export function demoLogin(role) {
  const map = { admin:'admin@company.com', manager:'alex@company.com', employee:'david@company.com' };
  return login(map[role], role === 'admin' ? 'admin123' : role === 'manager' ? 'manager123' : 'emp123');
}

// ─── Domain helpers ───────────────────────────────────────────────────────────
export function getMyTeam(managerId) { return read('users').filter(u => u.managerId === managerId); }
export function getTasksForManager(managerId) {
  const team = getMyTeam(managerId).map(u => u.id);
  return read('tasks').filter(t => team.includes(t.assignedTo) || t.createdBy === managerId);
}
export function getTasksForEmployee(empId) { return read('tasks').filter(t => t.assignedTo === empId); }
export function getPendingRequests(managerId) {
  const team = getMyTeam(managerId).map(u => u.id);
  return read('requests').filter(r => team.includes(r.employeeId) && r.status === 'pending');
}
export function getUserById(id) {
  const u = read('users').find(x => x.id === id);
  if (!u) return null;
  const { password: _, ...safe } = u;
  return safe;
}
export function taskRisk(task) {
  if (task.status === 'closed' || task.status === 'approved') return 'green';
  const days = (new Date(task.deadline) - Date.now()) / 86400000;
  if (days < 0) return 'red';
  if (days < 3 || task.progress < 30) return 'red';
  if (days < 7 || task.progress < 60) return 'yellow';
  return 'green';
}
export function employeeRisk(empId) {
  const tasks = getTasksForEmployee(empId).filter(t => t.status !== 'closed' && t.status !== 'approved');
  if (!tasks.length) return 'green';
  const risks = tasks.map(taskRisk);
  if (risks.includes('red')) return 'red';
  if (risks.includes('yellow')) return 'yellow';
  return 'green';
}
export function teamKpis(managerId) {
  const tasks = getTasksForManager(managerId);
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'closed' || t.status === 'approved').length;
  const overdue = tasks.filter(t => taskRisk(t) === 'red' && t.status !== 'closed' && t.status !== 'approved').length;
  const onTime = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pending = getPendingRequests(managerId).length;
  return { total, completed, overdue, onTime, pending };
}
export function globalKpis() {
  const users = read('users');
  const tasks = read('tasks');
  const employees = users.filter(u => u.role === 'employee').length;
  const managers  = users.filter(u => u.role === 'manager').length;
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'closed' || t.status === 'approved').length;
  const overdue   = tasks.filter(t => taskRisk(t) === 'red' && t.status !== 'closed' && t.status !== 'approved').length;
  const onTime = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { employees, managers, total, completed, overdue, onTime };
}
export function getCustomerById(id) { return read('customers').find(x => x.id === id) || null; }
export function getJobById(id) { return read('jobs').find(x => x.id === id) || null; }
