import { useState, useEffect } from 'react';
import { useApp, PageHeader, Btn, Badge, ProgressBar, Modal, Input, Textarea, Select, toast } from '../../App.jsx';
import { getTasksForEmployee, getTasksInvolvedWith, taskRisk, update, create, getAll } from '../../store.js';

const PRIORITIES = [
  { value:'low',      label:'Low'      },
  { value:'medium',   label:'Medium'   },
  { value:'high',     label:'High'     },
  { value:'critical', label:'Critical' },
];
const priorityColor = { low:'green', medium:'blue', high:'yellow', critical:'red' };
const statusColor   = {
  assigned:'blue', in_progress:'primary', submitted:'yellow',
  approved:'green', rejected:'red', closed:'green', overdue:'red',
  forwarded:'purple', waiting_approval:'yellow', sent_to_client:'blue',
  client_approved:'green', completed:'green',
};
const statusLabel   = {
  assigned:'Assigned', in_progress:'In Progress', submitted:'Submitted',
  approved:'Approved', rejected:'Rejected', closed:'Closed', overdue:'Overdue',
  forwarded:'Forwarded', waiting_approval:'Waiting Approval', sent_to_client:'Sent to Client',
  client_approved:'Client Approved', completed:'Completed',
};

const uid = () => Math.random().toString(36).slice(2, 10);

