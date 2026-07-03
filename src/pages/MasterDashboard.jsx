import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Shield, Users, Plus, Trash2, Edit, Eye, LogOut, Heart,
  BarChart2, Check, X, Key, RefreshCw, Lock, Unlock,
  Copy, QrCode, ChevronRight, Settings,
  UserCheck, UserX, Mail, Calendar, Package, RotateCcw, AlertTriangle,
} from 'lucide-react';


const C = {
  bg:        '#f8f9fb',
  sidebar:   '#ffffff',
  card:      '#ffffff',
  border:    '#e8eaed',
  accent:    '#e91e8c',
  accentSoft:'#fce4ec',
  accentMid: '#f48fb1',
  text:      '#1a1a2e',
  textSub:   '#6b7280',
  textMuted: '#9ca3af',
  green:     '#16a34a',
  greenBg:   '#dcfce7',
  blue:      '#2563eb',
  blueBg:    '#dbeafe',
  red:       '#dc2626',
  redBg:     '#fee2e2',
  orange:    '#ea580c',
  orangeBg:  '#ffedd5',
  purple:    '#7c3aed',
  purpleBg:  '#ede9fe',
};


const inp = {
  width: '100%', padding: '10px 13px',
  background: '#fff', border: `1px solid ${C.border}`,
  borderRadius: 10, color: C.text, fontSize: '0.92rem',
  outline: 'none', marginBottom: 12, boxSizing: 'border-box',
  fontFamily: 'system-ui, sans-serif',
  transition: 'border-color 0.15s',
};
const lbl = {
  display: 'block', marginBottom: 4, fontSize: '0.72rem',
  color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600,
};
const card = {
  background: C.card, border: `1px solid ${C.border}`,
  borderRadius: 16, padding: 24, marginBottom: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};
const primaryBtn = {
  padding: '10px 24px', background: C.accent,
  border: 'none', borderRadius: 50, color: '#fff',
  fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
  boxShadow: `0 4px 14px ${C.accent}33`,
};
const ghostBtn = {
  padding: '10px 22px', background: '#fff',
  border: `1px solid ${C.border}`, borderRadius: 50,
  color: C.textSub, fontSize: '0.9rem', cursor: 'pointer',
};
const actionBtn = (color, bg) => ({
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '6px 13px', borderRadius: 20,
  border: `1px solid ${color}30`, background: bg || `${color}12`,
  color, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500,
  transition: 'background 0.15s',
});

const SIDEBAR_TABS = [
  { id: 'clients',   icon: Users,     label: 'Client Accounts' },
  { id: 'add',       icon: Plus,      label: 'Add Client'      },
  { id: 'couples',   icon: Heart,     label: 'Couple Pages'    },
  { id: 'analytics', icon: BarChart2, label: 'Analytics'       },
  { id: 'trash',     icon: Trash2,    label: 'Trash'           },
];


