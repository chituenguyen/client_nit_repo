import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MdClose, MdFileUpload, MdOutlineDescription, MdEdit } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiErrorCircle } from 'react-icons/bi';
import { FaFile, FaDownload, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { type Assignment } from '../types';
import { useMySubmission } from '../hooks/useAssignmentQuery';
import { useSubmitAssignment, useUpdateSubmission } from '../hooks/useSubmissionQuery';

interface SubmissionModalProps {
  assignment: Assignment;
  onClose: () => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function SubmissionModal({
  assignment,
  onClose,
}: SubmissionModalProps) {
  const [submissionText, setSubmissionText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const {
    data: mySubmission,
    isLoading: isLoadingSubmission,
    error: submissionError,
  } = useMySubmission(assignment.id);

  const {
    mutate: submitAssignment,
    isPending: isSubmitting,
    error: submitMutationError,
  } = useSubmitAssignment();

  const {
    mutate: updateSubmission,
    isPending: isUpdating,
    error: updateMutationError,
  } = useUpdateSubmission();

  const isProcessing = isSubmitting || isUpdating;

  useEffect(() => {
    if (isEditMode && mySubmission) {
      setSubmissionText(mySubmission.submissionText || '');
    }
  }, [isEditMode, mySubmission]);

  useEffect(() => {
    if (mySubmission && !isEditMode) {
      setSubmissionText('');
      setFile(null);
      setFormError(null);
    }
  }, [isEditMode, mySubmission]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async () => {
    setFormError(null);

    try {
      const payload: { submissionText?: string; file?: File } = {};

      if (submissionText && submissionText.trim()) {
        payload.submissionText = submissionText.trim();
      }

      if (file instanceof File) {
        payload.file = file;
      }

      if (!payload.submissionText && !payload.file) {
        setFormError('Vui lòng nhập nội dung hoặc chọn file để nộp bài');
        return;
      }

      if (isEditMode && mySubmission) {
        updateSubmission(
          {
            submissionId: mySubmission.id,
            ...payload,
          },
          {
            onSuccess: () => {
              toast.success('Cập nhật bài nộp thành công!');
              setIsEditMode(false);
              setFile(null);
            },
            onError: (error) => {
              console.error('❌ Lỗi khi cập nhật:', error);
              setFormError(
                error instanceof Error
                  ? error.message
                  : 'Cập nhật thất bại. Vui lòng thử lại.'
              );
            },
          }
        );
      } else {
        submitAssignment(
          {
            assignmentId: assignment.id,
            ...payload,
          },
          {
            onSuccess: () => {
              toast.success('Nộp bài thành công!');
              setTimeout(() => {
                onClose();
              }, 100);
            },
            onError: (error) => {
              console.error('❌ Lỗi khi nộp bài:', error);
              setFormError(
                error instanceof Error
                  ? error.message
                  : 'Nộp bài thất bại. Vui lòng thử lại.'
              );
            },
          }
        );
      }
    } catch (error) {
      console.error('❌ Lỗi trong handleSubmit:', error);
      setFormError('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSubmissionText(mySubmission?.submissionText || '');
    setFile(null);
    setFormError(null);
  };

  const isOverdue = new Date(assignment.dueDate) < new Date();
  const isGraded = mySubmission?.score !== undefined && mySubmission?.score !== null;

  const renderContent = () => {
    if (isLoadingSubmission) {
      return (
        <div className="flex flex-col items-center justify-center p-12">
          <AiOutlineLoading3Quarters className="animate-spin text-4xl text-main" />
          <p className="mt-4 text-main">Đang tải trạng thái bài nộp...</p>
        </div>
      );
    }

    if (submissionError) {
      return (
        <div className="flex flex-col items-center justify-center p-12">
          <BiErrorCircle
            className="text-5xl mb-4"
            style={{ color: 'var(--color-danger)' }}
          />
          <p className="text-main text-center">
            Không thể tải trạng thái bài nộp.
          </p>
        </div>
      );
    }

    if (mySubmission) {
      if (isGraded) {
        return (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-lg bg-surface flex items-center gap-3">
              <FaCheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <h4 className="font-semibold text-main">Bài nộp đã được chấm điểm</h4>
                <p className="text-sm text-secondary">
                  Bạn không thể chỉnh sửa bài nộp đã được chấm
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-surface">
              <label className="block text-sm font-medium text-main mb-1">
                Điểm số:
              </label>
              <p className="text-2xl font-bold text-main">
                {mySubmission.score} / {assignment.maxScore || '?'}
              </p>
              {mySubmission.gradedAt && (
                <p className="text-xs text-secondary mt-1">
                  Chấm lúc: {new Date(mySubmission.gradedAt).toLocaleString('vi-VN')}
                </p>
              )}
            </div>

            {mySubmission.feedback && (
              <div className="p-4 rounded-lg bg-surface">
                <label className="block text-sm font-medium text-main mb-2">
                  Nhận xét từ giảng viên:
                </label>
                <p className="text-main">{mySubmission.feedback}</p>
              </div>
            )}

            {mySubmission.submissionText && (
              <div>
                <label className="block text-sm font-medium text-main mb-2">
                  Nội dung đã nộp:
                </label>
                <pre className="p-3 bg-surface rounded-lg text-sm text-main whitespace-pre-wrap font-sans">
                  {mySubmission.submissionText}
                </pre>
              </div>
            )}

            {mySubmission.fileUrl && (
              <div>
                <label className="block text-sm font-medium text-main mb-2">
                  File đã nộp:
                </label>
                <a
                  href={mySubmission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-3 p-3 bg-surface rounded-lg hover:bg-component transition-colors"
                >
                  <FaFile className="w-5 h-5 text-secondary" />
                  <span className="flex-1 text-main font-medium truncate">
                    {mySubmission.fileUrl.split('/').pop()}
                  </span>
                  <FaDownload className="w-4 h-4 text-secondary" />
                </a>
              </div>
            )}

            <p className="text-sm text-secondary text-center mt-4">
              Nộp vào lúc: {new Date(mySubmission.submittedAt).toLocaleString('vi-VN')}
            </p>
          </div>
        );
      }

      if (!isEditMode) {
        return (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-lg bg-surface flex items-center gap-3">
              <FaCheckCircle className="w-8 h-8 text-green-500" />
              <div className="flex-1">
                <h4 className="font-semibold text-main">Bạn đã nộp bài</h4>
                <p className="text-sm text-secondary">
                  Nộp vào lúc:{' '}
                  {new Date(mySubmission.submittedAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <button
                onClick={() => setIsEditMode(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
              >
                <MdEdit className="w-4 h-4" />
                Chỉnh sửa
              </button>
            </div>

            {mySubmission.submissionText && (
              <div>
                <label className="block text-sm font-medium text-main mb-2">
                  Nội dung đã nộp:
                </label>
                <pre className="p-3 bg-surface rounded-lg text-sm text-main whitespace-pre-wrap font-sans">
                  {mySubmission.submissionText}
                </pre>
              </div>
            )}

            {mySubmission.fileUrl && (
              <div>
                <label className="block text-sm font-medium text-main mb-2">
                  File đã nộp:
                </label>
                <a
                  href={mySubmission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-3 p-3 bg-surface rounded-lg hover:bg-component transition-colors"
                >
                  <FaFile className="w-5 h-5 text-secondary" />
                  <span className="flex-1 text-main font-medium truncate">
                    {mySubmission.fileUrl.split('/').pop()}
                  </span>
                  <FaDownload className="w-4 h-4 text-secondary" />
                </a>
              </div>
            )}

            <p className="text-xs text-secondary text-center">
              Bạn có thể chỉnh sửa bài nộp trước khi giảng viên chấm điểm
            </p>
          </div>
        );
      }

      return (
        <div className="p-6 space-y-5">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Chế độ chỉnh sửa:</strong> Bạn đang cập nhật bài nộp của mình
            </p>
          </div>

          <div>
            <label
              htmlFor="submissionText"
              className="flex items-center gap-2 text-sm font-medium text-main mb-2"
            >
              <MdOutlineDescription />
              <span>Nội dung nộp bài</span>
            </label>
            <textarea
              id="submissionText"
              rows={5}
              className="w-full p-3 bg-surface border border-color rounded-lg text-main focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Nhập nội dung bài làm của bạn tại đây..."
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-main mb-2">
              <MdFileUpload />
              <span>Tải file mới (tùy chọn)</span>
            </label>
            {mySubmission.fileUrl && !file && (
              <div className="mb-2 p-3 bg-surface rounded-lg">
                <p className="text-sm text-secondary mb-1">File hiện tại:</p>
                <a
                  href={mySubmission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline flex items-center gap-2"
                >
                  <FaFile className="w-4 h-4" />
                  {mySubmission.fileUrl.split('/').pop()}
                </a>
              </div>
            )}
            <div className="relative p-6 border-2 border-dashed border-color rounded-lg text-center bg-surface hover:bg-component transition-colors">
              <input
                type="file"
                id="file-upload"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
              {!file ? (
                <div className="text-secondary">
                  <FaFile className="mx-auto h-10 w-10" />
                  <p className="mt-2">
                    Kéo thả file vào đây, hoặc{' '}
                    <span className="font-medium text-blue-500">
                      nhấn để chọn file mới
                    </span>
                  </p>
                </div>
              ) : (
                <div className="text-left text-main">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-secondary">
                    {formatFileSize(file.size)}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-sm text-red-500 hover:underline mt-2"
                    disabled={isProcessing}
                  >
                    Xóa file
                  </button>
                </div>
              )}
            </div>
          </div>

          {(formError || updateMutationError) && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              <p>{formError || (updateMutationError as Error)?.message}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <AiOutlineLoading3Quarters className="animate-spin w-5 h-5" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </div>
      );
    }

    if (isOverdue) {
      return (
        <div className="flex flex-col items-center justify-center p-12">
          <BiErrorCircle
            className="text-5xl mb-4"
            style={{ color: 'var(--color-danger)' }}
          />
          <h4 className="text-xl font-semibold text-main">Đã quá hạn nộp bài</h4>
          <p className="text-secondary text-center mt-2">
            Bạn không thể nộp bài cho assignment này nữa.
          </p>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-5">
        <div>
          <label
            htmlFor="submissionText"
            className="flex items-center gap-2 text-sm font-medium text-main mb-2"
          >
            <MdOutlineDescription />
            <span>Nội dung nộp bài</span>
          </label>
          <textarea
            id="submissionText"
            rows={5}
            className="w-full p-3 bg-surface border border-color rounded-lg text-main focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Nhập nội dung bài làm của bạn tại đây..."
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-main mb-2">
            <MdFileUpload />
            <span>Tải file</span>
          </label>
          <div className="relative p-6 border-2 border-dashed border-color rounded-lg text-center bg-surface hover:bg-component transition-colors">
            <input
              type="file"
              id="file-upload"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            {!file ? (
              <div className="text-secondary">
                <FaFile className="mx-auto h-10 w-10" />
                <p className="mt-2">
                  Kéo thả file vào đây, hoặc{' '}
                  <span className="font-medium text-blue-500">
                    nhấn để chọn file
                  </span>
                </p>
              </div>
            ) : (
              <div className="text-left text-main">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-secondary">
                  {formatFileSize(file.size)}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-sm text-red-500 hover:underline mt-2"
                  disabled={isProcessing}
                >
                  Xóa file
                </button>
              </div>
            )}
          </div>
        </div>

        {(formError || submitMutationError) && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            <p>{formError || (submitMutationError as Error)?.message}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isProcessing}
          className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <AiOutlineLoading3Quarters className="animate-spin w-5 h-5" />
              <span>Đang nộp bài...</span>
            </>
          ) : (
            'Xác nhận nộp bài'
          )}
        </button>
      </div>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      onClick={isProcessing ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-background rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between py-3 px-6 border-b border-color">
          <h3 className="text-xl font-semibold text-main truncate pr-4">
            {isEditMode ? 'Chỉnh sửa bài nộp' : `Nộp bài: ${assignment.title}`}
          </h3>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 hover:bg-component rounded-lg transition-colors disabled:opacity-50"
          >
            <MdClose className="w-6 h-6 text-main" />
          </button>
        </div>

        <div className="overflow-y-auto">{renderContent()}</div>
      </div>
    </div>,
    document.body
  );
}