import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles/index.css';
import './styles/markdown.css';
import './styles/katex.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { KeyboardShortcutProvider } from './contexts/KeyboardShortcutContext';
import { ProfileProvider } from './contexts/ProfileContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import LoadingScreen from './components/common/LoadingScreen';
import SettingsModal from './components/modals/SettingsModal';
import PublicHome from './pages/PublicHome';
import Review from './pages/Review';
import Chat from './pages/Chat';
import CardsByDeck from './pages/CardsByDeck';
import SignupPage from './pages/SignUpPage';
import SignInPage from './pages/SignInPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <KeyboardShortcutProvider>
        <AuthProvider>
          <ProfileProvider>
            <Router>
              <AppContent />
            </Router>
          </ProfileProvider>
        </AuthProvider>
      </KeyboardShortcutProvider>
    </QueryClientProvider>
  );
}

const AppContent: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const isAuthPage = ['/signup', '/signin'].includes(location.pathname);

  useEffect(() => {
    const handleResize = () => {
      // lg breakpoint
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-dvh bg-white">
      {session && !isAuthPage && <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />}
      <div className={`flex flex-col flex-1 ${!isSidebarCollapsed && session && !isAuthPage ? 'lg:ml-72' : ''}`}>
        {!isAuthPage && (
          <Header
            showSidebarToggle={!!session}
            onToggleSidebar={toggleSidebar}
            isSidebarCollapsed={isSidebarCollapsed}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        )}
        <main className="flex-1 overflow-auto">
          <div className={`h-full ${isAuthPage ? '' : 'p-4'}`}>
            <Routes>
              <Route path="/" element={session ? <Navigate to="/chat" replace /> : <PublicHome />} />
              <Route path="/signup" element={session ? <Navigate to="/chat" replace /> : <SignupPage />} />
              <Route path="/signin" element={session ? <Navigate to="/chat" replace /> : <SignInPage />} />
              <Route
                path="/chat"
                element={session ? <Chat /> : <Navigate to="/signin" state={{ from: location }} replace />}
              />
              <Route
                path="/chat/:chatId"
                element={session ? <Chat /> : <Navigate to="/signin" state={{ from: location }} replace />}
              />
              <Route
                path="/review"
                element={session ? <Review /> : <Navigate to="/signin" state={{ from: location }} replace />}
              />
              <Route
                path="/review/:deckId"
                element={session ? <Review /> : <Navigate to="/signin" state={{ from: location }} replace />}
              />
              <Route
                path="/cards"
                element={session ? <CardsByDeck /> : <Navigate to="/signin" state={{ from: location }} replace />}
              />
              <Route
                path="/cards/:deckId"
                element={session ? <CardsByDeck /> : <Navigate to="/signin" state={{ from: location }} replace />}
              />
            </Routes>
          </div>
        </main>
      </div>
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </div>
  );
};

export default App;
