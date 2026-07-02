// ─────────────────────────────────────────────────────────────
// AppContext.jsx  — Role-based state management (Supabase-backed)
//
// Roles:
//   masterAdmin  — website owner, full system access
//   admin        — client, access only their own couple page
//   user         — visitor, no login required
//
// Security:
//   - Client sessions are token-based (stored in Supabase)
//   - Each new login issues a fresh session_token, revoking any
//     existing session on another device/browser
//   - Session is validated against DB every time the app loads
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  masterAdminLogin   as dbMasterLogin,
  fetchClients, createClient as dbCreateClient, updateClient as dbUpdateClient,
  deleteClient as dbDeleteClient, regenerateActivationCode as dbRegenCode,
  validateActivationCode as dbValidateCode, clientRegister as dbClientRegister,
  clientLogin    as dbClientLogin, clientLogout   as dbClientLogout,
  validateClientSession,
  fetchCouples, fetchCoupleBySlug, addCouple as dbAddCouple,
  updateCouple as dbUpdateCouple, deleteCouple as dbDeleteCouple,
  coupleLogin as dbCoupleLogin, saveBouquet as dbSaveBouquet,
} from '../lib/db';

const AppContext = createContext(null);

/* ─── localStorage helpers (session tokens only — no bulk data) ─── */
const LS_MASTER  = 'heartlink_master';
const LS_CLIENT  = 'heartlink_client_session';
const LS_COUPLE  = 'heartlink_couple_auth';
const lsGet = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const lsSet = (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const lsDel = (k)     => localStorage.removeItem(k);

export function AppProvider({ children }) {
  /* ── data ── */
  const [couples,      setCouples]      = useState([]);
  const [clients,      setClients]      = useState([]);
  const [loading,      setLoading]      = useState(true);

  /* ── master admin ── */
  const [masterLoggedIn, setMasterLoggedIn] = useState(
    () => localStorage.getItem(LS_MASTER) === 'true'
  );

  /* ── client session ── */
  const [clientSession, setClientSession] = useState(
    () => lsGet(LS_CLIENT, null)
  );

  /* ── visitor couple auth ── */
  const [coupleAuth, setCoupleAuth] = useState(
    () => lsGet(LS_COUPLE, null)
  );

  /* ═══════════════════════════════════════
     INITIAL DATA LOAD
  ═══════════════════════════════════════ */
  useEffect(() => {
    async function loadData() {
      const [couplesData, clientsData] = await Promise.all([
        fetchCouples(),
        fetchClients(),
      ]);
      setCouples(couplesData);
      setClients(clientsData);
      setLoading(false);
    }
    loadData();
  }, []);

  /* ═══════════════════════════════════════
     CLIENT SESSION SECURITY CHECK
     Runs on app load — if the session token no longer matches
     what's in the DB (another device logged in), force logout.
  ═══════════════════════════════════════ */
  useEffect(() => {
    if (!clientSession?.clientId || !clientSession?.sessionToken) return;

    validateClientSession(clientSession.clientId, clientSession.sessionToken).then(valid => {
      if (!valid) {
        // Session was invalidated (another device logged in, or account disabled)
        setClientSession(null);
        lsDel(LS_CLIENT);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ═══════════════════════════════════════
     MASTER ADMIN AUTH
  ═══════════════════════════════════════ */
  const masterLogin = async (username, password) => {
    const result = await dbMasterLogin(username, password);
    if (result.success) {
      setMasterLoggedIn(true);
      localStorage.setItem(LS_MASTER, 'true');
      // Reload data fresh from DB on master login
      const [couplesData, clientsData] = await Promise.all([fetchCouples(), fetchClients()]);
      setCouples(couplesData);
      setClients(clientsData);
    }
    return result.success;
  };

  const masterLogout = () => {
    setMasterLoggedIn(false);
    lsDel(LS_MASTER);
  };

  /* ═══════════════════════════════════════
     CLIENT AUTH
  ═══════════════════════════════════════ */
  const validateActivationCode = async (code) => {
    return dbValidateCode(code);
  };

  const clientRegister = async (gmail, password, activationCode) => {
    const result = await dbClientRegister(gmail, password, activationCode);
    if (result.success) {
      // Refresh clients list
      const updated = await fetchClients();
      setClients(updated);
    }
    return result;
  };

  const clientLogin = async (gmail, password) => {
    const result = await dbClientLogin(gmail, password);
    if (result.success) {
      setClientSession(result.session);
      lsSet(LS_CLIENT, result.session);
      // Load the couple for this client into state
      if (result.session.coupleSlug) {
        const couple = await fetchCoupleBySlug(result.session.coupleSlug);
        if (couple) {
          setCouples(prev => {
            const idx = prev.findIndex(c => c.slug === couple.slug);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = couple;
              return next;
            }
            return [...prev, couple];
          });
        }
      }
    }
    return result;
  };

  const clientLogout = async () => {
    if (clientSession?.clientId) {
      await dbClientLogout(clientSession.clientId, clientSession.sessionToken);
    }
    setClientSession(null);
    lsDel(LS_CLIENT);
  };

  /* ═══════════════════════════════════════
     VISITOR AUTH
  ═══════════════════════════════════════ */
  const coupleLogin = async (slug, code) => {
    const auth = await dbCoupleLogin(slug, code);
    if (auth) {
      setCoupleAuth(auth);
      lsSet(LS_COUPLE, auth);
      return true;
    }
    return false;
  };

  const coupleLogout = () => {
    setCoupleAuth(null);
    lsDel(LS_COUPLE);
  };

  /* ═══════════════════════════════════════
     MASTER ADMIN — CLIENT MANAGEMENT
  ═══════════════════════════════════════ */
  const createClient = async (data) => {
    const newClient = await dbCreateClient(data);
    if (newClient) setClients(prev => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = async (clientId, updates) => {
    await dbUpdateClient(clientId, updates);
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...updates } : c));
    // Refresh session if the logged-in client was updated
    if (clientSession?.clientId === clientId) {
      const updated = { ...clientSession, ...updates };
      setClientSession(updated);
      lsSet(LS_CLIENT, updated);
    }
  };

  const deleteClient = async (clientId) => {
    await dbDeleteClient(clientId);
    setClients(prev => prev.filter(c => c.id !== clientId));
  };

  const regenerateActivationCode = async (clientId) => {
    const client = clients.find(c => c.id === clientId);
    const newCode = await dbRegenCode(clientId, client?.displayName || '');
    if (newCode) {
      setClients(prev => prev.map(c =>
        c.id === clientId
          ? { ...c, activationCode: newCode, activated: false, gmail: '', password: '', approved: false }
          : c
      ));
    }
    return newCode;
  };

  const resetClientPassword = async (clientId, newPassword) => {
    await updateClient(clientId, { password: newPassword });
  };

  /* ═══════════════════════════════════════
     COUPLE DATA MANAGEMENT
  ═══════════════════════════════════════ */
  const addCouple = async (coupleData) => {
    const newCouple = await dbAddCouple(coupleData);
    if (newCouple) setCouples(prev => [newCouple, ...prev]);
    return newCouple;
  };

  const updateCouple = useCallback(async (slug, updates) => {
    // Optimistic update — update local state immediately
    setCouples(prev => prev.map(c => {
      if (c.slug !== slug) return c;
      // For pageContent, merge properly
      if (updates.pageContent) {
        return { ...c, ...updates, pageContent: { ...c.pageContent, ...updates.pageContent } };
      }
      return { ...c, ...updates };
    }));
    // Persist to DB
    await dbUpdateCouple(slug, updates);
  }, []);

  const deleteCouple = async (slug) => {
    await dbDeleteCouple(slug);
    setCouples(prev => prev.filter(c => c.slug !== slug));
  };

  const getCoupleBySlug = (slug) => couples.find(c => c.slug === slug);

  const saveBouquet = async (slug, quantities, seed) => {
    await dbSaveBouquet(slug, quantities, seed);
    setCouples(prev => prev.map(c =>
      c.slug === slug ? { ...c, bouquet: { quantities, seed } } : c
    ));
  };

  /* ── derived: couple belonging to logged-in client ── */
  const myCouple = clientSession?.coupleSlug
    ? couples.find(c => c.slug === clientSession.coupleSlug) || null
    : null;

  return (
    <AppContext.Provider value={{
      /* loading state */
      loading,

      /* data */
      couples,
      clients,
      myCouple,

      /* master admin */
      masterLoggedIn,
      masterLogin,
      masterLogout,

      /* client auth */
      clientSession,
      clientLogin,
      clientLogout,
      clientRegister,
      validateActivationCode,

      /* master admin — client management */
      createClient,
      updateClient,
      deleteClient,
      regenerateActivationCode,
      resetClientPassword,

      /* visitor auth */
      coupleAuth,
      coupleLogin,
      coupleLogout,

      /* couple data */
      addCouple,
      updateCouple,
      deleteCouple,
      getCoupleBySlug,
      saveBouquet,

      // legacy compat
      adminLoggedIn: masterLoggedIn,
      adminLogin:    masterLogin,
      adminLogout:   masterLogout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
