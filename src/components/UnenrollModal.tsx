import React from 'react';
import { BiErrorCircle } from 'react-icons/bi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface UnenrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  courseName?: string;
  scheduleInfo?: string;
}

export default function UnenrollModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  courseName,
  scheduleInfo,
}: UnenrollModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon & Title */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <BiErrorCircle className="text-red-600 text-4xl" />
          </div>
          <h3 className="text-xl font-bold  mb-2">
            Xác nhận hủy đăng ký
          </h3>
          <p className="text-secondary text-sm">
            Bạn có chắc chắn muốn hủy đăng ký khóa học này không?
          </p>
        </div>

        {/* Course Info */}
        {courseName && (
          <div className="bg-surface rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold">
              {courseName}
            </p>
            {scheduleInfo && (
              <p className="text-xs">
                {scheduleInfo}
              </p>
            )}
          </div>
        )}

        {/* Warning Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            ⚠️ Hành động này không thể hoàn tác. Bạn sẽ cần đăng ký lại nếu muốn tham gia khóa học.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Xác nhận hủy'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}