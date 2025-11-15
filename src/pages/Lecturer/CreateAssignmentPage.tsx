import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { assignmentApi } from '../../api/assignmentApi';
import type { Assignment } from '../../types';

type AssignmentFormData = {
  title: string;
  description: string;
  dueDate: string;
  maxScore: string;
  weekNumber: string;
};

export default function CreateAssignmentPage() {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AssignmentFormData>({
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      maxScore: '',
      weekNumber: '',
    },
  });

  // Fetch danh sách assignments đã giao
  const {
    data: assignmentsData,
    isLoading: isLoadingAssignments,
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const response = await assignmentApi.getAssignmentsByCourse(courseId);
      const payload = (response as any)?.data ?? response;
      return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
    },
    enabled: !!courseId,
  });

  const assignments = (assignmentsData ?? []) as Assignment[];

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

  const toLocalInput = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const handleDelete = async (assignmentId: string, assignmentTitle: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài tập "${assignmentTitle}"?`)) {
      return;
    }

    try {
      await assignmentApi.delete(assignmentId);
      await refetchAssignments();
      // Nếu đang chỉnh sửa bài tập bị xóa, reset form
      if (editingId === assignmentId) {
        reset({ title: '', description: '', dueDate: '', maxScore: '', weekNumber: '' });
        setFile(null);
        setEditingId(null);
      }
      alert('Xóa bài tập thành công');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xóa bài tập thất bại');
    }
  };

  const onSubmit = async (data: AssignmentFormData) => {
    if (!courseId) return;

    try {
      const maxScoreNum = data.maxScore?.trim() ? Number(data.maxScore) : undefined;
      const weekNumberNum = data.weekNumber?.trim() ? Number(data.weekNumber) : undefined;

      if (editingId) {
        await assignmentApi.update(
          editingId,
          {
            title: data.title,
            description: data.description,
            courseId,
            dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
            maxScore:
              maxScoreNum !== undefined && !isNaN(maxScoreNum) && maxScoreNum >= 0
                ? maxScoreNum
                : undefined,
            weekNumber:
              weekNumberNum !== undefined &&
              !isNaN(weekNumberNum) &&
              Number.isInteger(weekNumberNum) &&
              weekNumberNum >= 1
                ? weekNumberNum
                : undefined,
          },
          file || undefined
        );
      } else {
        await assignmentApi.create(
          {
            title: data.title,
            description: data.description,
            courseId,
            dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
            maxScore:
              maxScoreNum !== undefined && !isNaN(maxScoreNum) && maxScoreNum >= 0
                ? maxScoreNum
                : undefined,
            weekNumber:
              weekNumberNum !== undefined &&
              !isNaN(weekNumberNum) &&
              Number.isInteger(weekNumberNum) &&
              weekNumberNum >= 1
                ? weekNumberNum
                : undefined,
          },
          file || undefined
        );
      }

      // Reload danh sách assignments ngay lập tức
      await refetchAssignments();
      reset();
      setFile(null);
      setEditingId(null);
      alert(editingId ? 'Cập nhật bài tập thành công' : 'Giao bài tập thành công');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Giao bài tập thất bại');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Danh sách bài tập đã giao */}
      <div className="rounded-2xl border border-color/40 bg-surface/80 p-6 shadow-xl shadow-primary/10 dark:border-white/10 dark:bg-white/5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-main">Bài tập đã giao</h2>
          <span className="rounded-full bg-component/70 px-3 py-1 text-xs font-semibold text-secondary dark:bg-component/40 dark:text-gray-200">
            {assignments.length} bài tập
          </span>
        </div>

        {isLoadingAssignments ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-color/60 bg-component/40 p-6 text-center text-sm text-secondary dark:bg-component/20 dark:text-gray-200">
            Chưa có bài tập nào. Giao bài tập đầu tiên bên dưới.
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-xl border border-color/60 bg-component/30 p-4 shadow-inner shadow-black/5 dark:bg-component/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-main dark:text-white">{assignment.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-secondary dark:text-gray-300">
                      {assignment.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-secondary dark:text-gray-400">
                      {assignment.dueDate && (
                        <span className="flex items-center gap-1">
                          <span>Hạn nộp:</span>
                          <span className="font-semibold text-main dark:text-white">{formatDate(assignment.dueDate)}</span>
                        </span>
                      )}
                      {assignment.maxScore !== undefined && (
                        <span className="flex items-center gap-1">
                          <span>Điểm tối đa:</span>
                          <span className="font-semibold text-main dark:text-white">{assignment.maxScore}</span>
                        </span>
                      )}
                      {assignment.weekNumber !== undefined && (
                        <span className="flex items-center gap-1">
                          <span>Tuần:</span>
                          <span className="font-semibold text-main dark:text-white">{assignment.weekNumber}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type='button'
                      onClick={() => {
                        setEditingId(assignment.id);
                        reset({
                          title: assignment.title || '',
                          description: assignment.description || '',
                          dueDate: toLocalInput(assignment.dueDate),
                          maxScore: assignment.maxScore !== undefined ? String(assignment.maxScore) : '',
                          weekNumber: assignment.weekNumber !== undefined ? String(assignment.weekNumber) : '',
                        });
                        setFile(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-primary/50 px-4 py-2 text-sm font-semibold text-main transition-all hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-primary/60 dark:text-white dark:hover:bg-primary/20"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => handleDelete(assignment.id, assignment.title)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/60 dark:text-red-400 dark:hover:bg-red-500/20"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form tạo bài tập mới */}
      <div className="relative overflow-hidden rounded-2xl border border-color/40 bg-surface/80 p-6 shadow-xl shadow-primary/10 dark:border-white/10 dark:bg-white/5">
        <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-main">{editingId ? 'Chỉnh sửa bài tập' : 'Giao bài tập mới'}</h1>
              <p className="mt-1 text-sm text-secondary">Thiết lập nội dung, hạn nộp và điểm tối đa cho bài tập.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Tiêu đề & mô tả */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="assignment-title" 
                  className="mb-2 block text-sm font-semibold text-main dark:text-white"
                >
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('title', {
                    required: 'Tiêu đề là bắt buộc',
                    minLength: {
                      value: 3,
                      message: 'Tiêu đề phải có ít nhất 3 ký tự',
                    },
                  })}
                  className="w-full rounded-lg border border-color bg-white px-4 py-2.5 text-sm text-main placeholder:text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  placeholder="VD: Bài tập tuần 3 - SQL cơ bản"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label
                    htmlFor="assignment-description" 
                    className="mb-2 block text-sm font-semibold text-main dark:text-white">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="assignment-description"
                  {...register('description', {
                    required: 'Mô tả là bắt buộc',
                    minLength: {
                      value: 10,
                      message: 'Mô tả phải có ít nhất 10 ký tự',
                    },
                  })}
                  className="w-full rounded-lg border border-color bg-white px-4 py-2.5 text-sm text-main placeholder:text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  rows={6}
                  placeholder="Yêu cầu, định dạng nộp bài, tiêu chí chấm điểm..."
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Thông số */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label
                  htmlFor="assignment-due-date" 
                  className="mb-2 block text-sm font-semibold text-main dark:text-white"
                >
                  Hạn nộp
                </label>
                <input
                  id="assignment-due-date"
                  type="datetime-local"
                  {...register('dueDate')}
                  className="w-full rounded-lg border border-color bg-white px-4 py-2.5 text-sm text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="assignment-max-score" 
                  className="mb-2 block text-sm font-semibold text-main dark:text-white"
                >
                  Điểm tối đa
                </label>
                <input
                  type="number"
                  min={0}
                  {...register('maxScore', {
                    validate: (value) => {
                      if (!value || value.trim() === '') return true;
                      const num = Number(value);
                      if (isNaN(num)) return 'Điểm tối đa phải là số';
                      if (num < 0) return 'Điểm tối đa phải >= 0';
                      return true;
                    },
                  })}
                  className="w-full rounded-lg border border-color bg-white px-4 py-2.5 text-sm text-main placeholder:text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  placeholder="VD: 100"
                />
                {errors.maxScore && (
                  <p className="mt-1 text-xs text-red-500">{errors.maxScore.message}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="assignment-week-number" 
                  className="mb-2 block text-sm font-semibold text-main dark:text-white"
                >
                  Tuần
                </label>
                <input
                  id="assignment-week-number"
                  type="number"
                  min={1}
                  step={1}
                  {...register('weekNumber', {
                    validate: (value) => {
                      if (!value || value.trim() === '') return true;
                      const num = Number(value);
                      if (isNaN(num)) return 'Tuần phải là số';
                      if (!Number.isInteger(num)) return 'Tuần phải là số nguyên';
                      if (num < 1) return 'Tuần phải >= 1';
                      return true;
                    },
                  })}
                  className="w-full rounded-lg border border-color bg-white px-4 py-2.5 text-sm text-main placeholder:text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  placeholder="VD: 3"
                />
                {errors.weekNumber && (
                  <p className="mt-1 text-xs text-red-500">{errors.weekNumber.message}</p>
                )}
              </div>
            </div>

            {/* File */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-main dark:text-white">Tệp đính kèm (tuỳ chọn)</label>
              <div className="relative">
                <input
                  type="file"
                  id="assignment-file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <label
                  htmlFor="assignment-file"
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/50 px-4 py-2 text-sm font-semibold text-main transition-all hover:bg-primary/10 dark:border-primary/60 dark:text-white dark:hover:bg-primary/20"
                >
                  Chọn tệp
                </label>
                {file && (
                  <span className="ml-3 align-middle text-sm text-secondary">{file.name}</span>
                )}
              </div>
              <p className="mt-1 text-xs text-secondary">Hỗ trợ: PDF, DOCX, ZIP...</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-lg border border-color px-4 py-2 text-sm font-semibold text-secondary hover:bg-component/40 dark:border-slate-600 dark:text-gray-200"
              >
                Hủy
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    reset({ title: '', description: '', dueDate: '', maxScore: '', weekNumber: '' });
                    setFile(null);
                    setEditingId(null);
                  }}
                  className="rounded-lg border border-color px-4 py-2 text-sm font-semibold text-secondary hover:bg-component/40 dark:border-slate-600 dark:text-gray-200"
                >
                  Hủy chỉnh sửa
                </button>
              )}
              <button
                disabled={isSubmitting}
                type="submit"
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                {isSubmitting ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Giao bài tập'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


