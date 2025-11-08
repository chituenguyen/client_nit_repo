import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import NotFound from '../pages/NotFound';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleBasedRoute from '../components/RoleBasedRoute';
import { UserRole } from '../util/authUtils';
import RoleRedirect from '../components/RoleRedirect';

// Import các pages
import CoursePage from '../pages/coursePage';
import CalendarPage from '../pages/calendarPage';
import AssignmentPage from '../pages/assignmentPage';
import BlogPage from '../pages/blogPage';
import LecturerApp from '../LecturerApp';
import LecturerCoursesPage from '../pages/LecturerCoursesPage';
import CreateCoursePage from '../pages/CreateCoursePage';


const router = createBrowserRouter([
  // Public routes (không cần đăng nhập)
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },

    // Root redirect dựa vào role
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <RoleRedirect />
      </ProtectedRoute>
    ),
  },

    // Student routes
  {
    path: '/student',
    element: (
      <ProtectedRoute>
        <RoleBasedRoute allowedRoles={[UserRole.STUDENT]}>
          <App />
        </RoleBasedRoute>
      </ProtectedRoute>
    ),
    children: [
      { path: '', element: <Navigate to="/student/courses" replace /> },
      { path: 'courses', element: <CoursePage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'assignment', element: <AssignmentPage /> },
      { path: 'blog', element: <BlogPage /> },
    ],
  },

  // Lecturer routes (đổi từ /mentor)
  {
    path: '/lecturer',  // Đổi từ /mentor
    element: (
      <ProtectedRoute>
        <RoleBasedRoute allowedRoles={[UserRole.LECTURER]}>
          <LecturerApp />
        </RoleBasedRoute>
      </ProtectedRoute>
    ),
    children: [
      { path: '', element: <div>Lecturer Dashboard (Coming soon)</div> },
      { path: 'courses', element: <LecturerCoursesPage /> },
      { path: 'courses/create', element: <CreateCoursePage /> },
      { path: 'courses/:courseId/edit', element: <CreateCoursePage /> },
      { path: 'students', element: <div>Quản lý học viên</div> },
      { path: 'analytics', element: <div>Thống kê</div> },
    ],
  },

  // 404
  {
    path: '*',
    element: <NotFound />,
  }
]);



export default router;
