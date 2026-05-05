import { useState, useEffect } from 'react';
import { useApp, PageHeader, Card, Badge, Btn, Avatar, Modal, Textarea, toast } from '../../App.jsx';
import { getAll, update, create, getMyTeam, getPendingRequests } from '../../store.js';

export default function Approvals() {
  const { user, doRefresh } = useApp();
  const [requests, setRequests] = useState([]);
  const [tab, setTab]           = useState('pending');
  const [commentModal, setCommentModal] = useState(null);
  const [comment, setComment]   = useState('');
  const [action, setAction]     = useState('approve');

  const load = () => {
    const team = getMyTeam(user.id).map(e=>e.id);
    const all  = getAll('requests').filter(r => team.includes(r.employeeId)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    setRequests(all);
  };
  useEffect(() => { if(user) load(); }, [user]);

  const filtered = requests.filter(r => tab === 'all' ? true : r.status === tab);
  const pending  = requests.filter(r => r.status === 'pending').length;

  const openAction = (req, act) => { setCommentModal(req); setAction(act); setComment(''); };

  const confirm = () => {
    if (action === 'approve') {
      update('requests', commentModal.id, { status:'approved', managerComment: comment || 'Approved.' });
      // If extension request — update task deadline
      if (commentModal.type === 'extension' && commentModal.newDeadline) {
        update('tasks', commentModal.taskId, { deadline: commentModal.newDeadline, status:'in_progress' });
        toast('Extension approved — deadline updated automatically 📅');
      } else if (commentModal.type === 'submission') {
        update('tasks', commentModal.taskId, { status:'closed', approvedAt: new Date().toISOString() });
        toast('Task submission approved — marked as Closed ✅');
      } else {
        toast('Request approved ✅');
      }
    } else {
      update('requests', commentModal.id, { status:'rejected', managerComment: comment || 'Rejected.' });
      if (commentModal.type === 'submission') update('tasks', commentModal.taskId, { status:'rejected' });
      toast('Request rejected', 'warning');
    }
    setCommentModal(null); load(); doRefresh();
  };

  const tasks = getAll('tasks');
  const users = getAll('users');
  const typeIcon  = { extension:'⏰', submission:'✅' };
  const typeLabel = { extension:'Extension Request', submission:'Submission Review' };
  const statusColor = { pending:'yellow', approved:'green', rejected:'red' };

  return (
    <div>
      <PageHeader title="Approvals Inbox" subtitle="Review employee extension requests and task submissions"/>

      {/* Tabs */}
      <div className="tab-bar">
        {[['pending',`Pending (${pending})`],['approved','Approved'],['rejected','Rejected'],['all','All']].map(([v,l]) => (
          <button key={v} className={`tab-item${tab===v?' active':''}`} onClick={()=>setTab(v)}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">📨</div><h3>{tab==='pending'?'No pending requests':'Nothing here'}</h3><p>{tab==='pending'?'Your team is up to date!':'Try a different filter.'}</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {filtered.map(r => {
            const task = tasks.find(t=>t.id===r.taskId);
            const emp  = users.find(u=>u.id===r.employeeId);
            return (
              <Card key={r.id} style={{ borderLeft:`4px solid ${r.status==='approved'?'var(--success)':r.status==='rejected'?'var(--danger)':'var(--warning)'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
                  <div style={{ flex:1 }}>
                    {/* Header */}
                    <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12, flexWrap:'wrap' }}>
                      <span style={{ fontSize:18 }}>{typeIcon[r.type]}</span>
                      <span style={{ fontWeight:700, fontSize:15 }}>{typeLabel[r.type]}</span>
                      <Badge color={statusColor[r.status]}>{r.status.toUpperCase()}</Badge>
                      <span style={{ fontSize:12, color:'var(--muted)', marginLeft:'auto' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Employee + Task */}
                    {emp && (
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <Avatar name={emp.name} color={emp.color||'#4F6EF7'} size={30}/>
                        <div>
                          <div style={{ fontWeight:600, fontSize:14 }}>{emp.name}</div>
                          <div style={{ fontSize:12, color:'var(--muted)' }}>{emp.position} · {emp.dept}</div>
                        </div>
                      </div>
                    )}

                    <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px 14px', marginBottom:10 }}>
                      <div style={{ fontSize:12, color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:4 }}>Task</div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{task?.title || 'Task (deleted)'}</div>
                      {task && <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>Deadline: {new Date(task.deadline).toLocaleDateString()}</div>}
                    </div>

                    <div style={{ fontSize:13.5, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:r.newDeadline?8:0 }}>
                      <strong>Justification:</strong> {r.justification}
                    </div>
                    {r.newDeadline && (
                      <div style={{ fontSize:13, color:'var(--primary)', fontWeight:600, marginTop:6 }}>
                        📅 Requested new deadline: {new Date(r.newDeadline).toLocaleDateString()}
                      </div>
                    )}
                    {r.managerComment && (
                      <div style={{ marginTop:10, background:'var(--primary-light)', borderRadius:'var(--radius-sm)', padding:'8px 14px', fontSize:13, color:'var(--primary)', fontWeight:500 }}>
                        💬 <strong>Your comment:</strong> {r.managerComment}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {r.status === 'pending' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
                      <Btn variant="success" onClick={()=>openAction(r,'approve')} style={{ justifyContent:'center' }}>✅ Approve</Btn>
                      <Btn variant="danger"  onClick={()=>openAction(r,'reject')}  style={{ justifyContent:'center' }}>❌ Reject</Btn>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirm modal */}
      {commentModal && (
        <Modal title={action==='approve'?'✅ Confirm Approval':'❌ Confirm Rejection'} onClose={()=>setCommentModal(null)}
          footer={<><Btn variant="outline" onClick={()=>setCommentModal(null)}>Cancel</Btn>
            <Btn variant={action==='approve'?'success':'danger'} onClick={confirm}>{action==='approve'?'Approve':'Reject'}</Btn></>}>
          <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:16, lineHeight:1.6 }}>
            {action==='approve' && commentModal.type==='extension'
              ? '🔁 Approving this extension will automatically update the task deadline.'
              : action==='approve' && commentModal.type==='submission'
              ? '✅ Approving this submission will mark the task as Closed.'
              : '❌ The employee will be notified of the rejection.'}
          </p>
          <Textarea label="Comment (optional)" value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add a note for the employee..." rows={3}/>
        </Modal>
      )}
    </div>
  );
}
