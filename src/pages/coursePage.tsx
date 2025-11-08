import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiErrorCircle, BiSearch } from 'react-icons/bi';
import { MdPlayLesson } from 'react-icons/md';
import { PiUsersThreeFill } from 'react-icons/pi';
import { FaClock } from "react-icons/fa";
import { FaCalendarAlt } from "react-icons/fa";
import { GrSchedules } from "react-icons/gr";
import { useMyEnrollments } from '../hooks/useCourseQuery';
import { useCourseStore } from '../stores/courseStore';
import { useAuthStore } from '../stores/authStore';
import { courseApi, type Course } from '../api/courseApi';
import { AxiosError } from 'axios';

interface FetchCoursesResult {
  courses: Course[];
  nextPage?: number;
}

export default function CurrentCourse() {
  return (
    <section className="p-4 lg:flex-1 lg:flex lg:gap-8">
      <div className="space-y-8 flex-1">
        <UpcomingCourse />
        <div className="block lg:hidden">
          <InstructorList />
        </div>
        <EnrolledCourses />
        <AllCourses />
      </div>
      <div className="hidden lg:block">
        <InstructorList />
      </div>
    </section>
  );
}

/* === Upcoming Courses === */
function UpcomingCourse() {
  const upcomingCourses = [
    {
      id: 11,
      title: "Advanced Next.js & Server Components",
      instructor: "Vercel Academy",
      lessons: 9,
      thumbnail: "https://i.ytimg.com/vi/8aGhZQkoFbQ/maxresdefault.jpg",
    },
    {
      id: 12,
      title: "UI/UX Principles for Developers",
      instructor: "DesignCourse",
      lessons: 8,
      thumbnail: "https://i.ytimg.com/vi/3t8yG39vwOs/maxresdefault.jpg",
    },
    {
      id: 13,
      title: "Deploying Apps with Docker & AWS",
      instructor: "TechWorld with Nana",
      lessons: 12,
      thumbnail: "https://i.ytimg.com/vi/9zUHg7xjIqQ/maxresdefault.jpg",
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2.5 text-main">Upcoming Courses</h2>
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-3">
        {upcomingCourses.map((course) => (
          <div
            key={course.id}
            className="bg-background rounded-md shadow-sm overflow-hidden hover:shadow-md"
          >
            <img
              loading="lazy"
              className="w-full relative aspect-video object-cover"
              src={course.thumbnail}
              alt={`${course.title} thumbnail`}
            />

            <article className="px-4 pt-3 pb-4 space-y-2">
              <h3 className="text-lg font-semibold truncate text-main">{course.title}</h3>
              <p className="font-semibold text-secondary">{course.instructor}</p>
              <p className="text-sm text-secondary">{course.lessons} lessons</p>
              <button
                type="button"
                className="mt-2 w-full bg-primary text-primary font-medium py-1.5 rounded-md"
              >
                Pre-register
              </button>
            </article>
          </div>
        ))}
      </div>
    </div>
  );
}

/* === Enrolled Courses === */
function EnrolledCourses() {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const { isLoading, error, refetch } = useMyEnrollments('ENROLLED');
  const enrollments = useCourseStore((s) => s.enrollments) || [];

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2.5 text-main">Recent Enrolled Courses</h2>
        <div className="text-center py-8">
          <AiOutlineLoading3Quarters className="animate-spin inline-block text-3xl mb-2 text-main" />
          <p className="text-secondary">Loading enrolled courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load enrolled courses';
    
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2.5 text-main">Recent Enrolled Courses</h2>
        <div className="bg-surface border border-color rounded-lg p-6 text-center">
          <BiErrorCircle className="inline-block text-4xl mb-2" style={{ color: 'var(--color-danger)' }} />
          <p className="text-secondary mb-3">{errorMessage}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg transition-colors text-sm text-white font-medium"
            style={{ backgroundColor: 'var(--color-danger)' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2.5 text-main">Recent Enrolled Courses</h2>
        <div className="bg-surface border border-color rounded-lg p-8 text-center">
          <div className="text-5xl mb-3" style={{ color: 'var(--color-info)' }}>📚</div>
          <h3 className="text-lg font-semibold text-main mb-2">
            No enrolled courses yet
          </h3>
          <p className="text-secondary mb-4">
            Start learning by enrolling in courses from the available courses section below.
          </p>
        </div>
      </div>
    );
  }

  const displayedEnrollments = showAll ? enrollments : enrollments.slice(0, 4);

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-2xl font-bold text-main">Recent Enrolled Courses</h2>
        {enrollments.length > 4 && (
          <button
            type="button"
            aria-expanded={showAll}
            aria-controls="enrolled-courses-list"
            onClick={() => setShowAll(!showAll)}
            className="hover:underline text-main"
          >
            {showAll ? "See Less" : "See All"}
          </button>
        )}
      </div>

      <div
        id="enrolled-courses-list"
        className="flex flex-col gap-5 lg:grid lg:grid-cols-2"
      >
        {displayedEnrollments.map((enrollment) => {
          const course = enrollment.schedule.course;
          const schedule = enrollment.schedule;

          return (
            <div
              key={enrollment.id}
              className="bg-background flex gap-5 rounded-md shadow-md overflow-hidden hover:shadow-lg cursor-pointer"
              onClick={() => navigate(`/student/courses/${course.id}`)}
            >
              <img
                loading="lazy"
                className="h-28 object-cover aspect-square"
                src={course.thumbnailUrl || `https://picsum.photos/seed/${course.courseCode}/200/200`}
                alt={`${course.courseName} thumbnail`}
              />

              <article className="flex-1 flex flex-col justify-evenly">
                <h3 className="font-semibold line-clamp-1 text-main">{course.courseName}</h3>
                
                <p className="font-semibold text-secondary text-sm">{course.lecturer.user.fullName}</p>

                <div className="flex items-center gap-5 text-xs text-main">
                  <span className='flex items-center gap-1'><FaCalendarAlt className='w-4 h-4'/> {schedule.dayOfWeek}</span>
                  <span className='flex items-center gap-1'><FaClock className='w-4 h-4'/> {schedule.startTime} - {schedule.endTime}</span>
                </div>

                <p className="text-secondary text-xs">Room: {schedule.room}</p>
              </article>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* === Available Courses with Infinite Scroll === */
function AllCourses() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const pageLimit = 3;
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = !!user;
  const isStudent = user?.role === 'student';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCourses = async ({ pageParam = 1 }): Promise<FetchCoursesResult> => {
    const response = await courseApi.getCourses({
      search: debouncedSearch,
      page: pageParam,
      limit: pageLimit,
    });

    let courses: Course[] = [];
    
    if (response.data?.data) {
      if (Array.isArray(response.data.data)) {
        courses = response.data.data;
      } else if ('items' in response.data.data && Array.isArray(response.data.data.items)) {
        courses = response.data.data.items;
      }
    } else if (Array.isArray(response.data)) {
      courses = response.data;
    }

    return {
      courses,
      nextPage: courses.length === pageLimit ? pageParam + 1 : undefined,
    };
  };

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['courses-infinite', debouncedSearch],
    queryFn: fetchCourses,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const allCourses = data?.pages.flatMap((page) => page.courses) ?? [];

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDebouncedSearch(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const handleViewDetails = (id: string) => {
    navigate(`/student/courses/${encodeURIComponent(id)}`);
  };

  return (
    <section className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-main">All Courses</h2>
        
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-xl" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-main placeholder:text-secondary"
            />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2.5 bg-component text-main rounded-lg hover:opacity-80 transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Loading State (Initial) - Skeleton Cards */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-background border border-color rounded-xl shadow-sm overflow-hidden flex flex-col animate-pulse"
            >
              <div className="aspect-video bg-component"></div>
              <div className="pt-4 px-5 flex flex-col flex-1">
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-component rounded w-3/4"></div>
                  <div className="h-6 bg-component rounded w-1/2"></div>
                  <div className="h-4 bg-component rounded w-2/3"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-component rounded w-full"></div>
                    <div className="h-3 bg-component rounded w-5/6"></div>
                  </div>
                </div>
                <div className="space-y-3 py-5 border-t border-color mt-4">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-component rounded w-16"></div>
                    <div className="h-4 bg-component rounded w-16"></div>
                    <div className="h-4 bg-component rounded w-16"></div>
                  </div>
                  <div className="h-10 bg-component rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-surface border border-color rounded-xl p-8 text-center">
          <BiErrorCircle className="inline-block text-5xl mb-4" style={{ color: 'var(--color-danger)' }} />
          <h3 className="text-lg font-semibold mb-2 text-main">
            Failed to load courses
          </h3>
          <p className="text-secondary mb-4">
            {error instanceof AxiosError 
              ? (error.response?.data?.message || error.message) 
              : error instanceof Error 
              ? error.message 
              : 'An error occurred'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2.5 rounded-lg transition-colors font-medium text-white"
            style={{ backgroundColor: 'var(--color-danger)' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && allCourses.length === 0 && (
        <div className="text-center py-16">
          <div className="text-7xl mb-4" style={{ color: 'var(--color-info)' }}>📚</div>
          <h3 className="text-xl font-semibold text-main mb-2">
            No courses found
          </h3>
          <p className="text-secondary mb-6">
            {searchQuery 
              ? `No results for "${searchQuery}". Try a different search term.`
              : 'There are no courses available at the moment.'}
          </p>
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="px-6 py-2.5 bg-component text-main rounded-lg hover:opacity-80 transition-colors font-medium"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Course Grid */}
      {!isLoading && !isError && allCourses.length > 0 && (
        <>
          {!isStudent && isAuthenticated && (
            <div className="flex items-center justify-between">
              <span className="text-xs px-3 py-1 rounded-full" style={{ 
                color: 'var(--color-warning)', 
                backgroundColor: 'rgba(234, 179, 8, 0.1)' 
              }}>
                ℹ️ Only students can enroll in courses
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCourses.map((course) => {
              const totalEnrolled = course.schedules?.reduce(
                (sum, schedule) => sum + (schedule._count?.enrollments ?? 0), 
                0
              ) ?? 0;
              
              const isFull = totalEnrolled >= course.maxStudents;
              
              const scheduleCount = Array.isArray(course.schedules) 
                ? course.schedules.length 
                : (course._count?.schedules ?? 0);

              return (
                <div
                  key={course.courseCode}
                  className="bg-background border border-color rounded-xl shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div 
                    className="relative aspect-video bg-surface cursor-pointer"
                    onClick={() => handleViewDetails(course.id)}
                  >
                    <img
                      src={course.thumbnailUrl || `https://picsum.photos/seed/${course.courseCode}/640/360`}
                      alt={course.courseName}
                      className="absolute w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    
                    <span className="absolute top-3 left-3 px-3 py-1 text-xs font-bold rounded-full text-white shadow-lg" style={{ backgroundColor: 'var(--color-normal)' }}>
                      {course.courseCode}
                    </span>

                    {isFull && (
                      <span className="absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-full text-white shadow-lg" style={{ backgroundColor: 'var(--color-danger)' }}>
                        FULL
                      </span>
                    )}
                  </div>

                  <div className="pt-4 px-5 flex flex-col flex-1">
                    <div className="flex-1">
                      <h3 
                        className="font-bold text-lg line-clamp-2 mb-2 cursor-pointer hover:text-main transition-colors text-main"
                        title={course.courseName}
                        onClick={() => handleViewDetails(course.id)}
                      >
                        {course.courseName}
                      </h3>
                      
                      {course.lecturer?.user?.fullName && (
                        <p className="text-xs text-secondary mb-2 flex items-center">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></span>
                          {course.lecturer.user.fullName}
                          {course.lecturer.title && ` • ${course.lecturer.title}`}
                        </p>
                      )}
                      
                      <p 
                        className="text-sm text-secondary line-clamp-2 mb-4"
                        title={course.description || undefined}
                      >
                        {course.description || "No description available."}
                      </p>
                    </div>

                    <div className="space-y-3 py-5 border-t border-color">
                      <div className="flex items-center justify-between text-sm text-main">
                        <div className="flex items-center">
                          <MdPlayLesson className="w-5 h-5 mr-1.5" />
                          <span className="font-medium">{course.credits}</span>
                          <span className="ml-1">tín chỉ</span>
                        </div>

                        <div className='flex items-center justify-between text-sm'>
                          <GrSchedules className="w-5 h-5 mr-1.5" />
                          <span className="font-medium">{scheduleCount}</span>
                          <span className="ml-1">lịch học</span>
                        </div>

                        <div 
                          className="flex items-center"
                          style={{ color: isFull ? 'var(--color-danger)' : 'inherit' }}
                          title="Current/Maximum students"
                        >
                          <PiUsersThreeFill className="w-5 h-5 mr-1.5" />
                          <span className="font-medium">{course.maxStudents}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(course.id)}
                          className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary font-medium text-sm hover:opacity-90 transition-opacity"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {isFetchingNextPage && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-background border border-color rounded-xl shadow-sm overflow-hidden flex flex-col animate-pulse"
                >
                  <div className="aspect-video bg-component"></div>
                  <div className="pt-4 px-5 flex flex-col flex-1">
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-component rounded w-3/4"></div>
                      <div className="h-6 bg-component rounded w-1/2"></div>
                      <div className="h-4 bg-component rounded w-2/3"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-component rounded w-full"></div>
                        <div className="h-3 bg-component rounded w-5/6"></div>
                      </div>
                    </div>
                    <div className="space-y-3 py-5 border-t border-color mt-4">
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-component rounded w-16"></div>
                        <div className="h-4 bg-component rounded w-16"></div>
                        <div className="h-4 bg-component rounded w-16"></div>
                      </div>
                      <div className="h-10 bg-component rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div ref={observerTarget} className="h-4" />

          {!hasNextPage && allCourses.length > 0 && (
            <div className="text-center py-6 text-secondary text-sm border-t border-color">
              <p>🎓 You've reached the end of the course list</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function InstructorList() {
  const instructors = [
    {
      id: 1,
      name: "John Smith",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
      expertise: ["React", "JavaScript"],
      rating: 4.8,
    },
    {
      id: 2,
      name: "Anna Lee",
      avatar: "https://randomuser.me/api/portraits/women/55.jpg",
      expertise: ["Firebase", "Node.js"],
      rating: 4.6,
    },
    {
      id: 3,
      name: "Kevin Powell",
      avatar: "https://randomuser.me/api/portraits/men/60.jpg",
      expertise: ["CSS", "UI Design"],
      rating: 4.9,
    },
    {
      id: 4,
      name: "Ben Awad",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
      expertise: ["Next.js", "GraphQL"],
      rating: 4.7,
    },
    {
      id: 5,
      name: "Jack Herrington",
      avatar: "https://randomuser.me/api/portraits/men/68.jpg",
      expertise: ["TypeScript", "React"],
      rating: 4.9,
    },
  ];

  return (
    <aside className="lg:h-full text-xs lg:text-sm">
      <h2 className="font-semibold text-xl mb-2.5 text-main">Instructors</h2>
      <ul className="flex gap-2 overflow-auto lg:block bg-background shadow-lg rounded-md">
        {instructors.map((ins) => (
          <li key={ins.id} className="w-1/2 items-center hover:bg-component flex-shrink-0 flex gap-2 px-2 py-1 lg:px-4 lg:py-2 lg:w-full transition-colors">
            <img
              loading="lazy"
              src={ins.avatar}
              alt={ins.name}
              className="h-14 aspect-square rounded-full"
            />
            <article className="instructor-info flex flex-col lg:justify-between">
              <h4 className="instructor-name text-main">{ins.name}</h4>
              <p className="instructor-expertise text-secondary">
                {ins.expertise.join(", ")}
              </p>
              <span className="instructor-rating text-secondary">⭐ {ins.rating}</span>
            </article>
          </li>
        ))}
      </ul>
    </aside>
  );
}