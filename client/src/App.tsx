import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { KeyboardShortcutProvider } from './contexts/KeyboardShortcutContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoadingScreen from './components/LoadingScreen';

import PublicHome from './pages/PublicHome';
import ReviewSession from './pages/ReviewSession';
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

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen bg-white">
      {session && !isAuthPage && <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />}
      <div
        className={`flex flex-col flex-1 ${
          !isSidebarCollapsed && session && !isAuthPage ? 'ml-64' : ''
        } transition-all duration-300`}
      >
        {!isAuthPage && <Header showSidebarToggle={session && isSidebarCollapsed} onToggleSidebar={toggleSidebar} />}
        <main className={`flex-1 overflow-auto ${isAuthPage ? 'p-0' : ''}`}>
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
              element={session ? <ReviewSession /> : <Navigate to="/signin" state={{ from: location }} replace />}
            />
            <Route
              path="/review/:deckId"
              element={session ? <ReviewSession /> : <Navigate to="/signin" state={{ from: location }} replace />}
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
