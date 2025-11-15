import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import NotFound from '../pages/NotFound';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleBasedRoute from '../components/RoleBasedRoute';
import { UserRole } from '../types';
import RoleRedirect from '../components/RoleRedirect';

// Import các pages cho Student
import CoursePage from '../pages/Student/StudentCoursePage';
import CourseDetail from '../pages/Student/StudentCourseDetail';
import CalendarPage from '../pages/Student/StudentCalendarPage';
import AssignmentPage from '../pages/Student/StudentAssignmentPage';
import BlogPage from '../pages/Student/StudentBlogPage';

// Import các pages cho Lecturer
import LecturerApp from '../LecturerApp';
import LecturerCoursesPage from '../pages/Lecturer/LecturerCoursesPage';
import CalendarPageLecturer from '../pages/Lecturer/LecturerCalendarPage';
import CreateCoursePage from '../pages/Lecturer/CreateCoursePage';
import CreateAssignmentPage from '../pages/Lecturer/CreateAssignmentPage';
import LecturerAssignmentPage from '../pages/Lecturer/LecturerAssignmentPage';
import AssignmentDetailPage from '../pages/Lecturer/AssignmentDetailPage';


const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },

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
      { path: 'courses/:id', element: <CourseDetail /> },
      { path: 'courses/:id/assignments', element: <AssignmentPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'blog', element: <BlogPage /> },
    ],
  },

  // Lecturer routes
  {
    path: '/lecturer',
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
      { path: 'courses/:courseId/assignments/create', element: <CreateAssignmentPage /> },
      { path: 'assignment', element: <LecturerAssignmentPage /> },
      { path: 'assignment/:assignmentId', element: <AssignmentDetailPage /> },
      { path: 'calendar', element: <CalendarPageLecturer /> },
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