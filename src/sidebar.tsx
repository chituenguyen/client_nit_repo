import { Link } from "react-router-dom"
import { UserRole } from './util/authUtils';
import React from 'react'
import { useAuthStore } from "./stores/authStore";

interface SidebarProps {
    currentPage: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ currentPage, isOpen, onClose }: SidebarProps) {
    const user = useAuthStore(state => state.user);
    const baseUrl = user?.role === UserRole.LECTURER ? '/lecturer' : '/student';

    const navItems = user?.role === UserRole.LECTURER 
  ? ['Courses', 'Students', 'Analytics']
  : ['Courses', 'Calendar', 'Blog'];

    return (
        <>
            {/* Overlay - Chỉ hiện trên mobile khi menu mở */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
                    role = "button"
                    tabIndex = {0}
                    aria-label = "Close sidebar"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed lg:sticky
                lg:h-fit
                top-0 left-0 h-full
                w-64 bg-surface
                flex flex-col
                transform transition-transform duration-300 ease-in-out
                z-40
                ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
            `}>
                {/* Close button - Chỉ hiện trên mobile */}
                <div className="xl:hidden flex justify-end p-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-component transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-gray-800 dark:text-white" viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                        </svg>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 pt-6 xl:pt-6">
                    <ul className="space-y-1 px-3">
                        {navItems.map((name) => { 
                            const path = `${baseUrl}/${name.toLowerCase()}`;  // ← Dùng baseUrl
                            const isActive = currentPage === path;

                            // Map icon theo tên
                            const iconMap: Record<string, React.ReactNode> = {
                                'courses': <BookIcon />,
                                'calendar': <LessonIcon />,
                                'blog': <ChallengeIcon />,
                                'students': <ProjectIcon />,
                                'analytics': <AssessmentIcon />,
                            };

                            return (
                            <li key={name}>
                                <Link 
                                    to={path} 
                                    onClick={onClose}
                                    aria-current={isActive ? "page" : undefined}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                        isActive 
                                            ? "bg-primary text-primary font-medium shadow-sm" 
                                            : " hover:bg-component"
                                    }`}
                                >
                                    <span className="text-lg">{iconMap[name.toLowerCase()] || <HomeIcon />}</span>
                                    <span className="text-sm capitalize">{name}</span>
                                </Link>
                            </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
        </>
    )
}   

// Icons components
function HomeIcon() {
    return (
        <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 13h1v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7h1c.4 0 .77-.24.92-.62.16-.37.07-.8-.22-1.09l-8.99-9a.996.996 0 0 0-1.41 0l-9.01 9c-.29.29-.37.72-.22 1.09s.52.62.92.62Z"/>
        </svg>
    )
}

function BookIcon() {
    return (
        <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H6C4.35 2 3 3.35 3 5v14c0 1.65 1.35 3 3 3h15v-2H6c-.55 0-1-.45-1-1s.45-1 1-1h14c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1m-3 9-2-1-2 1V4h4z"/>
        </svg>
    )
}

function LessonIcon() {
    return (
        <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.71 2.29A1 1 0 0 0 14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-.27-.11-.52-.29-.71zM7 7h4v2H7zm10 10H7v-2h10zm0-4H7v-2h10zm-4-4V3.5L18.5 9z"/>
        </svg>
    )
}

function AssessmentIcon() {
    return (
        <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>
    )
}

function ChallengeIcon() {
    return (
        <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z"/>
        </svg>
    )
}


function ProjectIcon() {
    return (
        <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 6h-3v3h-2v-3h-3v-2h3V7h2v3h3v2z"/>
        </svg>
    )
}