export default function MasterDashboard() {
  const navigate = useNavigate();
  const {
    masterLoggedIn, masterLogout,
    clients, couples,
    trashedClients, trashedCouples,
    createClient, updateClient, deleteClient,
    restoreClient, permanentDeleteClient,
    regenerateActivationCode, resetClientPassword,
    addCouple, updateCouple, deleteCouple,
    restoreCouple, permanentDeleteCouple,
  } = useApp();

  const [tab,          setTab]          = useState('clients');
  const [toast,        setToast]        = useState('');
  const [editClient,   setEditClient]   = useState(null);
  const [resetPwModal, setResetPwModal] = useState(null);

  useEffect(() => {
    if (!masterLoggedIn) navigate('/master', { replace: true });
  }, [masterLoggedIn, navigate]);

  if (!masterLoggedIn) return null;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3200); };
  const handleLogout = () => { masterLogout(); navigate('/master'); };
  const trashCount = (trashedClients?.length || 0) + (trashedCouples?.length || 0);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui,sans-serif', display: 'flex' }}>
      {toast && <Toast msg={toast} />}

      {}
      <aside style={{ width: 232, background: C.sidebar, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0, boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '0 20px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 2 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={14} color="#fff" fill="#fff" />
            </div>
            <span style={{ fontWeight: 700, color: C.text, fontSize: '1rem', letterSpacing: -0.3 }}>HeartLink</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: C.textMuted, marginLeft: 39 }}>Master Admin</div>
        </div>

        <nav style={{ flex: 1, padding: '14px 10px' }}>
          {SIDEBAR_TABS.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 9, padding: '9px 12px', borderRadius: 10, border: 'none', marginBottom: 2,
              background: tab === id ? C.accentSoft : 'transparent',
              color: tab === id ? C.accent : C.textSub,
              cursor: 'pointer', fontSize: '0.875rem', fontWeight: tab === id ? 600 : 400,
              transition: 'all 0.15s',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Icon size={15} />{label}</span>
              {id === 'trash' && trashCount > 0 && (
                <span style={{ background: C.redBg, color: C.red, borderRadius: 10, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 700 }}>{trashCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '14px 10px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '0.7rem', color: C.textMuted, paddingLeft: 12, marginBottom: 6 }}>
            {clients.length} client{clients.length !== 1 ? 's' : ''} total
          </div>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: C.textMuted, cursor: 'pointer', fontSize: '0.85rem', transition: 'color 0.15s' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {}
      <main style={{ flex: 1, padding: '36px 40px', overflowY: 'auto' }}>
        {tab === 'clients'   && <ClientsTab clients={clients} couples={couples} updateClient={updateClient} deleteClient={deleteClient} regenerateActivationCode={regenerateActivationCode} setEditClient={setEditClient} setResetPwModal={setResetPwModal} showToast={showToast} navigate={navigate} />}
        {tab === 'add'       && <AddClientTab createClient={createClient} addCouple={addCouple} couples={couples} showToast={showToast} setTab={setTab} />}
        {tab === 'couples'   && <CouplesTab couples={couples} clients={clients} deleteCouple={deleteCouple} updateCouple={updateCouple} navigate={navigate} showToast={showToast} />}
        {tab === 'analytics' && <AnalyticsTab clients={clients} couples={couples} />}
        {tab === 'trash'     && <TrashTab trashedClients={trashedClients} trashedCouples={trashedCouples} restoreClient={restoreClient} permanentDeleteClient={permanentDeleteClient} restoreCouple={restoreCouple} permanentDeleteCouple={permanentDeleteCouple} showToast={showToast} />}
      </main>

      {editClient && <EditClientModal client={editClient} updateClient={updateClient} onClose={() => setEditClient(null)} showToast={showToast} />}
      {resetPwModal && <ResetPasswordModal client={resetPwModal} resetClientPassword={resetClientPassword} onClose={() => setResetPwModal(null)} showToast={showToast} />}
    </div>
  );
}


function Toast({ msg }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#fff', border: `1px solid ${C.border}`, padding: '12px 18px', borderRadius: 12, fontSize: '0.88rem', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 8, color: C.text }}>
      <span style={{ width: 20, height: 20, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Check size={11} color="#fff" strokeWidth={3} />
      </span>
      {msg}
    </div>
  );
}


function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ margin: '0 0 6px', color: C.text, fontSize: '1.4rem', fontWeight: 700, letterSpacing: -0.3 }}>{title}</h2>
      {subtitle && <p style={{ color: C.textSub, fontSize: '0.85rem', margin: 0 }}>{subtitle}</p>}
    </div>
  );
}


function Badge({ label, color, bg }) {
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: bg, color, border: `1px solid ${color}25` }}>
      {label}
    </span>
  );
}


