import { useState, useEffect } from 'react';
import { useApp, PageHeader, Card, Badge } from '../../App.jsx';
import { getAll } from '../../store.js';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const load = () => setReports(getAll('reports').sort((a,b)=>new Date(b.date)-new Date(a.date)));
  useEffect(()=>load(),[]);

  const jobs  = getAll('jobs');
  const users = getAll('users');

  return (
    <div>
      <PageHeader title="Service Reports" subtitle="Inspection and service reports auto-generated from completed jobs"/>

      {reports.length===0 ? (
        <div className="empty-state"><div className="icon">📄</div><h3>No reports yet</h3><p>Complete a job in Scheduling and click "Create Report" to generate one automatically.</p></div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:20 }}>
          {reports.map(r=>{
            const job  = jobs.find(j=>j.id===r.jobId);
            const tech = users.find(u=>u.id===r.techId);
            return (
              <Card key={r.id} style={{ position:'relative' }}>
                <div style={{ position:'absolute', top:20, right:20 }}>
                  <Badge color={r.status==='Approved'?'green':'yellow'}>{r.status}</Badge>
                </div>
                <div style={{ fontSize:11, color:'var(--muted)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8 }}>
                  📅 {new Date(r.date).toLocaleDateString('en-US',{ year:'numeric', month:'long', day:'numeric' })}
                </div>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, marginBottom:12, paddingRight:80 }}>
                  {job?.title || 'Service Report'}
                </h3>
                <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'12px 14px', fontSize:13.5, color:'var(--text-secondary)', lineHeight:1.65, marginBottom:14 }}>
                  {r.details}
                </div>
                {tech && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:13 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:tech.color||'#4F6EF7', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:12 }}>
                      {tech.name[0]}
                    </div>
                    <div>
                      <span style={{ fontWeight:600 }}>{tech.name}</span>
                      <span style={{ color:'var(--muted)' }}> · {tech.position}</span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
