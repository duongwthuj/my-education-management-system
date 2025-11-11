import React from 'react';
import { Menu, Search } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = ({ onMenuClick }) => {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="text-gray-500 focus:outline-none focus:text-gray-700 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="relative ml-4 lg:ml-0">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Search className="w-5 h-5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 w-64"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell Component */}
            <NotificationBell />

            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-2">Admin</span>
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                A
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