export default function MyTasks() {
  const { user, doRefresh } = useApp();
  const [tasks, setTasks]     = useState([]);
  const [filter, setFilter]   = useState('all');
  const [delayModal, setDelayModal]   = useState(null);
  const [delayReason, setDelayReason] = useState('');
  const [submitModal, setSubmitModal] = useState(null);

  // Forward Task modal state
  const [forwardModal, setForwardModal] = useState(null);
  const [forwardForm, setForwardForm]   = useState({ toId:'', stage:'', note:'' });

  // Request Update modal state
  const [updateModal, setUpdateModal]   = useState(null);
  const [updateForm, setUpdateForm]     = useState({ justification:'', newDeadline:'', requestedPriority:'' });

  // Workflow timeline modal
  const [timelineModal, setTimelineModal] = useState(null);

  const load = () => setTasks(getTasksForEmployee(user.id));
  useEffect(() => { if(user) load(); }, [user]);

  const allUsers  = getAll('users');
  const coworkers = allUsers.filter(u => u.id !== user?.id && u.role === 'employee');

  // ─── Filter logic ────────────────────────────────────────────────────────────
  const filtered = (() => {
    if (filter === 'all')       return tasks;
    if (filter === 'overdue')   return tasks.filter(t => taskRisk(t) === 'red' && t.status !== 'closed' && t.status !== 'approved');
    if (filter === 'forwarded') return tasks.filter(t => t.status === 'forwarded');
    return tasks.filter(t => t.status === filter);
  })();

  // ─── Submit flow (existing) ───────────────────────────────────────────────────
  const handleSubmit = (task) => {
    const risk = taskRisk(task);
    if (risk === 'red' && !task.delayReason && new Date(task.deadline) < new Date()) {
      setDelayModal(task); return;
    }
    setSubmitModal(task);
  };

  const confirmSubmit = () => {
    const req = {
      type:'submission', taskId:submitModal.id, employeeId:user.id,
      managerId:submitModal.createdBy, justification:'Task completed and submitted for review.',
      status:'pending', newDeadline:null,
    };
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

  // ─── Forward Task flow (new) ──────────────────────────────────────────────────
  const confirmForward = () => {
    if (!forwardForm.toId)    { toast('Please select a coworker','error'); return; }
    if (!forwardForm.stage.trim()) { toast('Please enter a stage title','error'); return; }

    const historyEntry = {
      fromId:    user.id,
      toId:      forwardForm.toId,
      note:      forwardForm.note,
      stage:     forwardForm.stage,
      timestamp: new Date().toISOString(),
    };

    // Update original task: mark as forwarded, append history
    const existingHistory = forwardModal.workflowHistory || [];
    update('tasks', forwardModal.id, {
      status: 'forwarded',
      workflowHistory: [...existingHistory, historyEntry],
    });

    // Create new child task
    const toUser = allUsers.find(u => u.id === forwardForm.toId);
    create('tasks', {
      title:           forwardForm.stage,
      desc:            forwardForm.note || `Forwarded from: ${forwardModal.title}`,
      priority:        forwardModal.priority,
      status:          'assigned',
      deadline:        forwardModal.deadline,
      assignedTo:      forwardForm.toId,
      createdBy:       forwardModal.createdBy,
      progress:        0,
      parentTaskId:    forwardModal.id,
      workflowHistory: [],
      delayReason:     null,
      submittedAt:     null,
      approvedAt:      null,
    });

    toast(`Task forwarded to ${toUser?.name || 'coworker'} ✅`);
    setForwardModal(null); setForwardForm({ toId:'', stage:'', note:'' });
    load(); doRefresh();
  };

  // ─── Request Task Update flow (new) ──────────────────────────────────────────
  const confirmUpdateRequest = () => {
    if (!updateForm.justification.trim()) { toast('Please describe what needs to change','error'); return; }
    create('requests', {
      type:              'update_request',
      taskId:            updateModal.id,
      employeeId:        user.id,
      managerId:         updateModal.createdBy,
      justification:     updateForm.justification,
      status:            'pending',
      newDeadline:       updateForm.newDeadline || null,
      requestedPriority: updateForm.requestedPriority || null,
      managerComment:    null,
    });
    toast('Update request sent to manager ✅');
    setUpdateModal(null); setUpdateForm({ justification:'', newDeadline:'', requestedPriority:'' });
    load(); doRefresh();
  };

  const now  = new Date();
  const tabs = ['all','assigned','in_progress','submitted','forwarded','approved','overdue','closed'];

  // Check if there's a pending update request for a given task
  const allRequests = getAll('requests');
  const hasPendingUpdate = (taskId) =>
    allRequests.some(r => r.taskId === taskId && r.type === 'update_request' && r.status === 'pending');

  const coworkerOptions = [
    { value:'', label:'Select coworker...' },
    ...coworkers.map(u => ({ value:u.id, label:`${u.name} (${u.position || u.role})` })),
  ];
  const priorityOptions = [
    { value:'', label:'No change' },
    ...PRIORITIES,
  ];

  return (
    <div>
      <PageHeader title="My Tasks" subtitle="Manage your assigned tasks, update progress, submit, or forward to a coworker"/>

      {/* Tab filters */}
      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t} className={`tab-item${filter===t?' active':''}`} onClick={()=>setFilter(t)}>
            {t === 'all' ? 'All Tasks' : t === 'in_progress' ? 'In Progress' : t.charAt(0).toUpperCase()+t.slice(1).replace('_',' ')}
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
            const risk      = taskRisk(task);
            const days      = Math.ceil((new Date(task.deadline) - now) / 86400000);
            const isOverdue = risk === 'red' && task.status !== 'closed' && task.status !== 'approved';
            const isActive  = task.status === 'in_progress' || task.status === 'assigned';
            const canSubmit = isActive && task.progress > 0;
            const isForwarded = task.status === 'forwarded';
            const pendingUpdate = hasPendingUpdate(task.id);
            const hasWorkflow = (task.workflowHistory || []).length > 0 || task.parentTaskId;

            return (
              <div key={task.id} style={{
                background:'var(--surface)',
                border:`1px solid ${isOverdue?'var(--danger)':'var(--border)'}`,
                borderLeft:`4px solid ${isOverdue?'var(--danger)':task.priority==='critical'?'var(--danger)':task.priority==='high'?'var(--warning)':isForwarded?'var(--purple)':'var(--primary)'}`,
                borderRadius:'var(--radius-lg)', padding:20,
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8, alignItems:'center' }}>
                      <Badge color={priorityColor[task.priority]}>{task.priority.toUpperCase()}</Badge>
                      <Badge color={statusColor[task.status]||'gray'}>{statusLabel[task.status]||task.status}</Badge>
                      {isOverdue && <Badge color="red">⚠️ OVERDUE</Badge>}
                      {pendingUpdate && <Badge color="yellow">⏳ Update Requested</Badge>}
                      {hasWorkflow && (
                        <span
                          onClick={() => setTimelineModal(task)}
                          style={{ fontSize:12, color:'var(--primary)', cursor:'pointer', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}
                        >
                          🔗 Workflow {task.parentTaskId ? '(Part of chain)' : `(${(task.workflowHistory||[]).length} stage${(task.workflowHistory||[]).length!==1?'s':''})`}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>{task.title}</h3>
                    <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.5, marginBottom:10 }}>{task.desc}</p>

                    {task.delayReason && (
                      <div style={{ background:'var(--warning-bg)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'var(--radius-sm)', padding:'8px 12px', fontSize:13, color:'var(--warning)', marginBottom:10 }}>
                        <strong>Delay Reason:</strong> {task.delayReason}
                      </div>
                    )}

                    {/* Forwarded indicator */}
                    {isForwarded && (task.workflowHistory||[]).length > 0 && (() => {
                      const last = task.workflowHistory[task.workflowHistory.length - 1];
                      const toUser = allUsers.find(u => u.id === last.toId);
                      return (
                        <div style={{ background:'var(--purple-bg)', border:'1px solid rgba(139,92,246,0.25)', borderRadius:'var(--radius-sm)', padding:'8px 12px', fontSize:13, color:'var(--purple)', marginBottom:10 }}>
                          🔗 Forwarded to <strong>{toUser?.name || 'a coworker'}</strong> — Stage: "{last.stage}"
                          {last.note && <div style={{ marginTop:4, opacity:0.8 }}>Note: {last.note}</div>}
                        </div>
                      );
                    })()}

                    {/* Progress */}
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
                      <span style={{ fontSize:12, color:'var(--muted)', minWidth:60 }}>Progress</span>
                      <div style={{ flex:1 }}>
                        <ProgressBar value={task.progress} color={isOverdue?'var(--danger)':'var(--primary)'}/>
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, minWidth:36 }}>{task.progress}%</span>
                    </div>
                    {isActive ? (
                      <input type="range" min={0} max={100} value={task.progress}
                        onChange={e=>{ update('tasks', task.id, { progress:Number(e.target.value) }); load(); doRefresh(); }}
                        style={{ width:'100%', marginTop:4, accentColor:'var(--primary)' }}/>
                    ) : null}
                  </div>

                  {/* Actions column */}
                  <div style={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
                    <div style={{ fontSize:13, fontWeight:700, color: days<0?'var(--danger)':days<3?'var(--warning)':'var(--muted)', marginBottom:2 }}>
                      {days<0 ? `${Math.abs(days)}d overdue` : days===0 ? 'Due today!' : `${days}d remaining`}
                    </div>
                    <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>📅 {new Date(task.deadline).toLocaleDateString()}</div>

                    {/* Submit for Review */}
                    {canSubmit && (
                      <Btn variant="success" onClick={()=>handleSubmit(task)} style={{ fontSize:12, padding:'7px 12px' }}>
                        ✅ Submit for Review
                      </Btn>
                    )}

                    {/* Forward Task */}
                    {isActive && (
                      <Btn variant="secondary" onClick={()=>{ setForwardModal(task); setForwardForm({ toId:'', stage:'', note:'' }); }} style={{ fontSize:12, padding:'7px 12px' }}>
                        🔗 Forward Task
                      </Btn>
                    )}

                    {/* Request Task Update */}
                    {isActive && !pendingUpdate && (
                      <Btn variant="outline" onClick={()=>{ setUpdateModal(task); setUpdateForm({ justification:'', newDeadline:'', requestedPriority:'' }); }} style={{ fontSize:12, padding:'7px 12px' }}>
                        ✏️ Request Update
                      </Btn>
                    )}

                    {/* Revise & Resubmit */}
                    {task.status === 'rejected' && (
                      <Btn variant="secondary" onClick={()=>{ update('tasks',task.id,{status:'in_progress'}); load(); }} style={{ fontSize:12 }}>
                        🔁 Revise & Resubmit
                      </Btn>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Delay reason modal (existing) ──────────────────────────────────── */}
      {delayModal && (
        <Modal title="⚠️ Log Delay Reason" onClose={()=>setDelayModal(null)}
          footer={<><Btn variant="outline" onClick={()=>setDelayModal(null)}>Cancel</Btn><Btn onClick={confirmDelay}>Submit & Continue</Btn></>}>
          <p style={{ fontSize:14, color:'var(--muted)', marginBottom:16 }}>This task is overdue. Please provide a reason before submitting.</p>
          <Textarea label="Delay Reason *" value={delayReason} onChange={e=>setDelayReason(e.target.value)} placeholder="Explain why the deadline was missed..." rows={4}/>
        </Modal>
      )}

      {/* ─── Confirm submit modal (existing) ────────────────────────────────── */}
      {submitModal && (
        <Modal title="Submit Task for Review" onClose={()=>setSubmitModal(null)}
          footer={<><Btn variant="outline" onClick={()=>setSubmitModal(null)}>Cancel</Btn><Btn onClick={confirmSubmit}>✅ Confirm Submit</Btn></>}>
          <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.7 }}>
            You are submitting <strong>"{submitModal?.title}"</strong> for manager approval. Your manager will review and mark it as Approved or Rejected.
          </p>
        </Modal>
      )}

      {/* ─── Forward Task modal (new) ────────────────────────────────────────── */}
      {forwardModal && (
        <Modal title="🔗 Forward Task to Coworker" onClose={()=>setForwardModal(null)}
          footer={<><Btn variant="outline" onClick={()=>setForwardModal(null)}>Cancel</Btn><Btn onClick={confirmForward}>Forward Task</Btn></>}>
          <p style={{ fontSize:14, color:'var(--muted)', marginBottom:20, lineHeight:1.6 }}>
            Forwarding <strong>"{forwardModal.title}"</strong> will mark it as <em>Forwarded</em> and create the next workflow stage for your coworker.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Select label="Assign Next Stage To *" value={forwardForm.toId}
              onChange={e=>setForwardForm(p=>({...p, toId:e.target.value}))} options={coworkerOptions}/>
            <Input label="Next Stage Title *" value={forwardForm.stage}
              onChange={e=>setForwardForm(p=>({...p, stage:e.target.value}))} placeholder="e.g. Prepare Quotation, Client Visit, Installation..."/>
            <Textarea label="Handover Notes" value={forwardForm.note}
              onChange={e=>setForwardForm(p=>({...p, note:e.target.value}))} placeholder="Add context, files references, or instructions for the next person..." rows={4}/>
          </div>
        </Modal>
      )}

      {/* ─── Request Task Update modal (new) ────────────────────────────────── */}
      {updateModal && (
        <Modal title="✏️ Request Task Update" onClose={()=>setUpdateModal(null)}
          footer={<><Btn variant="outline" onClick={()=>setUpdateModal(null)}>Cancel</Btn><Btn onClick={confirmUpdateRequest}>Send Request</Btn></>}>
          <p style={{ fontSize:14, color:'var(--muted)', marginBottom:20, lineHeight:1.6 }}>
            Request your manager to modify details of <strong>"{updateModal.title}"</strong>. They can approve or reject your request.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Textarea label="What needs to be changed? *" value={updateForm.justification}
              onChange={e=>setUpdateForm(p=>({...p, justification:e.target.value}))} placeholder="Describe what should be changed and why..." rows={4}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <Input label="Request New Deadline (optional)" type="date" value={updateForm.newDeadline}
                onChange={e=>setUpdateForm(p=>({...p, newDeadline:e.target.value}))}/>
              <Select label="Request Priority Change (optional)" value={updateForm.requestedPriority}
                onChange={e=>setUpdateForm(p=>({...p, requestedPriority:e.target.value}))} options={priorityOptions}/>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Workflow Timeline modal (new) ──────────────────────────────────── */}
      {timelineModal && (() => {
        const allTasks = getAll('tasks');
        // Build chain: walk to root then down
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
          <Modal title="🔗 Workflow Timeline" onClose={()=>setTimelineModal(null)}
            footer={<Btn onClick={()=>setTimelineModal(null)}>Close</Btn>}>
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {chain.map((t, i) => {
                const assignee = allUsers.find(u => u.id === t.assignedTo);
                const sColor = { assigned:'var(--info)', in_progress:'var(--primary)', submitted:'var(--warning)', approved:'var(--success)', rejected:'var(--danger)', forwarded:'var(--purple)', completed:'var(--success)' };
                return (
                  <div key={t.id} style={{ display:'flex', gap:12, paddingBottom:20, position:'relative' }}>
                    {/* connector line */}
                    {i < chain.length-1 && <div style={{ position:'absolute', left:16, top:32, bottom:0, width:2, background:'var(--border)' }}/>}
                    <div style={{ width:32, height:32, borderRadius:'50%', background:sColor[t.status]||'var(--border)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#fff', fontWeight:700, zIndex:1 }}>
                      {i+1}
                    </div>
                    <div style={{ flex:1, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px 14px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                        <span style={{ fontWeight:700, fontSize:14 }}>{t.title}</span>
                        <Badge color={statusColor[t.status]||'gray'}>{statusLabel[t.status]||t.status}</Badge>
                      </div>
                      <div style={{ fontSize:12, color:'var(--muted)' }}>
                        👤 {assignee?.name || 'Unknown'} · 📅 {new Date(t.deadline).toLocaleDateString()} · {t.progress}%
                      </div>
                      {(t.workflowHistory||[]).length > 0 && t.workflowHistory.map((h, hi) => {
                        const from = allUsers.find(u => u.id === h.fromId);
                        const to   = allUsers.find(u => u.id === h.toId);
                        return (
                          <div key={hi} style={{ marginTop:6, fontSize:12, color:'var(--purple)', borderTop:'1px solid var(--border)', paddingTop:6 }}>
                            🔗 {from?.name || 'Someone'} → {to?.name || 'Someone'} · "{h.stage}"
                            {h.note && <span style={{ color:'var(--muted)', marginLeft:6 }}>— {h.note}</span>}
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
