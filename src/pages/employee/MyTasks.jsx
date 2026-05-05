import { useState, useEffect } from 'react';
import { useApp, PageHeader, Btn, Badge, ProgressBar, Modal, Input, Textarea, Select, toast } from '../../App.jsx';
import { getTasksForEmployee, taskRisk, update, create, getAll } from '../../store.js';

const PRIORITIES = [
  { value:'low',      label:'Low'      },
  { value:'medium',   label:'Medium'   },
  { value:'high',     label:'High'     },
  { value:'critical', label:'Critical' },
];
const priorityColor = { low:'green', medium:'blue', high:'yellow', critical:'red' };
const statusColor   = { assigned:'blue', in_progress:'primary', submitted:'yellow', approved:'green', rejected:'red', closed:'green', overdue:'red' };
const statusLabel   = { assigned:'Assigned', in_progress:'In Progress', submitted:'Submitted', approved:'Approved', rejected:'Rejected', closed:'Closed', overdue:'Overdue' };

export default function MyTasks() {
  const { user, doRefresh } = useApp();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [delayModal, setDelayModal] = useState(null);
  const [delayReason, setDelayReason] = useState('');
  const [submitModal, setSubmitModal] = useState(null);

  const load = () => setTasks(getTasksForEmployee(user.id));
  useEffect(() => { if(user) load(); }, [user]);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => {
    if (filter === 'overdue') return taskRisk(t) === 'red' && t.status !== 'closed' && t.status !== 'approved';
    return t.status === filter;
  });

  const handleProgressChange = (id, val) => {
    update('tasks', id, { progress: Number(val) });
    load(); doRefresh();
  };

  const handleSubmit = (task) => {
    const risk = taskRisk(task);
    if (risk === 'red' && !task.delayReason && new Date(task.deadline) < new Date()) {
      setDelayModal(task); return;
    }
    setSubmitModal(task);
  };

  const confirmSubmit = () => {
    const req = { type:'submission', taskId:submitModal.id, employeeId:user.id, managerId:submitModal.createdBy, justification:'Task completed and submitted for review.', status:'pending', newDeadline:null };
    create('requests', req);
    update('tasks', submitModal.id, { status:'submitted', submittedAt: new Date().toISOString() });
    toast('Task submitted for manager review ✅');
    setSubmitModal(null); load(); doRefresh();
  };

  const confirmDelay = () => {
    if (!delayReason.trim()) { toast('Please enter a delay reason','error'); return; }
    update('tasks', delayModal.id, { delayReason });
    toast('Delay reason logged','info');
    setDelayReason(''); setDelayModal(null);
    setSubmitModal(delayModal); load();
  };

  const now = new Date();
  const tabs = ['all','assigned','in_progress','submitted','approved','overdue','closed'];

  return (
    <div>
      <PageHeader title="My Tasks" subtitle="Manage your assigned tasks, update progress, and submit for review"/>

      {/* Tab filters */}
      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t} className={`tab-item${filter===t?' active':''}`} onClick={()=>setFilter(t)}>
            {t === 'all' ? 'All Tasks' : t === 'in_progress' ? 'In Progress' : t.charAt(0).toUpperCase()+t.slice(1)}
            {t === 'overdue' && <span style={{ marginLeft:5, background:'var(--danger)', color:'#fff', borderRadius:'var(--radius-full)', fontSize:10, padding:'1px 6px' }}>
              {tasks.filter(x => taskRisk(x)==='red' && x.status!=='closed' && x.status!=='approved').length}
            </span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">📋</div><h3>No tasks here</h3><p>Try a different filter.</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {filtered.map(task => {
            const risk = taskRisk(task);
            const days = Math.ceil((new Date(task.deadline) - now) / 86400000);
            const isOverdue = risk === 'red' && task.status !== 'closed' && task.status !== 'approved';
            const canSubmit = (task.status === 'in_progress' || task.status === 'assigned') && task.progress > 0;
            return (
              <div key={task.id} style={{ background:'var(--surface)', border:`1px solid ${isOverdue?'var(--danger)':'var(--border)'}`, borderLeft:`4px solid ${isOverdue?'var(--danger)':task.priority==='critical'?'var(--danger)':task.priority==='high'?'var(--warning)':'var(--primary)'}`, borderRadius:'var(--radius-lg)', padding:20 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
                      <Badge color={priorityColor[task.priority]}>{task.priority.toUpperCase()}</Badge>
                      <Badge color={statusColor[task.status]||'gray'}>{statusLabel[task.status]||task.status}</Badge>
                      {isOverdue && <Badge color="red">⚠️ OVERDUE</Badge>}
                    </div>
                    <h3 style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>{task.title}</h3>
                    <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.5, marginBottom:10 }}>{task.desc}</p>
                    {task.delayReason && (
                      <div style={{ background:'var(--warning-bg)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'var(--radius-sm)', padding:'8px 12px', fontSize:13, color:'var(--warning)', marginBottom:10 }}>
                        <strong>Delay Reason:</strong> {task.delayReason}
                      </div>
                    )}
                    {/* Progress */}
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
                      <span style={{ fontSize:12, color:'var(--muted)', minWidth:60 }}>Progress</span>
                      <div style={{ flex:1 }}>
                        <ProgressBar value={task.progress} color={isOverdue?'var(--danger)':'var(--primary)'}/>
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, minWidth:36 }}>{task.progress}%</span>
                    </div>
                    {task.status === 'in_progress' || task.status === 'assigned' ? (
                      <input type="range" min={0} max={100} value={task.progress} onChange={e=>handleProgressChange(task.id, e.target.value)}
                        style={{ width:'100%', marginTop:4, accentColor:'var(--primary)' }}/>
                    ) : null}
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color: days < 0 ? 'var(--danger)' : days < 3 ? 'var(--warning)' : 'var(--muted)', marginBottom:4 }}>
                      {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today!' : `${days}d remaining`}
                    </div>
                    <div style={{ fontSize:12, color:'var(--muted)', marginBottom:16 }}>📅 {new Date(task.deadline).toLocaleDateString()}</div>
                    {canSubmit && (
                      <Btn variant="success" onClick={()=>handleSubmit(task)} style={{ fontSize:12, padding:'8px 14px' }}>Submit for Review</Btn>
                    )}
                    {task.status === 'rejected' && (
                      <Btn variant="secondary" onClick={()=>{ update('tasks',task.id,{status:'in_progress'}); load(); }} style={{ fontSize:12 }}>Revise & Resubmit</Btn>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delay reason modal */}
      {delayModal && (
        <Modal title="⚠️ Log Delay Reason" onClose={()=>setDelayModal(null)} footer={<><Btn variant="outline" onClick={()=>setDelayModal(null)}>Cancel</Btn><Btn onClick={confirmDelay}>Submit &amp; Continue</Btn></>}>
          <p style={{ fontSize:14, color:'var(--muted)', marginBottom:16 }}>This task is overdue. Please provide a reason before submitting.</p>
          <Textarea label="Delay Reason *" value={delayReason} onChange={e=>setDelayReason(e.target.value)} placeholder="Explain why the deadline was missed..." rows={4}/>
        </Modal>
      )}

      {/* Confirm submit modal */}
      {submitModal && (
        <Modal title="Submit Task for Review" onClose={()=>setSubmitModal(null)} footer={<><Btn variant="outline" onClick={()=>setSubmitModal(null)}>Cancel</Btn><Btn onClick={confirmSubmit}>✅ Confirm Submit</Btn></>}>
          <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.7 }}>
            You are submitting <strong>"{submitModal?.title}"</strong> for manager approval. Your manager will review and mark it as Approved or Rejected.
          </p>
        </Modal>
      )}
    </div>
  );
}
