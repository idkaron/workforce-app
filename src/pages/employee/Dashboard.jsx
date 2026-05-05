import { useState, useEffect } from 'react';
import { useApp, KpiCard, Card, Badge, ProgressBar, OverdueBanner, PageHeader, Btn, Avatar, toast } from '../../App.jsx';
import { getTasksForEmployee, getUserById, taskRisk, update } from '../../store.js';

export default function EmpDashboard() {
  const { user, doRefresh } = useApp();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (user) setTasks(getTasksForEmployee(user.id));
  }, [user]);

  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === 'closed' || t.status === 'approved').length;
  const overdue   = tasks.filter(t => taskRisk(t) === 'red' && t.status !== 'closed' && t.status !== 'approved').length;
  const onTime    = total > 0 ? Math.round((completed / total) * 100) : 0;

  const upcoming = tasks
    .filter(t => t.status !== 'closed' && t.status !== 'approved')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  const riskColor = { red:'var(--danger)', yellow:'var(--warning)', green:'var(--success)' };
  const statusColor = { assigned:'blue', in_progress:'primary', submitted:'yellow', approved:'green', rejected:'red', closed:'green', overdue:'red' };

  const handleProgress = (taskId, val) => {
    update('tasks', taskId, { progress: Number(val) });
    setTasks(getTasksForEmployee(user.id));
    doRefresh();
  };

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <OverdueBanner count={overdue}/>
      <PageHeader
        title={`${greeting}, ${user?.name?.split(' ')[0]} 👋`}
        subtitle={now.toLocaleDateString('en-US',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}
      />

      {/* KPI Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:28 }}>
        <KpiCard label="Total Tasks" value={total} icon="📋" color="var(--primary)" sub="All assigned"/>
        <KpiCard label="Completed"   value={completed} icon="✅" color="var(--success)" sub={`${onTime}% on time`} trend="up"/>
        <KpiCard label="Overdue"     value={overdue} icon="🚨" color="var(--danger)"  sub="Need attention" trend={overdue>0?'down':undefined}/>
        <KpiCard label="On-Time Rate" value={`${onTime}%`} icon="⭐" color="var(--warning)" sub="Performance score"/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:24 }}>
        {/* Upcoming tasks */}
        <Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontWeight:700, fontSize:15 }}>📅 Upcoming Deadlines</h3>
          </div>
          {upcoming.length === 0 ? (
            <div className="empty-state"><div className="icon">🎉</div><h3>All clear!</h3><p>No pending tasks right now.</p></div>
          ) : (
            <div style={{ padding:'8px 0' }}>
              {upcoming.map(t => {
                const days = Math.ceil((new Date(t.deadline) - now) / 86400000);
                const risk = taskRisk(t);
                return (
                  <div key={t.id} style={{ padding:'14px 24px', borderBottom:'1px solid var(--border-light)', display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{ width:4, height:48, borderRadius:4, background:riskColor[risk], flexShrink:0 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:14, marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.title}</div>
                      <ProgressBar value={t.progress} color={riskColor[risk]}/>
                      <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{t.progress}% complete</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <Badge color={risk === 'red' ? 'red' : risk === 'yellow' ? 'yellow' : 'green'}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
                      </Badge>
                      <div style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>
                        {new Date(t.deadline).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Performance ring */}
          <Card>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>📊 My Performance</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { label:'Completion Rate', val:onTime, color:'var(--success)' },
                { label:'Tasks In Progress', val:tasks.filter(t=>t.status==='in_progress').length * (100/Math.max(total,1)), color:'var(--primary)' },
                { label:'On-Time Submissions', val:completed > 0 ? 85 : 0, color:'var(--warning)' },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                    <span style={{ color:'var(--text-secondary)', fontWeight:500 }}>{label}</span>
                    <span style={{ fontWeight:700 }}>{Math.round(val)}%</span>
                  </div>
                  <ProgressBar value={val} color={color}/>
                </div>
              ))}
            </div>
          </Card>

          {/* Task status summary */}
          <Card>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>🗂 Task Summary</div>
            {[
              ['Assigned',    tasks.filter(t=>t.status==='assigned').length,    'blue'   ],
              ['In Progress', tasks.filter(t=>t.status==='in_progress').length, 'primary'],
              ['Submitted',   tasks.filter(t=>t.status==='submitted').length,   'yellow' ],
              ['Approved',    tasks.filter(t=>t.status==='approved').length,    'green'  ],
              ['Overdue',     overdue,                                           'red'    ],
            ].map(([label, count, color]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <Badge color={color}>{label}</Badge>
                <span style={{ fontWeight:700, fontSize:15 }}>{count}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
