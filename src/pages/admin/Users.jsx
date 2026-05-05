import { useState, useEffect } from 'react';
import { useApp, PageHeader, Badge, Btn, Modal, Input, Select, Avatar, toast } from '../../App.jsx';
import { getAll, create, update, remove } from '../../store.js';

const ROLES  = [{ value:'employee', label:'Employee' },{ value:'manager', label:'Manager' },{ value:'admin', label:'Admin' }];
const DEPTS  = ['Engineering','Operations','Sales','HR','Finance','Marketing'].map(d=>({value:d,label:d}));
const COLORS = ['#4F6EF7','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#F97316','#A855F7'];

export default function Users() {
  const [users, setUsers]   = useState([]);
  const [modal, setModal]   = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRF] = useState('all');
  const [form, setForm]     = useState({ name:'', email:'', password:'', role:'employee', dept:'Engineering', position:'', managerId:'' });
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const load = () => setUsers(getAll('users'));
  useEffect(()=>load(),[]);

  const managers = users.filter(u=>u.role==='manager');

  const openCreate = () => { setForm({ name:'',email:'',password:'',role:'employee',dept:'Engineering',position:'',managerId:'' }); setModal('create'); };
  const openEdit   = (u)  => { setForm({ name:u.name, email:u.email, password:'', role:u.role, dept:u.dept||'Engineering', position:u.position||'', managerId:u.managerId||'' }); setModal(u); };

  const save = () => {
    if (!form.name||!form.email) { toast('Name and email required','error'); return; }
    if (modal==='create') {
      if (!form.password) { toast('Password required for new users','error'); return; }
      const existing = users.find(u=>u.email.toLowerCase()===form.email.toLowerCase());
      if (existing) { toast('Email already exists','error'); return; }
      create('users',{ ...form, color:COLORS[Math.floor(Math.random()*COLORS.length)], techStatus:'Available' });
      toast('User created ✅');
    } else {
      const patch = { name:form.name, role:form.role, dept:form.dept, position:form.position, managerId:form.managerId||null };
      if (form.password) patch.password = form.password;
      update('users', modal.id, patch);
      toast('User updated ✅');
    }
    setModal(null); load();
  };

  const deleteUser = (id) => { if(confirm('Delete this user?')){ remove('users',id); toast('User deleted','info'); load(); }};

  const filtered = users.filter(u=>{
    if (roleFilter!=='all'&&u.role!==roleFilter) return false;
    return !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
  });

  const roleColor = { admin:'purple', manager:'primary', employee:'green' };

  return (
    <div>
      <PageHeader title="User Management" subtitle={`${users.length} users in the system`}
        actions={<Btn onClick={openCreate}>+ Add User</Btn>}/>

      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <div className="search-wrap" style={{ flex:1, minWidth:200 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" style={{ paddingLeft:36 }} placeholder="Search users..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="form-input" value={roleFilter} onChange={e=>setRF(e.target.value)} style={{ width:'auto', minWidth:140 }}>
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
        </select>
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
        <table className="data-table">
          <thead><tr><th>User</th><th>Role</th><th>Department</th><th>Position</th><th>Reports To</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.length===0 && <tr><td colSpan={6}><div className="empty-state" style={{ padding:32 }}><div className="icon">👥</div><h3>No users found</h3></div></td></tr>}
            {filtered.map(u=>{
              const mgr = managers.find(m=>m.id===u.managerId);
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <Avatar name={u.name} color={u.color||'#4F6EF7'} size={34}/>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14 }}>{u.name}</div>
                        <div style={{ fontSize:12, color:'var(--muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><Badge color={roleColor[u.role]||'gray'}>{u.role.toUpperCase()}</Badge></td>
                  <td style={{ fontSize:13 }}>{u.dept||'—'}</td>
                  <td style={{ fontSize:13, color:'var(--muted)' }}>{u.position||'—'}</td>
                  <td style={{ fontSize:13 }}>{mgr?mgr.name:<span style={{ color:'var(--muted-light)' }}>—</span>}</td>
                  <td>
                    <div style={{ display:'flex', gap:8 }}>
                      <Btn variant="outline" style={{ fontSize:12, padding:'6px 12px' }} onClick={()=>openEdit(u)}>Edit</Btn>
                      <Btn variant="danger"  style={{ fontSize:12, padding:'6px 12px' }} onClick={()=>deleteUser(u.id)}>Delete</Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal==='create'?'Add New User':'Edit User'} onClose={()=>setModal(null)}
          footer={<><Btn variant="outline" onClick={()=>setModal(null)}>Cancel</Btn><Btn onClick={save}>{modal==='create'?'Create User':'Save Changes'}</Btn></>}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Input label="Full Name *"  value={form.name}     onChange={f('name')}     placeholder="Full name"/>
              <Input label="Email *"      type="email" value={form.email}    onChange={f('email')}    placeholder="work@company.com"/>
            </div>
            <Input label={modal==='create'?'Password *':'New Password (leave blank to keep)'}  type="password" value={form.password} onChange={f('password')} placeholder="••••••••"/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Select label="Role *"       value={form.role}   onChange={f('role')}   options={ROLES}/>
              <Select label="Department"   value={form.dept}   onChange={f('dept')}   options={DEPTS}/>
            </div>
            <Input label="Position / Title" value={form.position} onChange={f('position')} placeholder="e.g. Senior Developer"/>
            {form.role==='employee' && (
              <Select label="Assign to Manager" value={form.managerId} onChange={f('managerId')} options={[{value:'',label:'No manager (unassigned)'}, ...managers.map(m=>({value:m.id,label:`${m.name} (${m.dept})`}))]}/>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