function ClientsTab({ clients, couples, updateClient, deleteClient, regenerateActivationCode, setEditClient, setResetPwModal, showToast, navigate }) {
  const handleDelete = (id, name) => {
    if (!window.confirm(`Move "${name}" to trash? You can restore it later from the Trash tab.`)) return;
    deleteClient(id);
    showToast(`${name} moved to trash.`);
  };

  const handleToggleActive = (client) => {
    updateClient(client.id, { active: !client.active });
    showToast(`${client.displayName || client.gmail} ${client.active ? 'disabled' : 'enabled'}.`);
  };

  const handleRegenCode = async (id) => {
    const newCode = await regenerateActivationCode(id);
    if (newCode) {
      navigator.clipboard.writeText(newCode).catch(() => {});
      showToast(`New code: ${newCode} (copied!)`);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    showToast(`Copied: ${code}`);
  };

  return (
    <div>
      <PageHeader title="Client Accounts" subtitle="Manage all registered clients. Share activation codes for self-registration." />

      {clients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: C.textMuted }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Users size={28} color={C.accent} strokeWidth={1.5} />
          </div>
          <p style={{ margin: 0, fontWeight: 500 }}>No clients yet.</p>
          <p style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>Go to Add Client to create one.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {clients.map(client => {
            const couple = couples.find(c => c.slug === client.coupleSlug);
            const isRegistered = !!client.gmail;
            return (
              <div key={client.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'box-shadow 0.15s' }}>
                {}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: isRegistered ? C.greenBg : C.orangeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isRegistered ? <UserCheck size={20} color={C.green} /> : <UserX size={20} color={C.orange} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: C.text, marginBottom: 3, fontSize: '0.95rem' }}>
                        {client.displayName || <span style={{ color: C.textMuted, fontStyle: 'italic' }}>(Not registered)</span>}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: C.textSub, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {isRegistered && <span><Mail size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />{client.gmail}</span>}
                        <span><Package size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />{client.subscription} • Created {client.createdAt}</span>
                        {couple && <span><Heart size={10} style={{ marginRight: 4, verticalAlign: 'middle', color: C.accent }} />/{client.coupleSlug} — {couple.name1} & {couple.name2}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Badge label={client.active ? '● Active' : '○ Disabled'} color={client.active ? C.green : C.red} bg={client.active ? C.greenBg : C.redBg} />
                    <Badge label={isRegistered ? '✓ Registered' : '⏳ Pending'} color={isRegistered ? C.blue : C.orange} bg={isRegistered ? C.blueBg : C.orangeBg} />
                  </div>
                </div>

                {}
                <div style={{ marginTop: 14, padding: '10px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.66rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3, fontWeight: 600 }}>Activation Code</div>
                    <code style={{ color: C.accent, fontSize: '0.92rem', letterSpacing: 1.5, fontWeight: 700 }}>{client.activationCode}</code>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => copyCode(client.activationCode)} style={actionBtn(C.purple, C.purpleBg)}><Copy size={12} /> Copy</button>
                    <button onClick={() => handleRegenCode(client.id)} style={actionBtn(C.orange, C.orangeBg)}><RefreshCw size={12} /> New Code</button>
                  </div>
                </div>

                {}
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => setEditClient(client)} style={actionBtn(C.orange, C.orangeBg)}><Edit size={12} /> Edit</button>
                  <button onClick={() => setResetPwModal(client)} style={actionBtn(C.blue, C.blueBg)}><Key size={12} /> Reset Password</button>
                  <button onClick={() => handleToggleActive(client)} style={actionBtn(client.active ? C.red : C.green, client.active ? C.redBg : C.greenBg)}>
                    {client.active ? <><Unlock size={12} /> Disable</> : <><Lock size={12} /> Enable</>}
                  </button>
                  {couple && <button onClick={() => navigate(`/love/${couple.slug}`)} style={actionBtn(C.blue, C.blueBg)}><Eye size={12} /> View Site</button>}
                  <button onClick={() => handleDelete(client.id, client.displayName || client.gmail || 'client')} style={actionBtn(C.textSub, '#f3f4f6')}><Trash2 size={12} /> Move to Trash</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function AddClientTab({ createClient, addCouple, couples, showToast, setTab }) {
  const [form, setForm] = useState({ name1: '', accessCode: '' });
  const [generated, setGenerated] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name1 || !form.accessCode) { alert('Please fill in all fields.'); return; }
    const slug = `${form.name1.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const couple = await addCouple({ name1: form.name1, name2: '', slug, accessCode: form.accessCode, theme: 'rose', package: 'Basic' });
    const client = await createClient({ displayName: form.name1, subscription: 'Basic', coupleSlug: couple?.slug || slug });
    if (client) { setGenerated(client); showToast('Client account created!'); }
    else showToast('Error creating client. Check Supabase connection.');
  };

  if (generated) {
    return (
      <div style={{ maxWidth: 540 }}>
        <PageHeader title="Client Created ✓" />
        <div style={{ ...card, borderColor: `${C.green}40`, background: C.greenBg }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.72rem', color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, fontWeight: 600 }}>Share this activation code with the client:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <code style={{ fontSize: '1.3rem', fontWeight: 700, color: C.accent, letterSpacing: 2, background: '#fff', padding: '10px 18px', borderRadius: 10, flex: 1, border: `1px solid ${C.border}` }}>{generated.activationCode}</code>
              <button onClick={() => { navigator.clipboard.writeText(generated.activationCode).catch(() => {}); showToast('Copied!'); }} style={actionBtn(C.purple, C.purpleBg)}><Copy size={14} /> Copy</button>
            </div>
          </div>
          <p style={{ margin: 0, color: C.textSub, fontSize: '0.85rem', lineHeight: 1.7 }}>
            The client visits <strong style={{ color: C.accent }}>/register</strong>, signs up with their Gmail, and enters this code to unlock their love page.
          </p>
        </div>
        <button onClick={() => { setGenerated(null); setForm({ name1: '', accessCode: '' }); setTab('clients'); }} style={primaryBtn}>Back to Clients</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <PageHeader title="Add New Client" subtitle="An activation code will be generated automatically." />
      <form onSubmit={handleSubmit}>
        <div style={card}>
          <label style={lbl}>Client Name *</label>
          <input style={inp} value={form.name1} onChange={e => set('name1', e.target.value)} placeholder="e.g. Renz" required />
          <label style={lbl}>Access Code *</label>
          <input style={inp} value={form.accessCode} onChange={e => set('accessCode', e.target.value)} placeholder="e.g. 0214" required />
        </div>
        <button type="submit" style={primaryBtn}><Plus size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Create Client Account</button>
      </form>
    </div>
  );
}


function CouplesTab({ couples, clients, deleteCouple, updateCouple, navigate, showToast }) {
  const handleDelete = (slug, name) => {
    if (!window.confirm(`Move "${name}" to trash? You can restore it later from the Trash tab.`)) return;
    deleteCouple(slug);
    showToast(`${name} moved to trash.`);
  };

  return (
    <div>
      <PageHeader title="All Couple Pages" />
      {couples.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: C.textMuted }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Heart size={28} color={C.accent} strokeWidth={1.5} />
          </div>
          <p style={{ margin: 0, fontWeight: 500 }}>No couple pages yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {couples.map(c => {
            const owner = clients.find(cl => cl.coupleSlug === c.slug);
            return (
              <div key={c.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={18} color={C.accent} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: C.text, fontSize: '0.92rem' }}>{c.name1} & {c.name2}</div>
                    <div style={{ fontSize: '0.75rem', color: C.textSub }}>
                      /{c.slug} • {c.package} • {c.photos?.length || 0} photos
                      {owner && <span style={{ marginLeft: 8, color: C.textMuted }}>Owner: {owner.displayName || owner.gmail}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Badge label={c.active ? '● Active' : '○ Inactive'} color={c.active ? C.green : C.textSub} bg={c.active ? C.greenBg : '#f3f4f6'} />
                  <button onClick={() => navigate(`/love/${c.slug}`)} style={actionBtn(C.blue, C.blueBg)}><Eye size={12} /> View</button>
                  <button onClick={() => handleDelete(c.slug, `${c.name1} & ${c.name2}`)} style={actionBtn(C.textSub, '#f3f4f6')}><Trash2 size={12} /> Move to Trash</button>
                </div>
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
}


function AnalyticsTab({ clients, couples }) {
  const totalPhotos  = couples.reduce((s, c) => s + (c.photos?.length  || 0), 0);
  const totalLetters = couples.reduce((s, c) => s + (c.letters?.length || 0), 0);
  const registered   = clients.filter(c => !!c.gmail).length;
  const pkgs = { Basic: 0, Premium: 0, Lifetime: 0 };
  clients.forEach(c => { if (pkgs[c.subscription] !== undefined) pkgs[c.subscription]++; });

  const stats = [
    { label: 'Total Clients',  value: clients.length, Icon: Users,     color: C.blue,   bg: C.blueBg   },
    { label: 'Registered',     value: registered,     Icon: UserCheck, color: C.green,  bg: C.greenBg  },
    { label: 'Couple Pages',   value: couples.length, Icon: Heart,     color: C.accent, bg: C.accentSoft},
    { label: 'Total Photos',   value: totalPhotos,    Icon: Eye,       color: C.purple, bg: C.purpleBg },
    { label: 'Total Letters',  value: totalLetters,   Icon: Mail,      color: C.orange, bg: C.orangeBg },
  ];

  return (
    <div>
      <PageHeader title="Analytics" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 28 }}>
        {stats.map(({ label, value, Icon, color, bg }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 16px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Icon size={18} color={color} strokeWidth={1.8} />
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.72rem', color: C.textMuted, marginTop: 6, fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontSize: '0.78rem', color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 18, fontWeight: 700 }}>Subscriptions</div>
        {Object.entries(pkgs).map(([pkg, count]) => (
          <div key={pkg} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: C.text, fontSize: '0.9rem', fontWeight: 500 }}>{pkg}</span>
              <span style={{ color: C.accent, fontWeight: 700 }}>{count}</span>
            </div>
            <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${clients.length ? (count / clients.length) * 100 : 0}%`, background: `linear-gradient(90deg,${C.accent},${C.accentMid})`, borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function TrashTab({ trashedClients, trashedCouples, restoreClient, permanentDeleteClient, restoreCouple, permanentDeleteCouple, showToast }) {
  const [section, setSection] = useState('clients');
  const totalTrash = (trashedClients?.length || 0) + (trashedCouples?.length || 0);

  const handleRestoreClient = (id, name) => { restoreClient(id); showToast(`${name} restored.`); };
  const handlePermDeleteClient = (id, name) => {
    if (!window.confirm(`Permanently delete "${name}"? This CANNOT be undone.`)) return;
    permanentDeleteClient(id); showToast(`${name} permanently deleted.`);
  };
  const handleRestoreCouple = (slug, name) => { restoreCouple(slug); showToast(`${name} restored.`); };
  const handlePermDeleteCouple = (slug, name) => {
    if (!window.confirm(`Permanently delete "${name}"? This CANNOT be undone.`)) return;
    permanentDeleteCouple(slug); showToast(`${name} permanently deleted.`);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: '1.4rem', fontWeight: 700, letterSpacing: -0.3 }}>Trash</h2>
        {totalTrash > 0 && <Badge label={`${totalTrash} item${totalTrash !== 1 ? 's' : ''}`} color={C.red} bg={C.redBg} />}
      </div>
      <p style={{ color: C.textSub, fontSize: '0.85rem', marginBottom: 24 }}>Items here are hidden from visitors. Restore to bring back, or permanently delete forever.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { id: 'clients', label: `Clients (${trashedClients?.length || 0})` },
          { id: 'couples', label: `Couple Pages (${trashedCouples?.length || 0})` },
        ].map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{ padding: '8px 20px', borderRadius: 20, border: `1px solid ${section === s.id ? C.accent : C.border}`, background: section === s.id ? C.accentSoft : '#fff', color: section === s.id ? C.accent : C.textSub, cursor: 'pointer', fontSize: '0.85rem', fontWeight: section === s.id ? 600 : 400, transition: 'all 0.15s' }}>
            {s.label}
          </button>
        ))}
      </div>

      {totalTrash === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: C.textMuted }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Trash2 size={22} color={C.textMuted} strokeWidth={1.5} />
          </div>
          <p style={{ margin: 0, fontWeight: 500 }}>Trash is empty</p>
        </div>
      )}

      {section === 'clients' && (trashedClients?.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {trashedClients.map(client => (
            <div key={client.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: C.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <UserX size={18} color={C.red} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: C.text, marginBottom: 2 }}>{client.displayName || '(No name)'}</div>
                  <div style={{ fontSize: '0.75rem', color: C.textSub }}>
                    {client.gmail && <span>{client.gmail} • </span>}
                    {client.subscription} • /{client.coupleSlug || 'no slug'}
                    {client.deletedAt && <span style={{ color: C.red, marginLeft: 6 }}>Deleted {new Date(client.deletedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleRestoreClient(client.id, client.displayName || client.gmail || 'client')} style={actionBtn(C.green, C.greenBg)}><RotateCcw size={12} /> Restore</button>
                <button onClick={() => handlePermDeleteClient(client.id, client.displayName || client.gmail || 'client')} style={actionBtn(C.red, C.redBg)}><AlertTriangle size={12} /> Delete Forever</button>
              </div>
            </div>
          ))}
        </div>
      ) : section === 'clients' && totalTrash > 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: C.textMuted }}><p style={{ margin: 0 }}>No trashed clients</p></div>
      ) : null)}

      {section === 'couples' && (trashedCouples?.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {trashedCouples.map(c => (
            <div key={c.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Heart size={18} color={C.accent} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: C.text, marginBottom: 2 }}>{c.name1} & {c.name2}</div>
                  <div style={{ fontSize: '0.75rem', color: C.textSub }}>
                    /{c.slug} • {c.package}
                    {c.deletedAt && <span style={{ color: C.red, marginLeft: 6 }}>Deleted {new Date(c.deletedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleRestoreCouple(c.slug, `${c.name1} & ${c.name2}`)} style={actionBtn(C.green, C.greenBg)}><RotateCcw size={12} /> Restore</button>
                <button onClick={() => handlePermDeleteCouple(c.slug, `${c.name1} & ${c.name2}`)} style={actionBtn(C.red, C.redBg)}><AlertTriangle size={12} /> Delete Forever</button>
              </div>
            </div>
          ))}
        </div>
      ) : section === 'couples' && totalTrash > 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: C.textMuted }}><p style={{ margin: 0 }}>No trashed couple pages</p></div>
      ) : null)}
    </div>
  );
}


