import { useState, useEffect } from 'react';
import { useApp, PageHeader, KpiCard, Badge, Btn, toast } from '../../App.jsx';
import { getAll, update } from '../../store.js';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const load = () => setInvoices(getAll('invoices').sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)));
  useEffect(()=>load(),[]);

  const customers = getAll('customers');
  const now = new Date();

  const collected = invoices.filter(i=>i.status==='Paid').reduce((s,i)=>s+i.totalAmount,0);
  const pending   = invoices.filter(i=>i.status==='Pending').reduce((s,i)=>s+i.totalAmount,0);
  const overdue   = invoices.filter(i=>i.status!=='Paid'&&new Date(i.dueDate)<now).reduce((s,i)=>s+i.totalAmount,0);

  const markPaid = (id) => { update('invoices',id,{status:'Paid'}); toast('Invoice marked as paid ✅'); load(); };

  const statusColor = { Paid:'green', Pending:'yellow', Overdue:'red' };

  return (
    <div>
      <PageHeader title="Invoices & Billing" subtitle="Track collections, pending payments and overdue accounts"/>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:28 }}>
        <KpiCard label="Total Collected" value={`₹${collected.toLocaleString()}`} icon="💚" color="var(--success)" sub={`${invoices.filter(i=>i.status==='Paid').length} invoices paid`}/>
        <KpiCard label="Pending"         value={`₹${pending.toLocaleString()}`}   icon="⏳" color="var(--warning)" sub={`${invoices.filter(i=>i.status==='Pending').length} awaiting`}/>
        <KpiCard label="Overdue Amount"  value={`₹${overdue.toLocaleString()}`}   icon="🚨" color="var(--danger)"  sub={`${invoices.filter(i=>i.status!=='Paid'&&new Date(i.dueDate)<now).length} overdue`} trend={overdue>0?'down':undefined}/>
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Customer</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {invoices.length===0 && <tr><td colSpan={5}><div className="empty-state" style={{ padding:32 }}><div className="icon">💰</div><h3>No invoices yet</h3><p>Approve a quotation to auto-generate one.</p></div></td></tr>}
            {invoices.map(inv=>{
              const cust = customers.find(c=>c.id===inv.customerId);
              const isOverdue = inv.status!=='Paid'&&new Date(inv.dueDate)<now;
              const status = isOverdue&&inv.status!=='Paid'?'Overdue':inv.status;
              return (
                <tr key={inv.id} style={{ background:isOverdue?'rgba(239,68,68,0.03)':undefined }}>
                  <td style={{ fontWeight:600 }}>{cust?.name||'Unknown'}</td>
                  <td style={{ fontWeight:800, fontSize:16 }}>₹{inv.totalAmount?.toLocaleString()}</td>
                  <td style={{ color:isOverdue?'var(--danger)':'var(--muted)', fontWeight:isOverdue?700:400, fontSize:13 }}>
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                    {isOverdue && <div style={{ fontSize:11, fontWeight:700 }}>OVERDUE</div>}
                  </td>
                  <td><Badge color={statusColor[status]||'gray'}>{status}</Badge></td>
                  <td>
                    {inv.status!=='Paid' && <Btn variant="success" style={{ fontSize:12, padding:'7px 14px' }} onClick={()=>markPaid(inv.id)}>Mark as Paid</Btn>}
                    {inv.status==='Paid' && <span style={{ fontSize:13, color:'var(--success)', fontWeight:600 }}>✅ Paid</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
