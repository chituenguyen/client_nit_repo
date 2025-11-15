import { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BiErrorCircle } from "react-icons/bi";
import { MdAssignment } from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa";
import { useMyEnrollments } from "../hooks/useCourseQuery";
import { useQuery } from "@tanstack/react-query";
import assignmentApi from "../api/assignmentApi";
import { useAllMySubmissions } from "../hooks/useAssignmentQuery";
import type { CalendarView } from "../types";
import type { Assignment } from "../types";

dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface CalendarTask {
  id: string;
  title: string;
  room?: string;
  startTime: string;
  endTime: string;
  type: 'schedule' | 'assignment';
  courseCode?: string;
  isSubmitted?: boolean; // Thêm field này
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [view, setView] = useState<CalendarView>("Week");

  useEffect(() => {
    const checkSize = () => {
      if (window.innerWidth < 1024) {
        setView("Day");
      } else {
        setView("Week");
      }
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const handleNext = () => {
    const unit = view === "Week" ? "week" : "day";
    setCurrentDate(currentDate.add(1, unit));
  };

  const handlePrev = () => {
    const unit = view === "Week" ? "week" : "day";
    setCurrentDate(currentDate.subtract(1, unit));
  };

  const handleMonthChange = (month: number) => {
    setCurrentDate(currentDate.month(month));
  };

  return (
    <section className="flex flex-col p-4 h-full bg-surface">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        setView={setView}
        onNext={handleNext}
        onPrev={handlePrev}
        onMonthChange={handleMonthChange}
      />
      <CalendarGrid currentDate={currentDate} view={view} />
    </section>
  );
}

interface CalendarHeaderProps {
  currentDate: dayjs.Dayjs;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  onNext: () => void;
  onPrev: () => void;
  onMonthChange: (month: number) => void;
}

type CalendarDateProps = {
  currentDate: dayjs.Dayjs;
  view: CalendarView;
};

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  view,
  setView,
  onNext,
  onPrev,
  onMonthChange,
}) => {
  const range = useMemo(() => {
    if (view === "Week") {
      const startOfWeek = currentDate.startOf("isoWeek");
      const endOfWeek = startOfWeek.add(6, "day");
      if (startOfWeek.month() !== endOfWeek.month()) {
        return `${startOfWeek.format("D MMM")} — ${endOfWeek.format("D MMM, YYYY")}`;
      }
      return `${startOfWeek.format("D")} — ${endOfWeek.format("D, MMM YYYY")}`;
    }
    return currentDate.format("D MMMM, YYYY");
  }, [currentDate, view]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <header className="flex flex-col sm:flex-row justify-between items-center bg-background py-3 px-4 rounded-md shadow-lg mb-2 gap-3">
      <div className="flex items-center gap-2">
        <button onClick={onPrev} className="px-2 py-1 bg-surface rounded hover:bg-component transition-colors">{'<'}</button>
        <button onClick={onNext} className="px-2 py-1 bg-surface rounded hover:bg-component transition-colors">{'>'}</button>

        <div className="flex items-center gap-2 ml-2">
          <select
            value={currentDate.month()}
            onChange={(e) => onMonthChange(parseInt(e.target.value))}
            className="bg-surface border border-color rounded-md px-2 py-1 text-sm text-main"
          >
            {months.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <h2 className="text-lg font-semibold whitespace-nowrap text-main">{range}</h2>
        </div>
      </div>

      <div className="space-x-2">
        {(["Day", "Week", "Month"] as CalendarView[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            disabled={v === "Month"}
            className={`px-3 py-1 border border-color rounded transition-colors
              ${view === v ? "bg-primary text-primary" : "hover:bg-component"}
              ${v === "Month" ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {v}
          </button>
        ))}
      </div>
    </header>
  );
};

const CalendarGrid: React.FC<CalendarDateProps> = ({ currentDate, view }) => {
  const HEADER_HEIGHT = 60;
  const now = dayjs();

  const { 
    data: enrollments, 
    isLoading: enrollmentsLoading, 
    error: enrollmentsError 
  } = useMyEnrollments('ENROLLED');

  // Lấy tất cả submissions
  const { data: allSubmissions } = useAllMySubmissions();

  // Lấy tất cả assignments từ các courses đã enroll
  const enrolledCourseIds = useMemo(() => {
    if (!enrollments) return [];
    return enrollments.map(e => e.schedule.course.id);
  }, [enrollments]);

  const { data: allAssignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['calendar-assignments', enrolledCourseIds],
    queryFn: async () => {
      if (enrolledCourseIds.length === 0) return [];
      
      const assignmentsPromises = enrolledCourseIds.map(courseId =>
        assignmentApi.getAssignmentsByCourse(courseId)
          .then(res => ({
            courseId,
            assignments: Array.isArray(res.data?.data) ? res.data.data : []
          }))
          .catch(() => ({ courseId, assignments: [] }))
      );

      const results = await Promise.all(assignmentsPromises);
      return results.flatMap(r => 
        r.assignments.map((a: Assignment) => ({
          ...a,
          courseId: r.courseId
        }))
      );
    },
    enabled: enrolledCourseIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const daysToDisplay = useMemo(() => {
    if (view === "Week") {
      const startOfWeek = currentDate.startOf("isoWeek");
      return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, "day"));
    }
    return [currentDate];
  }, [currentDate, view]);

  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

  const tasks = useMemo(() => {
    const dayMap: { [key: string]: number } = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 7,
    };

    const scheduleTasks: CalendarTask[] = [];
    const assignmentTasks: CalendarTask[] = [];

    // Schedule tasks (code cũ)
    if (enrollments) {
      const startOfWeek = currentDate.startOf("isoWeek");

      if (view === 'Week') {
        enrollments.forEach(enroll => {
          const { schedule } = enroll;
          const { course } = schedule;

          if (!schedule.startDate || !schedule.endDate) return;
          
          const courseStart = dayjs(schedule.startDate);
          const courseEnd = dayjs(schedule.endDate);

          const dayIndex = dayMap[schedule.dayOfWeek.toUpperCase()] || 1;
          const scheduleDate = startOfWeek.isoWeekday(dayIndex);

          const isWithinRange = 
            scheduleDate.isSameOrAfter(courseStart, 'day') &&
            scheduleDate.isSameOrBefore(courseEnd, 'day');

          if (isWithinRange) {
            const [startHour, startMin] = schedule.startTime.split(':').map(Number);
            const [endHour, endMin] = schedule.endTime.split(':').map(Number);

            const startTimeIso = scheduleDate.hour(startHour).minute(startMin).second(0).toISOString();
            const endTimeIso = scheduleDate.hour(endHour).minute(endMin).second(0).toISOString();

            scheduleTasks.push({
              id: `schedule-${enroll.id}`,
              title: course.courseName,
              room: schedule.room,
              startTime: startTimeIso,
              endTime: endTimeIso,
              type: 'schedule',
              courseCode: course.courseCode,
            });
          }
        });
      } else {
        const currentDayOfWeek = currentDate.isoWeekday();
        const currentDayString = Object.keys(dayMap).find(key => dayMap[key] === currentDayOfWeek);

        enrollments
          .filter(enroll => {
            const { schedule } = enroll;
            const isCorrectDay = schedule.dayOfWeek.toUpperCase() === currentDayString;
            if (!isCorrectDay) return false;

            if (!schedule.startDate || !schedule.endDate) return false;
            
            const courseStart = dayjs(schedule.startDate);
            const courseEnd = dayjs(schedule.endDate);

            return currentDate.isSameOrAfter(courseStart, 'day') &&
                   currentDate.isSameOrBefore(courseEnd, 'day');
          })
          .forEach(enroll => {
            const { schedule } = enroll;
            const { course } = schedule;
            
            const [startHour, startMin] = schedule.startTime.split(':').map(Number);
            const [endHour, endMin] = schedule.endTime.split(':').map(Number);
            
            const startTimeIso = currentDate.hour(startHour).minute(startMin).second(0).toISOString();
            const endTimeIso = currentDate.hour(endHour).minute(endMin).second(0).toISOString();
            
            scheduleTasks.push({
              id: `schedule-${enroll.id}`,
              title: course.courseName,
              room: schedule.room,
              startTime: startTimeIso,
              endTime: endTimeIso,
              type: 'schedule',
              courseCode: course.courseCode,
            });
          });
      }
    }

    // Assignment tasks (CẢI TIẾN: check submitted status)
    if (allAssignments && allAssignments.length > 0) {
      allAssignments.forEach((assignment: Assignment & { courseId: string }) => {
        const dueDate = dayjs(assignment.dueDate);
        
        const isInRange = view === 'Week'
          ? dueDate.isSameOrAfter(currentDate.startOf('isoWeek')) &&
            dueDate.isSameOrBefore(currentDate.startOf('isoWeek').add(6, 'day'))
          : dueDate.isSame(currentDate, 'day');

        if (isInRange) {
          const enrollment = enrollments?.find(e => e.schedule.course.id === assignment.courseId);
          const courseCode = enrollment?.schedule.course.courseCode;

          // ✅ CHECK XEM ĐÃ NỘP CHƯA
          const isSubmitted = allSubmissions?.some(
            sub => sub.assignmentId === assignment.id
          );

          const startTimeIso = dueDate.hour(23).minute(30).second(0).toISOString();
          const endTimeIso = dueDate.hour(23).minute(59).second(0).toISOString();

          assignmentTasks.push({
            id: `assignment-${assignment.id}`,
            title: `📝 ${assignment.title}`,
            startTime: startTimeIso,
            endTime: endTimeIso,
            type: 'assignment',
            courseCode: courseCode,
            isSubmitted: isSubmitted, // ✅ THÊM FIELD NÀY
          });
        }
      });
    }

    return [...scheduleTasks, ...assignmentTasks];
  }, [enrollments, allAssignments, allSubmissions, currentDate, view]);

  const currentMinutes = now.hour() * 60 + now.minute();
  const isVisibleWeek = view === 'Week' && now.isAfter(currentDate.startOf('isoWeek')) && now.isBefore(currentDate.startOf('isoWeek').add(7, 'day'));
  const isVisibleDay = view === 'Day' && currentDate.isSame(now, 'day');
  
  const isLoading = enrollmentsLoading || assignmentsLoading;
  const error = enrollmentsError;

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center bg-background rounded-md shadow-lg">
        <AiOutlineLoading3Quarters className="animate-spin text-2xl text-main" />
        <span className="ml-2 text-main">Loading schedule...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-surface rounded-md shadow-sm p-4">
        <BiErrorCircle className="text-4xl" style={{ color: 'var(--color-danger)' }} />
        <span className="mt-2 font-semibold text-main">Failed to load schedule</span>
        <p className="text-sm text-secondary">{(error as Error).message || "Please try again later."}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-y-auto rounded-md shadow-sm">
      <div className="w-fit flex-shrink-0 border-r border-color text-xs sticky left-0 z-10">
        <div style={{ height: HEADER_HEIGHT }} />
        {hours.map((hour) => (
          <div key={hour} className="h-[60px] text-right pr-1 pt-1 border-t border-color text-secondary">{hour}</div>
        ))}
      </div>

      <div className="flex flex-1 relative overflow-x-auto">
        {daysToDisplay.map((day) => {
          const isToday = day.isSame(now, "day");
          
          return (
            <div
              key={day.toString()}
              className={`flex-1 border-r border-color relative min-w-full lg:min-w-0 transition-colors ${
                isToday ? 'bg-primary/5' : ''
              }`}
              style={{ flexBasis: view === 'Week' ? `${100/7}%` : '100%' }}
            >
              <div 
                className={`border-b text-center py-2 sticky top-0 z-10 transition-all ${
                  isToday 
                    ? 'bg-primary text-primary shadow-md' 
                    : ''
                }`} 
                style={{ height: HEADER_HEIGHT }}
              >
                <div className={`font-medium text-sm ${isToday ? 'font-bold' : ''}`}>
                  {day.format("ddd")}
                </div>
                <div className={`text-xl ${isToday ? 'font-extrabold' : 'font-normal'}`}>
                  {day.format("D")}
                </div>
              </div>

              {hours.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-[60px] border-b border-color hover:bg-component transition-colors`} 
                />
              ))}

              {tasks
                .filter((task) => dayjs(task.startTime).isSame(day, "day"))
                .map((task) => {
                  const start = dayjs(task.startTime);
                  const end = dayjs(task.endTime);
                  const top = HEADER_HEIGHT + start.hour() * 60 + start.minute();
                  const duration = end.diff(start, "minute");
                  const height = Math.max(duration, 45);

                  const isAssignment = task.type === 'assignment';
                  const isSubmitted = task.isSubmitted;

                  // ✅ XÁC ĐỊNH MÀU DỰA TRÊN TRẠNG THÁI
                  const getTaskColors = () => {
                    if (isAssignment) {
                      if (isSubmitted) {
                        return {
                          bg: 'var(--color-success-light)',
                          border: 'var(--color-success)',
                        };
                      }
                      return {
                        bg: 'var(--color-warning)',
                        border: 'var(--color-danger)',
                      };
                    }
                    return {
                      bg: 'var(--color-background)',
                      border: 'var(--color-normal)',
                    };
                  };

                  const colors = getTaskColors();

                  return (
                    <div
                      key={task.id}
                      className={`absolute left-1 right-1 rounded p-2 text-sm overflow-hidden flex flex-col transition-all ${
                        isToday 
                          ? 'shadow-xl border-2' 
                          : 'shadow-lg'
                      }`}
                      style={{ 
                        top: `${top}px`, 
                        height: `${height}px`,
                        backgroundColor: colors.bg,
                        borderLeft: `4px solid ${colors.border}`,
                        opacity: isToday ? 1 : 0.5,
                      }}
                    >
                      <div className="font-semibold line-clamp-2 text-main flex items-center gap-1">
                        {isAssignment && (
                          isSubmitted ? (
                            <FaCheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                          ) : (
                            <MdAssignment className="w-4 h-4 flex-shrink-0" />
                          )
                        )}
                        {task.title}
                      </div>
                      {task.courseCode && (
                        <div className="text-xs font-medium text-secondary">
                          {task.courseCode}
                        </div>
                      )}
                      {task.room && (
                        <div className="text-xs font-medium mt-1 text-secondary">
                          Phòng: {task.room}
                        </div>
                      )}
                      <div className="mt-auto text-secondary flex items-center gap-1">
                        {isAssignment ? (
                          <>
                            ⏰ Deadline
                            {isSubmitted && (
                              <span className="text-xs" style={{ color: 'var(--color-success)' }}>
                                (Đã nộp)
                              </span>
                            )}
                          </>
                        ) : (
                          `${start.format("HH:mm")} — ${end.format("HH:mm")}`
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          );
        })}

        {(isVisibleWeek || isVisibleDay) && (() => {
          const currentDayIndex = view === 'Week' ? now.isoWeekday() - 1 : 0;
          const columnCount = daysToDisplay.length;
          const columnWidth = 100 / columnCount;

          const topPos = HEADER_HEIGHT + currentMinutes;
          const leftPercent = currentDayIndex * columnWidth;
          const rightPercent = 100 - (currentDayIndex + 1) * columnWidth;

          return (
            <>
              {view === 'Week' && currentDayIndex > 0 && (
                <div
                  className="absolute border-t-2 border-dashed"
                  style={{
                    top: `${topPos}px`,
                    left: 0,
                    right: `${100 - currentDayIndex * columnWidth}%`,
                    zIndex: 20,
                    borderColor: 'var(--color-normal)'
                  }}
                />
              )}
              <div
                className="absolute border-t-2"
                style={{
                  top: `${topPos}px`,
                  left: `${leftPercent}%`,
                  right: `${rightPercent}%`,
                  zIndex: 20,
                  borderColor: 'var(--color-normal)'
                }}
              />
              <div
                className="absolute w-2.5 h-2.5 rounded-full"
                style={{ 
                  top: `${topPos - 4}px`, 
                  left: `calc(${leftPercent}%)`, 
                  zIndex: 21,
                  backgroundColor: 'var(--color-normal)'
                }}
              />
              <div
                className="absolute w-2.5 h-2.5 rounded-full"
                style={{ 
                  top: `${topPos - 4}px`, 
                  right: `calc(${rightPercent}%)`, 
                  zIndex: 21,
                  backgroundColor: 'var(--color-normal)'
                }}
              />
            </>
          );
        })()}
      </div>
    </div>
  );
};