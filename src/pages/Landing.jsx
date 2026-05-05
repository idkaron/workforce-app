import { useApp, Btn } from '../App.jsx';

export default function Landing({ setPage }) {
  const { theme } = useApp() || {};
  const features = [
    { icon:'📋', title:'Task Management',     desc:'Full task lifecycle from assignment to approval with priority tiers and deadlines.' },
    { icon:'📅', title:'Deadline Monitoring',  desc:'Real-time overdue tracking, timeline view, and risk-color-coded status.' },
    { icon:'📈', title:'Analytics & Insights', desc:'Team performance charts, completion rates, and bottleneck identification.' },
    { icon:'💼', title:'Business Operations',  desc:'Customers, scheduling, quotations, invoices, AMC contracts and service reports.' },
    { icon:'🔔', title:'Smart Automations',    desc:'Auto-invoice on quote approval, auto-report on job completion, overdue alerts.' },
    { icon:'👥', title:'Multi-Role Access',     desc:'Admin, Manager and Employee dashboards tailored to each role\'s needs.' },
  ];
  const stats = [['500+','Employees Managed'],['98%','On-Time Rate'],['3 Roles','Admin · Manager · Employee'],['10+','Business Modules']];

  return (
    <div style={{ minHeight:'100vh', fontFamily:'var(--font)', background:'var(--bg)' }}>
      {/* Nav */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 64px', height:68, background:'var(--surface)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color:'var(--text)' }}>
          WorkForce<span style={{ color:'var(--primary)' }}>Ops</span>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <Btn variant="outline" onClick={() => setPage('login')}>Log In</Btn>
          <Btn variant="primary" onClick={() => setPage('register')}>Get Started →</Btn>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,#0F1724 0%,#1a2442 50%,#0d1b35 100%)', padding:'96px 64px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'30%', left:'20%', width:400, height:400, background:'#4F6EF7', borderRadius:'50%', filter:'blur(120px)', opacity:0.1, pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'20%', right:'15%', width:300, height:300, background:'#10B981', borderRadius:'50%', filter:'blur(100px)', opacity:0.08, pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:2 }}>
          <div style={{ display:'inline-block', background:'rgba(79,110,247,0.2)', color:'#7C9FFA', padding:'6px 20px', borderRadius:'var(--radius-full)', fontSize:13, fontWeight:700, marginBottom:24, border:'1px solid rgba(79,110,247,0.3)' }}>
            🏢 Corporate Workforce Management Platform
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:64, lineHeight:1.1, color:'#fff', maxWidth:780, margin:'0 auto 20px', fontWeight:900, letterSpacing:'-2px' }}>
            Track. Monitor.<br/><span style={{ color:'#4F6EF7' }}>Deliver on Time.</span>
          </h1>
          <p style={{ fontSize:18, color:'#94A3B8', maxWidth:520, margin:'0 auto 40px', lineHeight:1.7 }}>
            A unified platform for workforce deadline monitoring, task lifecycle management, and complete business operations — built for modern organizations.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Btn variant="primary" onClick={() => setPage('register')} style={{ padding:'14px 40px', fontSize:16 }}>Start Free →</Btn>
            <Btn variant="outline" onClick={() => setPage('login')} style={{ padding:'14px 40px', fontSize:16, color:'#94A3B8', borderColor:'rgba(255,255,255,0.15)' }}>Sign In</Btn>
          </div>
          {/* Stats */}
          <div style={{ display:'flex', gap:60, justifyContent:'center', marginTop:72, flexWrap:'wrap' }}>
            {stats.map(([n,l]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:32, fontWeight:800, color:'#fff' }}>{n}</div>
                <div style={{ fontSize:13, color:'#64748B', marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding:'80px 64px', background:'var(--surface)' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:40, fontWeight:800, color:'var(--text)', letterSpacing:'-1px' }}>Everything in One Platform</h2>
          <p style={{ color:'var(--muted)', fontSize:16, marginTop:12 }}>From task assignment to invoice collection — fully integrated.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:24, maxWidth:1100, margin:'0 auto' }}>
          {features.map(f => (
            <div key={f.title} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'28px 24px' }}>
              <div style={{ fontSize:36, marginBottom:14 }}>{f.icon}</div>
              <h3 style={{ fontSize:17, fontWeight:700, marginBottom:8, color:'var(--text)' }}>{f.title}</h3>
              <p style={{ fontSize:13.5, color:'var(--muted)', lineHeight:1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Demo logins */}
      <div style={{ padding:'64px', background:'var(--bg)', textAlign:'center' }}>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:800, marginBottom:12, color:'var(--text)' }}>Try It Instantly</h2>
        <p style={{ color:'var(--muted)', marginBottom:36, fontSize:15 }}>No registration needed — log in as any role to explore</p>
        <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
          {[['Admin','admin@company.com / admin123','#8B5CF6'],['Manager','alex@company.com / manager123','#4F6EF7'],['Employee','david@company.com / emp123','#10B981']].map(([r,creds,c]) => (
            <div key={r} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'24px 32px', minWidth:220 }}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:c+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, margin:'0 auto 14px' }}>
                {r==='Admin'?'🛡️':r==='Manager'?'👔':'👷'}
              </div>
              <div style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>{r}</div>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:16, lineHeight:1.5 }}>{creds}</div>
              <Btn variant="outline" onClick={() => setPage('login')} style={{ width:'100%', justifyContent:'center' }}>Login as {r}</Btn>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background:'#0B0F19', padding:'36px 64px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontFamily:'var(--font-display)', color:'#fff', fontSize:18, fontWeight:800 }}>WorkForce<span style={{ color:'#4F6EF7' }}>Ops</span></div>
          <div style={{ color:'#475569', fontSize:12, marginTop:4 }}>© 2025 WorkForceOps. All rights reserved.</div>
        </div>
        <div style={{ color:'#475569', fontSize:13 }}>Built for modern organizations 🚀</div>
      </footer>
    </div>
  );
}
