import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useLogout } from "./hooks/useAuthQuery";
import { useAuthStore } from './stores/authStore';

interface HeaderProps {
  currentPage: string;
  onMenuClick: () => void;
}

export default function Header({ currentPage, onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const logoutMutation = useLogout();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const isLecturer = user?.role === 'lecturer';
  const baseUrl = isLecturer ? '/lecturer' : '/student';

  const handleLogout = async () => {
    try {
      setShowUserMenu(false);
      await logoutMutation.mutateAsync();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const navItems = ['Courses', 'Calendar', 'Blog'];

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  }

  return (
    <header className="w-full z-50 flex justify-between items-center shadow-lg px-4 md:px-10 py-3 bg-surface">
      {/* Left side: Hamburger + Logo */}
      <div className="flex items-center gap-3 md:gap-10">
        {/* Hamburger Menu Button - Chỉ hiện trên mobile */}
        <button
          type="button"
          onClick={onMenuClick}
          className="xl:hidden p-2 rounded-lg hover:bg-component transition-colors"
          aria-label="Toggle menu"
        >
          <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-main" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>

        {/* Logo */}
        <Link to={`/`} className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-primary" viewBox="0 0 24 24">
                <path d="M17.5 4.5c-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-1.45-1.1-3.55-1.5-5.5-1.5zM21 18.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
              </svg>
            </div>
            <h1 className="text-xl md:text-2xl font-bold">SkillUp</h1>
        </Link>


        <nav className="hidden xl:block">
          <ul className="flex gap-8 items-center">
            {navItems.map((item) => {
              const path = `${baseUrl}/${item.toLowerCase()}`;
              const isActive = currentPage === path;

              return (
                <li key={item}>
                  <Link 
                    to={path}
                    className={`text-base font-medium transition-colors ${
                      isActive 
                        ? 'font-semibold' 
                        : 'text-secondary hover:text-main hover:font-semibold'
                    }`}
                  >
                    {item}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Search bar - Responsive */}
      <div className="relative flex-1 max-w-xs md:max-w-md mx-2 md:mx-10">
          <input 
            type="text" 
            placeholder="Search.." 
            aria-label="Search"
            className="pl-10 pr-4 py-2 bg-background border-none rounded-lg w-full text-sm focus:outline-none"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
            <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
            </svg>
          </span>
      </div>

      {/* Right side buttons */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Dark/Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-component transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="text-main md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="text-main md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17.01c2.76 0 5.01-2.25 5.01-5.01S14.76 6.99 12 6.99 6.99 9.24 6.99 12s2.25 5.01 5.01 5.01M12 9c1.66 0 3.01 1.35 3.01 3.01s-1.35 3.01-3.01 3.01-3.01-1.35-3.01-3.01S10.34 9 12 9M13 19h-2v3h2v-3M13 2h-2v3h2V2M2 11h3v2H2zM19 11h3v2h-3zM4.22 18.36l.71.71.71.71 1.06-1.06 1.06-1.06-.71-.71-.71-.71-1.06 1.06zM19.78 5.64l-.71-.71-.71-.71-1.06 1.06-1.06 1.06.71.71.71.71 1.06-1.06zM7.76 6.34 6.7 5.28 5.64 4.22l-.71.71-.71.71L5.28 6.7l1.06 1.06.71-.71zM16.24 17.66l1.06 1.06 1.06 1.06.71-.71.71-.71-1.06-1.06-1.06-1.06-.71.71z" className="text-gray-800"></path>
            </svg>
          )}
        </button>

        {/* User Role Badge - Hidden on mobile */}
        <span className={`hidden md:inline-block px-3 py-1 rounded-full text-xs font-semibold ${
          isLecturer 
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' 
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
        }`}>
          {isLecturer ? 'Lecturer' : 'Student'}
        </span>

        {/* User Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <img
              src={user?.avatar}
              alt={user?.full_name || 'User avatar'}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-primary object-cover"
            />
            <div className="hidden lg:block text-left">
              <p className="text-sm font-semibold">
                {user?.full_name}
              </p>
              <p className="text-xs text-secondary">
                {user?.email}
              </p>
            </div>
            <svg
              className="hidden md:block w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
                aria-label = "Close menu"
              />
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20">
                {/* User Info Section */}
                <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={user?.avatar}
                      alt={user?.full_name || 'User avatar'}
                      className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-600 shadow-md object-cover"
                    />
                  <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {user?.full_name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        {user?.email}
                      </p>
                  </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    isLecturer 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {isLecturer ? 'Lecturer' : 'Student'}
                  </span>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      // Navigate to profile page (nếu có)
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-blue-600 dark:text-blue-400" role="img" aria-labelledby="svg-profile-title">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Thông tin cá nhân</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Xem và chỉnh sửa hồ sơ</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 flex items-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={logoutMutation.isLoading}
                    aria-busy={logoutMutation.isLoading}
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-red-600 dark:text-red-400" role="img" aria-labelledby="svg-logout-title">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Đăng xuất</p>
                      <p className="text-xs text-red-500/70 dark:text-red-400/70">Thoát khỏi tài khoản</p>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}