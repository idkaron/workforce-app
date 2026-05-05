import { useState, useEffect } from 'react';
import { useApp, PageHeader, Card, Badge, KpiCard, ProgressBar } from '../../App.jsx';
import { getTasksForEmployee } from '../../store.js';

export default function History() {
  const { user } = useApp();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (user) {
      const all = getTasksForEmployee(user.id);
      setTasks(all.filter(t => t.status === 'closed' || t.status === 'approved' || t.status === 'rejected').sort((a,b)=>new Date(b.approvedAt||b.createdAt)-new Date(a.approvedAt||a.createdAt)));
    }
  }, [user]);

  const approved = tasks.filter(t => t.status === 'closed' || t.status === 'approved').length;
  const rejected = tasks.filter(t => t.status === 'rejected').length;
  const onTime   = tasks.filter(t => (t.status==='closed'||t.status==='approved') && t.submittedAt && new Date(t.submittedAt) <= new Date(t.deadline)).length;
  const onTimePct = approved > 0 ? Math.round((onTime/approved)*100) : 0;

  return (
    <div>
      <PageHeader title="Task History" subtitle="Completed, approved, and rejected tasks with performance metrics"/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:28 }}>
        <KpiCard label="Total Completed" value={approved} icon="✅" color="var(--success)"/>
        <KpiCard label="Rejected"        value={rejected} icon="❌" color="var(--danger)"/>
        <KpiCard label="On-Time Rate"    value={`${onTimePct}%`} icon="⏱️" color="var(--warning)" trend={onTimePct>=80?'up':'down'}/>
        <KpiCard label="Total Reviewed"  value={tasks.length} icon="📊" color="var(--primary)"/>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state"><div className="icon">📊</div><h3>No history yet</h3><p>Completed tasks will appear here once approved by your manager.</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {tasks.map(t => (
            <Card key={t.id} style={{ borderLeft:`4px solid ${t.status==='rejected'?'var(--danger)':'var(--success)'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                    <Badge color={t.status==='rejected'?'red':'green'}>{t.status.toUpperCase()}</Badge>
                    <Badge color={t.priority==='critical'?'red':t.priority==='high'?'yellow':'blue'}>{t.priority.toUpperCase()}</Badge>
                  </div>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{t.title}</div>
                  <div style={{ fontSize:13, color:'var(--muted)' }}>
                    Deadline: {new Date(t.deadline).toLocaleDateString()}
                    {t.submittedAt && <> · Submitted: {new Date(t.submittedAt).toLocaleDateString()}</>}
                  </div>
                  {t.delayReason && <div style={{ fontSize:13, color:'var(--warning)', marginTop:4 }}>⚠️ {t.delayReason}</div>}
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:24, fontWeight:800 }}>{t.progress}%</div>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>Progress at close</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
