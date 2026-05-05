import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { getSession, logout, demoLogin, login, create, update, getAll, syncWithServer } from './store.js';

// ─── Context ──────────────────────────────────────────────────────────────────
export const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

// ─── Lazy page imports ────────────────────────────────────────────────────────
import Landing    from './pages/Landing.jsx';
import AuthPage   from './pages/Auth.jsx';
// employee
import EmpDash    from './pages/employee/Dashboard.jsx';
import MyTasks    from './pages/employee/MyTasks.jsx';
import Requests   from './pages/employee/Requests.jsx';
import History    from './pages/employee/History.jsx';
// manager
import MgrDash    from './pages/manager/Dashboard.jsx';
import Employees  from './pages/manager/Employees.jsx';
import Tasks      from './pages/manager/Tasks.jsx';
import Deadlines  from './pages/manager/Deadlines.jsx';
import Approvals  from './pages/manager/Approvals.jsx';
import Analytics  from './pages/manager/Analytics.jsx';
import Customers  from './pages/manager/Customers.jsx';
import Scheduling from './pages/manager/Scheduling.jsx';
import Quotations from './pages/manager/Quotations.jsx';
import Invoices   from './pages/manager/Invoices.jsx';
import Contracts  from './pages/manager/Contracts.jsx';
import Reports    from './pages/manager/Reports.jsx';
// admin
import AdminDash  from './pages/admin/Dashboard.jsx';
import Users      from './pages/admin/Users.jsx';
import Teams      from './pages/admin/Teams.jsx';

// ─── Shared UI ────────────────────────────────────────────────────────────────
export const Btn = ({ children, variant='primary', onClick, type='button', style={}, disabled=false }) => {
  const styles = {
    primary:   { background:'var(--primary)',     color:'#fff',                border:'none',     boxShadow:'var(--shadow-primary)' },
    secondary: { background:'var(--primary-light)',color:'var(--primary)',      border:'none',     boxShadow:'none' },
    danger:    { background:'var(--danger-bg)',   color:'var(--danger)',        border:'none',     boxShadow:'none' },
    success:   { background:'var(--success-bg)',  color:'var(--success)',       border:'none',     boxShadow:'none' },
    outline:   { background:'transparent',        color:'var(--text-secondary)',border:'1.5px solid var(--border)', boxShadow:'none' },
    ghost:     { background:'transparent',        color:'var(--muted)',         border:'none',     boxShadow:'none' },
    dark:      { background:'var(--sidebar-bg)',  color:'#fff',                border:'none',     boxShadow:'none' },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'9px 18px', borderRadius:'var(--radius-sm)',
      fontSize:'13.5px', fontWeight:600, cursor:disabled?'not-allowed':'pointer',
      opacity:disabled?0.6:1, transition:'var(--transition)',
      whiteSpace:'nowrap', ...s, ...style,
    }}
      onMouseEnter={e=>{ if(!disabled){ e.currentTarget.style.opacity='0.88'; e.currentTarget.style.transform='translateY(-1px)'; }}}
      onMouseLeave={e=>{ e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)'; }}
    >{children}</button>
  );
};

export const Card = ({ children, style={}, onClick }) => (
  <div onClick={onClick} style={{
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:'var(--radius-lg)', padding:24,
    boxShadow:'var(--shadow-sm)', transition:'var(--transition)',
    cursor:onClick?'pointer':'default', ...style,
  }}
    onMouseEnter={e=>{ if(onClick){ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow)'; }}}
    onMouseLeave={e=>{ if(onClick){ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='var(--shadow-sm)'; }}}
  >{children}</div>
);

export const Badge = ({ color='green', children, dot=false }) => {
  const cls = { green:'pill-green', yellow:'pill-yellow', red:'pill-red', blue:'pill-blue', purple:'pill-purple', gray:'pill-gray', primary:'pill-primary' };
  return <span className={`pill ${cls[color]||'pill-gray'}`}>{dot&&<span className="status-dot" style={{background:'currentColor'}}/>}{children}</span>;
};

export const Input = ({ label, type='text', value, onChange, placeholder, readOnly=false, style={} }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6, ...style }}>
    {label && <label className="form-label">{label}</label>}
    <input type={type} className="form-input" value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}/>
  </div>
);

