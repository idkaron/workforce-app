import { useState } from 'react';
import { login, create, getAll } from '../store.js';
import { Btn, Input, Select, toast } from '../App.jsx';

export default function AuthPage({ mode, setPage, onAuth, onDemo }) {
  const isLogin = mode === 'login';
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'employee', dept:'Engineering', position:'' });
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (ev) => {
    ev.preventDefault(); setErr(''); setBusy(true);
    try {
      if (isLogin) {
        const u = await login(form.email, form.password);
        toast(`Welcome back, ${u.name}!`);
        onAuth(u);
      } else {
        // Register
        if (!form.name || !form.email || !form.password) throw new Error('All fields required');
        const existing = getAll('users').find(u => u.email.toLowerCase() === form.email.toLowerCase());
        if (existing) throw new Error('Email already registered');
        const colors = ['#4F6EF7','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#F97316','#A855F7'];
        const newUser = create('users', {
          name: form.name, email: form.email.toLowerCase(), password: form.password,
          role: form.role, dept: form.dept, position: form.position || form.role,
          managerId: null, color: colors[Math.floor(Math.random()*colors.length)],
          techStatus: 'Available',
        });
        const { password: _, ...safe } = newUser;
        sessionStorage.setItem('wop_session', JSON.stringify(safe));
        toast(`Account created! Welcome, ${safe.name} 🎉`);
        onAuth(safe);
      }
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const roles = [
    { value:'employee', label:'Employee / Technician' },
    { value:'manager',  label:'Manager' },
    { value:'admin',    label:'Admin' },
  ];
  const depts = ['Engineering','Operations','Sales','HR','Finance','Marketing'].map(d=>({value:d,label:d}));

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--bg)' }}>
      {/* Left panel */}
      <div style={{ flex:1, background:'linear-gradient(135deg,#0F1724,#1a2442)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:60, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'30%', left:'20%', width:300, height:300, background:'#4F6EF7', borderRadius:'50%', filter:'blur(100px)', opacity:0.12 }}/>
        <div style={{ position:'relative', zIndex:2, textAlign:'center', maxWidth:380 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:36, fontWeight:900, color:'#fff', marginBottom:16 }}>
            WorkForce<span style={{ color:'#4F6EF7' }}>Ops</span>
          </div>
          <p style={{ color:'#94A3B8', fontSize:16, lineHeight:1.7, marginBottom:40 }}>
            Corporate deadline & task monitoring — with complete business operations built in.
          </p>
          {[['📋','Task Lifecycle Management'],['📈','Real-time Analytics'],['🔔','Smart Automations'],['💼','Business Ops Suite']].map(([ic,tx]) => (
            <div key={tx} style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18, textAlign:'left' }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'rgba(79,110,247,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{ic}</div>
              <span style={{ color:'#CBD5E1', fontSize:14, fontWeight:500 }}>{tx}</span>
            </div>
          ))}
          {/* Demo logins */}
          <div style={{ marginTop:40, borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:32, width:'100%' }}>
            <div style={{ color:'#64748B', fontSize:12, marginBottom:12, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Quick Demo Access</div>
            <div style={{ display:'flex', gap:8 }}>
              {['admin','manager','employee'].map(r => (
                <button key={r} onClick={() => onDemo(r)} style={{ flex:1, padding:'9px 8px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.05)', color:'#CBD5E1', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.2s', textTransform:'capitalize' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(79,110,247,0.2)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                >{r}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ width:480, display:'flex', alignItems:'center', justifyContent:'center', padding:48 }}>
        <div style={{ width:'100%', maxWidth:400 }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, marginBottom:6 }}>{isLogin ? 'Welcome back' : 'Create account'}</h2>
          <p style={{ color:'var(--muted)', fontSize:14, marginBottom:32 }}>{isLogin ? 'Sign in to your workspace' : 'Join your organization on WorkForceOps'}</p>

          {err && <div style={{ background:'var(--danger-bg)', color:'var(--danger)', padding:'10px 14px', borderRadius:'var(--radius-sm)', fontSize:13, marginBottom:20, fontWeight:500 }}>{err}</div>}

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {!isLogin && <Input label="Full Name" value={form.name} onChange={f('name')} placeholder="Your full name"/>}
            <Input label="Email Address" type="email" value={form.email} onChange={f('email')} placeholder="you@company.com"/>
            <Input label="Password" type="password" value={form.password} onChange={f('password')} placeholder="••••••••"/>
            {!isLogin && (
              <>
                <Select label="Role" value={form.role} onChange={f('role')} options={roles}/>
                <Select label="Department" value={form.dept} onChange={f('dept')} options={depts}/>
                <Input label="Position / Title" value={form.position} onChange={f('position')} placeholder="e.g. Senior Developer"/>
              </>
            )}
            <Btn type="submit" disabled={busy} style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:15, marginTop:4 }}>
              {busy ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
            </Btn>
          </form>

          <p style={{ textAlign:'center', fontSize:13.5, color:'var(--muted)', marginTop:24 }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <span style={{ color:'var(--primary)', fontWeight:600, cursor:'pointer' }} onClick={() => setPage(isLogin?'register':'login')}>
              {isLogin ? 'Register' : 'Sign In'}
            </span>
          </p>
          <p style={{ textAlign:'center', marginTop:12 }}>
            <span style={{ color:'var(--muted)', fontSize:13, cursor:'pointer' }} onClick={() => setPage('landing')}>← Back to home</span>
          </p>
        </div>
      </div>
    </div>
  );
}
