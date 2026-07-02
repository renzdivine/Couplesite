// ─────────────────────────────────────────────────────────────
// MasterDashboard.jsx  — Website owner full control panel
// Route: /master/dashboard
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Shield, Users, Plus, Trash2, Edit, Eye, LogOut, Heart,
  BarChart2, Check, X, Key, RefreshCw, Lock, Unlock,
  Copy, Download, QrCode, ChevronRight, Settings,
  UserCheck, UserX, Mail, Calendar, Package,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';


/* ── shared styles ── */
const inp = { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,150,180,0.25)', borderRadius: 10, color: '#fff', fontSize: '0.95rem', outline: 'none', marginBottom: 12, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' };
const lbl = { display: 'block', marginBottom: 4, fontSize: '0.75rem', color: 'rgba(255,180,200,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 };
const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,150,180,0.15)', borderRadius: 20, padding: 24, marginBottom: 20 };
const primaryBtn = { padding: '11px 28px', background: 'linear-gradient(135deg,#7b1fa2,#4a0080)', border: 'none', borderRadius: 50, color: '#fff', fontSize: '0.92rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 20px rgba(123,31,162,0.3)' };
const ghostBtn = { padding: '11px 24px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,150,180,0.25)', borderRadius: 50, color: '#ff9ab5', fontSize: '0.92rem', cursor: 'pointer' };
const actionBtn = (color) => ({ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 20, border: `1px solid ${color}40`, background: `${color}20`, color, cursor: 'pointer', fontSize: '0.8rem' });

