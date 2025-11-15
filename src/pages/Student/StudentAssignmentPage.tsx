// src/pages/AssignmentPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiErrorCircle } from 'react-icons/bi';
import { MdAssignment, MdClose } from 'react-icons/md';
import { FaCalendarAlt, FaArrowLeft, FaDownload, FaFile, FaCheckCircle } from 'react-icons/fa';
import { useAssignmentsByCourse } from '../../hooks/useAssignmentQuery';
import { useCourseDetail } from '../../hooks/useCourseQuery';
import { useAssignmentStore } from '../../stores/assignmentStore';
import { useAllMySubmissions } from '../../hooks/useAssignmentQuery';
import { IoIosWarning } from 'react-icons/io';
import { FaFire } from 'react-icons/fa';
import type { Assignment } from '../../types';
import { createPortal } from 'react-dom';
import SubmissionModal from '../../components/SubmissionModal';

// ==================== FILE PREVIEW MODAL ====================
interface FilePreviewModalProps {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
}

function FilePreviewModal({ fileUrl, fileName, onClose }: FilePreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getFileType = (url: string): 'video' | 'image' | 'pdf' | 'unknown' => {
    if (!url) return 'unknown';
    const extension = url.split('.').pop()?.toLowerCase().split('?')[0];
    if (['mp4', 'webm', 'ogg'].includes(extension || '')) return 'video';
    if (['pdf'].includes(extension || '')) return 'pdf';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension || ''))
      return 'image';
    return 'unknown';
  };

  const fileType = getFileType(fileUrl);

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Không thể tải file. Vui lòng thử lại sau.');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl h-full bg-background rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between py-2 px-4">
          <h3 className="text-lg font-semibold text-main truncate pr-4">
            {fileName || 'Xem trước file'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-component rounded-lg transition-colors"
          >
            <MdClose className="w-6 h-6 text-main" />
          </button>
        </div>

        <div className="relative flex-1 overflow-auto">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface">
              <AiOutlineLoading3Quarters className="animate-spin text-4xl text-main" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface p-8">
              <BiErrorCircle
                className="text-5xl mb-4"
                style={{ color: 'var(--color-danger)' }}
              />
              <p className="text-main text-center">{error}</p>
            </div>
          )}

          {!error && fileType === 'video' && (
            <video
              src={fileUrl}
              controls
              className="w-full h-full"
              onLoadedData={handleLoad}
              onError={handleError}
            >
              Trình duyệt của bạn không hỗ trợ video.
            </video>
          )}

          {!error && fileType === 'image' && (
            <div className="flex items-center justify-center p-4 h-full">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain"
                onLoad={handleLoad}
                onError={handleError}
              />
            </div>
          )}

          {!error && fileType === 'pdf' && (
            <iframe
              src={fileUrl}
              className="w-full h-full border-0"
              title={fileName}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}

          {fileType === 'unknown' && (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <FaFile className="text-6xl text-secondary mb-4" />
              <p className="text-main mb-4">Không thể xem trước loại file này</p>
              <a
                href={fileUrl}
                download
                className="px-6 py-2.5 bg-primary text-primary rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
              >
                <FaDownload />
                Tải xuống file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ==================== MAIN COMPONENT ====================
export default function AssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<{
    url: string;
    name: string;
  } | null>(null);

  const [submissionAssignment, setSubmissionAssignment] =
    useState<Assignment | null>(null);

  const { data: course, isLoading: courseLoading } = useCourseDetail(id);
  const {
    isLoading: assignmentsLoading,
    error,
    refetch,
  } = useAssignmentsByCourse(id);
  const assignments = useAssignmentStore((s) => s.assignments);

  // Lấy tất cả submissions để check status
  const { data: allSubmissions } = useAllMySubmissions();

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

  const isSubmitted = (assignmentId: string) => {
    return allSubmissions?.some(sub => sub.assignmentId === assignmentId);
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'assignment-file';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewLecturerFile = (assignment: Assignment) => {
    if (assignment.fileUrl) {
      setSelectedFile({
        url: assignment.fileUrl,
        name: assignment.title,
      });
    }
  };

  const handleOpenSubmission = (assignment: Assignment) => {
    setSubmissionAssignment(assignment);
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
          <BiErrorCircle
            className="inline-block text-5xl mb-4"
            style={{ color: 'var(--color-danger)' }}
          />
          <h3 className="text-lg font-semibold mb-2 text-main">
            Không thể tải danh sách bài tập
          </h3>
          <p className="text-secondary mb-4">
            {typeof error === 'string'
              ? error
              : 'Đã xảy ra lỗi khi tải dữ liệu'}
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
          <h1 className="text-3xl lg:text-3xl font-bold text-main">
            Danh sách bài tập
          </h1>
          {course && (
            <p className="text-secondary mt-1">
              {course.courseName} ({course.courseCode})
            </p>
          )}
        </div>
        <div className="text-right flex items-center gap-2 mt-2 lg:mt-0">
          <span className="text-sm text-secondary">Tổng số bài tập </span>
          <span className="text-3xl font-bold text-main">
            {assignments.length}
          </span>
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
            const submitted = isSubmitted(assignment.id);

            // Xác định màu border
            const getBorderColor = () => {
              if (submitted) return 'var(--color-success)'; // Xanh lá
              if (overdue) return 'var(--color-danger)';
              if (isUrgent) return 'var(--color-warning)';
              return 'var(--color-normal)';
            };

            const getIconColor = () => {
              if (submitted) return 'var(--color-success)';
              if (overdue) return 'var(--color-danger)';
              if (isUrgent) return 'var(--color-warning)';
              return 'var(--color-normal)';
            };

            const getBackgroundColor = () => {
              if (submitted) return 'rgba(16, 185, 129, 0.1)';
              if (overdue) return 'rgba(239, 68, 68, 0.1)';
              if (isUrgent) return 'rgba(234, 179, 8, 0.1)';
              return 'rgba(59, 130, 246, 0.1)';
            };

            return (
              <div
                key={assignment.id}
                className="bg-background rounded-lg shadow-md hover:shadow-xl transition-all p-6 border-l-4"
                style={{
                  borderLeftColor: getBorderColor(),
                }}
              >
                <div className="flex flex-col items-center justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="flex-1 space-y-3 w-full">
                    {/* Header */}
                    <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center">
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: getBackgroundColor(),
                        }}
                      >
                        {submitted ? (
                          <FaCheckCircle
                            className="w-6 h-6"
                            style={{ color: getIconColor() }}
                          />
                        ) : (
                          <MdAssignment
                            className="w-6 h-6"
                            style={{ color: getIconColor() }}
                          />
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-main">
                          {assignment.title}
                        </h3>

                        {/* Status badges */}
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

                          {submitted && (
                            <span
                              className="px-3 py-1 text-xs rounded-full font-medium flex items-center"
                              style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                color: 'var(--color-success)',
                              }}
                            >
                              <FaCheckCircle className="h-4 w-4 mr-1" />
                              Đã nộp
                            </span>
                          )}

                          {overdue && !submitted && (
                            <span
                              className="px-3 py-1 text-xs rounded-full font-medium flex items-center"
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--color-danger)',
                              }}
                            >
                              <IoIosWarning className="h-5 w-5 mr-1" />
                              Quá hạn
                            </span>
                          )}

                          {isUrgent && !submitted && (
                            <span
                              className="px-3 py-1 text-xs rounded-full font-medium flex items-center"
                              style={{
                                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                color: 'var(--color-warning)',
                              }}
                            >
                              <FaFire className="h-5 w-5 mr-1" /> Còn {daysUntil}{' '}
                              ngày
                            </span>
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
                        <FaCalendarAlt className="w-4 h-4" />
                        <div>
                          <span>Hạn nộp: </span>
                          <span
                            className="font-medium"
                            style={{
                              color: overdue && !submitted ? 'var(--color-danger)' : 'inherit',
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

                    {/* File Download */}
                    {assignment.fileUrl && (
                      <button
                        onClick={() =>
                          handleDownload(assignment.fileUrl!, assignment.title)
                        }
                        className="px-3 py-1.5 text-xs bg-component text-main rounded-md hover:opacity-80 transition-opacity font-medium flex items-center gap-1"
                      >
                        <FaDownload className="w-3 h-3" />
                        Tải file đề bài
                      </button>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-auto shrink-0">
                    <button
                      onClick={() => handleViewLecturerFile(assignment)}
                      disabled={!assignment.fileUrl}
                      className="px-5 py-2.5 bg-component text-main rounded-lg hover:opacity-80 transition-opacity font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Xem file đề
                    </button>

                    <button
                      onClick={() => handleOpenSubmission(assignment)}
                      className="px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity font-medium text-sm whitespace-nowrap"
                      style={{
                        backgroundColor: submitted ? 'var(--color-success)' : 'var(--color-primary)',
                        color: 'white',
                      }}
                    >
                      {submitted ? 'Xem bài nộp' : 'Nộp bài'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {selectedFile && (
        <FilePreviewModal
          fileUrl={selectedFile.url}
          fileName={selectedFile.name}
          onClose={() => setSelectedFile(null)}
        />
      )}

      {submissionAssignment && (
        <SubmissionModal
          assignment={submissionAssignment}
          onClose={() => setSubmissionAssignment(null)}
        />
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