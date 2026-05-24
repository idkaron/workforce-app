import { useState, useEffect } from 'react';
import { useApp, PageHeader, Badge, Btn, ProgressBar, Avatar, Modal, Input, Textarea, Select, toast } from '../../App.jsx';
import { getTasksForManager, getMyTeam, taskRisk, update, create, remove, getAll, getWorkflowChain } from '../../store.js';

const PRIORITIES = [{ value:'low',label:'Low' },{ value:'medium',label:'Medium' },{ value:'high',label:'High' },{ value:'critical',label:'Critical' }];
const pColor = { low:'green', medium:'blue', high:'yellow', critical:'red' };
const sColor = {
  assigned:'blue', in_progress:'primary', submitted:'yellow',
  approved:'green', rejected:'red', closed:'green',
  forwarded:'purple', waiting_approval:'yellow', sent_to_client:'blue',
  client_approved:'green', completed:'green',
};
const sLabel = {
  assigned:'Assigned', in_progress:'In Progress', submitted:'Submitted',
  approved:'Approved', rejected:'Rejected', closed:'Closed',
  forwarded:'Forwarded', waiting_approval:'Waiting Approval', sent_to_client:'Sent to Client',
  client_approved:'Client Approved', completed:'Completed',
};

export default function Tasks() {
  const { user, doRefresh } = useApp();
  const [tasks, setTasks]   = useState([]);
  const [team, setTeam]     = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');;
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState({ title:'', desc:'', priority:'medium', deadline:'', assignedTo:'' });
  const [delayModal, setDelayModal]   = useState(null);
  const [delayReason, setDelayReason] = useState('');
  const [timelineModal, setTimelineModal] = useState(null);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const load = () => {
    setTasks(getTasksForManager(user.id));
    setTeam(getMyTeam(user.id));
  };
  useEffect(() => { if(user) load(); }, [user]);

  const openCreate = () => { setForm({ title:'', desc:'', priority:'medium', deadline:'', assignedTo:'' }); setModal('create'); };

  const saveTask = () => {
    if (!form.title.trim() || !form.deadline || !form.assignedTo) { toast('Title, deadline and assignee are required','error'); return; }
    if (modal === 'create') {
      create('tasks', { ...form, status:'assigned', progress:0, createdBy:user.id, delayReason:null, submittedAt:null, approvedAt:null, workflowHistory:[], parentTaskId:null });
      toast('Task created and assigned ✅');
    } else {
      update('tasks', modal.id, { title:form.title, desc:form.desc, priority:form.priority, deadline:form.deadline, assignedTo:form.assignedTo });
      toast('Task updated');
    }
    setModal(null); load(); doRefresh();
  };

  const openEdit  = (t) => { setForm({ title:t.title, desc:t.desc||'', priority:t.priority, deadline:t.deadline, assignedTo:t.assignedTo }); setModal(t); };
  const deleteTask = (id) => { if(confirm('Delete this task?')){ remove('tasks',id); toast('Task deleted','info'); load(); doRefresh(); }};

  const handleApprove      = (t) => { update('tasks',t.id,{ status:'closed', approvedAt:new Date().toISOString() }); toast('Task approved & closed ✅'); load(); doRefresh(); };
  const handleReject       = (t) => { update('tasks',t.id,{ status:'rejected' }); toast('Task rejected','warning'); load(); doRefresh(); };
  const handleSentToClient = (t) => { update('tasks',t.id,{ status:'sent_to_client' }); toast('Marked as Sent to Client 📤'); load(); doRefresh(); };
  const handleClientApproved = (t) => { update('tasks',t.id,{ status:'client_approved' }); toast('Client approved ✅'); load(); doRefresh(); };
  const handleComplete     = (t) => { update('tasks',t.id,{ status:'completed', approvedAt:new Date().toISOString() }); toast('Workflow completed 🎉'); load(); doRefresh(); };

  const requireDelay = (t) => { setDelayModal(t); setDelayReason(''); };
  const saveDelay = () => {
    if (!delayReason.trim()) { toast('Reason required','error'); return; }
    update('tasks', delayModal.id, { delayReason }); toast('Delay reason logged','info');
    setDelayModal(null); load();
  };

  const now = new Date();
  const allUsers   = getAll('users');
  const empOptions = [{ value:'', label:'Select employee...' }, ...team.map(e => ({ value:e.id, label:e.name }))];

  let filtered = tasks.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <PageHeader title="Task Management" subtitle="Create, assign, and manage the full task lifecycle"
        actions={<Btn onClick={openCreate}>+ New Task</Btn>}/>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:22, flexWrap:'wrap' }}>
        <div className="search-wrap" style={{ flex:1, minWidth:200 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" style={{ paddingLeft:36 }} placeholder="Search tasks..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="form-input" value={filter} onChange={e=>setFilter(e.target.value)} style={{ width:'auto', minWidth:180 }}>
          <option value="all">All Statuses</option>
          {Object.entries(sLabel).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Task</th><th>Assigned To</th><th>Priority</th><th>Progress</th><th>Deadline</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7}><div className="empty-state" style={{ padding:40 }}><div className="icon">📋</div><h3>No tasks found</h3></div></td></tr>}
            {filtered.map(t => {
              const emp  = allUsers.find(u => u.id === t.assignedTo);
              const risk = taskRisk(t);
              const days = Math.ceil((new Date(t.deadline)-now)/86400000);
              const isOverdue  = risk==='red' && t.status!=='closed' && t.status!=='approved' && t.status!=='completed';
              const hasWorkflow = (t.workflowHistory||[]).length > 0 || t.parentTaskId;
              return (
                <tr key={t.id} style={{ background:isOverdue?'rgba(239,68,68,0.03)':undefined }}>
                  <td style={{ minWidth:220 }}>
                    <div style={{ fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
                      {t.title}
                      {hasWorkflow && (
                        <span
                          title="View workflow chain"
                          onClick={() => setTimelineModal(t)}
                          style={{ fontSize:13, cursor:'pointer', color:'var(--purple)', flexShrink:0 }}
                        >🔗</span>
                      )}
                    </div>
                    {t.parentTaskId && <div style={{ fontSize:11, color:'var(--purple)', marginTop:2 }}>↪ Part of multi-stage workflow</div>}
                    {t.delayReason && <div style={{ fontSize:11, color:'var(--warning)', marginTop:3 }}>⚠️ {t.delayReason}</div>}
                  </td>
                  <td>
                    {emp ? <div style={{ display:'flex', alignItems:'center', gap:8 }}><Avatar name={emp.name} color={emp.color||'#4F6EF7'} size={26}/><span style={{ fontSize:13 }}>{emp.name.split(' ')[0]}</span></div> : <span style={{ color:'var(--muted)' }}>—</span>}
                  </td>
                  <td><Badge color={pColor[t.priority]}>{t.priority}</Badge></td>
                  <td style={{ minWidth:120 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <div style={{ flex:1 }}><ProgressBar value={t.progress} color={risk==='red'?'var(--danger)':risk==='yellow'?'var(--warning)':'var(--success)'}/></div>
                      <span style={{ fontSize:12, fontWeight:600, minWidth:30 }}>{t.progress}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize:13, color:days<0?'var(--danger)':days<3?'var(--warning)':'var(--muted)', fontWeight:days<3?700:400, whiteSpace:'nowrap' }}>
                    {days<0?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d`}
                    <div style={{ fontSize:11, fontWeight:400, color:'var(--muted)' }}>{new Date(t.deadline).toLocaleDateString()}</div>
                  </td>
                  <td><Badge color={sColor[t.status]||'gray'}>{sLabel[t.status]||t.status}</Badge></td>
                  <td>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {t.status === 'submitted' && <>
                        <Btn variant="success" style={{ fontSize:11, padding:'5px 10px' }} onClick={()=>handleApprove(t)}>✅ Approve</Btn>
                        <Btn variant="danger"  style={{ fontSize:11, padding:'5px 10px' }} onClick={()=>handleReject(t)}>❌ Reject</Btn>
                      </>}
                      {(t.status === 'approved' || t.status === 'closed') && (
                        <Btn variant="secondary" style={{ fontSize:11, padding:'5px 10px' }} onClick={()=>handleSentToClient(t)}>📤 Send to Client</Btn>
                      )}
                      {t.status === 'sent_to_client' && (
                        <Btn variant="success" style={{ fontSize:11, padding:'5px 10px' }} onClick={()=>handleClientApproved(t)}>🤝 Client Approved</Btn>
                      )}
                      {t.status === 'client_approved' && (
                        <Btn variant="success" style={{ fontSize:11, padding:'5px 10px' }} onClick={()=>handleComplete(t)}>🎉 Complete</Btn>
                      )}
                      {isOverdue && !t.delayReason && <Btn variant="outline" style={{ fontSize:11, padding:'5px 10px' }} onClick={()=>requireDelay(t)}>⚠️ Log Delay</Btn>}
                      {hasWorkflow && <Btn variant="ghost" style={{ fontSize:11, padding:'5px 10px' }} onClick={()=>setTimelineModal(t)}>🔗 Timeline</Btn>}
                      <Btn variant="outline" style={{ fontSize:11, padding:'5px 10px' }} onClick={()=>openEdit(t)}>Edit</Btn>
                      <Btn variant="danger"  style={{ fontSize:11, padding:'5px 10px' }} onClick={()=>deleteTask(t.id)}>Del</Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <Modal title={modal==='create'?'Create New Task':'Edit Task'} onClose={()=>setModal(null)}
          footer={<><Btn variant="outline" onClick={()=>setModal(null)}>Cancel</Btn><Btn onClick={saveTask}>{modal==='create'?'Create Task':'Save Changes'}</Btn></>}>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <Input label="Task Title *" value={form.title} onChange={f('title')} placeholder="Clear, actionable task name"/>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label className="form-label">Description</label>
              <textarea className="form-input" value={form.desc} onChange={f('desc')} rows={3} placeholder="What needs to be done?"/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <Select label="Priority *" value={form.priority} onChange={f('priority')} options={PRIORITIES}/>
              <Input  label="Deadline *" type="date" value={form.deadline} onChange={f('deadline')}/>
            </div>
            <Select label="Assign To *" value={form.assignedTo} onChange={f('assignedTo')} options={empOptions}/>
          </div>
        </Modal>
      )}

      {/* Delay Reason Modal */}
      {delayModal && (
        <Modal title="⚠️ Log Delay Reason" onClose={()=>setDelayModal(null)}
          footer={<><Btn variant="outline" onClick={()=>setDelayModal(null)}>Cancel</Btn><Btn onClick={saveDelay}>Save Reason</Btn></>}>
          <p style={{ fontSize:14, color:'var(--muted)', marginBottom:16 }}>Document why <strong>{delayModal.title}</strong> missed its deadline.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label className="form-label">Delay Reason *</label>
            <textarea className="form-input" value={delayReason} onChange={e=>setDelayReason(e.target.value)} rows={4} placeholder="Explain the root cause..."/>
          </div>
        </Modal>
      )}

      {/* Workflow Timeline Modal */}
      {timelineModal && (() => {
        const allTasks = getAll('tasks');
        let root = timelineModal;
        while (root.parentTaskId) {
          const parent = allTasks.find(t => t.id === root.parentTaskId);
          if (!parent) break;
          root = parent;
        }
        const chain = [];
        const visit = (t) => { chain.push(t); allTasks.filter(x => x.parentTaskId === t.id).forEach(visit); };
        visit(root);
        return (
          <Modal title="🔗 Workflow Timeline" onClose={()=>setTimelineModal(null)} footer={<Btn onClick={()=>setTimelineModal(null)}>Close</Btn>}>
            <p style={{ fontSize:13, color:'var(--muted)', marginBottom:20 }}>Full multi-stage workflow chain — {chain.length} stage{chain.length!==1?'s':''}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {chain.map((t, i) => {
                const assignee = allUsers.find(u => u.id === t.assignedTo);
                const dotColor = { assigned:'var(--info)', in_progress:'var(--primary)', submitted:'var(--warning)', approved:'var(--success)', rejected:'var(--danger)', forwarded:'var(--purple)', completed:'var(--success)', client_approved:'var(--success)' };
                return (
                  <div key={t.id} style={{ display:'flex', gap:12, paddingBottom:20, position:'relative' }}>
                    {i < chain.length-1 && <div style={{ position:'absolute', left:15, top:32, bottom:0, width:2, background:'var(--border)' }}/>}
                    <div style={{ width:32, height:32, borderRadius:'50%', background:dotColor[t.status]||'var(--border)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#fff', fontWeight:800, zIndex:1 }}>
                      {i+1}
                    </div>
                    <div style={{ flex:1, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px 14px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                        <span style={{ fontWeight:700, fontSize:14 }}>{t.title}</span>
                        <Badge color={sColor[t.status]||'gray'}>{sLabel[t.status]||t.status}</Badge>
                      </div>
                      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6 }}>
                        👤 {assignee?.name || 'Unassigned'} · 📅 {new Date(t.deadline).toLocaleDateString()} · {t.progress}% complete
                      </div>
                      {(t.workflowHistory||[]).map((h, hi) => {
                        const from = allUsers.find(u => u.id === h.fromId);
                        const to   = allUsers.find(u => u.id === h.toId);
                        return (
                          <div key={hi} style={{ fontSize:12, color:'var(--purple)', borderTop:'1px solid var(--border)', paddingTop:6, marginTop:4 }}>
                            🔗 <strong>{from?.name||'?'}</strong> → <strong>{to?.name||'?'}</strong> · Stage: "{h.stage}"
                            {h.note && <span style={{ color:'var(--muted)' }}> — {h.note}</span>}
                            <span style={{ color:'var(--muted-light)', marginLeft:8 }}>{new Date(h.timestamp).toLocaleDateString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
