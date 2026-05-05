import { useState, useEffect } from 'react';
import { useApp, PageHeader, Card, Badge, Btn, Modal, Input, Select, ProgressBar, toast } from '../../App.jsx';
import { getAll, create, update } from '../../store.js';

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({ customerId:'', startDate:'', endDate:'', totalVisits:4 });
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const load = () => setContracts(getAll('contracts'));
  useEffect(()=>load(),[]);

  const customers = getAll('customers');
  const now = new Date();

  const logVisit = (id) => {
    const c = contracts.find(x=>x.id===id);
    if (c.completedVisits>=c.totalVisits) { toast('All visits already completed','info'); return; }
    update('contracts', id, { completedVisits: c.completedVisits+1 });
    toast('Visit logged ✅'); load();
  };

  const save = () => {
    if (!form.customerId||!form.startDate||!form.endDate) { toast('All fields required','error'); return; }
    create('contracts',{ ...form, totalVisits:Number(form.totalVisits)||4, completedVisits:0 });
    toast('AMC Contract created ✅'); setModal(false); setForm({ customerId:'',startDate:'',endDate:'',totalVisits:4 }); load();
  };

  const expiringSoon = (endDate) => (new Date(endDate)-now) < 30*86400000;
  const isExpired    = (endDate) => new Date(endDate) < now;

  return (
    <div>
      <PageHeader title="AMC Contracts" subtitle="Annual maintenance contracts with visit progress tracking"
        actions={<Btn onClick={()=>setModal(true)}>+ New Contract</Btn>}/>

      {contracts.length===0 ? (
        <div className="empty-state"><div className="icon">🔒</div><h3>No contracts</h3><p>Create your first AMC contract.</p></div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
          {contracts.map(c=>{
            const cust  = customers.find(x=>x.id===c.customerId);
            const pct   = Math.round((c.completedVisits/c.totalVisits)*100);
            const soon  = expiringSoon(c.endDate);
            const expired = isExpired(c.endDate);
            const daysLeft = Math.ceil((new Date(c.endDate)-now)/86400000);
            return (
              <Card key={c.id} style={{ borderTop:`3px solid ${expired?'var(--danger)':soon?'var(--warning)':'var(--success)'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:16 }}>{cust?.name||'Unknown'}</div>
                    <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>
                      {new Date(c.startDate).toLocaleDateString()} → {new Date(c.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge color={expired?'red':soon?'yellow':'green'}>
                    {expired?'Expired':soon?`${daysLeft}d left`:'Active'}
                  </Badge>
                </div>

                <div style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
                    <span style={{ color:'var(--text-secondary)', fontWeight:500 }}>Visits Completed</span>
                    <span style={{ fontWeight:700 }}>{c.completedVisits} / {c.totalVisits}</span>
                  </div>
                  <ProgressBar value={pct} color={pct===100?'var(--success)':'var(--primary)'}/>
                </div>

                {(soon||expired) && (
                  <div style={{ background:expired?'var(--danger-bg)':'var(--warning-bg)', border:`1px solid ${expired?'rgba(239,68,68,0.3)':'rgba(245,158,11,0.3)'}`, borderRadius:'var(--radius-sm)', padding:'8px 12px', fontSize:12, fontWeight:600, color:expired?'var(--danger)':'var(--warning)', marginBottom:12 }}>
                    {expired?'⛔ Contract expired — needs renewal':'⚠️ Contract expiring soon — schedule renewal'}
                  </div>
                )}

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>{c.totalVisits-c.completedVisits} visits remaining</div>
                  {c.completedVisits < c.totalVisits && <Btn variant="secondary" style={{ fontSize:12, padding:'7px 14px' }} onClick={()=>logVisit(c.id)}>+ Log Visit</Btn>}
                  {c.completedVisits >= c.totalVisits && <Badge color="green">✅ Complete</Badge>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title="New AMC Contract" onClose={()=>setModal(false)}
          footer={<><Btn variant="outline" onClick={()=>setModal(false)}>Cancel</Btn><Btn onClick={save}>Create Contract</Btn></>}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Select label="Customer *" value={form.customerId} onChange={f('customerId')} options={[{value:'',label:'Select customer...'}, ...customers.map(c=>({value:c.id,label:c.name}))]}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Input label="Start Date *" type="date" value={form.startDate} onChange={f('startDate')}/>
              <Input label="End Date *"   type="date" value={form.endDate}   onChange={f('endDate')}/>
            </div>
            <Input label="Total Visits" type="number" value={form.totalVisits} onChange={f('totalVisits')} placeholder="4"/>
          </div>
        </Modal>
      )}
    </div>
  );
}
