import { useState, useEffect } from 'react';
import { useApp, PageHeader, Card, Badge, Btn, Modal, Input, Textarea, Select, toast } from '../../App.jsx';
import { getAll, create, getTasksForEmployee } from '../../store.js';

export default function Requests() {
  const { user, doRefresh } = useApp();
  const [requests, setRequests] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ taskId:'', type:'extension', justification:'', newDeadline:'' });
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const load = () => {
    const all = getAll('requests').filter(r => r.employeeId === user.id);
    setRequests(all.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)));
    setTasks(getTasksForEmployee(user.id).filter(t => t.status !== 'closed' && t.status !== 'approved'));
  };
  useEffect(() => { if(user) load(); }, [user]);

  const submit = () => {
    if (!form.taskId || !form.justification.trim()) { toast('Please fill in all required fields','error'); return; }
    if (form.type === 'extension' && !form.newDeadline) { toast('Please specify new deadline','error'); return; }
    const task = tasks.find(t => t.id === form.taskId);
    create('requests', { ...form, employeeId:user.id, managerId:task?.createdBy||'', status:'pending', managerComment:null });
    toast('Request submitted to your manager 📨');
    setShowModal(false); setForm({ taskId:'', type:'extension', justification:'', newDeadline:'' });
    load(); doRefresh();
  };

  const statusColor = { pending:'yellow', approved:'green', rejected:'red' };
  const typeLabel   = { extension:'⏰ Extension Request', submission:'✅ Submission Request' };

  return (
    <div>
      <PageHeader title="Extension Requests" subtitle="Request deadline extensions or track submission reviews"
        actions={<Btn onClick={()=>setShowModal(true)}>+ New Request</Btn>}/>

      {requests.length === 0 ? (
        <div className="empty-state"><div className="icon">📨</div><h3>No requests yet</h3><p>Submit a deadline extension request when you need more time.</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {requests.map(r => {
            const task = getAll('tasks').find(t => t.id === r.taskId);
            return (
              <Card key={r.id} style={{ borderLeft:`4px solid ${r.status==='approved'?'var(--success)':r.status==='rejected'?'var(--danger)':'var(--warning)'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                  <div>
                    <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                      <Badge color={statusColor[r.status]||'gray'}>{r.status.toUpperCase()}</Badge>
                      <span style={{ fontSize:13, color:'var(--muted)', fontWeight:500 }}>{typeLabel[r.type]||r.type}</span>
                    </div>
                    <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{task?.title || 'Task (deleted)'}</div>
                    <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:8, lineHeight:1.5 }}>
                      <strong>Justification:</strong> {r.justification}
                    </div>
                    {r.type === 'extension' && r.newDeadline && (
                      <div style={{ fontSize:13, color:'var(--muted)' }}>📅 Requested new deadline: <strong>{new Date(r.newDeadline).toLocaleDateString()}</strong></div>
                    )}
                    {r.managerComment && (
                      <div style={{ marginTop:10, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:13 }}>
                        <span style={{ fontWeight:600 }}>Manager's comment: </span>{r.managerComment}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign:'right', fontSize:12, color:'var(--muted)' }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal title="New Request" onClose={()=>setShowModal(false)} footer={<><Btn variant="outline" onClick={()=>setShowModal(false)}>Cancel</Btn><Btn onClick={submit}>Submit Request</Btn></>}>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <Select label="Request Type" value={form.type} onChange={f('type')} options={[
              { value:'extension',  label:'⏰ Deadline Extension' },
              { value:'submission', label:'✅ Task Submission'     },
            ]}/>
            <Select label="Task *" value={form.taskId} onChange={f('taskId')} options={[
              { value:'', label:'Select a task...' },
              ...tasks.map(t => ({ value:t.id, label:t.title })),
            ]}/>
            {form.type === 'extension' && <Input label="Requested New Deadline *" type="date" value={form.newDeadline} onChange={f('newDeadline')}/>}
            <Textarea label="Justification *" value={form.justification} onChange={f('justification')} placeholder="Explain why you need this extension or submit this task..." rows={4}/>
          </div>
        </Modal>
      )}
    </div>
  );
}
