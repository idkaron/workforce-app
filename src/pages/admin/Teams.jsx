import { useState, useEffect } from 'react';
import { useApp, PageHeader, Card, Badge, KpiCard, ProgressBar, Avatar } from '../../App.jsx';
import { getAll, taskRisk, employeeRisk } from '../../store.js';

export default function Teams() {
  const [teams, setTeams] = useState([]);
  useEffect(() => {
    const managers = getAll('users').filter(u=>u.role==='manager');
    const users    = getAll('users');
    const tasks    = getAll('tasks');
    const data = managers.map(m => {
      const employees = users.filter(u=>u.managerId===m.id);
      const mTasks    = tasks.filter(t=>employees.map(e=>e.id).includes(t.assignedTo)||t.createdBy===m.id);
      const completed = mTasks.filter(t=>t.status==='closed'||t.status==='approved').length;
      const overdue   = mTasks.filter(t=>taskRisk(t)==='red'&&t.status!=='closed'&&t.status!=='approved').length;
      const onTime    = mTasks.length>0?Math.round((completed/mTasks.length)*100):0;
      const atRisk    = employees.filter(e=>employeeRisk(e.id)==='yellow').length;
      const overdueEmps = employees.filter(e=>employeeRisk(e.id)==='red').length;
      return { manager:m, employees, mTasks, completed, overdue, onTime, atRisk, overdueEmps };
    });
    setTeams(data);
  }, []);

  const allTasks = getAll('tasks');
  const globalCompleted = allTasks.filter(t=>t.status==='closed'||t.status==='approved').length;
  const globalOnTime    = allTasks.length>0?Math.round((globalCompleted/allTasks.length)*100):0;
  const globalOverdue   = allTasks.filter(t=>taskRisk(t)==='red'&&t.status!=='closed'&&t.status!=='approved').length;

  return (
    <div>
      <PageHeader title="Team Overview" subtitle="All teams performance comparison and health status"/>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:18, marginBottom:28 }}>
        <KpiCard label="Total Teams"      value={teams.length}          icon="🏢" color="var(--primary)"/>
        <KpiCard label="Total Employees"  value={teams.reduce((s,t)=>s+t.employees.length,0)} icon="👷" color="var(--info)"/>
        <KpiCard label="Global On-Time"   value={`${globalOnTime}%`}    icon="⭐" color="var(--warning)" trend={globalOnTime>=70?'up':'down'}/>
        <KpiCard label="Org Overdue Tasks" value={globalOverdue}         icon="🚨" color="var(--danger)"  trend={globalOverdue>0?'down':undefined}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(400px,1fr))', gap:24 }}>
        {teams.map(({ manager:m, employees, mTasks, completed, overdue, onTime, atRisk, overdueEmps }) => (
          <Card key={m.id} style={{ borderTop:`3px solid ${overdue>0?'var(--danger)':atRisk>0?'var(--warning)':'var(--success)'}` }}>
            {/* Manager header */}
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
              <Avatar name={m.name} color={m.color||'#4F6EF7'} size={44}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:16 }}>{m.name}</div>
                <div style={{ fontSize:13, color:'var(--muted)' }}>{m.position} · {m.dept}</div>
              </div>
              <Badge color={overdueEmps>0?'red':atRisk>0?'yellow':'green'} dot>
                {overdueEmps>0?`${overdueEmps} Overdue`:atRisk>0?`${atRisk} At Risk`:'Healthy'}
              </Badge>
            </div>

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
              {[['Team',employees.length,'👥','var(--info)'],['Tasks',mTasks.length,'📋','var(--primary)'],['Done',completed,'✅','var(--success)'],['Overdue',overdue,'🚨','var(--danger)']].map(([l,v,ic,c])=>(
                <div key={l} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px 8px', textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'var(--muted)', fontWeight:600, marginBottom:4 }}>{ic} {l}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:c }}>{v}</div>
                </div>
              ))}
            </div>

            {/* On-time bar */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                <span style={{ color:'var(--text-secondary)', fontWeight:500 }}>Team On-Time Rate</span>
                <span style={{ fontWeight:700, color:onTime>=80?'var(--success)':onTime>=50?'var(--warning)':'var(--danger)' }}>{onTime}%</span>
              </div>
              <ProgressBar value={onTime} color={onTime>=80?'var(--success)':onTime>=50?'var(--warning)':'var(--danger)'}/>
            </div>

            {/* Employee list */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Members</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {employees.map(emp=>{
                  const risk = employeeRisk(emp.id);
                  return (
                    <div key={emp.id} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-full)', padding:'5px 10px 5px 6px' }}>
                      <Avatar name={emp.name} color={emp.color||'#4F6EF7'} size={22}/>
                      <span style={{ fontSize:12, fontWeight:500 }}>{emp.name.split(' ')[0]}</span>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:risk==='red'?'var(--danger)':risk==='yellow'?'var(--warning)':'var(--success)', flexShrink:0 }}/>
                    </div>
                  );
                })}
                {employees.length===0 && <span style={{ fontSize:13, color:'var(--muted)' }}>No employees assigned</span>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
