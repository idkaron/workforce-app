import { useState, useEffect } from 'react';
import { useApp, PageHeader, Badge, Btn, Modal, Input, Select, toast } from '../../App.jsx';
import { getAll, create, update } from '../../store.js';

const PRIORITY_COLORS = { High:'var(--danger)', Medium:'var(--warning)', Low:'var(--success)' };
const STATUS_STEPS    = ['Scheduled','In Progress','Completed'];

export default function Scheduling() {
  const { user } = useApp();
  const [jobs, setJobs]   = useState([]);
  const [modal, setModal] = useState(false);
  const [delayModal, setDelayModal] = useState(null);
  const [delayReason, setDelayReason] = useState('');
  const [form, setForm]   = useState({ title:'', customerId:'', assignedTo:'', priority:'Medium', deadline:'' });
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const load = () => setJobs(getAll('jobs').sort((a,b)=>new Date(a.deadline)-new Date(b.deadline)));
  useEffect(()=>load(),[]);

  const customers = getAll('customers');
  const employees = getAll('users').filter(u=>u.managerId===user?.id);
  const now = new Date();

  const updateStatus = (id, status) => {
    update('jobs', id, { status });
    if (status==='Completed') toast('Job completed! You can now create a service report 📄','info');
    else toast(`Status updated to "${status}"`);
    load();
  };

  const saveJob = () => {
    if (!form.title||!form.customerId||!form.deadline) { toast('Title, customer and deadline required','error'); return; }
    create('jobs', { ...form, status:'Scheduled', missedReason:null, reportId:null });
    toast('Job scheduled ✅'); setModal(false); setForm({ title:'',customerId:'',assignedTo:'',priority:'Medium',deadline:'' }); load();
  };

  const logDelay = (job) => { setDelayModal(job); setDelayReason(''); };
  const saveDelay = () => {
    if (!delayReason.trim()) { toast('Reason required','error'); return; }
    update('jobs', delayModal.id, { missedReason: delayReason });
    toast('Missed reason logged'); setDelayModal(null); load();
  };

  const createReport = (job) => {
    const existing = getAll('reports').find(r=>r.jobId===job.id);
    if (existing) { toast('Report already exists for this job','info'); return; }
    const rpt = create('reports', { jobId:job.id, techId:job.assignedTo, date:new Date().toISOString().slice(0,10), details:`Service completed for job: ${job.title}. All systems checked and operational.`, status:'Pending' });
    update('jobs', job.id, { reportId: rpt.id });
    toast('Service report created automatically 📄'); load();
  };

  const overdueBanner = jobs.filter(j=>new Date(j.deadline)<now&&j.status!=='Completed').length;

  return (
    <div>
      {overdueBanner>0 && <div className="overdue-banner">🚨 <strong>{overdueBanner} job{overdueBanner>1?'s':''}</strong> {overdueBanner>1?'are':'is'} overdue and require{overdueBanner===1?'s':''} a missed reason.</div>}
      <PageHeader title="Scheduling & Jobs" subtitle="Assign and track service jobs with priority and deadlines"
        actions={<Btn onClick={()=>setModal(true)}>+ New Job</Btn>}/>

      {jobs.length===0 ? (
        <div className="empty-state"><div className="icon">📅</div><h3>No jobs scheduled</h3><p>Create your first job to get started.</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {jobs.map(job=>{
            const cust  = customers.find(c=>c.id===job.customerId);
            const emp   = getAll('users').find(u=>u.id===job.assignedTo);
            const isOverdue = new Date(job.deadline)<now && job.status!=='Completed';
            const pc = PRIORITY_COLORS[job.priority]||'var(--primary)';
            return (
              <div key={job.id} style={{ background:'var(--surface)', border:`1px solid ${isOverdue?'var(--danger)':'var(--border)'}`, borderLeft:`5px solid ${pc}`, borderRadius:'var(--radius-lg)', padding:18, display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
                    <Badge color={job.priority==='High'?'red':job.priority==='Medium'?'yellow':'green'}>{job.priority} Priority</Badge>
                    <Badge color={job.status==='Completed'?'green':job.status==='In Progress'?'primary':'blue'}>{job.status}</Badge>
                    {isOverdue && <Badge color="red">⚠️ OVERDUE</Badge>}
                  </div>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>{job.title}</div>
                  <div style={{ fontSize:13, color:'var(--muted)', display:'flex', gap:16, flexWrap:'wrap' }}>
                    {cust && <span>🏢 {cust.name}</span>}
                    {emp  && <span>👷 {emp.name}</span>}
                    <span style={{ color:isOverdue?'var(--danger)':'var(--muted)', fontWeight:isOverdue?700:400 }}>📅 {new Date(job.deadline).toLocaleDateString()}</span>
                  </div>
                  {job.missedReason && <div style={{ fontSize:12, color:'var(--warning)', marginTop:6, background:'var(--warning-bg)', padding:'5px 10px', borderRadius:'var(--radius-sm)', display:'inline-block' }}>⚠️ {job.missedReason}</div>}
                </div>

                {/* Status buttons */}
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {STATUS_STEPS.map(s=>(
                    <button key={s} onClick={()=>updateStatus(job.id,s)} style={{ padding:'8px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', border:`1.5px solid ${job.status===s?pc:'var(--border)'}`, background:job.status===s?pc:'transparent', color:job.status===s?'#fff':'var(--muted)', transition:'all 0.2s' }}>{s}</button>
                  ))}
                  {job.status==='Completed' && !job.reportId && <Btn variant="secondary" style={{ fontSize:12, padding:'8px 12px' }} onClick={()=>createReport(job)}>📄 Create Report</Btn>}
                  {isOverdue && !job.missedReason && <Btn variant="danger" style={{ fontSize:12, padding:'8px 12px' }} onClick={()=>logDelay(job)}>⚠️ Log Reason</Btn>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title="Schedule New Job" onClose={()=>setModal(false)}
          footer={<><Btn variant="outline" onClick={()=>setModal(false)}>Cancel</Btn><Btn onClick={saveJob}>Schedule Job</Btn></>}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Input label="Job Title *" value={form.title} onChange={f('title')} placeholder="e.g. Fire System Inspection"/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Select label="Customer *" value={form.customerId} onChange={f('customerId')} options={[{value:'',label:'Select customer...'}, ...customers.map(c=>({value:c.id,label:c.name}))]}/>
              <Select label="Assign To"  value={form.assignedTo} onChange={f('assignedTo')} options={[{value:'',label:'Unassigned'}, ...getAll('users').filter(u=>u.managerId===user?.id).map(e=>({value:e.id,label:e.name}))]}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Select label="Priority" value={form.priority} onChange={f('priority')} options={['High','Medium','Low'].map(p=>({value:p,label:p}))}/>
              <Input  label="Deadline *" type="date" value={form.deadline} onChange={f('deadline')}/>
            </div>
          </div>
        </Modal>
      )}

      {delayModal && (
        <Modal title="Log Missed Reason" onClose={()=>setDelayModal(null)}
          footer={<><Btn variant="outline" onClick={()=>setDelayModal(null)}>Cancel</Btn><Btn onClick={saveDelay}>Save Reason</Btn></>}>
          <p style={{ fontSize:14, color:'var(--muted)', marginBottom:16 }}>Why did <strong>{delayModal.title}</strong> miss its deadline?</p>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label className="form-label">Reason *</label>
            <textarea className="form-input" value={delayReason} onChange={e=>setDelayReason(e.target.value)} rows={4} placeholder="Explain the root cause..."/>
          </div>
        </Modal>
      )}
    </div>
  );
}
