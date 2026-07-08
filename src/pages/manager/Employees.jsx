import { useState, useEffect } from 'react';
import { useApp, PageHeader, Card, Badge, Btn, Avatar, ProgressBar, Modal, Input, Select, toast } from '../../App.jsx';
import { getMyTeam, getTasksForManager, employeeRisk, taskRisk, update, remove, getAll } from '../../store.js';

const PRIORITIES = [
  { value:'low',      label:'Low'      },
  { value:'medium',   label:'Medium'   },
  { value:'high',     label:'High'     },
  { value:'critical', label:'Critical' },
];
const pColor = { low:'green', medium:'blue', high:'yellow', critical:'red' };
const sColor = {
  assigned:'blue', in_progress:'primary', submitted:'yellow',
  approved:'green', rejected:'red', closed:'green', overdue:'red',
  forwarded:'purple', waiting_approval:'yellow', sent_to_client:'blue',
  client_approved:'green', completed:'green',
};
const sLabel = {
  assigned:'Assigned', in_progress:'In Progress', submitted:'Submitted',
  approved:'Approved', rejected:'Rejected', closed:'Closed', overdue:'Overdue',
  forwarded:'Forwarded', waiting_approval:'Waiting Approval', sent_to_client:'Sent to Client',
  client_approved:'Client Approved', completed:'Completed',
};

// ─── Reassign Modal ────────────────────────────────────────────────────────
function ReassignModal({ task, currentEmp, team, onClose, onConfirm }) {
  const [toId, setToId] = useState('');
  
  const empOptions = [
    { value: '', label: 'Select employee...' },
    ...team.filter(u => u.id !== currentEmp.id).map(u => ({ value: u.id, label: u.name + (u.position ? ' (' + u.position + ')' : '') })),
  ];

  const handleSubmit = () => {
    if (!toId) { toast('Please select an employee', 'error'); return; }
    onConfirm(task.id, toId);
  };

  return (
    <Modal title="🔄 Reassign Task" onClose={onClose} footer={
      <div style={{ display:'flex', gap:10 }}>
        <Btn variant="outline" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSubmit}>Confirm Reassignment</Btn>
      </div>
    }>
      <p style={{ fontSize:14, color:'#64748B', marginBottom:20 }}>
        Reassign <strong style={{ color:'#0F172A' }}>"{task.title}"</strong> from {currentEmp.name} to someone else.
      </p>
      <Select label="Assign To *" value={toId} onChange={e => setToId(e.target.value)} options={empOptions} />
    </Modal>
  );
}

// ─── Edit Task Modal ───────────────────────────────────────────────────────
function EditTaskModal({ task, onClose, onConfirm }) {
  const [form, setForm] = useState({ title: task.title, deadline: task.deadline, priority: task.priority });

  const handleSubmit = () => {
    if (!form.title.trim() || !form.deadline) { toast('Title and deadline are required', 'error'); return; }
    onConfirm(task.id, form);
  };

  return (
    <Modal title="✏️ Edit Task" onClose={onClose} footer={
      <div style={{ display:'flex', gap:10 }}>
        <Btn variant="outline" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSubmit}>Save Changes</Btn>
      </div>
    }>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <Input label="Task Title *" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Select label="Priority *" value={form.priority} onChange={e => setForm(p => ({...p, priority: e.target.value}))} options={PRIORITIES} />
          <Input label="Deadline *" type="date" value={form.deadline} onChange={e => setForm(p => ({...p, deadline: e.target.value}))} />
        </div>
      </div>
    </Modal>
  );
}

