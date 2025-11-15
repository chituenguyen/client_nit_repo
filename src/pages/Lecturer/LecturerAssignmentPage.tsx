import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { assignmentApi } from '../../api/assignmentApi';
import { courseApi } from '../../api/courseApi';
import type { Assignment, Course } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types';
import {
  MdAssignment,
  MdWarning,
  MdCheckCircle,
  MdOutlineFilterAlt,
  MdCalendarToday,
  MdSchool,
  MdTrendingUp,
} from 'react-icons/md';

type AssignmentWithCourse = Assignment & {
  course?: Course;
  status?: 'upcoming' | 'overdue' | 'completed';
};

export default function LecturerAssignmentPage() {
  const user = useAuthStore((state) => state.user);
  const isLecturer = user?.role === UserRole.LECTURER;
  const navigate = useNavigate();
  
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'dueDate' | 'created' | 'title'>('dueDate');

  // Fetch courses của lecturer hoặc student
  const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses', user?.lecturerId],
    queryFn: async () => {
      if (isLecturer && user?.lecturerId) {
        const response = await courseApi.getLecturerCourses({
          lecturerId: user.lecturerId,
          limit: 1000,
        });
        const payload = (response as any)?.data ?? response;
        return Array.isArray(payload) ? payload : 
               Array.isArray(payload?.data) ? payload.data : 
               Array.isArray(payload?.courses) ? payload.courses : [];
      }
      // TODO: Implement student courses fetch
      return [];
    },
    enabled: !!user,
  });

  const courses = (coursesData ?? []) as Course[];

  // Fetch tất cả assignments từ tất cả courses
  const [allAssignments, setAllAssignments] = useState<AssignmentWithCourse[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  useEffect(() => {
    if (courses.length === 0) return;

    let isCancelled = false;
    setIsLoadingAssignments(true);

    const fetchAllAssignments = async () => {
      try {
        const assignmentsByCoursesPromises = courses.map(async (course) => {
          try {
            const response = await assignmentApi.getAssignmentsByCourse(course.id);
            const payload = (response as any)?.data ?? response;
            const assignments: Assignment[] = Array.isArray(payload)
              ? payload
              : Array.isArray(payload?.data)
              ? payload.data
              : [];

            // Thêm thông tin course vào assignment
            return assignments.map((assignment) => ({
              ...assignment,
              course,
              status: getAssignmentStatus(assignment.dueDate),
            }));
          } catch (error) {
            console.error(`Failed to fetch assignments for course ${course.id}`, error);
            return [];
          }
        });

        const results = await Promise.all(assignmentsByCoursesPromises);
        const flattenedAssignments = results.flat();

        if (!isCancelled) {
          setAllAssignments(flattenedAssignments);
        }
      } catch (error) {
        console.error('Failed to fetch all assignments', error);
      } finally {
        if (!isCancelled) {
          setIsLoadingAssignments(false);
        }
      }
    };

    void fetchAllAssignments();

    return () => {
      isCancelled = true;
    };
  }, [courses]);

  // Xác định trạng thái assignment
  const getAssignmentStatus = (dueDate?: string): 'upcoming' | 'overdue' | 'completed' => {
    if (!dueDate) return 'upcoming';
    const now = new Date();
    const due = new Date(dueDate);
    
    if (due < now) return 'overdue';
    
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return 'upcoming';
    
    return 'completed';
  };

  // Format date
  const formatDate = (date?: string) => {
    if (!date) return '—';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed);
  };

  // Tính thống kê
  const stats = useMemo(() => {
    const total = allAssignments.length;
    const upcoming = allAssignments.filter((a) => a.status === 'upcoming').length;
    const overdue = allAssignments.filter((a) => a.status === 'overdue').length;
    const completed = allAssignments.filter((a) => a.status === 'completed').length;
    
    return { total, upcoming, overdue, completed };
  }, [allAssignments]);

  // Filter và sort assignments
  const filteredAssignments = useMemo(() => {
    let results = [...allAssignments];

    // Filter by course
    if (courseFilter !== 'ALL') {
      results = results.filter((a) => a.course?.id === courseFilter);
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      results = results.filter((a) => a.status === statusFilter);
    }

    // Sort
    results.sort((a, b) => {
      if (sortBy === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      } else if (sortBy === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return a.title.localeCompare(b.title, 'vi');
      }
    });

    return results;
  }, [allAssignments, courseFilter, statusFilter, sortBy]);

  const isLoading = isLoadingCourses || isLoadingAssignments;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-3xl p-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-color/40 bg-gradient-to-br from-primary/30 via-primary/15 to-transparent p-8 shadow-2xl shadow-primary/10 dark:border-white/10 dark:bg-gradient-to-br dark:from-white/10 dark:via-white/5">
        <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_60%)]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <MdAssignment className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold text-main lg:text-4xl">
              {isLecturer ? 'Quản lý Bài tập' : 'Bài tập của tôi'}
            </h1>
          </div>
          <p className="text-base text-secondary lg:text-lg">
            {isLecturer
              ? 'Tổng quan tất cả bài tập đã giao từ các khóa học của bạn'
              : 'Theo dõi và quản lý tất cả bài tập được giao'}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-color/40 bg-surface/80 p-6 shadow-lg dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary dark:text-gray-300">Tổng số bài tập</p>
              <p className="text-3xl font-bold text-main dark:text-white">{stats.total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <MdAssignment className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-color/40 bg-surface/80 p-6 shadow-lg dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary dark:text-gray-300">Sắp đến hạn</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.upcoming}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <MdCalendarToday className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-color/40 bg-surface/80 p-6 shadow-lg dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary dark:text-gray-300">Quá hạn</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
              <MdWarning className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-color/40 bg-surface/80 p-6 shadow-lg dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary dark:text-gray-300">Hoàn thành</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <MdCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-color/40 bg-surface/80 p-6 shadow-lg dark:border-white/10 dark:bg-white/5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="flex items-center gap-2 rounded-xl border border-color/30 bg-component/60 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-secondary dark:border-white/10 dark:bg-white/10 dark:text-gray-200">
            <MdSchool className="h-5 w-5 text-primary" />
            <span className="flex-1">
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full border-none bg-transparent text-main focus:outline-none"
              >
                <option value="ALL">Tất cả khóa học</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.courseName}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-color/30 bg-component/60 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-secondary dark:border-white/10 dark:bg-white/10 dark:text-gray-200">
            <MdOutlineFilterAlt className="h-5 w-5 text-primary" />
            <span className="flex-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border-none bg-transparent text-main focus:outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="upcoming">Sắp đến hạn</option>
                <option value="overdue">Quá hạn</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </span>
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-color/30 bg-component/60 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-secondary dark:border-white/10 dark:bg-white/10 dark:text-gray-200">
            <MdTrendingUp className="h-5 w-5 text-primary" />
            <span className="flex-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'created' | 'title')}
                className="w-full border-none bg-transparent text-main focus:outline-none"
              >
                <option value="dueDate">Theo deadline</option>
                <option value="created">Mới tạo nhất</option>
                <option value="title">Theo tên A-Z</option>
              </select>
            </span>
          </label>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary/40 bg-surface/60 p-10 text-center shadow-inner">
          <MdAssignment className="mx-auto mb-4 h-16 w-16 text-secondary" />
          <h3 className="text-xl font-semibold text-main">Chưa có bài tập nào</h3>
          <p className="mt-2 text-secondary">
            {isLecturer
              ? 'Hãy giao bài tập đầu tiên cho học viên từ trang Courses'
              : 'Bạn chưa có bài tập nào được giao'}
          </p>
          {isLecturer && (
            <button
              onClick={() => navigate('/lecturer/courses')}
              className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary/90"
            >
              Đi tới Courses
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-2xl border border-color/40 bg-surface/80 p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-start gap-3">
                    <div
                      className={`mt-1 flex h-10 w-10 items-center justify-center rounded-xl ${
                        assignment.status === 'overdue'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : assignment.status === 'upcoming'
                          ? 'bg-orange-100 dark:bg-orange-900/30'
                          : 'bg-green-100 dark:bg-green-900/30'
                      }`}
                    >
                      {assignment.status === 'overdue' ? (
                        <MdWarning className="h-5 w-5 text-red-600 dark:text-red-400" />
                      ) : assignment.status === 'upcoming' ? (
                        <MdCalendarToday className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <MdCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-main dark:text-white">
                        {assignment.title}
                      </h3>
                      <p className="mt-1 text-sm text-secondary dark:text-gray-300">
                        <span className="font-semibold">{assignment.course?.courseName}</span>
                        {' • '}
                        <span className="text-xs">{assignment.course?.courseCode}</span>
                      </p>
                    </div>
                  </div>

                  <p className="mb-3 line-clamp-2 text-sm text-secondary dark:text-gray-300">
                    {assignment.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-secondary dark:text-gray-400">
                    {assignment.dueDate && (
                      <span className="flex items-center gap-1">
                        <MdCalendarToday className="h-4 w-4" />
                        <span>Hạn nộp:</span>
                        <span className="font-semibold text-main dark:text-white">
                          {formatDate(assignment.dueDate)}
                        </span>
                      </span>
                    )}
                    {assignment.maxScore !== undefined && (
                      <span className="flex items-center gap-1">
                        <span>Điểm tối đa:</span>
                        <span className="font-semibold text-main dark:text-white">
                          {assignment.maxScore}
                        </span>
                      </span>
                    )}
                    {assignment.weekNumber !== undefined && (
                      <span className="flex items-center gap-1">
                        <span>Tuần:</span>
                        <span className="font-semibold text-main dark:text-white">
                          {assignment.weekNumber}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:flex-row">
                  {isLecturer && (
                    <button
                      onClick={() =>
                        navigate(`/lecturer/courses/${assignment.courseId}/assignments/create`)
                      }
                      className="rounded-lg border  px-4 py-2 text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 dark:border-primary/60 dark:hover:bg-primary/20"
                    >
                      Quản lý
                    </button>
                  )}
                  <button
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    onClick={() => {
                      if (isLecturer) {
                        navigate(`/lecturer/assignment/${assignment.id}`);
                      } else {
                        // TODO: Student submission page
                        alert('Nộp bài - Tính năng đang phát triển');
                      }
                    }}
                  >
                    {isLecturer ? 'Xem chi tiết' : 'Nộp bài'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}