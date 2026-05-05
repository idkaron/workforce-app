import { useState, useEffect } from 'react';
import { useApp, PageHeader, Badge, Btn, Modal, Input, Select, toast } from '../../App.jsx';
import { getAll, create, update } from '../../store.js';

export default function Quotations() {
  const [quotes, setQuotes] = useState([]);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ customerId:'', items:[{ desc:'', qty:1, rate:0 }] });
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const load = () => setQuotes(getAll('quotations').sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)));
  useEffect(()=>load(),[]);

  const customers = getAll('customers');
  const now = new Date();

  const addItem    = ()    => setForm(p=>({...p, items:[...p.items,{desc:'',qty:1,rate:0}]}));
  const removeItem = (i)   => setForm(p=>({...p, items:p.items.filter((_,idx)=>idx!==i)}));
  const updateItem = (i,k,v) => setForm(p=>{ const items=[...p.items]; items[i]={...items[i],[k]:v}; return {...p,items}; });
  const total = () => form.items.reduce((sum,it)=>sum+(Number(it.qty)||0)*(Number(it.rate)||0),0);

  const save = () => {
    if (!form.customerId||form.items.some(it=>!it.desc)) { toast('Customer and all item descriptions required','error'); return; }
    create('quotations',{ customerId:form.customerId, items:form.items, totalAmount:total(), status:'Draft', invoiceId:null });
    toast('Quotation created ✅'); setModal(false); setForm({ customerId:'', items:[{desc:'',qty:1,rate:0}] }); load();
  };

  const setStatus = (q, status) => {
    update('quotations', q.id, { status });
    if (status==='Approved') {
      // Auto-create invoice
      const inv = create('invoices',{ customerId:q.customerId, quotationId:q.id, totalAmount:q.totalAmount, status:'Pending', dueDate: new Date(Date.now()+30*86400000).toISOString().slice(0,10) });
      update('quotations', q.id, { invoiceId: inv.id });
      toast('Quote approved! Invoice auto-generated 💰');
    } else {
      toast(`Status updated to "${status}"`,'info');
    }
    load();
  };

  const statusColor = { Draft:'gray', Sent:'blue', Approved:'green', Rejected:'red' };
  const overdueCutoff = 7*24*60*60*1000;

  return (
    <div>
      <PageHeader title="Quotations Pipeline" subtitle="Manage proposals — approving auto-creates an invoice"
        actions={<Btn onClick={()=>setModal(true)}>+ Create Quote</Btn>}/>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th><th>Invoice</th><th>Update Status</th></tr></thead>
          <tbody>
            {quotes.length===0 && <tr><td colSpan={6}><div className="empty-state" style={{ padding:32 }}><div className="icon">📋</div><h3>No quotations yet</h3></div></td></tr>}
            {quotes.map(q=>{
              const cust = customers.find(c=>c.id===q.customerId);
              const isFollowUp = q.status==='Sent' && (now-new Date(q.createdAt))>overdueCutoff;
              return (
                <tr key={q.id} style={{ background:isFollowUp?'rgba(239,68,68,0.04)':undefined }}>
                  <td style={{ fontWeight:600 }}>{cust?.name||'Unknown'}</td>
                  <td style={{ fontSize:13, color:'var(--muted)' }}>{new Date(q.createdAt).toLocaleDateString()}</td>
                  <td style={{ fontWeight:800, fontSize:15 }}>₹{q.totalAmount?.toLocaleString()}</td>
                  <td>
                    <Badge color={statusColor[q.status]}>{q.status}</Badge>
                    {isFollowUp && <span style={{ marginLeft:8, fontSize:11, fontWeight:700, color:'var(--danger)' }}>FOLLOW UP!</span>}
                  </td>
                  <td>{q.invoiceId ? <Badge color="green">Invoice Created</Badge> : <span style={{ color:'var(--muted-light)', fontSize:13 }}>—</span>}</td>
                  <td>
                    <select className="form-input" value={q.status} onChange={e=>setStatus(q,e.target.value)} style={{ width:'auto', minWidth:130 }} disabled={q.status==='Approved'||q.status==='Rejected'}>
                      {['Draft','Sent','Approved','Rejected'].map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Create Quotation" onClose={()=>setModal(false)}
          footer={<><Btn variant="outline" onClick={()=>setModal(false)}>Cancel</Btn><Btn onClick={save}>Create Quote</Btn></>}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Select label="Customer *" value={form.customerId} onChange={f('customerId')} options={[{value:'',label:'Select customer...'}, ...customers.map(c=>({value:c.id,label:c.name}))]}/>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <label className="form-label" style={{ marginBottom:0 }}>Line Items</label>
                <Btn variant="outline" onClick={addItem} style={{ fontSize:12, padding:'5px 12px' }}>+ Add Item</Btn>
              </div>
              {form.items.map((item,i)=>(
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 70px 90px 30px', gap:8, marginBottom:8 }}>
                  <input className="form-input" placeholder="Description" value={item.desc} onChange={e=>updateItem(i,'desc',e.target.value)} style={{ fontSize:13 }}/>
                  <input className="form-input" type="number" placeholder="Qty" value={item.qty} onChange={e=>updateItem(i,'qty',e.target.value)} style={{ fontSize:13 }}/>
                  <input className="form-input" type="number" placeholder="Rate ₹" value={item.rate} onChange={e=>updateItem(i,'rate',e.target.value)} style={{ fontSize:13 }}/>
                  {form.items.length>1 && <button onClick={()=>removeItem(i)} style={{ background:'var(--danger-bg)', color:'var(--danger)', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:16 }}>×</button>}
                </div>
              ))}
              <div style={{ textAlign:'right', fontSize:16, fontWeight:700, marginTop:10 }}>Total: ₹{total().toLocaleString()}</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
