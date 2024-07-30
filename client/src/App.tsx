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

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header />
      <div className="flex flex-1 pt-16">
        {session && <Sidebar />}
        <main className={`flex-1 overflow-auto ${session ? 'ml-64' : ''}`}>
          <Routes>
            <Route path="/" element={session ? <Home /> : <PublicHome />} />
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
