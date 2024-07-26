// src/components/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-16 left-0 bg-gray-50 h-[calc(100vh-4rem)] w-64 overflow-y-auto">
      <ul className="mt-6">
        {[
          { path: '/', label: 'Dashboard' },
          { path: '/review', label: 'Review' },
          { path: '/create', label: 'New Cards' },
        ].map(({ path, label }) => (
          <li key={path}>
            <Link
              to={path}
              className={`block py-3 px-6 ${
                isActive(path)
                  ? 'bg-gray-200 font-semibold'
                  : 'hover:bg-gray-100'
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;
