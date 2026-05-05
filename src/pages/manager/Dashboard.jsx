import { useState, useEffect } from 'react';
import { useApp, KpiCard, Card, Badge, ProgressBar, OverdueBanner, PageHeader, Btn, Avatar } from '../../App.jsx';
import { teamKpis, getMyTeam, getTasksForManager, taskRisk, employeeRisk, getAll } from '../../store.js';

export default function MgrDashboard() {
  const { user, setPage } = useApp();
  const [kpis, setKpis]   = useState({ total:0, completed:0, overdue:0, onTime:0, pending:0 });
  const [team, setTeam]   = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    if (!user) return;
    setKpis(teamKpis(user.id));
    setTeam(getMyTeam(user.id));
    const tasks = getTasksForManager(user.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,6);
    setRecent(tasks);
  }, [user]);

  const riskColor = { red:'var(--danger)', yellow:'var(--warning)', green:'var(--success)' };
  const now = new Date();

  return (
    <div>
      <OverdueBanner count={kpis.overdue}/>
      <PageHeader
        title={`Team Overview — ${user?.dept}`}
        subtitle={`${now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})} · ${team.length} employees under your supervision`}
        actions={<Btn onClick={()=>setPage('tasks')}>+ New Task</Btn>}
      />

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:18, marginBottom:28 }}>
        <KpiCard label="Total Tasks"   value={kpis.total}     icon="📋" color="var(--primary)"/>
        <KpiCard label="Completed"     value={kpis.completed} icon="✅" color="var(--success)"  trend="up"/>
        <KpiCard label="Overdue"       value={kpis.overdue}   icon="🚨" color="var(--danger)"   trend={kpis.overdue>0?'down':undefined}/>
        <KpiCard label="On-Time Rate"  value={`${kpis.onTime}%`} icon="⭐" color="var(--warning)"/>
        <KpiCard label="Pending Approvals" value={kpis.pending} icon="📨" color="var(--purple)" sub="Click to review" onClick={()=>setPage('approvals')}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:24 }}>
        {/* Recent Tasks */}
        <Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontWeight:700, fontSize:15 }}>📋 Recent Team Tasks</h3>
            <Btn variant="ghost" onClick={()=>setPage('tasks')} style={{ fontSize:13 }}>View All →</Btn>
          </div>
          <table className="data-table">
            <thead><tr><th>Task</th><th>Employee</th><th>Priority</th><th>Deadline</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map(t => {
                const emp = getAll('users').find(u=>u.id===t.assignedTo);
                const risk = taskRisk(t);
                const days = Math.ceil((new Date(t.deadline)-now)/86400000);
                const sMap = { assigned:'blue', in_progress:'primary', submitted:'yellow', approved:'green', rejected:'red', closed:'green', overdue:'red' };
                const pMap = { low:'green', medium:'blue', high:'yellow', critical:'red' };
                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight:600, maxWidth:200 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</div>
                      <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
                        <ProgressBar value={t.progress} color={riskColor[risk]}/>
                        <span style={{ fontSize:11 }}>{t.progress}%</span>
                      </div>
                    </td>
                    <td>
                      {emp ? <div style={{ display:'flex', alignItems:'center', gap:8 }}><Avatar name={emp.name} color={emp.color} size={26}/><span style={{ fontSize:13 }}>{emp.name.split(' ')[0]}</span></div> : '—'}
                    </td>
                    <td><Badge color={pMap[t.priority]}>{t.priority}</Badge></td>
                    <td style={{ fontSize:13, color:days<0?'var(--danger)':days<3?'var(--warning)':'var(--muted)', fontWeight:days<3?700:400 }}>
                      {days<0?`${Math.abs(days)}d late`:days===0?'Today':`${days}d`}
                    </td>
                    <td><Badge color={sMap[t.status]||'gray'}>{t.status.replace('_',' ')}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* Team health */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <Card>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>👥 Team Health</div>
            {team.length === 0 ? <p style={{ color:'var(--muted)', fontSize:13 }}>No employees assigned yet.</p> : team.map(emp => {
              const risk = employeeRisk(emp.id);
              const empTasks = getTasksForManager(user.id).filter(t=>t.assignedTo===emp.id);
              const active = empTasks.filter(t=>t.status!=='closed'&&t.status!=='approved').length;
              return (
                <div key={emp.id} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <Avatar name={emp.name} color={emp.color} size={34}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{emp.name}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{active} active task{active!==1?'s':''}</div>
                  </div>
                  <Badge color={risk==='red'?'red':risk==='yellow'?'yellow':'green'} dot>
                    {risk==='red'?'Overdue':risk==='yellow'?'At Risk':'On Track'}
                  </Badge>
                </div>
              );
            })}
            <Btn variant="secondary" onClick={()=>setPage('employees')} style={{ width:'100%', justifyContent:'center', marginTop:8, fontSize:13 }}>Manage Team →</Btn>
          </Card>

          {/* Quick stats */}
          <Card>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>📊 Breakdown</div>
            {[
              ['Assigned',    getTasksForManager(user.id).filter(t=>t.status==='assigned').length,    'var(--info)'],
              ['In Progress', getTasksForManager(user.id).filter(t=>t.status==='in_progress').length, 'var(--primary)'],
              ['Submitted',   getTasksForManager(user.id).filter(t=>t.status==='submitted').length,   'var(--warning)'],
              ['Closed',      getTasksForManager(user.id).filter(t=>t.status==='closed'||t.status==='approved').length, 'var(--success)'],
            ].map(([label, count, color]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:color }}/>
                  <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{label}</span>
                </div>
                <span style={{ fontWeight:700, fontSize:15 }}>{count}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
