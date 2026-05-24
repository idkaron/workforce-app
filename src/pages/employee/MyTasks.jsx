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
const statusColor   = {
  assigned:'blue', in_progress:'primary', submitted:'yellow',
  approved:'green', rejected:'red', closed:'green', overdue:'red',
  forwarded:'purple', waiting_approval:'yellow', sent_to_client:'blue',
  client_approved:'green', completed:'green',
};
const statusLabel = {
  assigned:'Assigned', in_progress:'In Progress', submitted:'Submitted',
  approved:'Approved', rejected:'Rejected', closed:'Closed', overdue:'Overdue',
  forwarded:'Forwarded', waiting_approval:'Waiting Approval', sent_to_client:'Sent to Client',
  client_approved:'Client Approved', completed:'Completed',
};

// ─── Workflow Timeline Panel (extracted to avoid IIFE issues) ─────────────────
function WorkflowTimeline({ task, onClose }) {
  const allTasks = getAll('tasks');
  const allUsers = getAll('users');

  // Walk to root
  let root = task;
  let safety = 0;
  while (root && root.parentTaskId && safety < 20) {
    const parent = allTasks.find(t => t.id === root.parentTaskId);
    if (!parent) break;
    root = parent;
    safety++;
  }

  // Walk down
  const chain = [];
  const visit = (t) => {
    chain.push(t);
    allTasks.filter(x => x.parentTaskId === t.id).forEach(visit);
  };
  if (root) visit(root);

  const dotColor = {
    assigned:'#3B82F6', in_progress:'#4F6EF7', submitted:'#F59E0B',
    approved:'#10B981', rejected:'#EF4444', forwarded:'#8B5CF6',
    completed:'#10B981', client_approved:'#10B981',
  };
  const sLabelMap = {
    assigned:'Assigned', in_progress:'In Progress', submitted:'Submitted',
    approved:'Approved', rejected:'Rejected', forwarded:'Forwarded',
    completed:'Completed', client_approved:'Client Approved',
  };

  return (
    <Modal title="🔗 Workflow Timeline" onClose={onClose} footer={<Btn onClick={onClose}>Close</Btn>}>
      <p style={{ fontSize:13, color:'#64748B', marginBottom:20 }}>{chain.length} stage{chain.length !== 1 ? 's' : ''} in this workflow</p>
      {chain.map((t, i) => {
        const assignee = allUsers.find(u => u.id === t.assignedTo);
        return (
          <div key={t.id} style={{ display:'flex', gap:12, paddingBottom:20, position:'relative' }}>
            {i < chain.length - 1 && (
              <div style={{ position:'absolute', left:15, top:32, bottom:0, width:2, background:'#E2E8F0' }}/>
            )}
            <div style={{
              width:32, height:32, borderRadius:'50%', flexShrink:0, zIndex:1,
              background: dotColor[t.status] || '#E2E8F0',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, color:'#fff', fontWeight:800,
            }}>{i + 1}</div>
            <div style={{ flex:1, background:'#F8FAFF', border:'1px solid #E2E8F0', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <span style={{ fontWeight:700, fontSize:14, color:'#0F172A' }}>{t.title}</span>
                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'#EEF2FF', color:'#4F6EF7', fontWeight:600 }}>
                  {sLabelMap[t.status] || t.status}
                </span>
              </div>
              <div style={{ fontSize:12, color:'#64748B' }}>
                👤 {assignee ? assignee.name : 'Unassigned'} · 📅 {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'} · {t.progress || 0}%
              </div>
              {(t.workflowHistory || []).map((h, hi) => {
                const from = allUsers.find(u => u.id === h.fromId);
                const to   = allUsers.find(u => u.id === h.toId);
                return (
                  <div key={hi} style={{ marginTop:6, fontSize:12, color:'#8B5CF6', borderTop:'1px solid #E2E8F0', paddingTop:6 }}>
                    🔗 {from ? from.name : '?'} → {to ? to.name : '?'} · "{h.stage}"
                    {h.note ? <span style={{ color:'#94A3B8', marginLeft:6 }}>— {h.note}</span> : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </Modal>
  );
}

// ─── Forward Task Modal ───────────────────────────────────────────────────────
function ForwardModal({ task, onClose, onConfirm }) {
  const allUsers  = getAll('users');
  const coworkers = allUsers.filter(u => u.role === 'employee' && u.id !== task.id);
  const [toId,  setToId]  = useState('');
  const [stage, setStage] = useState('');
  const [note,  setNote]  = useState('');

  const empOptions = [
    { value:'', label:'Select coworker...' },
    ...coworkers.map(u => ({ value: u.id, label: u.name + (u.position ? ' (' + u.position + ')' : '') })),
  ];

  const handleSubmit = () => {
    if (!toId)         { toast('Please select a coworker', 'error'); return; }
    if (!stage.trim()) { toast('Please enter a stage title', 'error'); return; }
    onConfirm({ toId, stage, note });
  };

  return (
    <Modal
      title="🔗 Forward Task to Coworker"
      onClose={onClose}
      footer={
        <div style={{ display:'flex', gap:10 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSubmit}>Forward Task</Btn>
        </div>
      }
    >
      <p style={{ fontSize:14, color:'#64748B', marginBottom:20, lineHeight:1.6 }}>
        Forwarding <strong style={{ color:'#0F172A' }}>"{task.title}"</strong> will mark it as{' '}
        <em>Forwarded</em> and create a new task stage for the selected coworker.
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <Select
          label="Assign Next Stage To *"
          value={toId}
          onChange={e => setToId(e.target.value)}
          options={empOptions}
        />
        <Input
          label="Next Stage Title *"
          value={stage}
          onChange={e => setStage(e.target.value)}
          placeholder="e.g. Prepare Quotation, Client Visit, Installation..."
        />
        <Textarea
          label="Handover Notes (optional)"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add context or instructions for the next person..."
          rows={3}
        />
      </div>
    </Modal>
  );
}

// ─── Request Update Modal ─────────────────────────────────────────────────────
function UpdateRequestModal({ task, onClose, onConfirm }) {
  const [justification,     setJustification]     = useState('');
  const [newDeadline,       setNewDeadline]       = useState('');
  const [requestedPriority, setRequestedPriority] = useState('');

  const priorityOptions = [
    { value:'', label:'No change' },
    { value:'low',      label:'Low'      },
    { value:'medium',   label:'Medium'   },
    { value:'high',     label:'High'     },
    { value:'critical', label:'Critical' },
  ];

  const handleSubmit = () => {
    if (!justification.trim()) { toast('Please describe what needs to change', 'error'); return; }
    onConfirm({ justification, newDeadline: newDeadline || null, requestedPriority: requestedPriority || null });
  };

  return (
    <Modal
      title="✏️ Request Task Update"
      onClose={onClose}
      footer={
        <div style={{ display:'flex', gap:10 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSubmit}>Send Request</Btn>
        </div>
      }
    >
      <p style={{ fontSize:14, color:'#64748B', marginBottom:20, lineHeight:1.6 }}>
        Request your manager to modify <strong style={{ color:'#0F172A' }}>"{task.title}"</strong>.
        They can approve or reject your request.
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <Textarea
          label="What needs to be changed? *"
          value={justification}
          onChange={e => setJustification(e.target.value)}
          placeholder="Describe what should be changed and why..."
          rows={4}
        />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Input
            label="Request New Deadline (optional)"
            type="date"
            value={newDeadline}
            onChange={e => setNewDeadline(e.target.value)}
          />
          <Select
            label="Request Priority Change (optional)"
            value={requestedPriority}
            onChange={e => setRequestedPriority(e.target.value)}
            options={priorityOptions}
          />
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MyTasks() {
  const { user, doRefresh } = useApp();
  const [tasks, setTasks]   = useState([]);
  const [filter, setFilter] = useState('all');

  // Existing modal state
  const [delayModal, setDelayModal]   = useState(null);
  const [delayReason, setDelayReason] = useState('');
  const [submitModal, setSubmitModal] = useState(null);

  // New modal state — just store the task object
  const [forwardModal,  setForwardModal]  = useState(null);
  const [updateModal,   setUpdateModal]   = useState(null);
  const [timelineModal, setTimelineModal] = useState(null);

  const load = () => { if (user) setTasks(getTasksForEmployee(user.id)); };
  useEffect(() => { load(); }, [user]);

  // ─── Filtered tasks ─────────────────────────────────────────────────────────
  const filtered = (() => {
    if (filter === 'all')       return tasks;
    if (filter === 'overdue')   return tasks.filter(t => taskRisk(t) === 'red' && t.status !== 'closed' && t.status !== 'approved' && t.status !== 'completed');
    if (filter === 'forwarded') return tasks.filter(t => t.status === 'forwarded');
    return tasks.filter(t => t.status === filter);
  })();

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSubmit = (task) => {
    const risk = taskRisk(task);
    if (risk === 'red' && !task.delayReason && new Date(task.deadline) < new Date()) {
      setDelayModal(task); return;
    }
    setSubmitModal(task);
  };

  const confirmSubmit = () => {
    create('requests', {
      type:'submission', taskId:submitModal.id, employeeId:user.id,
      managerId:submitModal.createdBy, justification:'Task completed and submitted for review.',
      status:'pending', newDeadline:null,
    });
    update('tasks', submitModal.id, { status:'submitted', submittedAt: new Date().toISOString() });
    toast('Task submitted for manager review ✅');
    setSubmitModal(null); load(); doRefresh();
  };

  const confirmDelay = () => {
    if (!delayReason.trim()) { toast('Please enter a delay reason', 'error'); return; }
    update('tasks', delayModal.id, { delayReason });
    toast('Delay reason logged', 'info');
    const saved = delayModal;
    setDelayReason(''); setDelayModal(null);
    setSubmitModal(saved); load();
  };

  const handleForwardConfirm = ({ toId, stage, note }) => {
    const historyEntry = {
      fromId: user.id, toId, note, stage,
      timestamp: new Date().toISOString(),
    };
    const existing = forwardModal.workflowHistory || [];
    update('tasks', forwardModal.id, {
      status: 'forwarded',
      workflowHistory: [...existing, historyEntry],
    });
    create('tasks', {
      title: stage,
      desc: note || 'Forwarded from: ' + forwardModal.title,
      priority: forwardModal.priority,
      status: 'assigned',
      deadline: forwardModal.deadline,
      assignedTo: toId,
      createdBy: forwardModal.createdBy,
      progress: 0,
      parentTaskId: forwardModal.id,
      workflowHistory: [],
      delayReason: null, submittedAt: null, approvedAt: null,
    });
    const toUser = getAll('users').find(u => u.id === toId);
    toast('Task forwarded to ' + (toUser ? toUser.name : 'coworker') + ' ✅');
    setForwardModal(null); load(); doRefresh();
  };

  const handleUpdateConfirm = ({ justification, newDeadline, requestedPriority }) => {
    create('requests', {
      type: 'update_request',
      taskId: updateModal.id,
      employeeId: user.id,
      managerId: updateModal.createdBy,
      justification,
      status: 'pending',
      newDeadline: newDeadline || null,
      requestedPriority: requestedPriority || null,
      managerComment: null,
    });
    toast('Update request sent to manager ✅');
    setUpdateModal(null); load(); doRefresh();
  };

  const allRequests = getAll('requests');
  const hasPendingUpdate = (taskId) =>
    allRequests.some(r => r.taskId === taskId && r.type === 'update_request' && r.status === 'pending');

  const now  = new Date();
  const tabs = ['all', 'assigned', 'in_progress', 'submitted', 'forwarded', 'approved', 'overdue', 'closed'];

  return (
    <div>
      <PageHeader title="My Tasks" subtitle="Manage your assigned tasks, submit, or forward to a coworker"/>

      {/* Tab filters */}
      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t} className={`tab-item${filter === t ? ' active' : ''}`} onClick={() => setFilter(t)}>
            {t === 'all' ? 'All Tasks' : t === 'in_progress' ? 'In Progress' : t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}
            {t === 'overdue' && (
              <span style={{ marginLeft:5, background:'#EF4444', color:'#fff', borderRadius:999, fontSize:10, padding:'1px 6px' }}>
                {tasks.filter(x => taskRisk(x) === 'red' && x.status !== 'closed' && x.status !== 'approved').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">📋</div><h3>No tasks here</h3><p>Try a different filter.</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {filtered.map(task => {
            const risk      = taskRisk(task);
            const days      = Math.ceil((new Date(task.deadline) - now) / 86400000);
            const isOverdue = risk === 'red' && task.status !== 'closed' && task.status !== 'approved' && task.status !== 'completed';
            const isActive  = task.status === 'in_progress' || task.status === 'assigned';
            const canSubmit = isActive && task.progress > 0;
            const isForwarded  = task.status === 'forwarded';
            const pendingUpd   = hasPendingUpdate(task.id);
            const hasWorkflow  = (task.workflowHistory || []).length > 0 || task.parentTaskId;

            const borderLeftColor = isOverdue ? '#EF4444'
              : task.priority === 'critical' ? '#EF4444'
              : task.priority === 'high'     ? '#F59E0B'
              : isForwarded                   ? '#8B5CF6'
              : '#4F6EF7';

            return (
              <div key={task.id} style={{
                background:'var(--surface)',
                border:`1px solid ${isOverdue ? '#EF4444' : 'var(--border)'}`,
                borderLeft:`4px solid ${borderLeftColor}`,
                borderRadius:'var(--radius-lg)',
                padding:20,
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    {/* Badges */}
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8, alignItems:'center' }}>
                      <Badge color={priorityColor[task.priority]}>{task.priority.toUpperCase()}</Badge>
                      <Badge color={statusColor[task.status] || 'gray'}>{statusLabel[task.status] || task.status}</Badge>
                      {isOverdue   && <Badge color="red">⚠️ OVERDUE</Badge>}
                      {pendingUpd  && <Badge color="yellow">⏳ Update Requested</Badge>}
                      {hasWorkflow && (
                        <span
                          onClick={() => setTimelineModal(task)}
                          style={{ fontSize:12, color:'#8B5CF6', cursor:'pointer', fontWeight:600 }}
                        >
                          🔗 {task.parentTaskId ? 'Part of workflow' : `Workflow (${(task.workflowHistory || []).length} stage${(task.workflowHistory || []).length !== 1 ? 's' : ''})`}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>{task.title}</h3>
                    <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.5, marginBottom:10 }}>{task.desc}</p>

                    {task.delayReason && (
                      <div style={{ background:'#FEF3C7', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#D97706', marginBottom:10 }}>
                        <strong>Delay Reason:</strong> {task.delayReason}
                      </div>
                    )}

                    {/* Forwarded note */}
                    {isForwarded && (task.workflowHistory || []).length > 0 && (() => {
                      const last  = task.workflowHistory[task.workflowHistory.length - 1];
                      const toUsr = getAll('users').find(u => u.id === last.toId);
                      return (
                        <div style={{ background:'#EDE9FE', border:'1px solid rgba(139,92,246,0.25)', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#7C3AED', marginBottom:10 }}>
                          🔗 Forwarded to <strong>{toUsr ? toUsr.name : 'a coworker'}</strong> — Stage: "{last.stage}"
                          {last.note && <div style={{ marginTop:4, opacity:0.8 }}>Note: {last.note}</div>}
                        </div>
                      );
                    })()}

                    {/* Progress */}
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
                      <span style={{ fontSize:12, color:'var(--muted)', minWidth:60 }}>Progress</span>
                      <div style={{ flex:1 }}>
                        <ProgressBar value={task.progress} color={isOverdue ? '#EF4444' : '#4F6EF7'}/>
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, minWidth:36 }}>{task.progress}%</span>
                    </div>
                    {isActive && (
                      <input type="range" min={0} max={100} value={task.progress}
                        onChange={e => { update('tasks', task.id, { progress: Number(e.target.value) }); load(); doRefresh(); }}
                        style={{ width:'100%', marginTop:4, accentColor:'#4F6EF7' }}/>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
                    <div style={{ fontSize:13, fontWeight:700, marginBottom:2, color: days < 0 ? '#EF4444' : days < 3 ? '#F59E0B' : '#64748B' }}>
                      {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today!' : `${days}d remaining`}
                    </div>
                    <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>📅 {new Date(task.deadline).toLocaleDateString()}</div>

                    {canSubmit && (
                      <Btn variant="success" onClick={() => handleSubmit(task)} style={{ fontSize:12, padding:'7px 12px' }}>
                        ✅ Submit for Review
                      </Btn>
                    )}
                    {isActive && (
                      <Btn variant="secondary" onClick={() => setForwardModal(task)} style={{ fontSize:12, padding:'7px 12px' }}>
                        🔗 Forward Task
                      </Btn>
                    )}
                    {isActive && !pendingUpd && (
                      <Btn variant="outline" onClick={() => setUpdateModal(task)} style={{ fontSize:12, padding:'7px 12px' }}>
                        ✏️ Request Update
                      </Btn>
                    )}
                    {task.status === 'rejected' && (
                      <Btn variant="secondary" onClick={() => { update('tasks', task.id, { status:'in_progress' }); load(); }} style={{ fontSize:12 }}>
                        🔁 Revise &amp; Resubmit
                      </Btn>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Existing: Delay modal ──────────────────────────────────────────── */}
      {delayModal && (
        <Modal title="⚠️ Log Delay Reason" onClose={() => setDelayModal(null)}
          footer={<div style={{ display:'flex', gap:10 }}><Btn variant="outline" onClick={() => setDelayModal(null)}>Cancel</Btn><Btn onClick={confirmDelay}>Submit &amp; Continue</Btn></div>}>
          <p style={{ fontSize:14, color:'var(--muted)', marginBottom:16 }}>This task is overdue. Please provide a reason before submitting.</p>
          <Textarea label="Delay Reason *" value={delayReason} onChange={e => setDelayReason(e.target.value)} placeholder="Explain why the deadline was missed..." rows={4}/>
        </Modal>
      )}

      {/* ─── Existing: Submit confirm modal ─────────────────────────────────── */}
      {submitModal && (
        <Modal title="Submit Task for Review" onClose={() => setSubmitModal(null)}
          footer={<div style={{ display:'flex', gap:10 }}><Btn variant="outline" onClick={() => setSubmitModal(null)}>Cancel</Btn><Btn onClick={confirmSubmit}>✅ Confirm Submit</Btn></div>}>
          <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.7 }}>
            You are submitting <strong>"{submitModal.title}"</strong> for manager approval. Your manager will review and mark it as Approved or Rejected.
          </p>
        </Modal>
      )}

      {/* ─── New: Forward Task modal ─────────────────────────────────────────── */}
      {forwardModal && (
        <ForwardModal
          task={forwardModal}
          onClose={() => setForwardModal(null)}
          onConfirm={handleForwardConfirm}
        />
      )}

      {/* ─── New: Request Update modal ───────────────────────────────────────── */}
      {updateModal && (
        <UpdateRequestModal
          task={updateModal}
          onClose={() => setUpdateModal(null)}
          onConfirm={handleUpdateConfirm}
        />
      )}

      {/* ─── New: Workflow Timeline modal ────────────────────────────────────── */}
      {timelineModal && (
        <WorkflowTimeline
          task={timelineModal}
          onClose={() => setTimelineModal(null)}
        />
      )}
    </div>
  );
}