export const Textarea = ({ label, value, onChange, placeholder, rows=4 }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
    {label && <label className="form-label">{label}</label>}
    <textarea className="form-input" value={value} onChange={onChange} placeholder={placeholder} rows={rows}/>
  </div>
);

export const Select = ({ label, value, onChange, options, style={} }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6, ...style }}>
    {label && <label className="form-label">{label}</label>}
    <select className="form-input" value={value} onChange={onChange}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

export const ProgressBar = ({ value=0, color='var(--primary)' }) => (
  <div className="progress-track">
    <div className="progress-fill" style={{ width:`${Math.min(100,value)}%`, background:color }}/>
  </div>
);

export const Avatar = ({ name='?', color='#4F6EF7', size=36 }) => (
  <div className="avatar" style={{ width:size, height:size, fontSize:size*0.38, background:color }}>
    {name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
  </div>
);

export const Modal = ({ title, onClose, children, footer }) => (
  <div className="modal-overlay" onClick={e=>{ if(e.target===e.currentTarget)onClose(); }}>
    <div className="modal-box">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid var(--border)' }}>
        <h3 style={{ fontSize:17, fontWeight:700 }}>{title}</h3>
        <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--muted)', lineHeight:1 }}>×</button>
      </div>
      <div style={{ padding:24 }}>{children}</div>
      {footer && <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border)', display:'flex', gap:10, justifyContent:'flex-end' }}>{footer}</div>}
    </div>
  </div>
);

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="page-header">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {actions && <div style={{ display:'flex', gap:10 }}>{actions}</div>}
  </div>
);

