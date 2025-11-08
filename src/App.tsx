import './App.css'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './header'
import Sidebar from './sidebar'
import { useState } from 'react'
import Footer from './footer'
import { useAuthStore } from './stores/authStore'

export default function App() {
  const user = useAuthStore(state => state.user);
  const location = useLocation();
  const isHome = location.pathname === '/student';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className='font-popins flex flex-col h-full max-w-[1500px] mx-auto bg-surface'>
        
        <Header 
          currentPage={location.pathname}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className='main relative flex-1 flex flex-col overflow-x-hidden overflow-y-auto'>
          <div className='flex'>
            <Sidebar 
              currentPage={location.pathname}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />
            
            <div className="flex-1 flex flex-col gap-5 overflow-x-hidden">
                {isHome && (
                    <>
                      {/* Welcome Section */}
                      <section className='flex gap-2.5 rounded-lg'>
                          <article>
                            <h1 className="text-3xl font-bold">Welcome back <span className='text-primary'>{user?.full_name}</span></h1>
                            <p className="text-base">Explore new courses and continue your learning journey!</p>
                          </article>
                      </section> 

                      <hr  className='border-primary border-2'/>

                      {/* Overview Section */}
                      <section>
                          <h2 className='text-2xl font-semibold mb-2.5'>Overview</h2>
                          <div className='w-full flex items-center justify-between gap-5'>
                            <div className='flex-1 rounded-md bg-surface shadow-lg py-2 px-4'>
                              <h3 className='text-xl font-semibold mb-3'>Total course enrolled</h3>
                              <p>45</p>
                            </div>

                            <div className='flex-1 rounded-md bg-surface shadow-lg py-2 px-4'>
                              <h3 className='text-xl font-semibold mb-3'>Completed</h3>
                              <p>100%</p>
                            </div>

                            <div className='flex-1 rounded-md bg-surface shadow-lg py-2 px-4'>
                              <h3 className='text-xl font-semibold mb-3'>Score</h3>
                              <p>100</p>
                            </div>
                          </div>
                      </section>

                    </>
                )}
                <Outlet />
            </div>
          </div>
          <Footer/>
        </div>
    </div>
  )
}