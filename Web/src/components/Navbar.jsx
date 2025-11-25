import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = ({ onMenuClick }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-secondary-200 sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 mr-2 text-secondary-500 hover:bg-secondary-100 rounded-lg lg:hidden transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Search Bar */}
            <div className="relative w-full max-w-md hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-secondary-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm giáo viên, môn học..."
                className="block w-full pl-10 pr-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-secondary-400"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Notification Bell Component */}
            <NotificationBell />

            <div className="h-8 w-px bg-secondary-200 mx-2 hidden sm:block"></div>

            <div className="flex items-center">
              <div className="text-right mr-3 hidden sm:block">
                <p className="text-sm font-semibold text-secondary-900">Admin User</p>
                <p className="text-xs text-secondary-500">Super Admin</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20 ring-2 ring-white cursor-pointer hover:ring-primary-100 transition-all">
                <span className="font-bold text-sm">A</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

