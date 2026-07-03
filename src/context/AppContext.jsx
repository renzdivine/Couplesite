import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  masterAdminLogin   as dbMasterLogin,
  fetchClients, fetchTrashedClients,
  createClient as dbCreateClient, updateClient as dbUpdateClient,
  deleteClient as dbDeleteClient, restoreClient as dbRestoreClient,
  permanentDeleteClient as dbPermDeleteClient,
  regenerateActivationCode as dbRegenCode,
  validateActivationCode as dbValidateCode, clientRegister as dbClientRegister,
  clientLogin    as dbClientLogin, clientLogout   as dbClientLogout,
  validateClientSession,
  fetchCouples, fetchTrashedCouples,
  fetchCoupleBySlug, addCouple as dbAddCouple,
  updateCouple as dbUpdateCouple,
  deleteCouple as dbDeleteCouple, restoreCouple as dbRestoreCouple,
  permanentDeleteCouple as dbPermDeleteCouple,
  coupleLogin as dbCoupleLogin, saveBouquet as dbSaveBouquet,
} from '../lib/db';

const AppContext = createContext(null);


const LS_MASTER  = 'heartlink_master';
const LS_CLIENT  = 'heartlink_client_session';
const LS_COUPLE  = 'heartlink_couple_auth';
const lsGet = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const lsSet = (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const lsDel = (k)     => localStorage.removeItem(k);

export function AppProvider({ children }) {
  
  const [couples,        setCouples]        = useState([]);
  const [clients,        setClients]        = useState([]);
  const [trashedCouples, setTrashedCouples] = useState([]);
  const [trashedClients, setTrashedClients] = useState([]);
  const [loading,        setLoading]        = useState(true);

  
  const [masterLoggedIn, setMasterLoggedIn] = useState(
    () => localStorage.getItem(LS_MASTER) === 'true'
  );

  
  const [clientSession, setClientSession] = useState(
    () => lsGet(LS_CLIENT, null)
  );

  
  const [coupleAuth, setCoupleAuth] = useState(
    () => lsGet(LS_COUPLE, null)
  );

  
  useEffect(() => {
    async function loadData() {
      const [couplesData, clientsData, trashedCouplesData, trashedClientsData] = await Promise.all([
        fetchCouples(),
        fetchClients(),
        fetchTrashedCouples(),
        fetchTrashedClients(),
      ]);
      setCouples(couplesData);
      setClients(clientsData);
      setTrashedCouples(trashedCouplesData);
      setTrashedClients(trashedClientsData);
      setLoading(false);
    }
    loadData();
  }, []);

  
  useEffect(() => {
    if (!clientSession?.clientId || !clientSession?.sessionToken) return;

    validateClientSession(clientSession.clientId, clientSession.sessionToken).then(valid => {
      if (!valid) {
        
        setClientSession(null);
        lsDel(LS_CLIENT);
      }
    });
  }, []); 

  
  const masterLogin = async (username, password) => {
    const result = await dbMasterLogin(username, password);
    if (result.success) {
      setMasterLoggedIn(true);
      localStorage.setItem(LS_MASTER, 'true');
      
      const [couplesData, clientsData, trashedCouplesData, trashedClientsData] = await Promise.all([
        fetchCouples(), fetchClients(), fetchTrashedCouples(), fetchTrashedClients(),
      ]);
      setCouples(couplesData);
      setClients(clientsData);
      setTrashedCouples(trashedCouplesData);
      setTrashedClients(trashedClientsData);
    }
    return result.success;
  };

  const masterLogout = () => {
    setMasterLoggedIn(false);
    lsDel(LS_MASTER);
  };

  
  const validateActivationCode = async (code) => {
    return dbValidateCode(code);
  };

  const clientRegister = async (gmail, password, activationCode) => {
    const result = await dbClientRegister(gmail, password, activationCode);
    if (result.success) {
      
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

  
  const coupleLogin = async (slug, code) => {
    const auth = await dbCoupleLogin(slug, code);
    
    if (auth && !auth.error) {
      setCoupleAuth(auth);
      lsSet(LS_COUPLE, auth);
      return { success: true };
    }
    return { success: false, error: auth?.error || 'Wrong code. Try again.' };
  };

  const coupleLogout = () => {
    setCoupleAuth(null);
    lsDel(LS_COUPLE);
  };

  
  const createClient = async (data) => {
    const newClient = await dbCreateClient(data);
    if (newClient) setClients(prev => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = async (clientId, updates) => {
    
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...updates } : c));
    try {
      await dbUpdateClient(clientId, updates);
    } catch {
      
      const fresh = await fetchClients();
      setClients(fresh);
      return;
    }
    
    if (clientSession?.clientId === clientId) {
      const updated = { ...clientSession, ...updates };
      setClientSession(updated);
      lsSet(LS_CLIENT, updated);
    }
  };

  const deleteClient = async (clientId) => {
    await dbDeleteClient(clientId);
    const trashed = clients.find(c => c.id === clientId);
    setClients(prev => prev.filter(c => c.id !== clientId));
    if (trashed) setTrashedClients(prev => [{ ...trashed, deletedAt: new Date().toISOString() }, ...prev]);
  };

  const restoreClient = async (clientId) => {
    await dbRestoreClient(clientId);
    const item = trashedClients.find(c => c.id === clientId);
    setTrashedClients(prev => prev.filter(c => c.id !== clientId));
    if (item) setClients(prev => [{ ...item, deletedAt: null, active: true }, ...prev]);
  };

  const permanentDeleteClient = async (clientId) => {
    await dbPermDeleteClient(clientId);
    setTrashedClients(prev => prev.filter(c => c.id !== clientId));
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

  
  const addCouple = async (coupleData) => {
    const newCouple = await dbAddCouple(coupleData);
    if (newCouple) setCouples(prev => [newCouple, ...prev]);
    return newCouple;
  };

  const updateCouple = useCallback(async (slug, updates) => {
    
    setCouples(prev => prev.map(c => {
      if (c.slug !== slug) return c;
      
      if (updates.pageContent) {
        return { ...c, ...updates, pageContent: { ...c.pageContent, ...updates.pageContent } };
      }
      return { ...c, ...updates };
    }));
    
    await dbUpdateCouple(slug, updates);
  }, []);

  const deleteCouple = async (slug) => {
    await dbDeleteCouple(slug);
    const trashed = couples.find(c => c.slug === slug);
    setCouples(prev => prev.filter(c => c.slug !== slug));
    if (trashed) setTrashedCouples(prev => [{ ...trashed, deletedAt: new Date().toISOString() }, ...prev]);
  };

  const restoreCouple = async (slug) => {
    await dbRestoreCouple(slug);
    const item = trashedCouples.find(c => c.slug === slug);
    setTrashedCouples(prev => prev.filter(c => c.slug !== slug));
    if (item) setCouples(prev => [{ ...item, deletedAt: null, active: true }, ...prev]);
  };

  const permanentDeleteCouple = async (slug) => {
    await dbPermDeleteCouple(slug);
    setTrashedCouples(prev => prev.filter(c => c.slug !== slug));
  };

  const getCoupleBySlug = (slug) => couples.find(c => c.slug === slug);

  const saveBouquet = async (slug, quantities, seed) => {
    await dbSaveBouquet(slug, quantities, seed);
    setCouples(prev => prev.map(c =>
      c.slug === slug ? { ...c, bouquet: { quantities, seed } } : c
    ));
  };

  
  const myCouple = clientSession?.coupleSlug
    ? couples.find(c => c.slug === clientSession.coupleSlug) || null
    : null;

  return (
    <AppContext.Provider value={{
      
      loading,

      
      couples,
      clients,
      trashedCouples,
      trashedClients,
      myCouple,

      
      masterLoggedIn,
      masterLogin,
      masterLogout,

      
      clientSession,
      clientLogin,
      clientLogout,
      clientRegister,
      validateActivationCode,

      
      createClient,
      updateClient,
      deleteClient,
      restoreClient,
      permanentDeleteClient,
      regenerateActivationCode,
      resetClientPassword,

      
      coupleAuth,
      coupleLogin,
      coupleLogout,

      
      addCouple,
      updateCouple,
      deleteCouple,
      restoreCouple,
      permanentDeleteCouple,
      getCoupleBySlug,
      saveBouquet,

      
      adminLoggedIn: masterLoggedIn,
      adminLogin:    masterLogin,
      adminLogout:   masterLogout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
