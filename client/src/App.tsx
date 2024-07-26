// src/App.tsx
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ReviewSession from './components/ReviewSession';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import CreateCard from './components/CreateCard';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Header from './components/Header';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

const AppContent: React.FC = () => {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {session && <Header />}
      <div className="flex pt-16">
        {' '}
        {/* Add padding-top to account for fixed header */}
        {session && <Sidebar />}
        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
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
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateCard />
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
