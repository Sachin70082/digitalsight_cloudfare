
import React, { useState, createContext, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole } from './types';
import { api } from './services/mockApi';
import { User as FirebaseUser } from 'firebase/auth';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReleaseList from './pages/ReleaseList';
import ReleaseReview from './pages/ReleaseReview';
import ReleaseDetail from './pages/ReleaseDetail';
import Artists from './pages/Artists';
import SubLabels from './pages/SubLabels';
import Settings from './pages/Settings';
import Network from './pages/Network';
import Employees from './pages/Employees';
import Notices from './pages/Notices';
import CorrectionQueue from './pages/CorrectionQueue';
import Accounting from './pages/Accounting';
import Support from './pages/Support';
import FAQ from './pages/FAQ';
import Labels from './pages/Labels';

type ToastType = 'success' | 'error' | 'info';

type AppContextType = {
  user: User | null;
  pendingFounder: FirebaseUser | null;
  login: (email: string, password?: string) => Promise<void>;
  completeFounderSetup: (name: string, designation: string) => Promise<void>;
  logout: () => void;
  showToast: (message: string, type?: ToastType) => void;
};

export const AppContext = createContext<AppContextType>({
  user: null,
  pendingFounder: null,
  login: async () => {},
  completeFounderSetup: async () => {},
  logout: () => {},
  showToast: () => {},
});

const Toast: React.FC<{ message: string; type: ToastType; onClear: () => void }> = ({ message, type, onClear }) => {
    useEffect(() => {
        const timer = setTimeout(onClear, 6000);
        return () => clearTimeout(timer);
    }, [onClear]);

    const bgClass = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-primary' : 'bg-blue-600';
    
    return (
        <div className={`fixed bottom-6 right-6 z-[1000] min-w-[300px] max-w-md ${bgClass} text-white p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 animate-slide-up border border-white/10`}>
            <div className="flex items-center gap-3">
                {type === 'error' ? (
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                ) : (
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                )}
                <p className="text-sm font-bold tracking-tight">{message}</p>
            </div>
            <button onClick={onClear} className="text-white/60 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
    );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [pendingFounder, setPendingFounder] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Ensure permissions exist even when hydrating from storage
      if (parsedUser && !parsedUser.permissions) {
          parsedUser.permissions = { canManageArtists: false, canManageReleases: false, canCreateSubLabels: false };
      }
      setUser(parsedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password?: string) => {
    const result = await api.login(email, password);
    
    if (result && 'needsProfile' in result) {
        setPendingFounder(result.firebaseUser);
        return;
    }

    if (result && 'id' in result) {
      const userResult = result as User;
      setUser(userResult);
      sessionStorage.setItem('user', JSON.stringify(userResult));
      setPendingFounder(null);
    } else {
      throw new Error('Authentication failed.');
    }
  }, []);

  const completeFounderSetup = useCallback(async (name: string, designation: string) => {
      if (!pendingFounder) return;
      
      const newUser = await api.createMasterProfile(pendingFounder.uid, { name, designation });
      setUser(newUser);
      sessionStorage.setItem('user', JSON.stringify(newUser));
      setPendingFounder(null);
  }, [pendingFounder]);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setPendingFounder(null);
    sessionStorage.removeItem('user');
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
      setToast({ message, type });
  }, []);

  if (isLoading) {
    return <div className="bg-gray-900 h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <AppContext.Provider value={{ user, pendingFounder, login, completeFounderSetup, logout, showToast }}>
      <BrowserRouter>
        {toast && <Toast message={toast.message} type={toast.type} onClear={() => setToast(null)} />}
        <Routes>
          {!user ? (
            <>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="releases" element={<ReleaseList />} />
              <Route path="releases/:releaseId" element={<ReleaseDetail />} />
              
              {(user.role === UserRole.LABEL_ADMIN || user.permissions?.canCreateSubLabels) && (
                <Route path="sub-labels" element={<SubLabels />} />
              )}

              {(user.role === UserRole.OWNER || user.permissions?.canManageNetwork || user.permissions?.canCreateSubLabels) && (
                <Route path="network" element={<Network />} />
              )}

              {(user.role !== UserRole.ARTIST || user.permissions?.canManageArtists) && (
                <Route path="artists" element={<Artists />} />
              )}

              {(user.role === UserRole.OWNER || user.permissions?.canManageEmployees) && (
                <Route path="employees" element={<Employees />} />
              )}

              {(user.role === UserRole.OWNER || user.role === UserRole.EMPLOYEE) && (
                  <>
                    <Route path="notices" element={<Notices />} />
                    <Route path="correction-queue" element={<CorrectionQueue />} />
                  </>
              )}

              <Route path="accounting" element={<Accounting />} />
              <Route path="support" element={<Support />} />
              <Route path="faq" element={<FAQ />} />

              <Route path="settings" element={<Settings />} />

              {(user.role === UserRole.OWNER || user.role === UserRole.EMPLOYEE) && (
                <Route path="release/:releaseId" element={<ReleaseReview />} />
              )}

              {(user.role === UserRole.OWNER || user.permissions?.canOnboardLabels) && (
                <Route path="labels" element={<Labels />} />
              )}
              
              <Route path="*" element={<Navigate to="/" />} />
            </Route>
          )}
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
};

export default App;