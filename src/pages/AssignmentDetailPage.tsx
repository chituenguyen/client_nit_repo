import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentApi } from '../api/assignmentApi';
import type { Assignment, Submission } from '../types';
import {
  MdArrowBack,
  MdPeople,
  MdCheckCircle,
  MdPending,
  MdWarning,
  MdFileDownload,
} from 'react-icons/md';

export default function AssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [score, setScore] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  // Fetch assignment details
  const { data: assignmentData, isLoading: isLoadingAssignment } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return null;
      const response = await assignmentApi.getAssignmentById(assignmentId);
      const payload = (response as any)?.data ?? response;
      return payload as Assignment;
    },
    enabled: !!assignmentId,
  });

  // Fetch submissions
  const { data: submissionsData, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return [];
      const response = await assignmentApi.getSubmissions(assignmentId);
      const payload = (response as any)?.data ?? response;
      return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
    },
    enabled: !!assignmentId,
  });

  const submissions = (submissionsData ?? []) as Submission[];

  // Helper function để xác định status
  const getSubmissionStatus = (submission: Submission): 'submitted' | 'graded' | 'late' => {
    // Nếu đã có điểm thì là graded
    if (submission.score !== undefined && submission.score !== null) {
      return 'graded';
    }
    
    // Kiểm tra có nộp trễ không
    if (assignmentData?.dueDate) {
      const dueDate = new Date(assignmentData.dueDate);
      const submittedDate = new Date(submission.submittedAt);
      if (submittedDate > dueDate) {
        return 'late';
      }
    }
    
    return 'submitted';
  };

  // Grade mutation
  const gradeMutation = useMutation({
    mutationFn: async ({ submissionId, score, feedback }: { submissionId: string; score: number; feedback?: string }) => {
      return assignmentApi.gradeSubmission(submissionId, score, feedback);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', assignmentId] });
      setGradingSubmissionId(null);
      setScore('');
      setFeedback('');
      alert('Chấm điểm thành công!');
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Chấm điểm thất bại');
    },
  });

  const handleGrade = (submissionId: string) => {
    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum) || scoreNum < 0) {
      alert('Điểm không hợp lệ');
      return;
    }

    if (assignmentData?.maxScore && scoreNum > assignmentData.maxScore) {
      alert(`Điểm không được vượt quá ${assignmentData.maxScore}`);
      return;
    }

    gradeMutation.mutate({ submissionId, score: scoreNum, feedback: feedback.trim() || undefined });
  };

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

  const stats = {
    total: submissions.length,
    graded: submissions.filter((s) => getSubmissionStatus(s) === 'graded').length,
    submitted: submissions.filter((s) => getSubmissionStatus(s) === 'submitted').length,
    late: submissions.filter((s) => getSubmissionStatus(s) === 'late').length,
  };

  const isLoading = isLoadingAssignment || isLoadingSubmissions;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!assignmentData) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-red-600">Không tìm thấy bài tập</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-component transition-colors dark:hover:bg-white/10"
        >
          <MdArrowBack className="h-6 w-6 text-main" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-main dark:text-white">{assignmentData.title}</h1>
          <p className="mt-1 text-sm text-secondary dark:text-gray-300">{assignmentData.description}</p>
        </div>
      </div>

      {/* Assignment Info */}
      <div className="rounded-2xl border border-color/40 bg-surface/80 p-6 shadow-lg dark:border-white/10 dark:bg-white/5">
        <h2 className="text-xl font-bold text-main dark:text-white mb-4">Thông tin bài tập</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-secondary dark:text-gray-400">Hạn nộp:</span>
            <p className="font-semibold text-main dark:text-white">{formatDate(assignmentData.dueDate)}</p>
          </div>
          <div>
            <span className="text-secondary dark:text-gray-400">Điểm tối đa:</span>
            <p className="font-semibold text-main dark:text-white">{assignmentData.maxScore ?? '—'}</p>
          </div>
          <div>
            <span className="text-secondary dark:text-gray-400">Tuần:</span>
            <p className="font-semibold text-main dark:text-white">{assignmentData.weekNumber ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-color/40 bg-surface/80 p-6 shadow-lg dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary dark:text-gray-300">Tổng số nộp</p>
              <p className="text-3xl font-bold text-main dark:text-white">{stats.total}</p>
            </div>
            <MdPeople className="h-10 w-10 text-primary" />
          </div>
        </div>

        <div className="rounded-2xl border border-color/40 bg-surface/80 p-6 shadow-lg dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary dark:text-gray-300">Đã chấm</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.graded}</p>
            </div>
            <MdCheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-color/40 bg-surface/80 p-6 shadow-lg dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary dark:text-gray-300">Chờ chấm</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.submitted}</p>
            </div>
            <MdPending className="h-10 w-10 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-color/40 bg-surface/80 p-6 shadow-lg dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary dark:text-gray-300">Nộp trễ</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.late}</p>
            </div>
            <MdWarning className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="rounded-2xl border border-color/40 bg-surface/80 p-6 shadow-lg dark:border-white/10 dark:bg-white/5">
        <h2 className="text-xl font-bold text-main dark:text-white mb-4">Danh sách bài nộp ({submissions.length})</h2>

        {submissions.length === 0 ? (
          <div className="text-center py-10 text-secondary dark:text-gray-400">
            Chưa có sinh viên nào nộp bài
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => {
              const status = getSubmissionStatus(submission);
              const studentName = submission.student?.user?.fullName || 'N/A';
              const studentEmail = submission.student?.user?.email || 'N/A';
              const studentCode = submission.student?.studentCode || 'N/A';
              
              return (
              <div
                key={submission.id}
                className="rounded-xl border border-color/40 bg-component/30 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Student Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <img
                      src={submission.student?.user?.avatar || 'https://via.placeholder.com/50'}
                      alt={studentName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-main dark:text-white">{studentName}</h3>
                          <p className="text-sm text-secondary dark:text-gray-400">{studentEmail}</p>
                          <p className="text-xs text-secondary dark:text-gray-400">MSSV: {studentCode}</p>
                        </div>
                        {/* Hiển thị điểm ngay ở đây */}
                        {status === 'graded' && submission.score !== undefined && (
                          <div className="text-right">
                            <div className="text-xs text-secondary dark:text-gray-400 mb-1">Điểm</div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {submission.score}<span className="text-base">/{assignmentData.maxScore}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-secondary dark:text-gray-400">
                        <span>Nộp lúc: <strong>{formatDate(submission.submittedAt)}</strong></span>
                        {status === 'late' && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded dark:bg-red-900/30 dark:text-red-400">
                            Nộp trễ
                          </span>
                        )}
                        {status === 'graded' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded dark:bg-green-900/30 dark:text-green-400">
                            Đã chấm • {formatDate(submission.gradedAt)}
                          </span>
                        )}
                      </div>
                      {submission.fileUrl && (
                        <a
                          href={submission.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex flex-wrap items-center gap-3 text-xs text-secondary dark:text-gray-400 hover:underline"
                        >
                          <MdFileDownload className="h-4 w-4" />
                          Tải file bài nộp
                        </a>
                      )}
                      {/* Hiển thị feedback nếu có */}
                      {status === 'graded' && submission.feedback && (
                        <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded dark:bg-blue-900/20 dark:border-blue-400">
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Nhận xét:</p>
                          <p className="text-sm text-secondary dark:text-gray-300">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Grading Section */}
                  <div className="lg:w-64">
                    {status === 'graded' ? (
                      <div className="text-center text-sm text-green-600 dark:text-green-400 font-semibold">
                        ✓ Đã hoàn thành
                      </div>
                    ) : gradingSubmissionId === submission.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-main dark:text-white mb-1">
                            Điểm (tối đa {assignmentData.maxScore})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={assignmentData.maxScore}
                            step="0.1"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            className="w-full px-3 py-2 border border-color rounded-lg text-main focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                            placeholder="Nhập điểm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-main dark:text-white mb-1">
                            Nhận xét (tuỳ chọn)
                          </label>
                          <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-color rounded-lg text-main focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                            placeholder="Nhận xét cho sinh viên..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGrade(submission.id)}
                            disabled={gradeMutation.isPending}
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                          >
                            {gradeMutation.isPending ? 'Đang lưu...' : 'Lưu điểm'}
                          </button>
                          <button
                            onClick={() => {
                              setGradingSubmissionId(null);
                              setScore('');
                              setFeedback('');
                            }}
                            className="px-4 py-2 border border-color rounded-lg hover:bg-component dark:border-slate-600"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setGradingSubmissionId(submission.id)}
                        className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                      >
                        Chấm điểm
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