export const KpiCard = ({ label, value, icon, color='var(--primary)', sub, trend }) => (
  <div className="kpi-card" style={{ '--accent-color':color }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
      <span style={{ fontSize:13, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</span>
      <span style={{ fontSize:22 }}>{icon}</span>
    </div>
    <div style={{ fontSize:34, fontWeight:800, color:'var(--text)', lineHeight:1 }}>{value}</div>
    {(sub||trend) && (
      <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8 }}>
        {trend==='up'  && <span className="trend-up">↑</span>}
        {trend==='down'&& <span className="trend-down">↓</span>}
        {sub && <span style={{ fontSize:12, color:'var(--muted)' }}>{sub}</span>}
      </div>
    )}
  </div>
);

export const OverdueBanner = ({ count }) => count > 0 ? (
  <div className="overdue-banner">
    <span>🚨</span>
    <span><strong>{count} task{count>1?'s':''}</strong> {count>1?'are':'is'} overdue and require{count===1?'s':''} immediate attention.</span>
  </div>
) : null;

// ─── Toast system ─────────────────────────────────────────────────────────────
let _addToast = () => {};
export const toast = (msg, type='success') => _addToast(msg, type);

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    _addToast = (msg, type) => {
      const id = Math.random().toString(36).slice(2);
      setToasts(t => [...t, { id, msg, type }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    };
  }, []);
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  const colors = { success:'var(--success)', error:'var(--danger)', warning:'var(--warning)', info:'var(--info)' };
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast" style={{ borderLeft:`4px solid ${colors[t.type]||colors.info}` }}>
          <span>{icons[t.type]||icons.info}</span>
          <span style={{ fontSize:14, fontWeight:500 }}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = {
  employee: [
    { id:'emp-dash',    icon:'⚡', label:'Dashboard'       },
    { id:'my-tasks',    icon:'📋', label:'My Tasks'         },
    { id:'requests',    icon:'📨', label:'Extension Requests'},
    { id:'history',     icon:'📊', label:'Task History'     },
  ],
  manager: [
    { id:'mgr-dash',    icon:'⚡', label:'Overview',      section:'WORKSPACE' },
    { id:'employees',   icon:'👥', label:'Employees'                          },
    { id:'tasks',       icon:'📋', label:'Task Management'                    },
    { id:'deadlines',   icon:'📅', label:'Deadline Monitor'                   },
    { id:'approvals',   icon:'📨', label:'Approvals'                          },
    { id:'analytics',   icon:'📈', label:'Analytics'                          },
    { id:'customers',   icon:'🏢', label:'Customers',     section:'BUSINESS OPS' },
    { id:'scheduling',  icon:'🗓️', label:'Scheduling'                         },
    { id:'quotations',  icon:'📋', label:'Quotations'                         },
    { id:'invoices',    icon:'💰', label:'Invoices'                           },
    { id:'contracts',   icon:'🔒', label:'AMC Contracts'                      },
    { id:'reports',     icon:'📄', label:'Reports'                            },
  ],
  admin: [
    { id:'admin-dash',  icon:'⚡', label:'Global Overview' },
    { id:'users',       icon:'👥', label:'User Management' },
    { id:'teams',       icon:'🏢', label:'Team Overview'   },
  ],
};

const Sidebar = ({ page, setPage, user, theme, setTheme }) => {
  const items = NAV[user?.role] || [];
  let lastSection = '';
  return (
    <div className="sidebar">
      {/* Brand */}
      <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid var(--sidebar-border)' }}>
        <div style={{ fontFamily:'var(--font-display)', color:'#fff', fontSize:21, fontWeight:800, letterSpacing:'-0.5px', marginBottom:2 }}>
          <span style={{ color:'var(--primary-light)', filter:'brightness(2)' }}>W</span>orkForce<span style={{ color:'#4F6EF7' }}>Ops</span>
        </div>
        <div style={{ color:'var(--muted)', fontSize:11, fontWeight:500, letterSpacing:'0.04em' }}>CORPORATE MANAGEMENT PLATFORM</div>
        {/* User card */}
        <div style={{ marginTop:16, background:'rgba(255,255,255,0.05)', borderRadius:'var(--radius-sm)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
          <Avatar name={user?.name||'?'} color={user?.color||'#4F6EF7'} size={32}/>
          <div>
            <div style={{ color:'#E2E8F0', fontSize:13, fontWeight:600 }}>{user?.name}</div>
            <div style={{ color:'#64748B', fontSize:11, textTransform:'uppercase', fontWeight:700, letterSpacing:'0.05em' }}>{user?.role}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'12px 12px', overflowY:'auto' }}>
        {items.map(item => {
          const showSection = item.section && item.section !== lastSection;
          if (showSection) lastSection = item.section;
          const active = page === item.id;
          return (
            <div key={item.id}>
              {showSection && <div style={{ color:'#334155', fontSize:10, fontWeight:700, letterSpacing:'0.1em', padding:'16px 8px 6px', textTransform:'uppercase' }}>{item.section}</div>}
              <div className={`sidebar-nav-item${active?' active':''}`} onClick={() => setPage(item.id)}>
                <span style={{ fontSize:16, width:20, textAlign:'center' }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.id==='approvals' && <PendingBadge/>}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding:'12px 12px 20px', borderTop:'1px solid var(--sidebar-border)' }}>
        <div className="sidebar-nav-item" onClick={() => setTheme(theme==='dark'?'light':'dark')}>
          <span style={{ fontSize:16 }}>{theme==='dark'?'☀️':'🌙'}</span>
          <span>{theme==='dark'?'Light Mode':'Dark Mode'}</span>
        </div>
        <div className="sidebar-nav-item" onClick={() => { logout(); window.location.reload(); }}>
          <span style={{ fontSize:16 }}>🚪</span><span>Sign Out</span>
        </div>
      </div>
    </div>
  );
};

const PendingBadge = () => {
  const { user } = useApp();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (user?.role !== 'manager') return;
    const team = getAll('users').filter(u => u.managerId === user.id).map(u => u.id);
    const n = getAll('requests').filter(r => team.includes(r.employeeId) && r.status === 'pending').length;
    setCount(n);
  }, [user]);
  if (!count) return null;
  return <span style={{ background:'var(--danger)', color:'#fff', borderRadius:'var(--radius-full)', fontSize:10, fontWeight:800, padding:'1px 7px', marginLeft:'auto' }}>{count}</span>;
};

// ─── Layout ───────────────────────────────────────────────────────────────────
const Layout = ({ page, setPage, user, theme, setTheme, children }) => (
  <div style={{ display:'flex', minHeight:'100vh' }}>
    <Sidebar page={page} setPage={setPage} user={user} theme={theme} setTheme={setTheme}/>
    <main className="main-content">
      <div className="page-enter">{children}</div>
    </main>
  </div>
);

// ─── Route map ────────────────────────────────────────────────────────────────
const ROUTES = {
  // employee
  'emp-dash':   <EmpDash/>,
  'my-tasks':   <MyTasks/>,
  'requests':   <Requests/>,
  'history':    <History/>,
  // manager
  'mgr-dash':   <MgrDash/>,
  'employees':  <Employees/>,
  'tasks':      <Tasks/>,
  'deadlines':  <Deadlines/>,
  'approvals':  <Approvals/>,
  'analytics':  <Analytics/>,
  'customers':  <Customers/>,
  'scheduling': <Scheduling/>,
  'quotations': <Quotations/>,
  'invoices':   <Invoices/>,
  'contracts':  <Contracts/>,
  'reports':    <Reports/>,
  // admin
  'admin-dash': <AdminDash/>,
  'users':      <Users/>,
  'teams':      <Teams/>,
};

function defaultPage(role) {
  if (role === 'admin')    return 'admin-dash';
  if (role === 'manager')  return 'mgr-dash';
  return 'emp-dash';
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('wop_theme') || 'light');
  const [user, setUser]   = useState(null);
  const [page, setPage]   = useState('landing');
  const [refresh, setRefresh] = useState(0);
  const [syncKey, setSyncKey] = useState(0); 

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wop_theme', theme);
  }, [theme]);

  // Init store + session + sync
  useEffect(() => {
    syncWithServer();
    const handleSync = () => setSyncKey(s => s + 1);
    window.addEventListener('wop_sync_complete', handleSync);
    
    const s = getSession();
    if (s) { setUser(s); setPage(defaultPage(s.role)); }
    
    return () => window.removeEventListener('wop_sync_complete', handleSync);
  }, []);

  const doRefresh = useCallback(() => setRefresh(r => r+1), []);
  const handleAuth = (u) => { setUser(u); setPage(defaultPage(u.role)); };
  const handleDemoLogin = (role) => { try { const u = demoLogin(role); handleAuth(u); } catch(e) { alert(e.message); } };

  const ctxValue = { user, setUser, page, setPage, refresh, doRefresh, theme, syncKey };

  if (!user) {
    if (page === 'login' || page === 'register') {
      return (
        <Ctx.Provider value={ctxValue}>
          <div key={syncKey}>
            <AuthPage mode={page} setPage={setPage} onAuth={handleAuth} onDemo={handleDemoLogin}/>
            <ToastContainer/>
          </div>
        </Ctx.Provider>
      );
    }
    return (
      <Ctx.Provider value={ctxValue}>
        <div key={syncKey}>
          <Landing setPage={setPage}/>
          <ToastContainer/>
        </div>
      </Ctx.Provider>
    );
  }

  const PageComponent = ROUTES[page];
  return (
    <Ctx.Provider value={ctxValue}>
      <Layout page={page} setPage={setPage} user={user} theme={theme} setTheme={setTheme}>
        {PageComponent || <div style={{ color:'var(--muted)', padding:40 }}>Page not found: {page}</div>}
      </Layout>
      <ToastContainer/>
    </Ctx.Provider>
  );
}
