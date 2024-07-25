import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome to FlashCard App</h1>
      <div>
        <Link to="/review" className="text-blue-600 hover:underline">
          Start Reviewing
        </Link>
      </div>
      <div>
        <Link to="/create" className="text-blue-600 hover:underline">
          Your cards
        </Link>
      </div>
    </div>
  );
};

export default Home;
