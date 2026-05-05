import { useState, useEffect } from 'react';
import { useApp, KpiCard, Card, Badge, PageHeader, ProgressBar } from '../../App.jsx';
import { globalKpis, getAll, taskRisk } from '../../store.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { setPage } = useApp();
  const [kpis, setKpis] = useState({ employees:0, managers:0, total:0, completed:0, overdue:0, onTime:0 });
  const [teamData, setTeamData] = useState([]);

  useEffect(() => {
    setKpis(globalKpis());
    const managers = getAll('users').filter(u=>u.role==='manager');
    const tasks    = getAll('tasks');
    const users    = getAll('users');
    const data = managers.map(m => {
      const team     = users.filter(u=>u.managerId===m.id).map(u=>u.id);
      const mTasks   = tasks.filter(t=>team.includes(t.assignedTo)||t.createdBy===m.id);
      const completed= mTasks.filter(t=>t.status==='closed'||t.status==='approved').length;
      const overdue  = mTasks.filter(t=>taskRisk(t)==='red'&&t.status!=='closed'&&t.status!=='approved').length;
      const onTime   = mTasks.length>0?Math.round((completed/mTasks.length)*100):0;
      return { name:m.name.split(' ')[0], dept:m.dept, total:mTasks.length, completed, overdue, onTime, teamSize:team.length };
    });
    setTeamData(data);
  }, []);

  const allUsers = getAll('users');
  const recent   = getAll('tasks').sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);

  return (
    <div>
      <PageHeader title="Admin — Global Overview" subtitle="Organization-wide monitoring and analytics"/>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:16, marginBottom:28 }}>
        <KpiCard label="Employees"   value={kpis.employees} icon="👷" color="var(--primary)"/>
        <KpiCard label="Managers"    value={kpis.managers}  icon="👔" color="var(--purple)"/>
        <KpiCard label="Total Tasks" value={kpis.total}     icon="📋" color="var(--info)"/>
        <KpiCard label="Completed"   value={kpis.completed} icon="✅" color="var(--success)" trend="up"/>
        <KpiCard label="Overdue"     value={kpis.overdue}   icon="🚨" color="var(--danger)"  trend={kpis.overdue>0?'down':undefined}/>
        <KpiCard label="On-Time %"   value={`${kpis.onTime}%`} icon="⭐" color="var(--warning)"/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
        {/* Team comparison chart */}
        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:20 }}>📊 Team Performance Comparison</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={teamData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="name" tick={{ fill:'var(--muted)', fontSize:12 }}/>
              <YAxis tick={{ fill:'var(--muted)', fontSize:12 }}/>
              <Tooltip contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8 }}/>
              <Bar dataKey="total"     name="Total"     fill="#4F6EF7" radius={[4,4,0,0]}/>
              <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4,4,0,0]}/>
              <Bar dataKey="overdue"   name="Overdue"   fill="#EF4444" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Manager cards */}
        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>🏢 Team Breakdown</div>
          {teamData.map((t,i)=>(
            <div key={i} style={{ marginBottom:16, paddingBottom:16, borderBottom:'1px solid var(--border-light)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div>
                  <span style={{ fontWeight:700, fontSize:14 }}>{t.name} ({t.dept})</span>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>{t.teamSize} employees · {t.total} tasks</div>
                </div>
                <Badge color={t.onTime>=80?'green':t.onTime>=50?'yellow':'red'}>{t.onTime}%</Badge>
              </div>
              <ProgressBar value={t.onTime} color={t.onTime>=80?'var(--success)':t.onTime>=50?'var(--warning)':'var(--danger)'}/>
            </div>
          ))}
        </Card>
      </div>

      {/* Recent activity */}
      <Card style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontWeight:700, fontSize:15 }}>🕐 Recent Activity (All Teams)</span>
        </div>
        <table className="data-table">
          <thead><tr><th>Task</th><th>Assigned To</th><th>Created By</th><th>Deadline</th><th>Status</th></tr></thead>
          <tbody>
            {recent.map(t=>{
              const emp = allUsers.find(u=>u.id===t.assignedTo);
              const mgr = allUsers.find(u=>u.id===t.createdBy);
              const sMap= { assigned:'blue', in_progress:'primary', submitted:'yellow', approved:'green', rejected:'red', closed:'green' };
              return (
                <tr key={t.id}>
                  <td style={{ fontWeight:600, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</td>
                  <td style={{ fontSize:13 }}>{emp?.name||'—'}</td>
                  <td style={{ fontSize:13, color:'var(--muted)' }}>{mgr?.name||'—'}</td>
                  <td style={{ fontSize:13, color:'var(--muted)' }}>{new Date(t.deadline).toLocaleDateString()}</td>
                  <td><Badge color={sMap[t.status]||'gray'}>{t.status.replace('_',' ')}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
