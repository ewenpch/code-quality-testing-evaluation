import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { logout } from '../services/api';
import ThemeToggle from './ThemeToggle';

const linkClasses =
  'rounded text-sm font-medium text-content-inverted underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70';

const Navigation = ({ onLogout }) => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    logout();
    onLogout();
    navigate('/login');
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    const randomEmoji = ['👋', '😊', '🌟', '✨'][Math.floor(Math.random() * 4)];
    return `Good ${timeOfDay}, ${user.firstname || 'User'} ${randomEmoji}`;
  })();

  return (
    <nav className="bg-surface-inverted text-content-inverted">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-5">
          <Link className={linkClasses} to="/users">
            Users
          </Link>
          <Link className={linkClasses} to="/products">
            Products
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="truncate text-sm sm:text-base">{greeting}</span>
          <ThemeToggle variant="inverse" />
          <button className="btn-nav-danger" onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
