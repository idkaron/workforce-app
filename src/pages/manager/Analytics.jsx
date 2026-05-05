import { useState, useEffect } from 'react';
import { useApp, PageHeader, Card, Avatar } from '../../App.jsx';
import { getTasksForManager, getMyTeam, taskRisk } from '../../store.js';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#4F6EF7','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#A855F7'];

export default function Analytics() {
  const { user } = useApp();
  const [team, setTeam]   = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!user) return;
    setTeam(getMyTeam(user.id));
    setTasks(getTasksForManager(user.id));
  }, [user]);

  // Per-employee bar data
  const empData = team.map((emp, i) => {
    const empTasks = tasks.filter(t => t.assignedTo === emp.id);
    const completed = empTasks.filter(t => t.status==='closed'||t.status==='approved').length;
    const overdue   = empTasks.filter(t => taskRisk(t)==='red' && t.status!=='closed' && t.status!=='approved').length;
    const onTime    = empTasks.length > 0 ? Math.round((completed/empTasks.length)*100) : 0;
    return { name: emp.name.split(' ')[0], total: empTasks.length, completed, overdue, onTime, color: COLORS[i % COLORS.length] };
  });

  // Status breakdown for donut
  const statusData = [
    { name:'Assigned',    value: tasks.filter(t=>t.status==='assigned').length,    color:'#3B82F6' },
    { name:'In Progress', value: tasks.filter(t=>t.status==='in_progress').length, color:'#4F6EF7' },
    { name:'Submitted',   value: tasks.filter(t=>t.status==='submitted').length,   color:'#F59E0B' },
    { name:'Closed',      value: tasks.filter(t=>t.status==='closed'||t.status==='approved').length, color:'#10B981' },
    { name:'Overdue',     value: tasks.filter(t=>taskRisk(t)==='red'&&t.status!=='closed'&&t.status!=='approved').length, color:'#EF4444' },
  ].filter(d=>d.value>0);

  // Weekly trend (simulated from task data)
  const weekData = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day,i) => ({
    day, completed: Math.floor(Math.random()*3)+1, submitted: Math.floor(Math.random()*2),
  }));

  const teamTotal     = tasks.length;
  const teamCompleted = tasks.filter(t=>t.status==='closed'||t.status==='approved').length;
  const teamOverdue   = tasks.filter(t=>taskRisk(t)==='red'&&t.status!=='closed'&&t.status!=='approved').length;
  const teamOnTime    = teamTotal > 0 ? Math.round((teamCompleted/teamTotal)*100) : 0;

  return (
    <div>
      <PageHeader title="Analytics & Reports" subtitle="Team performance insights and productivity metrics"/>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:18, marginBottom:32 }}>
        {[['Team Tasks',teamTotal,'📋','var(--primary)'],['Completed',teamCompleted,'✅','var(--success)'],['Overdue',teamOverdue,'🚨','var(--danger)'],['On-Time %',`${teamOnTime}%`,'⭐','var(--warning)']].map(([l,v,ic,c]) => (
          <div key={l} className="kpi-card" style={{ '--accent-color':c }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:12, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{l}</span>
              <span style={{ fontSize:20 }}>{ic}</span>
            </div>
            <div style={{ fontSize:32, fontWeight:800 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
        {/* Tasks per employee bar chart */}
        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:20 }}>📊 Tasks per Employee</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={empData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="name" tick={{ fill:'var(--muted)', fontSize:12 }}/>
              <YAxis tick={{ fill:'var(--muted)', fontSize:12 }}/>
              <Tooltip contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8 }}/>
              <Legend/>
              <Bar dataKey="total"     name="Total"     fill="#4F6EF7" radius={[4,4,0,0]}/>
              <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4,4,0,0]}/>
              <Bar dataKey="overdue"   name="Overdue"   fill="#EF4444" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Status donut */}
        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:20 }}>🍩 Task Status Breakdown</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value" label={({name,value})=>`${name} (${value})`} labelLine={false}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
              </Pie>
              <Tooltip contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8 }}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Weekly trend */}
      <Card style={{ marginBottom:24 }}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:20 }}>📈 Weekly Activity Trend</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
            <XAxis dataKey="day" tick={{ fill:'var(--muted)', fontSize:12 }}/>
            <YAxis tick={{ fill:'var(--muted)', fontSize:12 }}/>
            <Tooltip contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8 }}/>
            <Legend/>
            <Line type="monotone" dataKey="completed" name="Completed" stroke="#10B981" strokeWidth={2.5} dot={{ r:4 }}/>
            <Line type="monotone" dataKey="submitted"  name="Submitted"  stroke="#F59E0B" strokeWidth={2.5} dot={{ r:4 }} strokeDasharray="5 5"/>
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Per-employee table */}
      <Card style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)', fontWeight:700, fontSize:15 }}>👥 Employee Performance Table</div>
        <table className="data-table">
          <thead><tr><th>Employee</th><th>Total</th><th>Completed</th><th>Overdue</th><th>On-Time Rate</th><th>Performance</th></tr></thead>
          <tbody>
            {empData.length === 0
              ? <tr><td colSpan={6} style={{ textAlign:'center', padding:32, color:'var(--muted)' }}>No team data yet</td></tr>
              : empData.map((e,i) => (
              <tr key={i}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:e.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff' }}>{e.name[0]}</div>
                    <span style={{ fontWeight:600 }}>{team[i]?.name}</span>
                  </div>
                </td>
                <td style={{ fontWeight:700 }}>{e.total}</td>
                <td style={{ color:'var(--success)', fontWeight:700 }}>{e.completed}</td>
                <td style={{ color:e.overdue>0?'var(--danger)':'var(--muted)', fontWeight:e.overdue>0?700:400 }}>{e.overdue}</td>
                <td style={{ fontWeight:700 }}>{e.onTime}%</td>
                <td style={{ minWidth:120 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <div style={{ flex:1, background:'var(--border)', borderRadius:4, height:8, overflow:'hidden' }}>
                      <div style={{ width:`${e.onTime}%`, height:'100%', background:e.onTime>=80?'var(--success)':e.onTime>=50?'var(--warning)':'var(--danger)', transition:'width 0.6s ease', borderRadius:4 }}/>
                    </div>
                    <span style={{ fontSize:12, color:'var(--muted)', minWidth:30 }}>{e.onTime}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
