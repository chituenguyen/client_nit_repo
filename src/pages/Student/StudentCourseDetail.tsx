import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiErrorCircle } from 'react-icons/bi';
import { MdPlayLesson, MdAssignment } from 'react-icons/md';
import { GrCertificate } from 'react-icons/gr';
import { useCourseDetail, useEnrollCourse, useUnenrollCourse, useMyEnrollments } from '../../hooks/useCourseQuery';
import { useAuthStore } from '../../stores/authStore';
import { useCourseStore } from '../../stores/courseStore';
import type { Schedule } from '../../types';
import toast from 'react-hot-toast';
import UnenrollModal from '../../components/UnenrollModal';
import { IoArrowForwardOutline } from "react-icons/io5";
import { AxiosError } from 'axios';

interface UnenrollInfo {
  enrollmentId: string;
  scheduleId: string;
  courseName: string;
  scheduleInfo: string;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === 'student';

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allEnrollments = useCourseStore((s) => s.enrollments) || [];

  const { data: course, isLoading, error } = useCourseDetail(id);
  const enrollMutation = useEnrollCourse();
  const unenrollMutation = useUnenrollCourse();

  useMyEnrollments('ENROLLED');

  const [enrolledSchedules, setEnrolledSchedules] = useState<Set<string>>(new Set());
  const [unenrolledEnrollments, setUnenrolledEnrollments] = useState<Set<string>>(new Set());

  const [showUnenrollModal, setShowUnenrollModal] = useState(false);
  const [selectedEnrollmentForUnenroll, setSelectedEnrollmentForUnenroll] = useState<UnenrollInfo | null>(null);

  const existingEnrollmentScheduleIds = useMemo(() => {
    if (!allEnrollments || allEnrollments.length === 0) {
      return new Set<string>();
    }
    return new Set(allEnrollments.map(e => e.scheduleId));
  }, [allEnrollments]);

  const scheduleToEnrollmentMap = useMemo(() => {
    if (!allEnrollments || allEnrollments.length === 0) {
      return new Map<string, string>();
    }
    return new Map(allEnrollments.map(e => [e.scheduleId, e.id]));
  }, [allEnrollments]);

  const handleEnroll = async (scheduleId: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đăng ký khóa học');
      navigate('/login');
      return;
    }

    if (!isStudent) {
      toast.error('Chỉ sinh viên mới có thể đăng ký khóa học');
      return;
    }

    try {
      await enrollMutation.mutateAsync(scheduleId);
      setEnrolledSchedules(prev => new Set(prev).add(scheduleId));
      setUnenrolledEnrollments(prev => {
        const enrollmentId = scheduleToEnrollmentMap.get(scheduleId);
        if (enrollmentId) {
          const newSet = new Set(prev);
          newSet.delete(enrollmentId);
          return newSet;
        }
        return prev;
      });
      toast.success('Đăng ký khóa học thành công! 🎉');
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error?.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  const handleUnenrollClick = (schedule: Schedule, courseName: string) => {
    const enrollmentId = scheduleToEnrollmentMap.get(schedule.id);
    
    if (!enrollmentId) {
      toast.error('Không tìm thấy thông tin đăng ký');
      return;
    }

    setSelectedEnrollmentForUnenroll({
      enrollmentId,
      scheduleId: schedule.id,
      courseName,
      scheduleInfo: `${schedule.dayOfWeek} | ${schedule.startTime} - ${schedule.endTime} | Phòng ${schedule.room}`,
    });
    setShowUnenrollModal(true);
  };

  const handleUnenrollConfirm = async () => {
    if (!selectedEnrollmentForUnenroll) return;

    try {
      await unenrollMutation.mutateAsync(selectedEnrollmentForUnenroll.enrollmentId);
      
      setUnenrolledEnrollments(prev => new Set(prev).add(selectedEnrollmentForUnenroll.enrollmentId));
      setEnrolledSchedules(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedEnrollmentForUnenroll.scheduleId);
        return newSet;
      });
      
      toast.success('Hủy đăng ký khóa học thành công!');
      setShowUnenrollModal(false);
      setSelectedEnrollmentForUnenroll(null);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error?.response?.data?.message || 'Hủy đăng ký thất bại');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <AiOutlineLoading3Quarters className="animate-spin inline-block text-4xl mb-4 text-main" />
        <p className="text-secondary text-lg">Loading course...</p>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Không thể tải chi tiết khóa học';
    