// ─── Employee Workspace Modal ──────────────────────────────────────────────
function EmployeeWorkspace({ employee, initialFilter = 'all', onClose, managerId, doRefresh }) {
  const [filter, setFilter] = useState(initialFilter);
  const [tasks, setTasks] = useState([]);
  const [reassignModal, setReassignModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const team = getAll('users').filter(u => u.role === 'employee' || u.role === 'manager');

  const loadTasks = () => {
    setTasks(getTasksForManager(managerId).filter(t => t.assignedTo === employee.id));
  };
  useEffect(() => { loadTasks(); }, [employee.id]);

  const active = tasks.filter(t => t.status !== 'closed' && t.status !== 'approved');
  const overdueCount = active.filter(t => taskRisk(t) === 'red').length;

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'active') return t.status !== 'closed' && t.status !== 'approved' && t.status !== 'completed';
    if (filter === 'overdue') return taskRisk(t) === 'red' && t.status !== 'closed' && t.status !== 'approved' && t.status !== 'completed';
    if (filter === 'completed') return t.status === 'closed' || t.status === 'approved' || t.status === 'completed';
    return t.status === filter;
  });

  const now = new Date();

  // Handlers
  const handleApprove = (t) => { update('tasks', t.id, { status:'closed', approvedAt:new Date().toISOString() }); toast('Task approved'); loadTasks(); doRefresh(); };
  const handleReject = (t) => { update('tasks', t.id, { status:'rejected' }); toast('Task rejected'); loadTasks(); doRefresh(); };
  const handleDelete = (id) => { if(confirm('Delete this task?')) { remove('tasks', id); toast('Task deleted'); loadTasks(); doRefresh(); }};
  
  const handleReassign = (taskId, toId) => {
    update('tasks', taskId, { assignedTo: toId });
    toast('Task reassigned successfully');
    setReassignModal(null);
    loadTasks();
    doRefresh(); // Trigger parent refresh to update card stats
  };

  const handleEdit = (taskId, data) => {
    update('tasks', taskId, data);
    toast('Task updated');
    setEditModal(null);
    loadTasks();
    doRefresh();
  };

  const tabs = ['all', 'active', 'overdue', 'completed'];

  return (
    <Modal title={`Workspace: ${employee.name}`} onClose={onClose} footer={<Btn onClick={onClose}>Close Workspace</Btn>}>
      {/* Employee Header */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, paddingBottom:20, borderBottom:'1px solid #E2E8F0' }}>
        <Avatar name={employee.name} color={employee.color} size={56} />
        <div>
          <div style={{ fontWeight:700, fontSize:18 }}>{employee.name}</div>
          <div style={{ fontSize:14, color:'#64748B' }}>{employee.position} · {employee.dept}</div>
        </div>
        <div style={{ marginLeft:'auto', textAlign:'right' }}>
          <div style={{ fontSize:12, color:'#64748B', marginBottom:4 }}>Current Workload</div>
          <div style={{ display:'flex', gap:8 }}>
            <Badge color="blue">{active.length} Active</Badge>
            {overdueCount > 0 && <Badge color="red">{overdueCount} Overdue</Badge>}
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="tab-bar" style={{ marginBottom:20 }}>
        {tabs.map(t => (
          <button key={t} className={`tab-item${filter === t ? ' active' : ''}`} onClick={() => setFilter(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div style={{ display:'flex', flexDirection:'column', gap:12, maxHeight:'50vh', overflowY:'auto', paddingRight:8 }}>
        {filteredTasks.length === 0 ? (
          <div className="empty-state" style={{ padding:30 }}><div className="icon">✅</div><h3>No tasks match this filter</h3></div>
        ) : (
          filteredTasks.map(t => {
            const risk = taskRisk(t);
            const days = Math.ceil((new Date(t.deadline)-now)/86400000);
            const isOverdue = risk==='red' && t.status!=='closed' && t.status!=='approved' && t.status!=='completed';
            
            return (
              <div key={t.id} style={{
                background:'#F8FAFF', border:`1px solid ${isOverdue ? '#EF4444' : '#E2E8F0'}`, 
                borderRadius:8, padding:16, display:'flex', flexDirection:'column', gap:10
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15, color:'#0F172A', marginBottom:4 }}>{t.title}</div>
                    <div style={{ fontSize:13, color:'#64748B' }}>
                      📅 Deadline: <span style={{ color: days<0?'#EF4444':days<3?'#F59E0B':'inherit', fontWeight:days<3?700:400 }}>
                        {new Date(t.deadline).toLocaleDateString()} {days<0?`(${Math.abs(days)}d overdue)`:days===0?`(Today)`:''}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <Badge color={pColor[t.priority]}>{t.priority}</Badge>
                    <Badge color={sColor[t.status]||'gray'}>{sLabel[t.status]||t.status}</Badge>
                  </div>
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:12, color:'#64748B', minWidth:50 }}>Progress</span>
                  <div style={{ flex:1 }}><ProgressBar value={t.progress} color={risk==='red'?'#EF4444':'#4F6EF7'}/></div>
                  <span style={{ fontSize:12, fontWeight:700 }}>{t.progress}%</span>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap', paddingTop:10, borderTop:'1px dashed #E2E8F0' }}>
                  {t.status === 'submitted' && <>
                    <Btn variant="success" style={{ fontSize:11, padding:'4px 10px' }} onClick={()=>handleApprove(t)}>✅ Approve</Btn>
                    <Btn variant="danger"  style={{ fontSize:11, padding:'4px 10px' }} onClick={()=>handleReject(t)}>❌ Reject</Btn>
                  </>}
                  <Btn variant="secondary" style={{ fontSize:11, padding:'4px 10px' }} onClick={()=>setReassignModal(t)}>🔄 Reassign</Btn>
                  <Btn variant="outline" style={{ fontSize:11, padding:'4px 10px' }} onClick={()=>setEditModal(t)}>✏️ Edit</Btn>
                  <Btn variant="ghost" style={{ fontSize:11, padding:'4px 10px', color:'#EF4444' }} onClick={()=>handleDelete(t.id)}>Trash</Btn>
                </div>
              </div>
            );
          })
        )}
      </div>

      {reassignModal && (
        <ReassignModal task={reassignModal} currentEmp={employee} team={team} onClose={()=>setReassignModal(null)} onConfirm={handleReassign} />
      )}
      
      {editModal && (
        <EditTaskModal task={editModal} onClose={()=>setEditModal(null)} onConfirm={handleEdit} />
      )}
    </Modal>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function Employees() {
  const { user, doRefresh } = useApp();
  const [team, setTeam] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Workspace state
  const [workspaceEmp, setWorkspaceEmp] = useState(null);
  const [workspaceFilter, setWorkspaceFilter] = useState('all');

  useEffect(() => { 
    if(user) {
      const allUsers = getAll('users');
      setTeam(allUsers.filter(u => u.role === 'employee' || u.role === 'manager')); 
    }
  }, [user]);

  const enriched = team.map(emp => {
    const tasks    = getTasksForManager(user.id).filter(t => t.assignedTo === emp.id);
    const active   = tasks.filter(t => t.status !== 'closed' && t.status !== 'approved' && t.status !== 'completed');
    const completed= tasks.filter(t => t.status === 'closed' || t.status === 'approved' || t.status === 'completed').length;
    const overdue  = active.filter(t => taskRisk(t) === 'red').length;
    const progress = active.length > 0 ? Math.round(active.reduce((a,t)=>a+t.progress,0)/active.length) : 100;
    const risk     = employeeRisk(emp.id);
    return { ...emp, tasks:tasks.length, active:active.length, completed, overdue, progress, risk };
  });

  const filtered = enriched
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.position?.toLowerCase().includes(search.toLowerCase()))
    .filter(e => filter === 'all' || e.risk === filter);

  const riskCounts = { all:enriched.length, green:enriched.filter(e=>e.risk==='green').length, yellow:enriched.filter(e=>e.risk==='yellow').length, red:enriched.filter(e=>e.risk==='red').length };

  const openWorkspace = (emp, initialFilter = 'all') => {
    setWorkspaceEmp(emp);
    setWorkspaceFilter(initialFilter);
  };

  return (
    <div>
      <PageHeader title="Employee Management" subtitle={`${team.length} employees in your team`}/>

      {/* Filters */}
      <div style={{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
        <div className="search-wrap" style={{ flex:1, minWidth:200 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" style={{ paddingLeft:36 }} placeholder="Search employees..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="tab-bar" style={{ margin:0 }}>
          {[['all','All'],['green','On Track'],['yellow','At Risk'],['red','Overdue']].map(([v,l]) => (
            <button key={v} className={`tab-item${filter===v?' active':''}`} onClick={()=>setFilter(v)}>
              {l} <span style={{ opacity:0.65 }}>({riskCounts[v]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">👥</div><h3>No employees found</h3><p>Try adjusting your search or filters.</p></div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
          {filtered.map(emp => (
            <Card key={emp.id} style={{ borderTop:`3px solid ${emp.risk==='red'?'var(--danger)':emp.risk==='yellow'?'var(--warning)':'var(--success)'}` }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
                <Avatar name={emp.name} color={emp.color} size={44}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{emp.name}</div>
                  <div style={{ fontSize:13, color:'var(--muted)' }}>{emp.position}</div>
                  <div style={{ fontSize:12, color:'var(--muted-light)', marginTop:2 }}>{emp.dept} · {emp.email}</div>
                </div>
                <Badge color={emp.risk==='red'?'red':emp.risk==='yellow'?'yellow':'green'} dot>
                  {emp.risk==='red'?'Overdue':emp.risk==='yellow'?'At Risk':'On Track'}
                </Badge>
              </div>

              {/* Workload progress */}
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--muted)', marginBottom:6 }}>
                  <span>Avg Progress ({emp.active} active task{emp.active!==1?'s':''})</span>
                  <span style={{ fontWeight:700 }}>{emp.progress}%</span>
                </div>
                <ProgressBar value={emp.progress} color={emp.risk==='red'?'var(--danger)':emp.risk==='yellow'?'var(--warning)':'var(--success)'}/>
              </div>

              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
                {[['Total',emp.tasks,'var(--primary)','all'],['Done',emp.completed,'var(--success)','completed'],['Overdue',emp.overdue,'var(--danger)','overdue']].map(([l,v,c,f]) => (
                  <div key={l} 
                    onClick={() => openWorkspace(emp, f)}
                    style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px', textAlign:'center', cursor:'pointer', transition:'border-color 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = c}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    title={`Click to view ${l.toLowerCase()} tasks`}
                  >
                    <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
                    <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Tech status */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:emp.techStatus==='Available'?'var(--success)':emp.techStatus==='On Job'?'var(--warning)':'var(--muted)', display:'inline-block' }}/>
                  <span style={{ fontSize:12, color:'var(--text-secondary)', fontWeight:500 }}>{emp.techStatus||'Available'}</span>
                </div>
                <Btn variant="secondary" style={{ fontSize:12, padding:'6px 14px' }} onClick={()=>openWorkspace(emp, 'all')}>View Tasks</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Employee Workspace Modal */}
      {workspaceEmp && (
        <EmployeeWorkspace 
          employee={workspaceEmp} 
          initialFilter={workspaceFilter}
          onClose={() => setWorkspaceEmp(null)} 
          managerId={user.id}
          doRefresh={doRefresh}
        />
      )}
    </div>
  );
}