const SIDEBAR_TABS = [
  { id: 'clients',   icon: Users,    label: 'Client Accounts' },
  { id: 'add',       icon: Plus,     label: 'Add Client'      },
  { id: 'couples',   icon: Heart,    label: 'Couple Pages'    },
  { id: 'analytics', icon: BarChart2, label: 'Analytics'      },
];

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export default function MasterDashboard() {
  const navigate = useNavigate();
  const {
    masterLoggedIn, masterLogout,
    clients, couples,
    createClient, updateClient, deleteClient,
    regenerateActivationCode, resetClientPassword,
    addCouple, updateCouple, deleteCouple,
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

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#050010,#0d001a,#050010)', color: '#fff', fontFamily: 'system-ui,sans-serif', display: 'flex' }}>
      {toast && <Toast msg={toast} />}

      {/* Sidebar */}
      <aside style={{ width: 240, background: 'rgba(0,0,0,0.5)', borderRight: '1px solid rgba(150,100,200,0.15)', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(150,100,200,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Shield size={18} color="#b39ddb" />
            <span style={{ fontWeight: 700, color: '#d4a0ff', fontSize: '1rem' }}>HeartLink</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(200,170,255,0.4)' }}>Master Admin Panel</div>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {SIDEBAR_TABS.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setTab(id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', marginBottom: 4, background: tab === id ? 'rgba(123,31,162,0.25)' : 'transparent', color: tab === id ? '#d4a0ff' : 'rgba(200,170,255,0.5)', cursor: 'pointer', fontSize: '0.9rem', borderLeft: tab === id ? '2px solid #9c27b0' : '2px solid transparent', transition: 'all 0.2s' }}>
              <Icon size={15} />{label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(150,100,200,0.12)' }}>
          <div style={{ fontSize: '0.72rem', color: 'rgba(200,170,255,0.3)', marginBottom: 8, paddingLeft: 12 }}>
            {clients.length} client{clients.length !== 1 ? 's' : ''} total
          </div>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: 'rgba(200,170,255,0.4)', cursor: 'pointer', fontSize: '0.85rem' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {tab === 'clients'   && <ClientsTab clients={clients} couples={couples} updateClient={updateClient} deleteClient={deleteClient} regenerateActivationCode={regenerateActivationCode} setEditClient={setEditClient} setResetPwModal={setResetPwModal} showToast={showToast} navigate={navigate} />}
        {tab === 'add'       && <AddClientTab createClient={createClient} addCouple={addCouple} couples={couples} showToast={showToast} setTab={setTab} />}
        {tab === 'couples'   && <CouplesTab couples={couples} clients={clients} deleteCouple={deleteCouple} updateCouple={updateCouple} navigate={navigate} showToast={showToast} />}
        {tab === 'analytics' && <AnalyticsTab clients={clients} couples={couples} />}
      </main>

      {editClient && (
        <EditClientModal client={editClient} updateClient={updateClient} onClose={() => setEditClient(null)} showToast={showToast} />
      )}
      {resetPwModal && (
        <ResetPasswordModal client={resetPwModal} resetClientPassword={resetClientPassword} onClose={() => setResetPwModal(null)} showToast={showToast} />
      )}
    </div>
  );
}

/* ── Toast ── */
function Toast({ msg }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: 'linear-gradient(135deg,#7b1fa2,#4a0080)', padding: '12px 20px', borderRadius: 12, fontSize: '0.9rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
      <Check size={15} /> {msg}
    </div>
  );
}

/* ════════════════════════════════════════
   CLIENTS TAB
════════════════════════════════════════ */
function ClientsTab({ clients, couples, updateClient, deleteClient, regenerateActivationCode, setEditClient, setResetPwModal, showToast, navigate }) {
  const handleDelete = (id, name) => {
    if (!window.confirm(`Delete client "${name}"? This cannot be undone.`)) return;
    deleteClient(id);
    showToast(`${name} deleted.`);
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
      <h2 style={{ margin: '0 0 8px', color: '#d4a0ff', fontSize: '1.5rem', fontWeight: 400 }}>Client Accounts</h2>
      <p style={{ color: 'rgba(200,170,255,0.45)', fontSize: '0.85rem', marginBottom: 24 }}>Manage all registered clients. Share activation codes for self-registration.</p>

      {clients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'rgba(200,170,255,0.4)' }}>
          <Users size={44} strokeWidth={1.2} style={{ marginBottom: 12 }} />
          <p>No clients yet. Go to Add Client to create one.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {clients.map(client => {
            const couple = couples.find(c => c.slug === client.coupleSlug);
            const isRegistered = !!client.gmail;
            return (
              <div key={client.id} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${client.active ? 'rgba(150,100,200,0.2)' : 'rgba(255,100,100,0.15)'}`, borderRadius: 18, padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: isRegistered ? 'rgba(76,175,80,0.2)' : 'rgba(255,150,50,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isRegistered ? <UserCheck size={20} color="#a5d6a7" /> : <UserX size={20} color="#ffb74d" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff', marginBottom: 2 }}>{client.displayName || '(Not registered)'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(200,170,255,0.45)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {isRegistered && <span><Mail size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />{client.gmail}</span>}
                        <span><Package size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />{client.subscription} • Created {client.createdAt}</span>
                        {couple && <span><Heart size={10} style={{ marginRight: 4, verticalAlign: 'middle', color: '#ff9ab5' }} />/{client.coupleSlug} — {couple.name1} & {couple.name2}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', background: client.active ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)', color: client.active ? '#a5d6a7' : '#ef9a9a', border: `1px solid ${client.active ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)'}` }}>
                      {client.active ? '● Active' : '○ Disabled'}
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', background: isRegistered ? 'rgba(33,150,243,0.2)' : 'rgba(255,152,0,0.2)', color: isRegistered ? '#90caf9' : '#ffcc80', border: `1px solid ${isRegistered ? 'rgba(33,150,243,0.3)' : 'rgba(255,152,0,0.3)'}` }}>
                      {isRegistered ? '✓ Registered' : '⏳ Pending'}
                    </span>
                  </div>
                </div>

                {/* Activation code row */}
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(200,170,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Activation Code</div>
                    <code style={{ color: '#d4a0ff', fontSize: '0.95rem', letterSpacing: 1, fontWeight: 700 }}>{client.activationCode}</code>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => copyCode(client.activationCode)} style={actionBtn('#9c27b0')} title="Copy code"><Copy size={12} /> Copy</button>
                    <button onClick={() => handleRegenCode(client.id)} style={actionBtn('#ff9800')} title="Regenerate code"><RefreshCw size={12} /> New Code</button>
                  </div>
                </div>

                {/* Actions row */}
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => setEditClient(client)} style={actionBtn('#ff9800')}><Edit size={12} /> Edit</button>
                  <button onClick={() => setResetPwModal(client)} style={actionBtn('#2196f3')}><Key size={12} /> Reset Password</button>
                  <button onClick={() => handleToggleActive(client)} style={actionBtn(client.active ? '#f44336' : '#4caf50')}>
                    {client.active ? <><Unlock size={12} /> Disable</> : <><Lock size={12} /> Enable</>}
                  </button>
                  {couple && <button onClick={() => navigate(`/love/${couple.slug}`)} style={actionBtn('#00bcd4')}><Eye size={12} /> View Site</button>}
                  <button onClick={() => handleDelete(client.id, client.displayName || client.gmail || 'client')} style={actionBtn('#888')}><Trash2 size={12} /> Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   ADD CLIENT TAB
════════════════════════════════════════ */
function AddClientTab({ createClient, addCouple, couples, showToast, setTab }) {
  const [form, setForm] = useState({ name1: '', accessCode: '' });
  const [generated, setGenerated] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name1 || !form.accessCode) {
      alert('Please fill in all fields.');
      return;
    }
    // auto-generate slug from name + timestamp to guarantee uniqueness
    const slug = `${form.name1.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const couple = await addCouple({ name1: form.name1, name2: '', slug, accessCode: form.accessCode, theme: 'rose', package: 'Basic' });
    const client = await createClient({ displayName: form.name1, subscription: 'Basic', coupleSlug: couple?.slug || slug });
    if (client) {
      setGenerated(client);
      showToast('Client account created!');
    } else {
      showToast('Error creating client. Check Supabase connection.');
    }
  };

  if (generated) {
    return (
      <div style={{ maxWidth: 560 }}>
        <h2 style={{ margin: '0 0 24px', color: '#d4a0ff', fontWeight: 400 }}>Client Created ✓</h2>
        <div style={{ ...card, borderColor: 'rgba(123,31,162,0.4)', background: 'rgba(123,31,162,0.1)' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(200,170,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Share this activation code with the client:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <code style={{ fontSize: '1.4rem', fontWeight: 700, color: '#d4a0ff', letterSpacing: 2, background: 'rgba(0,0,0,0.4)', padding: '10px 18px', borderRadius: 10, flex: 1 }}>{generated.activationCode}</code>
              <button onClick={() => { navigator.clipboard.writeText(generated.activationCode).catch(() => {}); showToast('Copied!'); }} style={actionBtn('#9c27b0')}><Copy size={14} /> Copy</button>
            </div>
          </div>
          <p style={{ margin: 0, color: 'rgba(200,170,255,0.6)', fontSize: '0.85rem', lineHeight: 1.7 }}>
            The client visits <strong style={{ color: '#d4a0ff' }}>/register</strong>, signs up with their Gmail, and enters this code to unlock their love page.
          </p>
        </div>
        <button onClick={() => { setGenerated(null); setForm({ name1: '', accessCode: '' }); setTab('clients'); }} style={primaryBtn}>Back to Clients</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400 }}>
      <h2 style={{ margin: '0 0 8px', color: '#d4a0ff', fontWeight: 400 }}>Add New Client</h2>
      <p style={{ color: 'rgba(200,170,255,0.45)', fontSize: '0.85rem', marginBottom: 24 }}>An activation code will be generated automatically.</p>
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

/* ════════════════════════════════════════
   COUPLES TAB — Master can view/delete all couple pages
════════════════════════════════════════ */
function CouplesTab({ couples, clients, deleteCouple, updateCouple, navigate, showToast }) {
  const [qrSlug, setQrSlug] = useState(couples[0]?.slug || '');
  const qrUrl = qrSlug ? `${window.location.origin}/love/${qrSlug}` : '';

  const handleDelete = (slug, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteCouple(slug);
    showToast(`${name} deleted.`);
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', color: '#d4a0ff', fontWeight: 400 }}>All Couple Pages</h2>
      {couples.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'rgba(200,170,255,0.4)' }}>
          <Heart size={44} strokeWidth={1.2} style={{ marginBottom: 12 }} />
          <p>No couple pages yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {couples.map(c => {
            const owner = clients.find(cl => cl.coupleSlug === c.slug);
            return (
              <div key={c.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(150,100,200,0.15)', borderRadius: 18, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(233,30,140,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={18} color="#ff9ab5" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{c.name1} & {c.name2}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(200,170,255,0.45)' }}>
                      /{c.slug} • {c.package} • {c.photos?.length || 0} photos
                      {owner && <span style={{ marginLeft: 8, color: 'rgba(200,170,255,0.5)' }}>Owner: {owner.displayName || owner.gmail}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', background: c.active ? 'rgba(76,175,80,0.2)' : 'rgba(100,100,100,0.2)', color: c.active ? '#a5d6a7' : 'rgba(255,255,255,0.4)', border: '1px solid rgba(76,175,80,0.2)' }}>
                    {c.active ? '● Active' : '○ Inactive'}
                  </span>
                  <button onClick={() => navigate(`/love/${c.slug}`)} style={actionBtn('#2196f3')}><Eye size={12} /> View</button>
                  <button onClick={() => handleDelete(c.slug, `${c.name1} & ${c.name2}`)} style={actionBtn('#e91e8c')}><Trash2 size={12} /> Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Generator */}
      {couples.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: '0.8rem', color: 'rgba(200,170,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <QrCode size={14} /> Heart QR Generator
          </div>
          <label style={lbl}>Select Couple</label>
          <select value={qrSlug} onChange={e => setQrSlug(e.target.value)} style={{ ...inp, marginBottom: 20 }}>
            {couples.map(c => <option key={c.slug} value={c.slug}>{c.name1} & {c.name2} (/{c.slug})</option>)}
          </select>
          {qrUrl && (
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ background: 'white', padding: 10, borderRadius: 12, display: 'inline-block' }}>
                <QRCodeSVG value={qrUrl} size={130} fgColor="#1a0015" bgColor="white" level="H" />
              </div>
              <div>
                <p style={{ color: 'rgba(200,170,255,0.5)', fontSize: '0.82rem', marginBottom: 12 }}>
                  URL: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>{qrUrl}</code>
                </p>
                <button onClick={() => { navigator.clipboard.writeText(qrUrl).catch(() => {}); showToast('Link copied!'); }} style={{ ...ghostBtn, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Copy size={13} /> Copy Link
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   ANALYTICS TAB
════════════════════════════════════════ */
function AnalyticsTab({ clients, couples }) {
  const totalPhotos  = couples.reduce((s, c) => s + (c.photos?.length  || 0), 0);
  const totalLetters = couples.reduce((s, c) => s + (c.letters?.length || 0), 0);
  const registered   = clients.filter(c => !!c.gmail).length;
  const pkgs = { Basic: 0, Premium: 0, Lifetime: 0 };
  clients.forEach(c => { if (pkgs[c.subscription] !== undefined) pkgs[c.subscription]++; });

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', color: '#d4a0ff', fontWeight: 400 }}>Analytics</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Clients',    value: clients.length,  Icon: Users     },
          { label: 'Registered',       value: registered,      Icon: UserCheck },
          { label: 'Couple Pages',     value: couples.length,  Icon: Heart     },
          { label: 'Total Photos',     value: totalPhotos,     Icon: Eye       },
          { label: 'Total Letters',    value: totalLetters,    Icon: Mail      },
        ].map(({ label, value, Icon }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(150,100,200,0.15)', borderRadius: 18, padding: '22px 16px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Icon size={22} color="#d4a0ff" strokeWidth={1.5} /></div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#d4a0ff' }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(200,170,255,0.5)', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={card}>
        <div style={{ fontSize: '0.8rem', color: 'rgba(200,170,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16, fontWeight: 600 }}>Subscriptions</div>
        {Object.entries(pkgs).map(([pkg, count]) => (
          <div key={pkg} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ color: 'rgba(200,170,255,0.7)', fontSize: '0.9rem' }}>{pkg}</span>
              <span style={{ color: '#d4a0ff', fontWeight: 600 }}>{count}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${clients.length ? (count / clients.length) * 100 : 0}%`, background: 'linear-gradient(90deg,#7b1fa2,#9c27b0)', borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   EDIT CLIENT MODAL
════════════════════════════════════════ */
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

  const handleSave = () => {
    updateClient(client.id, form);
    showToast('Client updated!');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0018,#060010)', border: '1px solid rgba(150,100,200,0.25)', borderRadius: 24, padding: 36, maxWidth: 480, width: '100%', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#d4a0ff', fontWeight: 400 }}>Edit Client</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(200,170,255,0.5)', cursor: 'pointer' }}><X size={18} /></button>
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
        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', color: 'rgba(200,170,255,0.7)' }}>
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} style={{ accentColor: '#9c27b0' }} /> Active
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', color: 'rgba(200,170,255,0.7)' }}>
            <input type="checkbox" checked={form.approved} onChange={e => set('approved', e.target.checked)} style={{ accentColor: '#9c27b0' }} /> Approved
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

/* ════════════════════════════════════════
   RESET PASSWORD MODAL
════════════════════════════════════════ */
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0018,#060010)', border: '1px solid rgba(150,100,200,0.25)', borderRadius: 24, padding: 36, maxWidth: 420, width: '100%', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#d4a0ff', fontWeight: 400 }}>Reset Password</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(200,170,255,0.5)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <p style={{ color: 'rgba(200,170,255,0.5)', fontSize: '0.85rem', marginBottom: 20 }}>
          Setting new password for: <strong style={{ color: '#d4a0ff' }}>{client.displayName || client.gmail || 'this client'}</strong>
        </p>
        <label style={lbl}>New Password</label>
        <input style={inp} type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(''); }} placeholder="Enter new password" />
        <label style={lbl}>Confirm Password</label>
        <input style={inp} type="password" value={pw2} onChange={e => { setPw2(e.target.value); setErr(''); }} placeholder="Confirm new password" />
        {err && <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: 10 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSave} style={primaryBtn}>Reset Password</button>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
