// src/App.tsx
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ReviewSession from './pages/ReviewSession';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Cards from './pages/Cards';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import PublicHome from './pages/PublicHome';
import DeckCards from './pages/DeckCards';
import { KeyboardShortcutProvider } from './contexts/KeyboardShortcutContext';
import ChatPage from './pages/Chat';
import { useState } from 'react';

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
            <Route path="/chat" element={<ChatPage />} />
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
                  <DeckCards />
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
