import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
if(!API_URL) {
  throw new Error('Missing VITE_API_BASE_URL. Cấu hình trong .env.[mode]');
}
// Tạo axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor để thêm token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Cho axios tự thay đổi header nếu là FormData (cần để axios tự thêm boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor để bắt lỗi 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('401 Unauthorized - Token có thể đã hết hạn');
      // Có thể redirect về trang login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Định nghĩa Types cho dữ liệu đăng ký
export type StudentRegisterData = {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    studentCode: string;
    major?: string;
    enrollmentYear?: number;
    className?: string;
}

export type LecturerRegisterData = {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    lecturerCode: string;
    department?: string;
    title: 'TA' | 'LECTURER' | 'SENIOR_LECTURER' | 'ASSOCIATE_PROFESSOR' | 'PROFESSOR';
    bio?: string;
}

// Định nghĩa Types cho Course (theo API backend)
export type CreateCourseData = {
    courseCode: string;
    courseName: string;
    description: string;
    credits: number;
    maxStudents: number;
    lecturerId: string; // Backend yêu cầu UUID
    thumbnailUrl?: string;
}

export type CourseSchedule = {
    id: string;
    courseId: string;
    semester: string;
    academicYear: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    startDate: string;
    endDate: string;
    totalWeeks: number;
    createdAt?: string;
    updatedAt?: string;
};

export type CreateScheduleData = {
    courseId: string;
    semester: string;
    academicYear: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    startDate: string;
    endDate: string;
    totalWeeks: number;
};

export type Course = {
    id: string;
    courseCode: string;
    courseName: string;
    description: string;
    credits: number;
    maxStudents: number;
    lecturerId: string;
    createdAt: string;
    updatedAt: string;
    schedules?: CourseSchedule[];
    thumbnailUrl?: string;
}

// ==== AUTH API ====
export const authApi = {

  login: async (email: string, password: string) => {
    return api.post('/auth/login', { 
      email, 
      password 
    });
  },

  // Register Student
  registerStudent: async (data: StudentRegisterData) => {
    return api.post('/auth/register/student', data);
  },

  // Register Lecturer
  registerLecturer: async (data: LecturerRegisterData) => {
    return api.post('/auth/register/lecturer', data);
  },

  // Lấy thông tin user hiện tại (sau khi login)
  getCurrentUser: () => {
    return api.get('/auth/me');
  },

  // Kiểm tra email có tồn tại không (nếu API hỗ trợ)
  checkEmailExists: (email: string) => {
    // Tùy thuộc vào API của bạn
    return api.get(`/users?email=${email}`);
  },
};

// ==== COURSE API ====
export type GetLecturerCoursesParams = {
  search?: string;
  page?: number;
  limit?: number;
  lecturerId?: string;
};

export const courseApi = {
  // Tạo course mới
  createCourse: async (data: CreateCourseData, thumbnailFile?: File) => {
  if (thumbnailFile) {
    const formData = new FormData();
    // Gửi từng field riêng lẻ như string
    formData.append('courseCode', data.courseCode);
    formData.append('courseName', data.courseName);
    formData.append('description', data.description);
    formData.append('credits', data.credits.toString());
    formData.append('maxStudents', data.maxStudents.toString());
    formData.append('lecturerId', data.lecturerId);
    formData.append('thumbnail', thumbnailFile); // Key chính xác

    return api.post('/courses', formData);
  }
  return api.post('/courses', data);
  },

  // Lấy danh sách courses (hỗ trợ tìm kiếm & phân trang)
  getLecturerCourses: async (params?: GetLecturerCoursesParams) => {
    const queryParams: Record<string, string | number> = {};

    if (params?.search && params.search.trim() !== '') {
      queryParams.search = params.search.trim();
    }

    if (typeof params?.page === 'number') {
      queryParams.page = params.page;
    }

    if (typeof params?.limit === 'number') {
      queryParams.limit = params.limit;
    }

    if (params?.lecturerId) {
      queryParams.lecturerId = params.lecturerId;
    }

    return api.get('/courses', { params: queryParams });
  },

  // Thêm lịch học cho course
  createSchedule: async (data: CreateScheduleData) => {
    return api.post('/schedules', data);
  },

  // Lấy lịch học theo course
  getCourseSchedules: async (courseId: string) => {
    return api.get('/schedules', {
      params: {
        courseId,
        limit: 1000,
      },
    });
  },

  // Cập nhật lịch học
  updateSchedule: async (scheduleId: string, data: Partial<CreateScheduleData>) => {
    return api.patch(`/schedules/${scheduleId}`, data);
  },

  // Xóa lịch học
  deleteSchedule: async (scheduleId: string) => {
    return api.delete(`/schedules/${scheduleId}`);
  },

  // Lấy chi tiết course
  getCourseById: async (courseId: string) => {
    return api.get(`/courses/${courseId}`);
  },

  // Cập nhật course
  updateCourse: async (courseId: string, data: Partial<CreateCourseData>, thumbnailFile?: File) => {
    // Nếu có file → dùng FormData
    if (thumbnailFile) {
      const formData = new FormData();
      
      // Append từng field một cách rõ ràng
      if (data.courseCode !== undefined) formData.append('courseCode', data.courseCode);
      if (data.courseName !== undefined) formData.append('courseName', data.courseName);
      if (data.description !== undefined) formData.append('description', data.description);
      if (data.credits !== undefined) formData.append('credits', data.credits.toString());
      if (data.maxStudents !== undefined) formData.append('maxStudents', data.maxStudents.toString());
      if (data.lecturerId !== undefined) formData.append('lecturerId', data.lecturerId);
      
      formData.append('thumbnail', thumbnailFile); // Key chính xác là "thumbnail"

      return api.patch(`/courses/${courseId}`, formData);
    }

    // Nếu không có file → dùng JSON bình thường
    return api.patch(`/courses/${courseId}`, data);
  },

  // Xóa course
  deleteCourse: async (courseId: string) => {
    return api.delete(`/courses/${courseId}`);
  },

  // Lấy tất cả courses (public)
  getAllCourses: async () => {
    return api.get('/courses');
  },
};

export default api;