function EditClientModal({ client, updateClient, onClose, showToast }) {
  const [form, setForm] = useState({
    displayName:  client.displayName  || '',
    subscription: client.subscription || 'Basic',
    expiresAt:    client.expiresAt    || '',
    coupleSlug:   client.coupleSlug   || '',
    active:       client.active,
    approved:     client.approved,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => { updateClient(client.id, form); showToast('Client updated!'); onClose(); };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20, padding: 36, maxWidth: 480, width: '100%', fontFamily: 'system-ui,sans-serif', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: C.text, fontWeight: 700, fontSize: '1.2rem' }}>Edit Client</h2>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', color: C.textSub, cursor: 'pointer', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>
        <label style={lbl}>Display Name</label>
        <input style={inp} value={form.displayName} onChange={e => set('displayName', e.target.value)} />
        <label style={lbl}>Subscription</label>
        <select style={inp} value={form.subscription} onChange={e => set('subscription', e.target.value)}>
          {['Basic', 'Premium', 'Lifetime'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label style={lbl}>Expires At</label>
        <input type="date" style={inp} value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} />
        <label style={lbl}>Couple Slug</label>
        <input style={inp} value={form.coupleSlug} onChange={e => set('coupleSlug', e.target.value)} placeholder="e.g. renz-jane" />
        <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem', color: C.text }}>
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} style={{ accentColor: C.accent, width: 16, height: 16 }} /> Active
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem', color: C.text }}>
            <input type="checkbox" checked={form.approved} onChange={e => set('approved', e.target.checked)} style={{ accentColor: C.accent, width: 16, height: 16 }} /> Approved
          </label>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSave} style={primaryBtn}>Save Changes</button>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}


