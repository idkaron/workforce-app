import { useState, useEffect } from 'react';
import { useApp, PageHeader, Card, Badge, Btn, Avatar, ProgressBar } from '../../App.jsx';
import { getMyTeam, getTasksForManager, employeeRisk, taskRisk } from '../../store.js';

export default function Employees() {
  const { user, setPage } = useApp();
  const [team, setTeam] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { if(user) setTeam(getMyTeam(user.id)); }, [user]);

  const enriched = team.map(emp => {
    const tasks    = getTasksForManager(user.id).filter(t => t.assignedTo === emp.id);
    const active   = tasks.filter(t => t.status !== 'closed' && t.status !== 'approved');
    const completed= tasks.filter(t => t.status === 'closed' || t.status === 'approved').length;
    const overdue  = active.filter(t => taskRisk(t) === 'red').length;
    const progress = active.length > 0 ? Math.round(active.reduce((a,t)=>a+t.progress,0)/active.length) : 100;
    const risk     = employeeRisk(emp.id);
    return { ...emp, tasks:tasks.length, active:active.length, completed, overdue, progress, risk };
  });

  const filtered = enriched
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.position?.toLowerCase().includes(search.toLowerCase()))
    .filter(e => filter === 'all' || e.risk === filter);

  const riskCounts = { all:enriched.length, green:enriched.filter(e=>e.risk==='green').length, yellow:enriched.filter(e=>e.risk==='yellow').length, red:enriched.filter(e=>e.risk==='red').length };

  return (
    <div>
      <PageHeader title="Employee Management" subtitle={`${team.length} employees in your team`}/>

      {/* Filters */}
      <div style={{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
        <div className="search-wrap" style={{ flex:1, minWidth:200 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" style={{ paddingLeft:36 }} placeholder="Search employees..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="tab-bar" style={{ margin:0 }}>
          {[['all','All'],['green','On Track'],['yellow','At Risk'],['red','Overdue']].map(([v,l]) => (
            <button key={v} className={`tab-item${filter===v?' active':''}`} onClick={()=>setFilter(v)}>
              {l} <span style={{ opacity:0.65 }}>({riskCounts[v]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">👥</div><h3>No employees found</h3><p>Try adjusting your search or filters.</p></div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
          {filtered.map(emp => (
            <Card key={emp.id} style={{ borderTop:`3px solid ${emp.risk==='red'?'var(--danger)':emp.risk==='yellow'?'var(--warning)':'var(--success)'}` }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
                <Avatar name={emp.name} color={emp.color} size={44}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{emp.name}</div>
                  <div style={{ fontSize:13, color:'var(--muted)' }}>{emp.position}</div>
                  <div style={{ fontSize:12, color:'var(--muted-light)', marginTop:2 }}>{emp.dept} · {emp.email}</div>
                </div>
                <Badge color={emp.risk==='red'?'red':emp.risk==='yellow'?'yellow':'green'} dot>
                  {emp.risk==='red'?'Overdue':emp.risk==='yellow'?'At Risk':'On Track'}
                </Badge>
              </div>

              {/* Workload progress */}
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--muted)', marginBottom:6 }}>
                  <span>Avg Progress ({emp.active} active task{emp.active!==1?'s':''})</span>
                  <span style={{ fontWeight:700 }}>{emp.progress}%</span>
                </div>
                <ProgressBar value={emp.progress} color={emp.risk==='red'?'var(--danger)':emp.risk==='yellow'?'var(--warning)':'var(--success)'}/>
              </div>

              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
                {[['Total',emp.tasks,'var(--primary)'],['Done',emp.completed,'var(--success)'],['Overdue',emp.overdue,'var(--danger)']].map(([l,v,c]) => (
                  <div key={l} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
                    <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Tech status */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:emp.techStatus==='Available'?'var(--success)':emp.techStatus==='On Job'?'var(--warning)':'var(--muted)', display:'inline-block' }}/>
                  <span style={{ fontSize:12, color:'var(--text-secondary)', fontWeight:500 }}>{emp.techStatus||'Available'}</span>
                </div>
                <Btn variant="secondary" style={{ fontSize:12, padding:'6px 14px' }} onClick={()=>setPage('tasks')}>View Tasks</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
