import { useState, useEffect } from 'react';
import { useApp, PageHeader, Badge, Btn, Modal, Input, toast } from '../../App.jsx';
import { getAll, create, update } from '../../store.js';

export default function Customers() {
  const { user } = useApp();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ name:'', company:'', email:'', phone:'', address:'', hasAMC:false });
  const f = k => e => setForm(p=>({ ...p, [k]: e.target.type==='checkbox'?e.target.checked:e.target.value }));

  const load = () => setCustomers(getAll('customers').sort((a,b)=>a.name.localeCompare(b.name)));
  useEffect(()=>load(),[]);

  const save = () => {
    if (!form.name.trim()||!form.email.trim()) { toast('Name and email required','error'); return; }
    create('customers', form);
    toast('Customer added ✅');
    setModal(false); setForm({ name:'',company:'',email:'',phone:'',address:'',hasAMC:false }); load();
  };

  const filtered = customers.filter(c=>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company||'').toLowerCase().includes(search.toLowerCase()) ||
    (c.email||'').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${customers.length} clients in your database`}
        actions={<Btn onClick={()=>setModal(true)}>+ Add Customer</Btn>}/>

      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <div className="search-wrap" style={{ flex:1 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" style={{ paddingLeft:36 }} placeholder="Search by name, company or email..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', fontSize:13, color:'var(--muted)' }}>
          <span style={{ color:'var(--success)', fontWeight:600 }}>● {customers.filter(c=>c.hasAMC).length} AMC</span>
          <span>● {customers.filter(c=>!c.hasAMC).length} No AMC</span>
        </div>
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Company</th><th>Contact</th><th>Address</th><th>AMC Status</th></tr></thead>
          <tbody>
            {filtered.length===0 && <tr><td colSpan={5}><div className="empty-state" style={{ padding:32 }}><div className="icon">🏢</div><h3>No customers found</h3></div></td></tr>}
            {filtered.map(c=>(
              <tr key={c.id}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--primary-light)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'var(--primary)' }}>{c.name[0]}</div>
                    <span style={{ fontWeight:600 }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ color:'var(--text-secondary)' }}>{c.company||'—'}</td>
                <td>
                  <div style={{ fontSize:14, fontWeight:500 }}>{c.email}</div>
                  <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{c.phone||'—'}</div>
                </td>
                <td style={{ fontSize:13, color:'var(--muted)' }}>{c.address||'—'}</td>
                <td>
                  <Badge color={c.hasAMC?'green':'gray'}>{c.hasAMC?'✅ Active AMC':'No AMC'}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Add New Customer" onClose={()=>setModal(false)}
          footer={<><Btn variant="outline" onClick={()=>setModal(false)}>Cancel</Btn><Btn onClick={save}>Add Customer</Btn></>}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Input label="Full Name *" value={form.name} onChange={f('name')} placeholder="Customer name"/>
              <Input label="Company"     value={form.company} onChange={f('company')} placeholder="Company name"/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Input label="Email *" type="email" value={form.email} onChange={f('email')} placeholder="email@company.com"/>
              <Input label="Phone"               value={form.phone} onChange={f('phone')} placeholder="+91-9XXXXXXXXX"/>
            </div>
            <Input label="Address" value={form.address} onChange={f('address')} placeholder="Full address"/>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:14, fontWeight:500 }}>
              <input type="checkbox" checked={form.hasAMC} onChange={f('hasAMC')} style={{ width:16, height:16 }}/>
              Has Active AMC Contract
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}