function ResetPasswordModal({ client, resetClientPassword, onClose, showToast }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');

  const handleSave = () => {
    if (!pw) { setErr('Enter a new password.'); return; }
    if (pw !== pw2) { setErr('Passwords do not match.'); return; }
    resetClientPassword(client.id, pw);
    showToast(`Password reset for ${client.displayName || client.gmail}.`);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20, padding: 36, maxWidth: 420, width: '100%', fontFamily: 'system-ui,sans-serif', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: C.text, fontWeight: 700, fontSize: '1.2rem' }}>Reset Password</h2>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', color: C.textSub, cursor: 'pointer', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>
        <p style={{ color: C.textSub, fontSize: '0.85rem', marginBottom: 20 }}>
          Setting new password for: <strong style={{ color: C.accent }}>{client.displayName || client.gmail || 'this client'}</strong>
        </p>
        <label style={lbl}>New Password</label>
        <input style={inp} type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(''); }} placeholder="Enter new password" />
        <label style={lbl}>Confirm Password</label>
        <input style={inp} type="password" value={pw2} onChange={e => { setPw2(e.target.value); setErr(''); }} placeholder="Confirm new password" />
        {err && <p style={{ color: C.red, fontSize: '0.85rem', marginBottom: 12 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSave} style={primaryBtn}>Reset Password</button>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
