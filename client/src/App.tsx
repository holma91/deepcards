import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ReviewSession from './components/ReviewSession';
import Header from './components/Header';
import { dummyDeck } from './DummyData';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <ProtectedRoute>
            <ReviewSession deck={dummyDeck} />
          </ProtectedRoute>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