    return (
      <div className="bg-surface border border-color rounded-xl p-8 text-center">
        <BiErrorCircle className="inline-block text-5xl mb-4" style={{ color: 'var(--color-danger)' }} />
        <h3 className="text-lg font-semibold mb-2 text-main">Failed to load course</h3>
        <p className="text-secondary mb-4">{errorMessage}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 rounded-lg transition-colors font-medium text-white"
          style={{ backgroundColor: 'var(--color-danger)' }}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <p className="text-secondary">No course found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 w-full max-w-full overflow-x-hidden">
      {/* Course Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thumbnail */}
        <img
          loading="lazy"
          src={course.thumbnailUrl || `https://picsum.photos/seed/${course.courseCode}/640/360`}
          alt={course.courseName}
          className="w-full h-full object-cover rounded-lg shadow-md"
        />

        {/* Course Info */}
        <div className="flex flex-col gap-4">
          <article>
            <h1 className="text-2xl font-bold text-main">{course.courseName}</h1>
            <p className="text-sm text-secondary">
              Mã: <span className="font-medium">{course.courseCode}</span>
            </p>
          </article>

          {course.lecturer && (
            <article>
              <h4 className="text-sm font-semibold text-main">Giảng viên</h4>
              <p className="text-sm text-secondary">
                {course.lecturer.user?.fullName} – {course.lecturer.title}
              </p>
              {course.lecturer.department && <p className="text-xs text-secondary">{course.lecturer.department}</p>}
            </article>
          )}

          <section className="bg-background p-5 rounded-lg flex-1 shadow-md hover:shadow-lg">
            <h3 className="font-semibold text-main">Mô tả</h3>
            <p className="text-sm text-secondary whitespace-pre-line">
              {course.description || 'No description provided.'}
            </p>
          </section>
        </div>
      </div>

      {/* Info Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Credits */}
        <div className="bg-background rounded-lg overflow-hidden shadow-md flex items-center justify-between cursor-pointer transition-all group">
          <div className='p-4 flex items-center'>
            <div className="p-2 bg-primary text-primary rounded-lg mr-3 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GrCertificate className="w-6 h-6" />
            </div>
            <article>
              <h4 className="text-secondary">Credit</h4>
              <p className="font-medium text-main">{course.credits}</p>
            </article>
          </div>
          <div className='bg-primary text-primary h-full flex items-center justify-center px-4 scale-x-0 origin-right group-hover:scale-x-100 transition-transform'>
            <IoArrowForwardOutline className='w-5 h-5'/>
          </div>
        </div>

        {/* Assignments */}
        <div 
          className="bg-background rounded-lg overflow-hidden shadow-md hover:shadow-lg flex items-center justify-between cursor-pointer transition-all group"
        >
          <div className='p-4 flex items-center'>
            <div className="p-2 bg-primary text-primary rounded-lg mr-3 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MdAssignment className="w-6 h-6" />
            </div>
            <article className="flex-1">
              <h4 className="text-secondary">Assignment</h4>
              <p className="font-medium text-main">{course._count.assignments ?? 0}</p>
            </article>
          </div>
          <button
            type='button' 
            onClick={() => navigate(`/student/courses/${course.id}/assignments`)}
            className='bg-primary text-primary h-full flex items-center justify-center px-4 scale-x-0 origin-right group-hover:scale-x-100 transition-transform'
          >
            <IoArrowForwardOutline className='w-5 h-5'/>
          </button>
        </div>

        {/* Lessons */}  
        <div className="bg-background rounded-lg overflow-hidden shadow-md hover:shadow-lg flex items-center justify-between cursor-pointer transition-all group">
          <div className='p-4 flex items-center'>
            <div className="p-2 bg-primary text-primary rounded-lg mr-3 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MdPlayLesson className="w-6 h-6" />
            </div>
            <article>
              <h4 className="text-secondary">Lectures</h4>
              <p className="font-medium text-main">{course._count.lectureMaterials ?? 0}</p>
            </article>
          </div>
          <button 
            type='button' 
            className='bg-primary text-primary h-full flex items-center justify-center px-4 scale-x-0 origin-right group-hover:scale-x-100 transition-transform'
          >
            <IoArrowForwardOutline className='w-5 h-5'/>
          </button>
        </div>
      </section>

      {/* Schedules table */}
      <div>
        <h3 className="font-semibold text-lg mb-3 text-main">Lịch học</h3>

        <section className="bg-background shadow-md w-full overflow-hidden rounded-lg">
          {(() => {
            const schedules = course.schedules ?? [];
            if (schedules.length === 0)
              return (
                <p className="text-secondary p-4">Chưa có lịch học cho khóa học này.</p>
              );

            return (
              <div className="overflow-x-auto lg:p-3">
                <table className="text-sm border-collapse w-full">
                  <thead>
                    <tr className="bg-primary text-primary">
                      <th className="hidden lg:table-cell px-3 py-2 text-center whitespace-nowrap">
                        Học kỳ
                      </th>
                      <th className="hidden lg:table-cell px-3 py-2 text-center whitespace-nowrap">
                        Năm học
                      </th>
                      <th className="px-3 py-2 text-center whitespace-nowrap">Thứ</th>
                      <th className="px-3 py-2 text-center whitespace-nowrap">Giờ</th>
                      <th className="px-3 py-2 text-center whitespace-nowrap">Phòng</th>
                      <th className="px-3 py-2 text-center whitespace-nowrap">Từ - Đến</th>
                      <th className="hidden lg:table-cell px-3 py-2 text-center whitespace-nowrap">
                        Tuần
                      </th>
                      <th className="px-3 py-2 text-center whitespace-nowrap">Số lượng</th>
                      <th className="px-3 py-2 text-center whitespace-nowrap">Hành động</th>
                    </tr>
                  </thead>

                  <tbody>
                    {schedules.map((s) => {
                      const isFull =
                        s._count?.enrollments && course.maxStudents
                          ? s._count.enrollments >= course.maxStudents
                          : false;
                      
                      const isLocallyEnrolled = enrolledSchedules.has(s.id);
                      const isAlreadyEnrolled = existingEnrollmentScheduleIds.has(s.id);
                      const enrollmentId = scheduleToEnrollmentMap.get(s.id);
                      const isLocallyUnenrolled = enrollmentId ? unenrolledEnrollments.has(enrollmentId) : false;
                      
                      const isEnrolled = (isLocallyEnrolled || isAlreadyEnrolled) && !isLocallyUnenrolled;

                      return (
                        <tr key={s.id} className="border-t border-color">
                          <td className="hidden lg:table-cell px-3 py-4 text-center whitespace-nowrap text-main">
                            {s.semester ?? '-'}
                          </td>
                          <td className="hidden lg:table-cell px-3 py-4 text-center whitespace-nowrap text-main">
                            {s.academicYear ?? '-'}
                          </td>
                          <td className="px-3 py-4 text-center whitespace-nowrap text-main">
                            {s.dayOfWeek ?? '-'}
                          </td>
                          <td className="px-3 py-4 text-center whitespace-nowrap text-main">
                            {s.startTime ?? '-'} - {s.endTime ?? '-'}
                          </td>
                          <td className="px-3 py-4 text-center whitespace-nowrap text-main">
                            {s.room ?? '-'}
                          </td>
                          <td className="px-3 py-4 text-center whitespace-nowrap text-main">
                            {s.startDate
                              ? new Date(s.startDate).toLocaleDateString()
                              : '-'}{' '}
                            –{' '}
                            {s.endDate ? new Date(s.endDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="hidden lg:table-cell px-3 py-4 text-center whitespace-nowrap text-main">
                            {s.totalWeeks ?? '-'}
                          </td>
                          <td className="px-3 py-4 text-center whitespace-nowrap text-main">
                            {s._count?.enrollments ?? 0}/{course.maxStudents}
                          </td>
                          <td className="px-3 py-4 text-center whitespace-nowrap">
                            {isEnrolled ? (
                              <button
                                onClick={() => handleUnenrollClick(s, course.courseName)}
                                disabled={unenrollMutation.isPending}
                                className="text-white w-full py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                style={{ backgroundColor: 'var(--color-danger)' }}
                              >
                                {unenrollMutation.isPending ? 'Loading...' : 'Unenroll'}
                              </button>
                            ) : isFull ? (
                              <p className="font-medium" style={{ color: 'var(--color-danger)' }}>Full</p>
                            ) : (
                              <button
                                className="bg-primary text-primary w-full py-2 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleEnroll(s.id)}
                                disabled={enrollMutation.isPending || !isStudent}
                              >
                                {enrollMutation.isPending ? 'Loading...' : 'Enroll'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </section>
      </div>

      {/* Back to courses button */}    
      <button
        onClick={() => navigate('/student/courses')}
        className="mx-auto block px-4 py-2 rounded-lg bg-component font-medium hover:opacity-80 transition-opacity text-main"
      >
        Back to courses
      </button>

      <UnenrollModal
        isOpen={showUnenrollModal}
        onClose={() => {
          setShowUnenrollModal(false);
          setSelectedEnrollmentForUnenroll(null);
        }}
        onConfirm={handleUnenrollConfirm}
        isLoading={unenrollMutation.isPending}
        courseName={selectedEnrollmentForUnenroll?.courseName}
        scheduleInfo={selectedEnrollmentForUnenroll?.scheduleInfo}
      />
    </div>
  );
}