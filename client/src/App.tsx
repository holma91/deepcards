import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { KeyboardShortcutProvider } from './contexts/KeyboardShortcutContext';
import { useAuth } from './contexts/AuthContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Home from './pages/Home';
import PublicHome from './pages/PublicHome';
import ReviewSession from './pages/ReviewSession';
import Cards from './pages/Cards';
import Chat from './pages/Chat';
import CardsByDeck from './pages/CardsByDeck';

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
  const { session } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-white">
      {session && <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />}
      <div
        className={`flex flex-col flex-1 ${!isSidebarCollapsed && session ? 'ml-64' : ''} transition-all duration-300`}
      >
        <Header showSidebarToggle={session && isSidebarCollapsed} onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={session ? <Home /> : <PublicHome />} />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:chatId"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/review"
              element={
                <ProtectedRoute>
                  <ReviewSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/review/:deckId"
              element={
                <ProtectedRoute>
                  <ReviewSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cards"
              element={
                <ProtectedRoute>
                  <Cards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cards/:deckId"
              element={
                <ProtectedRoute>
                  <CardsByDeck />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
