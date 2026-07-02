// ─────────────────────────────────────────────────────────────
// App.jsx  — Role-based routing
//
//  /master              → Master Admin login
//  /master/dashboard    → Master Admin dashboard (full system)
//  /register            → Client self-registration (activation code)
//  /admin/login         → Client login
//  /admin               → Client dashboard (manage own couple page)
//
//  /love/:slug          → Visitor entry: code screen → memory game → butterflies
//  /butterflies360      → 360° butterfly world
//  /butterfly/0         → Butterfly Letters (love letter scrapbook)
//  /butterfly/1         → Butterfly Photos  (animated gallery slideshow)
//  /butterfly/2         → Butterfly Story   (song / vinyl board)
//  /butterfly/3         → Butterfly Wish    (wishes / time capsule)
//
//  *                    → Redirect to /admin/login
// ─────────────────────────────────────────────────────────────

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Auth & admin — lazy loaded (each becomes its own chunk)
const MasterLogin     = lazy(() => import('./pages/MasterLogin'));
const MasterDashboard = lazy(() => import('./pages/MasterDashboard'));
const ClientRegister  = lazy(() => import('./pages/ClientRegister'));
const AdminLogin      = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard  = lazy(() => import('./pages/AdminDashboard'));

// Visitor experience — lazy loaded
const VisitorEntry     = lazy(() => import('./pages/VisitorEntry'));
const Butterflies360   = lazy(() => import('./pages/Butterflies360'));
const ButterflyLetters = lazy(() => import('./pages/ButterflyLetters'));
const ButterflyPhotos  = lazy(() => import('./pages/ButterflyPhotos'));
const ButterflyStory   = lazy(() => import('./pages/ButterflyStory'));
const ButterflyWish    = lazy(() => import('./pages/ButterflyWish'));

import './App.css';

/* Minimal full-screen loader shown while a chunk is downloading */
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

function App() {
  return (
    <AppProvider>
      <AppRoutes />
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
          {/* ── Master Admin ── */}
          <Route path="/master"           element={<MasterLogin />} />
          <Route path="/master/dashboard" element={<MasterDashboard />} />

          {/* ── Client (Admin) ── */}
          <Route path="/register"         element={<ClientRegister />} />
          <Route path="/admin/login"      element={<AdminLogin />} />
          <Route path="/admin"            element={<AdminDashboard />} />

          {/* ── Visitor experience ── */}
          <Route path="/love/:slug"       element={<VisitorEntry />} />
          <Route path="/butterflies360"   element={<Butterflies360 />} />
          <Route path="/butterfly/0"      element={<ButterflyLetters />} />
          <Route path="/butterfly/1"      element={<ButterflyPhotos />} />
          <Route path="/butterfly/2"      element={<ButterflyStory />} />
          <Route path="/butterfly/3"      element={<ButterflyWish />} />

          {/* ── Fallback ── */}
          <Route path="/"                 element={<Navigate to="/admin/login" replace />} />
          <Route path="*"                 element={<Navigate to="/admin/login" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
  );
}

export default App;
