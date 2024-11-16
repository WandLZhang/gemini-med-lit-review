// src/components/Header/Header.js
import React from 'react';
import UserMenu from './UserMenu';

const Header = ({ user, handleLogin, handleLogout, showUserMenu, setShowUserMenu }) => {
  return (
    <header className="h-16 p-4 flex justify-between items-center bg-white shadow-sm">
      <h1 className="text-xl font-semibold text-gray-800"></h1>
      <UserMenu 
        user={user}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
      />
    </header>
  );
};

export default Header;
