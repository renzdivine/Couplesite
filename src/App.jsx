import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { MusicProvider } from './context/MusicContext';
import BgMusicPlayer from './components/BgMusicPlayer';
import MusicLoader   from './components/MusicLoader';

const MasterLogin     = lazy(() => import('./pages/MasterLogin'));
const MasterDashboard = lazy(() => import('./pages/MasterDashboard'));
const ClientRegister  = lazy(() => import('./pages/ClientRegister'));
const AdminLogin      = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard  = lazy(() => import('./pages/AdminDashboard'));

const VisitorEntry     = lazy(() => import('./pages/VisitorEntry'));
const Butterflies360   = lazy(() => import('./pages/Butterflies360'));
const ButterflyLetters = lazy(() => import('./pages/ButterflyLetters'));
const ButterflyPhotos  = lazy(() => import('./pages/ButterflyPhotos'));
const ButterflyStory   = lazy(() => import('./pages/ButterflyStory'));
const ButterflyWish    = lazy(() => import('./pages/ButterflyWish'));

import './App.css';

function PageLoader() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1a0a0a',
    }}>
      <span style={{ fontSize: '2rem', animation: 'spin 1.2s linear infinite' }}>🦋</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ProtectedVisitorRoute({ children }) {
  const { coupleAuth, coupleLogout } = useApp();

  if (!coupleAuth?.slug || !coupleAuth?.visitorToken) {
    
    return <Navigate to="/admin/login" replace />;
  }

  
  const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
  if (coupleAuth.issuedAt && Date.now() - coupleAuth.issuedAt > SESSION_TTL_MS) {
    coupleLogout();
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function ProtectedAdminRoute({ children }) {
  const { clientSession } = useApp();
  if (!clientSession?.sessionToken) return <Navigate to="/admin/login" replace />;
  return children;
}

function ProtectedMasterRoute({ children }) {
  const { masterLoggedIn } = useApp();
  if (!masterLoggedIn) return <Navigate to="/master" replace />;
  return children;
}

function App() {
  return (
    <AppProvider>
      <MusicProvider>
        <AppRoutes />
        {}
        <BgMusicPlayer />
      </MusicProvider>
    </AppProvider>
  );
}

function AppRoutes() {
  const { loading } = useApp();
  if (loading) return <PageLoader />;

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {}
          <Route path="/master"           element={<MasterLogin />} />
          <Route path="/master/dashboard" element={
            <ProtectedMasterRoute><MasterDashboard /></ProtectedMasterRoute>
          } />

          {}
          <Route path="/register"    element={<ClientRegister />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin"       element={
            <ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>
          } />

          {}
          <Route path="/love/:slug" element={<VisitorEntry />} />

          {}
          <Route path="/butterflies360" element={
            <ProtectedVisitorRoute><MusicLoader /><Butterflies360 /></ProtectedVisitorRoute>
          } />
          <Route path="/butterfly/0" element={
            <ProtectedVisitorRoute><MusicLoader /><ButterflyLetters /></ProtectedVisitorRoute>
          } />
          <Route path="/butterfly/1" element={
            <ProtectedVisitorRoute><MusicLoader /><ButterflyPhotos /></ProtectedVisitorRoute>
          } />
          <Route path="/butterfly/2" element={
            <ProtectedVisitorRoute><MusicLoader /><ButterflyStory /></ProtectedVisitorRoute>
          } />
          <Route path="/butterfly/3" element={
            <ProtectedVisitorRoute><MusicLoader /><ButterflyWish /></ProtectedVisitorRoute>
          } />

          {}
          <Route path="/"  element={<Navigate to="/admin/login" replace />} />
          <Route path="*"  element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
