import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  // Dummy data
  const stats = {
    today: {
      learned: 10,
      added: 22,
    },
    allTime: {
      learned: 100,
      added: 140,
    },
  };

  return (
    <div className="p-8">
      <div>
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">today</h2>
          <div className="grid grid-cols-2 gap-x-8">
            <p className="text-sm">cards learned: {stats.today.learned}</p>
            <p className="text-sm">cards added: {stats.today.added}</p>
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">all time</h2>
          <div className="grid grid-cols-2 gap-x-8">
            <p className="text-sm">cards learned: {stats.allTime.learned}</p>
            <p className="text-sm">cards added: {stats.allTime.added}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
