import { Outlet, useLocation } from 'react-router-dom';
import Header from '../../header';
import Sidebar from '../../sidebar';
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

export default function LecturerApp() {
  const location = useLocation();
  const isHome = location.pathname === '/lecturer';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = useAuthStore(state => state.user);

  return (
    <div className='font-opens flex flex-col h-full max-w-[1500px] mx-auto bg-background dark:bg-gray-900 overflow-hidden'>
      <Header 
        currentPage={location.pathname}
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      <div className='flex-1 flex overflow-hidden'>
        <Sidebar 
          currentPage={location.pathname}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        <div className="main p-4 md:p-10 flex-1 flex flex-col gap-5 overflow-y-auto">
          {isHome && (
            <section className='flex gap-2.5 rounded-lg'>
              <article>
                <h1 className="text-3xl font-bold">
                  Chào mừng Lecturer <span className='text-primary'>{user?.full_name}</span>
                </h1>
                <p className="text-base">Quản lý khóa học và học viên của bạn!</p>
              </article>
            </section>
          )}
          <Outlet />
        </div>
      </div>
    </div>
  );
}