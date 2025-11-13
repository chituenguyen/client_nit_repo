// ⚠️ DEPRECATED: File này chỉ để tương thích ngược
// Nên import trực tiếp từ '../types' thay vì file này

import type { User, UserRole } from '../types';
import { normalizeRole } from '../types';

// Re-export để các file cũ vẫn hoạt động
export type { User, UserRole };
export { normalizeRole };
