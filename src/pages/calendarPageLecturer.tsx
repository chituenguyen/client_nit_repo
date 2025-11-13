import { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useQuery } from "@tanstack/react-query";
import { courseApi } from "../api/courseApi";
import type { Course, Schedule } from "../types";
import { useAuthStore } from "../stores/authStore";
import { UserRole } from "../types";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

dayjs.extend(isoWeek);

export default function CalendarPageLecturer() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedCourse, setSelectedCourse] = useState<string>("ALL");
  const user = useAuthStore((state) => state.user);
  const isLecturer = user?.role === UserRole.LECTURER;

  const handleNextMonth = () => setCurrentDate(currentDate.add(1, "month"));
  const handlePrevMonth = () => setCurrentDate(currentDate.subtract(1, "month"));

  // Fetch courses
  const { data: coursesData } = useQuery({
    queryKey: ["courses", user?.lecturerId],
    queryFn: async () => {
      if (isLecturer && user?.lecturerId) {
        const response = await courseApi.getLecturerCourses({
          lecturerId: user.lecturerId,
          limit: 1000,
        });
        const payload = (response as any)?.data ?? response;
        return Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.courses)
          ? payload.courses
          : [];
      }
      return [];
    },
    enabled: !!user && isLecturer,
  });

  const courses = (coursesData ?? []) as Course[];

  // Fetch schedules for all courses
  const [scheduleMap, setScheduleMap] = useState<Record<string, Schedule[]>>({});

  useEffect(() => {
    if (courses.length === 0) return;

    let isCancelled = false;

    const fetchAllSchedules = async () => {
      try {
        const results = await Promise.all(
          courses.map(async (course) => {
            try {
              const response = await courseApi.getCourseSchedules(course.id);
              const payload = (response as any)?.data ?? response;
              const schedules: Schedule[] = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.data)
                ? payload.data
                : [];
              return { courseId: course.id, schedules };
            } catch (error) {
              return { courseId: course.id, schedules: [] };
            }
          })
        );

        if (!isCancelled) {
          const map: Record<string, Schedule[]> = {};
          results.forEach(({ courseId, schedules }) => {
            map[courseId] = schedules;
          });
          setScheduleMap(map);
        }
      } catch (error) {
        console.error("Failed to fetch schedules", error);
      }
    };

    void fetchAllSchedules();

    return () => {
      isCancelled = true;
    };
  }, [courses]);

  return (
    <section className="p-3 md:p-6 bg-background min-h-full">
      <CalendarHeader
        currentDate={currentDate}
        onNext={handleNextMonth}
        onPrev={handlePrevMonth}
        courses={courses}
        selectedCourse={selectedCourse}
        onCourseChange={setSelectedCourse}
      />

      <CalendarGrid
        currentDate={currentDate}
        courses={courses}
        scheduleMap={scheduleMap}
        selectedCourse={selectedCourse}
      />
    </section>
  );
}

/* === Calendar Header === */
interface CalendarHeaderProps {
  currentDate: dayjs.Dayjs;
  onNext: () => void;
  onPrev: () => void;
  courses: Course[];
  selectedCourse: string;
  onCourseChange: (courseId: string) => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onNext,
  onPrev,
  courses,
  selectedCourse,
  onCourseChange,
}) => {
  const vietnameseMonth = `tháng ${currentDate.month() + 1} ${currentDate.year()}`;

  return (
    <header className="bg-surface py-3 md:py-4 px-3 md:px-6 rounded-xl shadow-sm mb-3 md:mb-4 border border-color/20 dark:bg-white/5 dark:border-white/10">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={onPrev}
            className="p-1.5 md:p-2 rounded-lg hover:bg-component transition-colors dark:hover:bg-white/10"
            aria-label="Tháng trước"
          >
            <MdChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-main" />
          </button>
          <h2 className="text-base md:text-xl font-bold text-main dark:text-white min-w-[140px] md:min-w-[200px] text-center">
            {vietnameseMonth}
          </h2>
          <button
            onClick={onNext}
            className="p-1.5 md:p-2 rounded-lg hover:bg-component transition-colors dark:hover:bg-white/10"
            aria-label="Tháng sau"
          >
            <MdChevronRight className="h-5 w-5 md:h-6 md:w-6 text-main" />
          </button>
        </div>

        {/* Course Filter */}
        <select
          value={selectedCourse}
          onChange={(e) => onCourseChange(e.target.value)}
          className="w-full sm:w-auto bg-surface border border-color/40 rounded-lg px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-main focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-white/5 dark:border-white/10 dark:text-white"
        >
          <option value="ALL">Tất cả các khóa học</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.courseName}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}

