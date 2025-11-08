import { useParams, useNavigate } from 'react-router-dom';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiErrorCircle } from 'react-icons/bi';
import { MdAssignment } from 'react-icons/md';
import { FaCalendarAlt, FaArrowLeft } from 'react-icons/fa';
import { useAssignmentsByCourse } from '../hooks/useAssignmentQuery';
import { useCourseDetail } from '../hooks/useCourseQuery';
import { useAssignmentStore } from '../stores/assignmentStore';
import { IoIosWarning } from "react-icons/io";
import { FaFire } from "react-icons/fa";


export default function AssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: course, isLoading: courseLoading } = useCourseDetail(id);
  const { isLoading: assignmentsLoading, error, refetch } = useAssignmentsByCourse(id);
  const assignments = useAssignmentStore((s) => s.assignments);

  const isLoading = courseLoading || assignmentsLoading;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <AiOutlineLoading3Quarters className="animate-spin inline-block text-4xl mb-4 text-main" />
          <p className="text-lg text-main">Đang tải bài tập...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-surface border border-color rounded-xl p-8 text-center">
          <BiErrorCircle className="inline-block text-5xl mb-4" style={{ color: 'var(--color-danger)' }} />
          <h3 className="text-lg font-semibold mb-2 text-main">
            Không thể tải danh sách bài tập
          </h3>
          <p className="text-secondary mb-4">
            {typeof error === 'string' ? error : 'Đã xảy ra lỗi khi tải dữ liệu'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2.5 rounded-lg transition-colors font-medium text-white"
            style={{ backgroundColor: 'var(--color-danger)' }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start lg:flex-row lg:items-end justify-between">
        <div>
          <button
            onClick={() => navigate(`/student/courses/${id}`)}
            className="flex items-center gap-2 text-secondary hover:text-main mb-3 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span>Quay lại khóa học</span>
          </button>
          <h1 className="text-3xl lg:text-3xl font-bold text-main">Danh sách bài tập</h1>
          {course && (
            <p className="text-secondary mt-1">
              {course.courseName} ({course.courseCode})
            </p>
          )}
        </div>
        <div className="text-right flex items-center gap-2 mt-2 lg:mt-0">
          <span className="text-sm text-secondary">Tổng số bài tập </span>
          <span className="text-3xl font-bold text-main">{assignments.length}</span>
        </div>
      </div>

      {/* Assignments List */}
      {!assignments || assignments.length === 0 ? (
        <div className="bg-background rounded-lg shadow-md p-12 text-center">
          <MdAssignment className="inline-block text-secondary text-7xl mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-main">
            Chưa có bài tập nào
          </h3>
          <p className="text-secondary mb-6">
            Giảng viên chưa đăng bài tập cho khóa học này.
          </p>
          <button
            onClick={() => navigate(`/student/courses/${id}`)}
            className="px-6 py-2.5 bg-primary text-primary rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Quay lại khóa học
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {assignments.map((assignment) => {
            const overdue = isOverdue(assignment.dueDate);
            const daysUntil = getDaysUntilDue(assignment.dueDate);
            const isUrgent = !overdue && daysUntil <= 3 && daysUntil > 0;

            return (
              <div
                key={assignment.id}
                className="bg-background rounded-lg shadow-md hover:shadow-xl transition-all p-6 border-l-4"
                style={{
                  borderLeftColor: overdue
                    ? 'var(--color-danger)'
                    : isUrgent
                    ? 'var(--color-warning)'
                    : 'var(--color-normal)',
                }}
              >
                <div className="flex flex-col items-center justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center">
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: overdue
                            ? 'rgba(239, 68, 68, 0.1)'
                            : isUrgent
                            ? 'rgba(234, 179, 8, 0.1)'
                            : 'rgba(59, 130, 246, 0.1)',
                        }}
                      >
                        <MdAssignment
                          className="w-6 h-6"
                          style={{
                            color: overdue
                              ? 'var(--color-danger)'
                              : isUrgent
                              ? 'var(--color-warning)'
                              : 'var(--color-normal)',
                          }}
                        />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-main">{assignment.title}</h3>

                        {/*Due time */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {assignment.weekNumber && (
                            <span
                              className="inline-block px-3 py-1 text-xs rounded-full font-medium"
                              style={{
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: 'var(--color-normal)',
                              }}
                            >
                              Tuần {assignment.weekNumber}
                            </span>
                          )}

                          {overdue && (
                            <p
                              className="px-3 py-1 text-xs rounded-full font-medium"
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--color-danger)',
                              }}
                            >
                              <IoIosWarning className='h-6 w-6'/> Quá hạn
                            </p>
                          )}

                          {isUrgent && (
                            <p
                              className="px-3 py-1 text-xs rounded-full font-medium"
                              style={{
                                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                color: 'var(--color-warning)',
                              }}
                            >
                              <FaFire className='w-6 h-6'/> Còn {daysUntil} ngày
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {assignment.description && (
                      <p className="text-sm text-secondary leading-relaxed">
                        {assignment.description}
                      </p>
                    )}

                    {/* Info Grid */}
                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-main">
                        <FaCalendarAlt className="w-4 h-4"/>
                        <div>
                          <span>Hạn nộp: </span>
                          <span
                            className="font-medium"
                            style={{
                              color: overdue ? 'var(--color-danger)' : 'inherit',
                            }}
                          >
                            {formatDate(assignment.dueDate)}
                          </span>
                        </div>
                      </div>

                      {assignment.maxScore !== undefined &&
                        assignment.maxScore !== null && (
                          <div className="flex items-center gap-2 text-sm text-main">
                            <span>Điểm tối đa:</span>
                            <span className="font-bold text-lg">
                              {assignment.maxScore}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="px-5 py-2.5 bg-primary text-primary rounded-lg hover:opacity-90 transition-opacity font-medium text-sm whitespace-nowrap">
                    Xem chi tiết
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Back Button */}
      {assignments && assignments.length > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => navigate(`/student/courses/${id}`)}
            className="px-6 py-2.5 bg-component text-main rounded-lg hover:opacity-80 transition-opacity font-medium"
          >
            Quay lại khóa học
          </button>
        </div>
      )}
    </div>
  );
}