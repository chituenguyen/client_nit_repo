// src/types.ts - Tổng hợp tất cả types cho cả Student và Lecturer

// ==================== USER & AUTH TYPES ====================

export const UserRole = {
    STUDENT: 'student',
    LECTURER: 'lecturer'
  } as const;
  
  export type UserRole = typeof UserRole[keyof typeof UserRole];
  
  export interface User {
    id: string;
    email: string;
    full_name: string;
    avatar: string;
    role: UserRole;
    phone?: string;
    createdAt: string;
    updatedAt?: string;
    lecturerId?: string; // ID từ bảng LECTURER (khác với userId)
    studentId?: string;  // ID từ bảng STUDENT (khác với userId)
  }
  
  export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  }
  
  
  
  // ==================== LECTURER TYPES ====================
  
  export type LecturerTitle = 
    | 'TA' 
    | 'LECTURER' 
    | 'SENIOR_LECTURER' 
    | 'ASSOCIATE_PROFESSOR' 
    | 'PROFESSOR';
  
  export interface Lecturer {
    id: string;
    userId: string;
    lecturerCode: string;
    department: string;
    title: string;
    bio: string;
    user: UserProfile;
  }
  
  // ==================== SCHEDULE TYPES ====================
  
  export type DayOfWeek = 
    | 'MONDAY' 
    | 'TUESDAY' 
    | 'WEDNESDAY' 
    | 'THURSDAY' 
    | 'FRIDAY' 
    | 'SATURDAY' 
    | 'SUNDAY';
  
  export interface ScheduleCount {
    enrollments: number;
  }
  
  export interface Schedule {
    id: string;
    courseId: string;
    semester: string;
    academicYear: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    room: string;
    startDate: string;
    endDate: string;
    totalWeeks: number;
    _count: ScheduleCount;
  }
  
  // ==================== COURSE TYPES ====================
  
  export interface CourseCount {
    assignments: number;
    lectureMaterials: number;
    schedules?: number;
  }
  
  export interface Course {
    id: string;
    courseCode: string;
    courseName: string;
    description: string | null;
    thumbnailUrl: string | null;
    credits: number;
    lecturerId: string;
    maxStudents: number;
    createdAt: string;
    updatedAt: string;
    lecturer: Lecturer;
    schedules: Schedule[];
    _count: CourseCount;
  }
  
  // Types cho Lecturer tạo/cập nhật khóa học
  export interface CreateCourseData {
    courseCode: string;
    courseName: string;
    description: string;
    credits: number;
    maxStudents: number;
    lecturerId: string;
    thumbnailUrl?: string;
  }
  
  export interface CreateScheduleData {
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
  }
  
  // ==================== ENROLLMENT TYPES ====================
  
  export type EnrollmentStatus = 'ENROLLED' | 'DROPPED' | 'COMPLETED';
  
  export interface Enrollment {
    id: string;
    studentId: string;
    scheduleId: string;
    enrollmentDate: string;
    status: EnrollmentStatus;
    schedule: {
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
      course: Course;
    };
  }
  
  // ==================== API RESPONSE TYPES ====================
  
  export interface ApiError {
    message: string;
    statusCode?: number;
  }
  
  export interface CoursesParams {
    search?: string;
    lecturerId?: string;
    page?: number;
    limit?: number;
  }
  
  export interface CoursesResponse {
    success: boolean;
    data: Course[] | { items: Course[]; total: number; page: number; limit: number };
    message?: string;
  }
  
  export interface CourseDetailResponse {
    success: boolean;
    data: Course;
    message?: string;
  }
  
  export interface EnrollmentResponse {
    success: boolean;
    message: string;
    data?: {
      id: string;
      scheduleId: string;
      studentId: string;
      enrolledAt: string;
    };
  }
  
  export interface UnenrollResponse {
    success: boolean;
    message: string;
  }
  
  export interface MyEnrollmentsResponse {
    success: boolean;
    data: Enrollment[];
    message?: string;
  }
  
  // ==================== FORM TYPES ====================
  
  export interface LoginFormData {
    email: string;
    password: string;
  }
  
  export interface RegisterFormData {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    // student fields
    studentCode?: string;
    major?: string;
    enrollmentYear?: string;
    className?: string;
    // lecturer fields
    lecturerCode?: string;
    department?: string;
    title?: LecturerTitle;
    bio?: string;
  }
  
  // Types cho API register
  export interface StudentRegisterData {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    studentCode: string;
    major?: string;
    enrollmentYear?: number;
    className?: string;
  }
  
  export interface LecturerRegisterData {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    lecturerCode: string;
    department?: string;
    title: LecturerTitle;
    bio?: string;
  }
  
  // ==================== CALENDAR TYPES ====================
  
  export type CalendarView = 'Day' | 'Week' | 'Month';
  
  export interface CalendarTask {
    id: string;
    title: string;
    room: string;
    startTime: string;
    endTime: string;
  }
  
  // ==================== ASSIGNMENT TYPES ====================
  
  export interface Assignment {
    id: string;
    title: string;
    description: string;
    courseId: string;
    dueDate: string;
    maxScore?: number;
    weekNumber?: number;
    fileUrl?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface CreateAssignmentPayload {
    title: string;
    description: string;
    courseId: string;
    dueDate?: string; // ISO-8601 datetime
    maxScore?: number;
    weekNumber?: number;
  }
  
  export interface AssignmentsResponse {
    success: boolean;
    data: Assignment[];
    message?: string;
  }
  
  export interface AssignmentDetailResponse {
    success: boolean;
    data: Assignment;
    message?: string;
  }
  
  // ==================== SUBMISSION TYPES ====================
  
  export interface Submission {
    id: string;
    assignmentId: string;
    studentId: string;
    submittedAt: string;
    fileUrl?: string;
    submissionText?: string;
    score?: number;
    feedback?: string;
    gradedAt?: string;
    gradedBy?: string;
    student?: {
      id: string;
      studentCode?: string;
      major?: string;
      enrollmentYear?: number;
      className?: string;
      user?: {
        fullName: string;
        email: string;
        avatar?: string;
      };
    };
    assignment?: {
      title: string;
      maxScore?: number;
    };
    grader?: {
      id: string;
      user?: {
        fullName: string;
      };
    };
  }
  
  // ==================== UTILITY TYPES ====================
  
  export interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
  }
  
  export interface LocationState {
    from?: {
      pathname: string;
    };
  }
  
  // Normalize role từ API
  export const normalizeRole = (apiRole: string | number | null | undefined): UserRole => {
    if (
      apiRole === 2 || 
      apiRole === '2' || 
      apiRole === 'LECTURER' || 
      apiRole === 'lecturer' ||
      (typeof apiRole === 'string' && apiRole.toUpperCase() === 'LECTURER')
    ) {
      return UserRole.LECTURER;
    }
    return UserRole.STUDENT;
  };