/* === Calendar Grid === */
interface CalendarGridProps {
  currentDate: dayjs.Dayjs;
  courses: Course[];
  scheduleMap: Record<string, Schedule[]>;
  selectedCourse: string;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  courses,
  scheduleMap,
  selectedCourse,
}) => {
  const now = dayjs();
  
  // Tạo lưới tháng
  const monthData = useMemo(() => {
    const startOfMonth = currentDate.startOf("month");
    const endOfMonth = currentDate.endOf("month");
    const startDate = startOfMonth.startOf("isoWeek"); // Bắt đầu từ Thứ 2 (ISO week)
    const endDate = endOfMonth.endOf("isoWeek");

    const days: dayjs.Dayjs[] = [];
    let day = startDate;

    while (day.isBefore(endDate) || day.isSame(endDate, "day")) {
      days.push(day);
      day = day.add(1, "day");
    }

    return days;
  }, [currentDate]);

  const daysOfWeek = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  // Map dayOfWeek từ API sang số (ISO week: Monday = 1, Sunday = 7)
  const dayOfWeekMap: Record<string, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7, // ISO week: Sunday = 7, không phải 0
  };

  // Lấy schedules được filter
  const filteredSchedules = useMemo(() => {
    const allSchedules: Array<Schedule & { course: Course }> = [];
    
    Object.entries(scheduleMap).forEach(([courseId, schedules]) => {
      const course = courses.find((c) => c.id === courseId);
      if (!course) return;
      
      if (selectedCourse === "ALL" || selectedCourse === courseId) {
        schedules.forEach((schedule) => {
          allSchedules.push({ ...schedule, course });
        });
      }
    });

    return allSchedules;
  }, [scheduleMap, courses, selectedCourse]);

  // Kiểm tra xem một ngày có schedule không
  const getSchedulesForDay = (day: dayjs.Dayjs) => {
    const dayOfWeek = day.isoWeekday(); // ISO: 1 = Monday, 7 = Sunday
    
    return filteredSchedules.filter((schedule) => {
      const scheduleDayNum = dayOfWeekMap[schedule.dayOfWeek];
      
      if (scheduleDayNum !== dayOfWeek) return false;

      // Check if day is within schedule date range (inclusive)
      const startDate = dayjs(schedule.startDate);
      const endDate = dayjs(schedule.endDate);
      
      const isInRange = (day.isSame(startDate, "day") || day.isAfter(startDate, "day")) &&
                        (day.isSame(endDate, "day") || day.isBefore(endDate, "day"));
      
      return isInRange;
    });
  };

  return (
    <div className="bg-surface rounded-xl shadow-lg border border-color/20 dark:bg-white/5 dark:border-white/10 overflow-x-auto">
      {/* Header - Days of week */}
      <div className="grid grid-cols-7 border-b border-color/20 bg-component/30 dark:bg-white/5 dark:border-white/10 min-w-[640px]">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="py-2 md:py-4 text-center text-xs md:text-sm font-semibold text-secondary dark:text-gray-300 border-r border-color/20 last:border-r-0 dark:border-white/10"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 min-w-[640px]">
        {monthData.map((day) => {
          const isToday = day.isSame(now, "day");
          const isCurrentMonth = day.month() === currentDate.month();
          const daySchedules = getSchedulesForDay(day);

          return (
            <div
              key={day.toString()}
              className={`border-r border-b border-color/20 p-1.5 md:p-4 min-h-[120px] md:min-h-[180px] hover:bg-component/20 transition-colors dark:border-white/10 dark:hover:bg-white/5 ${
                !isCurrentMonth ? "bg-component/10 dark:bg-black/20" : ""
              }`}
            >
              {/* Date Number */}
              <div className="flex justify-between items-start mb-1 md:mb-3">
                <span
                  className={`text-sm md:text-lg font-bold ${
                    isToday
                      ? "flex items-center justify-center w-6 h-6 md:w-9 md:h-9 rounded-full bg-primary text-white dark:bg-white dark:text-black text-xs md:text-base"
                      : isCurrentMonth
                      ? "text-main dark:text-white"
                      : "text-secondary/50 dark:text-gray-500"
                  }`}
                >
                  {day.date()}
                </span>
              </div>

              {/* Schedules */}
              <div className="space-y-1 md:space-y-2 overflow-hidden">
                {daySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-1 md:p-2.5 rounded-md md:rounded-lg bg-orange-50 border-l-2 md:border-l-4 border-orange-500 hover:bg-orange-100 transition-colors cursor-pointer dark:bg-orange-900/20 dark:border-orange-400 dark:hover:bg-orange-900/40"
                    title={`${schedule.course.courseName}\nPhòng: ${schedule.room}\nGiờ: ${schedule.startTime} - ${schedule.endTime}`}
                  >
                    {/* Mobile: Chỉ hiển thị code + thời gian */}
                    <div className="block md:hidden">
                      <div className="font-bold text-[10px] text-main dark:text-white truncate">
                        {schedule.course.courseCode}
                      </div>
                      <div className="text-[9px] text-secondary dark:text-gray-400 truncate">
                        {schedule.startTime}
                      </div>
                    </div>
                    
                    {/* Desktop: Hiển thị đầy đủ */}
                    <div className="hidden md:block">
                      <div className="font-bold text-sm text-main dark:text-white mb-1 truncate">
                        {schedule.course.courseCode}
                      </div>
                      <div className="text-xs text-secondary dark:text-gray-400 space-y-0.5">
                        <div className="truncate">{schedule.room}</div>
                        <div className="truncate">{schedule.startTime} - {schedule.endTime}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-color/20 py-2 px-3 md:px-4 bg-component/30 text-[10px] md:text-xs text-secondary dark:bg-white/5 dark:border-white/10 dark:text-gray-400 min-w-[640px]">
        Quản lí theo dõi
      </div>
    </div>
  );
}