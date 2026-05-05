import { useState, useEffect } from 'react';
import { useApp, PageHeader, Card, Badge, ProgressBar, Avatar } from '../../App.jsx';
import { getTasksForManager, getMyTeam, taskRisk, getAll } from '../../store.js';

export default function Deadlines() {
  const { user } = useApp();
  const [tasks, setTasks] = useState([]);
  const [team,  setTeam]  = useState([]);
  const [empFilter, setEmpFilter]   = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    setTasks(getTasksForManager(user.id).filter(t => t.status !== 'closed' && t.status !== 'approved').sort((a,b)=>new Date(a.deadline)-new Date(b.deadline)));
    setTeam(getMyTeam(user.id));
  }, [user]);

  const now = new Date();

  const filtered = tasks.filter(t => {
    if (empFilter !== 'all' && t.assignedTo !== empFilter) return false;
    const r = taskRisk(t);
    if (riskFilter !== 'all' && r !== riskFilter) return false;
    return true;
  });

  const overdue   = filtered.filter(t => taskRisk(t)==='red').length;
  const atRisk    = filtered.filter(t => taskRisk(t)==='yellow').length;
  const onTrack   = filtered.filter(t => taskRisk(t)==='green').length;

  const riskColor = { red:'var(--danger)', yellow:'var(--warning)', green:'var(--success)' };
  const riskLabel = { red:'Overdue', yellow:'At Risk', green:'On Track' };

  return (
    <div>
      <PageHeader title="Deadline Monitor" subtitle="Timeline view of all active tasks sorted by urgency"/>

      {/* Summary pills */}
      <div style={{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:12 }}>
          {[['🔴',overdue,'Overdue','var(--danger)'],['🟡',atRisk,'At Risk','var(--warning)'],['🟢',onTrack,'On Track','var(--success)']].map(([ic,cnt,lb,cl]) => (
            <div key={lb} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'12px 20px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:20 }}>{ic}</span>
              <div><div style={{ fontSize:22, fontWeight:800, color:cl }}>{cnt}</div><div style={{ fontSize:12, color:'var(--muted)' }}>{lb}</div></div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:10, marginLeft:'auto', flexWrap:'wrap', alignItems:'center' }}>
          <select className="form-input" value={empFilter} onChange={e=>setEmpFilter(e.target.value)} style={{ width:'auto', minWidth:160 }}>
            <option value="all">All Employees</option>
            {team.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select className="form-input" value={riskFilter} onChange={e=>setRiskFilter(e.target.value)} style={{ width:'auto', minWidth:140 }}>
            <option value="all">All Risk Levels</option>
            <option value="red">Overdue</option>
            <option value="yellow">At Risk</option>
            <option value="green">On Track</option>
          </select>
        </div>
      </div>

      {/* Timeline list */}
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">🎉</div><h3>All clear!</h3><p>No tasks match the current filters.</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map(t => {
            const emp  = getAll('users').find(u=>u.id===t.assignedTo);
            const risk = taskRisk(t);
            const days = Math.ceil((new Date(t.deadline)-now)/86400000);
            const pct  = Math.max(0, Math.min(100, days > 0 ? Math.round(((t.progress)/100)*100) : 0));
            return (
              <div key={t.id} style={{ background:'var(--surface)', border:`1px solid ${days<0?'rgba(239,68,68,0.4)':'var(--border)'}`, borderRadius:'var(--radius-lg)', padding:'16px 20px', display:'flex', gap:16, alignItems:'center' }}>
                {/* Left accent */}
                <div style={{ width:4, height:56, borderRadius:4, background:riskColor[risk], flexShrink:0 }}/>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.title}</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    {emp && <div style={{ display:'flex', alignItems:'center', gap:6 }}><Avatar name={emp.name} color={emp.color} size={20}/><span style={{ fontSize:12, color:'var(--muted)' }}>{emp.name.split(' ')[0]}</span></div>}
                    <Badge color={t.priority==='critical'?'red':t.priority==='high'?'yellow':'blue'}>{t.priority}</Badge>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ width:140, flexShrink:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--muted)', marginBottom:5 }}><span>Progress</span><span style={{ fontWeight:700 }}>{t.progress}%</span></div>
                  <ProgressBar value={t.progress} color={riskColor[risk]}/>
                </div>

                {/* Deadline */}
                <div style={{ textAlign:'right', flexShrink:0, minWidth:100 }}>
                  <div style={{ fontSize:20, fontWeight:800, color:riskColor[risk] }}>
                    {days < 0 ? `${Math.abs(days)}d` : days === 0 ? '0d' : `${days}d`}
                  </div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>
                    {days < 0 ? 'overdue' : days === 0 ? 'due today' : 'remaining'}
                  </div>
                  <div style={{ fontSize:11, color:'var(--muted-light)', marginTop:2 }}>{new Date(t.deadline).toLocaleDateString()}</div>
                </div>

                {/* Risk badge */}
                <div style={{ flexShrink:0 }}>
                  <Badge color={risk==='red'?'red':risk==='yellow'?'yellow':'green'} dot>{riskLabel[risk]}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
