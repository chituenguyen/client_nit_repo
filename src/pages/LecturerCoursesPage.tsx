import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useDebounce } from '../hooks/useDebounce';
import {
  MdPlayLesson,
  MdEdit,
  MdAdd,
  MdSearch,
  MdOutlineFilterAlt,
  MdOutlineSort,
  MdOutlineSchedule,
} from 'react-icons/md';
import { courseApi, type Course, type CourseSchedule } from './api';
import { useAuthStore } from '../stores/authStore';

const DAY_OF_WEEK_LABELS: Record<string, string> = {
  MONDAY: 'Thứ Hai',
  TUESDAY: 'Thứ Ba',
  WEDNESDAY: 'Thứ Tư',
  THURSDAY: 'Thứ Năm',
  FRIDAY: 'Thứ Sáu',
  SATURDAY: 'Thứ Bảy',
  SUNDAY: 'Chủ Nhật',
};

const formatDayOfWeek = (day: string | undefined) => {
  if (!day) return '—';
  return DAY_OF_WEEK_LABELS[day] ?? day;
};

const PAGE_SIZE = 9;
type CoursesPageResult = {
  items: Course[];
  meta: Record<string, unknown>;
};

export default function LecturerCoursesPage() {
  const navigate = useNavigate();
  const lecturerId = useAuthStore((state) => state.user?.lecturerId);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<CoursesPageResult>({
    queryKey: ['lecturer-courses', lecturerId ?? 'unknown', debouncedSearchTerm],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === 'number' ? pageParam : 1;
      const response = await courseApi.getLecturerCourses({
        search: debouncedSearchTerm || undefined,
        page,
        limit: PAGE_SIZE,
        lecturerId: lecturerId ?? undefined,
      });

      const payload = (response as any)?.data ?? response;
      const nestedData = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.courses)
        ? payload.courses
        : [];

      const meta =
        ((payload?.meta as Record<string, unknown> | undefined) ??
          (payload?.pagination as Record<string, unknown> | undefined) ??
          (payload?.metaData as Record<string, unknown> | undefined) ??
          {}) as Record<string, unknown>;

      return {
        items: (nestedData ?? []) as Course[],
        meta,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage) {
        return undefined;
      }

      const meta = (lastPage.meta ?? {}) as Record<string, unknown>;
      const nextPageFromMeta = meta?.nextPage ?? meta?.next ?? meta?.next_page;
      if (typeof nextPageFromMeta === 'number') {
        return nextPageFromMeta;
      }

      const hasNextFlag =
        (meta?.hasNextPage ?? meta?.hasNext ?? meta?.has_more ?? meta?.hasMore) as
          | boolean
          | undefined;

      if (hasNextFlag === false) {
        return undefined;
      }

      if (hasNextFlag === true) {
        const currentPage =
          (meta?.currentPage ?? meta?.page ?? meta?.pageNumber ?? meta?.page_index) as
            | number
            | undefined;
        if (typeof currentPage === 'number') {
          return currentPage + 1;
        }
        return allPages.length + 1;
      }

      const currentPage =
        (meta?.currentPage ?? meta?.page ?? meta?.pageNumber ?? meta?.page_index) as
          | number
          | undefined;
      const totalPages =
        (meta?.totalPages ?? meta?.totalPage ?? meta?.lastPage ?? meta?.pageCount) as
          | number
          | undefined;

      if (
        typeof currentPage === 'number' &&
        typeof totalPages === 'number' &&
        currentPage < totalPages
      ) {
        return currentPage + 1;
      }

      if (lastPage.items.length < PAGE_SIZE) {
        return undefined;
      }

      return allPages.length + 1;
    },
  });

  const courses = useMemo<Course[]>(() => {
    if (!data?.pages?.length) {
      return [];
    }

    return data.pages.flatMap((page) => page.items ?? []);
  }, [data]);

  const [semesterFilter, setSemesterFilter] = useState<string>('ALL');
  const [dayFilter, setDayFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [scheduleMap, setScheduleMap] = useState<Record<string, CourseSchedule[]>>({});
  const fetchedScheduleIds = useRef<Set<string>>(new Set());
  const [hoverCourseId, setHoverCourseId] = useState<string | null>(null);
  const [hoverSide, setHoverSide] = useState<'right' | 'left'>('right');

  useEffect(() => {
    setScheduleMap({});
    fetchedScheduleIds.current.clear();
  }, [debouncedSearchTerm, lecturerId]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }
        if (!hasNextPage || isFetchingNextPage) {
          return;
        }
        void fetchNextPage();
      },
      {
        root: null,
        rootMargin: '240px 0px',
        threshold: 0,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, courses.length]);

  const semesterOptions = useMemo(() => {
    const semesters = new Set<string>();
    courses.forEach((course) => {
      const combinedSchedules = scheduleMap[course.id] ?? course.schedules ?? [];
      combinedSchedules.forEach((schedule) => {
        if (schedule.semester) {
          semesters.add(schedule.semester);
        }
      });
    });
    return Array.from(semesters);
  }, [courses, scheduleMap]);

  const dayOptions = useMemo(() => {
    const days = new Set<string>();
    courses.forEach((course) => {
      const combinedSchedules = scheduleMap[course.id] ?? course.schedules ?? [];
      combinedSchedules.forEach((schedule) => {
        if (schedule.dayOfWeek) {
          days.add(schedule.dayOfWeek);
        }
      });
    });
    return Array.from(days);
  }, [courses, scheduleMap]);

  useEffect(() => {
    const missingCourseIds = courses
      .filter((course) => !course.schedules?.length && !fetchedScheduleIds.current.has(course.id))
      .map((course) => course.id);

    if (missingCourseIds.length === 0) {
      return;
    }

    let isCancelled = false;

    const fetchSchedules = async () => {
      try {
        const results = await Promise.all(
          missingCourseIds.map(async (courseId) => {
            fetchedScheduleIds.current.add(courseId);
            try {
              const response = await courseApi.getCourseSchedules(courseId);
              const payload = (response as any)?.data ?? response;
              const schedules: CourseSchedule[] = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.data)
                ? payload.data
                : Array.isArray(payload?.schedules)
                ? payload.schedules
                : [];
              return { courseId, schedules };
            } catch (error) {
              console.error('Fetch schedules failed for course', courseId, error);
              return { courseId, schedules: [] as CourseSchedule[] };
            }
          })
        );

        if (!isCancelled) {
          setScheduleMap((prev) => {
            const updated = { ...prev };
            results.forEach(({ courseId, schedules }) => {
              updated[courseId] = schedules;
            });
            return updated;
          });
        }
      } catch (error) {
        console.error('Fetch schedules batch failed', error);
      }
    };

    void fetchSchedules();

    return () => {
      isCancelled = true;
    };
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    const normalized = courses.map((course) => ({
      ...course,
      courseName: course.courseName?.trim() ?? '',
      courseCode: course.courseCode?.trim() ?? '',
      description: course.description?.trim() ?? '',
      resolvedSchedules: scheduleMap[course.id] ?? course.schedules ?? [],
    }));

    let results = keyword
      ? normalized.filter((course) =>
          [course.courseName, course.courseCode, course.description]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(keyword))
        )
      : normalized;

    if (semesterFilter !== 'ALL') {
      results = results.filter((course) =>
        course.resolvedSchedules.some((schedule) => schedule.semester === semesterFilter)
      );
    }

    if (dayFilter !== 'ALL') {
      results = results.filter((course) =>
        course.resolvedSchedules.some((schedule) => schedule.dayOfWeek === dayFilter)
      );
    }

    results = results.sort((a, b) => {
      if (sortBy === 'name') {
        return a.courseName.localeCompare(b.courseName, 'vi', {
          sensitivity: 'base',
        });
      }

      const dateA = new Date(a.createdAt ?? '').getTime();
      const dateB = new Date(b.createdAt ?? '').getTime();

      if (sortBy === 'newest') {
        return (dateB || 0) - (dateA || 0);
      }

      return (dateA || 0) - (dateB || 0);
    });

    return results;
  }, [courses, scheduleMap, semesterFilter, dayFilter, sortBy]);

  const latestCourse = filteredCourses[0] ?? courses[0];


  const formatDate = (date?: string) => {
    if (!date) return '—';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';

    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(parsed);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg">
        <p className="font-semibold">Có lỗi xảy ra khi tải danh sách khóa học</p>
        <p className="text-sm mt-1">{(error as any)?.response?.data?.message || 'Vui lòng thử lại sau'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 rounded-3xl p-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-color/40 bg-gradient-to-br from-primary/30 via-primary/15 to-transparent p-8 shadow-2xl shadow-primary/10 dark:border-white/10 dark:bg-gradient-to-br dark:from-white/10 dark:via-white/5">
        <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_60%)]"></div>
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-main lg:text-4xl">
                Khám phá và quản lý<br className="hidden sm:block" /> hệ thống khóa học của bạn
              </h1>
              <p className="mt-3 text-base text-secondary lg:text-lg">
                Theo dõi hiệu suất, tối ưu trải nghiệm học viên và luôn sẵn sàng ra mắt khóa học mới với bảng điều khiển sinh động.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-secondary">
              <div className="inline-flex items-center gap-2 rounded-full bg-component/80 px-4 py-2 font-medium backdrop-blur text-main dark:bg-component/40 dark:text-white">
                <MdOutlineSchedule className="h-5 w-5 text-primary" />
                Cập nhật mới nhất {formatDate(latestCourse?.updatedAt || latestCourse?.createdAt)}
              </div>
            </div>
          </div>
          <Link
            to="/lecturer/courses/create"
            className="group inline-flex items-center gap-3 rounded-2xl bg-primary px-6 py-4 text-sm font-semibold uppercase tracking-widest text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:-translate-y-1 hover:bg-primary/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl transition-transform duration-300 group-hover:scale-110">
              <MdAdd />
            </span>
            Tạo khóa học mới
          </Link>
        </div>
      </div>

      

      {/* Filter Bar */}
      <div className="rounded-2xl border border-color/40 bg-surface/80 p-6 shadow-lg shadow-primary/10 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
          <div className="relative lg:col-span-5">
            <MdSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm kiếm theo tên, mã hoặc mô tả khóa học..."
              className="w-full rounded-xl border border-color/40 bg-component/60 py-3 pl-12 pr-4 text-sm text-main placeholder:text-secondary focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-gray-300"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-3">
            <label className="flex items-center gap-2 rounded-xl border border-color/30 bg-component/60 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-secondary dark:border-white/10 dark:bg-white/10 dark:text-gray-200">
              <MdOutlineFilterAlt className="h-5 w-5 text-primary" />
              <span className="flex-1">
                <select
                  value={semesterFilter}
                  onChange={(event) => setSemesterFilter(event.target.value)}
                  className="w-full border-none bg-transparent text-main focus:outline-none"
                >
                  <option value="ALL">Tất cả học kỳ</option>
                  {semesterOptions.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-color/30 bg-component/60 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-secondary dark:border-white/10 dark:bg-white/10 dark:text-gray-200">
              <MdOutlineFilterAlt className="h-5 w-5 text-primary" />
              <span className="flex-1">
                <select
                  value={dayFilter}
                  onChange={(event) => setDayFilter(event.target.value)}
                  className="w-full border-none bg-transparent text-main focus:outline-none"
                >
                  <option value="ALL">Tất cả các ngày</option>
                  {(dayOptions.length > 0 ? dayOptions : Object.keys(DAY_OF_WEEK_LABELS)).map((day) => (
                    <option key={day} value={day}>
                      {formatDayOfWeek(day)}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-color/30 bg-component/60 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-secondary dark:border-white/10 dark:bg-white/10 dark:text-gray-200">
              <MdOutlineSort className="h-5 w-5 text-primary" />
              <span className="flex-1">
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as 'newest' | 'oldest' | 'name')}
                  className="w-full border-none bg-transparent text-main focus:outline-none"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="name">Theo tên A-Z</option>
                </select>
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Courses List */}
      {courses.length === 0 ? (
        <div className="rounded-2xl border border-color/40 bg-surface/60 p-14 text-center shadow-xl shadow-primary/10 backdrop-blur">
          <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" fill="currentColor" className="mx-auto mb-6 text-secondary" viewBox="0 0 24 24">
            <path d="M20 2H6C4.35 2 3 3.35 3 5v14c0 1.65 1.35 3 3 3h15v-2H6c-.55 0-1-.45-1-1s.45-1 1-1h14c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1m-3 9-2-1-2 1V4h4z" />
          </svg>
          <h3 className="text-2xl font-semibold text-main">Chưa có khóa học nào</h3>
          <p className="mt-2 text-secondary">Khởi tạo khóa học đầu tiên để thu hút học viên đăng ký.</p>
          <Link
            to="/lecturer/courses/create"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:-translate-y-1 hover:bg-primary/90"
          >
            <MdAdd className="h-5 w-5" />
            Tạo khóa học mới
          </Link>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary/40 bg-surface/60 p-10 text-center shadow-inner shadow-primary/5 backdrop-blur">
          <h3 className="text-xl font-semibold text-main">Không tìm thấy khóa học phù hợp</h3>
          <p className="mt-2 text-secondary">Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSemesterFilter('ALL');
              setDayFilter('ALL');
              setSortBy('newest');
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-primary/40 px-4 py-2 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => {
            const mappedSchedules = scheduleMap[course.id];
            const schedules = mappedSchedules ?? course.schedules ?? [];
            const primarySchedule = schedules[0];

            return (
              <div
                key={course.id}
                className="group relative z-10 flex h-full flex-col rounded-2xl border border-color/40 bg-surface/80 shadow-xl shadow-primary/10 transition-all duration-300 hover:-translate-y-1 hover:z-50 hover:border-primary/40 hover:bg-component/80 hover:shadow-2xl hover:shadow-primary/30 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10"
                onMouseEnter={(event) => {
                  const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                  const spaceRight = window.innerWidth - rect.right;
                  const side = spaceRight < 360 ? 'left' : 'right';
                  setHoverSide(side);
                  setHoverCourseId(course.id);
                }}
                onMouseLeave={() => setHoverCourseId(null)}
              >
                {course.thumbnailUrl && (
                  <div className="relative w-full overflow-hidden aspect-[16/9] rounded-t-2xl">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.courseName}
                      className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                )}
                {!course.thumbnailUrl && (
                  <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-4 dark:from-primary/20 dark:via-primary/10">
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
                    <div className="flex items-start justify-end">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <MdPlayLesson className="h-6 w-6" />
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="text-sm text-secondary dark:text-gray-200">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-semibold text-main transition-colors duration-300">
                        {course.courseName}
                      </h3>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-secondary dark:text-gray-300">
                        {course.courseCode}
                      </p>
                    </div>
                  </div>

                  {/* Bỏ khối lịch học để card gọn hơn */}

                  <div className="mt-auto flex flex-col gap-3 border-t border-color/40 pt-3 text-sm text-secondary dark:text-gray-200 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-component/70 px-3 py-1 text-xs font-semibold text-secondary dark:bg-component/40 dark:text-gray-200">
                        ID: {course.id.slice(0, 6)}...
                      </span>
                 </div>

                 {/* Panel chi tiết khi hover (dạng popover như Udemy) */}
                 <div
                   className={`${hoverCourseId === course.id ? 'md:block' : 'md:hidden'} absolute top-0 z-50 w-80 transition-all duration-200`} 
                   style={{
                     // position outside card left/right with small gap
                     left: hoverCourseId === course.id && hoverSide === 'right' ? '100%' : 'auto',
                     right: hoverCourseId === course.id && hoverSide === 'left' ? '100%' : 'auto',
                   }}
                 >
                   <div className={`${hoverSide === 'right' ? 'ml-4' : 'mr-4'} pointer-events-auto rounded-2xl border border-color/40 bg-surface p-4 shadow-2xl ring-1 ring-black/5 dark:border-white/10 dark:bg-[#0b0b0c]`}>
                     <h4 className="line-clamp-2 text-sm font-bold text-main dark:text-white">{course.courseName}</h4>
                     <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-secondary dark:text-gray-300">{course.courseCode}</p>
                    {primarySchedule?.semester ? (
                      <h4 className="line-clamp-2 text-sm font-semibold text-main dark:text-white">{primarySchedule.semester}</h4>
                    ) : (
                      <p className="text-xs text-secondary dark:text-gray-300">Chưa thiết lập lịch học  </p>
                    )}
                     {course.description && (
                       <p className="mt-3 line-clamp-6 text-xs text-secondary dark:text-gray-300">{course.description}</p>
                     )}
                     <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-secondary dark:text-gray-300">
                       <div className="flex items-center justify-between">
                         <span>Tín chỉ</span>
                         <span className="font-semibold text-main dark:text-white">{course.credits ?? '—'}</span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span>Số học viên</span>
                         <span className="font-semibold text-main dark:text-white">{course.maxStudents ?? '—'}</span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span>Cập nhật</span>
                         <span className="font-semibold text-main dark:text-white">{formatDate(course.updatedAt || course.createdAt)}</span>
                       </div>
                     </div>
                   </div>
                 </div>
                    <div className="flex gap-2 pr-1">
                      <button
                        onClick={() => navigate(`/lecturer/courses/${course.id}/edit`)}
                        className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 sm:flex-none dark:bg-white dark:text-black dark:hover:bg-white/90"
                      >
                        <span className="inline-flex items-center gap-2">
                          <MdEdit className="h-4 w-4" />
                          Chỉnh sửa
                        </span>
                      </button>
                      <div className="flex-1">
                        <button
                          disabled
                          title="Chỉ Admin mới có quyền xóa khóa học"
                          className="w-full rounded-xl bg-component px-4 py-2 text-sm font-semibold text-secondary opacity-60"
                        >
                          Chỉ Admin
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div ref={loadMoreRef} className="h-1" aria-hidden="true" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      )}
      {!hasNextPage && courses.length > 0 && (
        <p className="text-center text-sm text-secondary">Đã hiển thị tất cả khóa học</p>
      )}
    </div>
  );
}

