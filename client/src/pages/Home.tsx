import React from 'react';
import { useStats } from '../hooks/useStats';

const Home: React.FC = () => {
  const { data: stats, isLoading, isError } = useStats();

  if (isLoading) return <div>Loading stats...</div>;
  if (isError) return <div>Error loading stats</div>;

  return (
    <div className="p-8">
      <div>
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">today</h2>
          <div className="grid grid-cols-2 gap-x-8">
            <p className="text-sm">cards reviewed: {stats?.today.reviewed}</p>
            <p className="text-sm">cards added: {stats?.today.added}</p>
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">all time</h2>
          <div className="grid grid-cols-2 gap-x-8">
            <p className="text-sm">cards reviewed: {stats?.allTime.reviewed}</p>
            <p className="text-sm">cards added: {stats?.allTime.added}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
