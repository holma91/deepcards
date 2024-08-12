import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { KeyboardShortcutProvider } from './contexts/KeyboardShortcutContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import LoadingScreen from './components/LoadingScreen';

import PublicHome from './pages/PublicHome';
import Review from './pages/Review';
import Cards from './pages/Cards';
import Chat from './pages/Chat';
import CardsByDeck from './pages/CardsByDeck';
import SignupPage from './pages/SignUpPage';
import SignInPage from './pages/SignInPage';

function App() {
  return (
    <KeyboardShortcutProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </KeyboardShortcutProvider>
  );
}

const AppContent: React.FC = () => {
  const { session, loading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const isAuthPage = ['/signup', '/signin'].includes(location.pathname);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen bg-white">
      {session && !isAuthPage && <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />}
      <div className={`flex flex-col flex-1 ${!isSidebarCollapsed && session && !isAuthPage ? 'md:ml-72' : ''}`}>
        {!isAuthPage && (
          <Header
            showSidebarToggle={session ? true : false}
            onToggleSidebar={toggleSidebar}
            isSidebarCollapsed={isSidebarCollapsed}
          />
        )}
        <main className={`flex-1 overflow-auto ${isAuthPage ? 'p-0' : 'p-4'}`}>
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
              element={session ? <Cards /> : <Navigate to="/signin" state={{ from: location }} replace />}
            />
            <Route
              path="/cards/:deckId"
              element={session ? <CardsByDeck /> : <Navigate to="/signin" state={{ from: location }} replace />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
