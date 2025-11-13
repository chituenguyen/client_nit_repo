import { useState, useEffect } from 'react';

/**
 * Hook tùy chỉnh để trì hoãn việc cập nhật một giá trị.
 * Rất hữu ích cho việc debounce input của người dùng (ví dụ: ô tìm kiếm).
 * @param value Giá trị cần trì hoãn (VD: searchTerm)
 * @param delay Thời gian trì hoãn (VD: 500ms)
 * @returns Giá trị đã được trì hoãn
 */
export function useDebounce<T>(value: T, delay: number): T {
  // State để lưu trữ giá trị đã bị trì hoãn
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Thiết lập một timer
    // Chỉ cập nhật debouncedValue sau khi hết thời gian 'delay'
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Đây là hàm dọn dẹp (cleanup function)
    // Nó sẽ chạy mỗi khi 'value' hoặc 'delay' thay đổi
    // Nó hủy timer trước đó để timer mới được thiết lập
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Chỉ chạy lại effect này nếu 'value' hoặc 'delay' thay đổi

  return debouncedValue;
}