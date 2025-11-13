import { useState, forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, type FieldError } from 'react-hook-form';
import { useRegisterStudent, useRegisterLecturer } from '../hooks/useAuthQuery';
import type { StudentRegisterData, LecturerRegisterData } from '../api/api';

type RegisterFormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  // student
  studentCode?: string;
  major?: string;
  enrollmentYear?: string;
  className?: string;
  // lecturer
  lecturerCode?: string;
  department?: string;
  title?: 'TA' | 'LECTURER' | 'SENIOR_LECTURER' | 'ASSOCIATE_PROFESSOR' | 'PROFESSOR';
  bio?: string;
};

export default function RegisterPage() {
  const [role, setRole] = useState<'student' | 'lecturer'>('student');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<RegisterFormData>({
    defaultValues: {
      title: 'LECTURER'
    }
  });

  const registerStudentMutation = useRegisterStudent();
  const registerLecturerMutation = useRegisterLecturer();
  const navigate = useNavigate();

  const currentMutation = role === 'student' ? registerStudentMutation : registerLecturerMutation;
  const password = watch('password');

  // Reset form khi đổi role
  const handleRoleChange = (newRole: 'student' | 'lecturer') => {
    setRole(newRole);
    reset();
  };

  const onSubmit = async (data: RegisterFormData) => {
    const { confirmPassword, enrollmentYear, ...restData } = data;
    
    try {
      if (role === 'student') {
        const studentData: StudentRegisterData = {
          fullName: restData.fullName,
          email: restData.email,
          password: restData.password,
          phone: restData.phone,
          studentCode: restData.studentCode!,
          major: restData.major,
          className: restData.className,
          enrollmentYear: enrollmentYear ? Number(enrollmentYear) : undefined
        };
        await registerStudentMutation.mutateAsync(studentData);
      } else {
        const lecturerData: LecturerRegisterData = {
          fullName: restData.fullName,
          email: restData.email,
          password: restData.password,
          phone: restData.phone,
          lecturerCode: restData.lecturerCode!,
          department: restData.department,
          title: restData.title!,
          bio: restData.bio,
        };
        await registerLecturerMutation.mutateAsync(lecturerData);
      }

      alert('Đăng ký thành công!');
      navigate('/');
    } catch (err: any) {
      console.error('Register error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-8 relative overflow-hidden">
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>

      <div className="max-w-lg w-full bg-surface rounded-2xl shadow-2xl overflow-hidden my-4 border border-color/50 relative z-10 backdrop-blur-sm transform transition-all duration-300 hover:shadow-xl">
        {/* Logo Header */}
        <div className="bg-primary px-8 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine"></div>
          
          <div className="flex items-center justify-center gap-3 relative z-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="text-primary" viewBox="0 0 24 24">
              <path d="M17.5 4.5c-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-1.45-1.1-3.55-1.5-5.5-1.5zM21 18.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
            </svg>
            <h1 className="text-3xl font-bold text-primary">SkillUp</h1>
          </div>
        </div>

        <div className="px-8 py-6 max-h-[calc(100vh-160px)] overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-main mb-2">Đăng ký tài khoản</h2>
            <p className="text-secondary text-sm">
              Tạo tài khoản mới để bắt đầu học tập
            </p>
          </div>

          {/* Role Selector */}
          <div className="flex justify-center mb-6 gap-3">
            <button
              type="button"
              className={`px-6 py-2.5 rounded-lg font-medium transition-all relative overflow-hidden group ${
                role === 'student'
                  ? 'bg-primary text-primary shadow-lg scale-105'
                  : 'bg-component text-main hover:bg-opacity-80 hover:scale-105'
              }`}
              onClick={() => handleRoleChange('student')}
              disabled={currentMutation.isPending || isSubmitting}
            >
              <span className="relative z-10">Sinh viên</span>
              {role === 'student' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              )}
            </button>
            <button
              type="button"
              className={`px-6 py-2.5 rounded-lg font-medium transition-all relative overflow-hidden group ${
                role === 'lecturer'
                  ? 'bg-primary text-primary shadow-lg scale-105'
                  : 'bg-component text-main hover:bg-opacity-80 hover:scale-105'
              }`}
              onClick={() => handleRoleChange('lecturer')}
              disabled={currentMutation.isPending || isSubmitting}
            >
              <span className="relative z-10">Giảng viên</span>
              {role === 'lecturer' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              )}
            </button>
          </div>

          {/* Error */}
          {currentMutation.isError && (
            <div className="mb-4 p-3 bg-background border-2 border-primary rounded-lg text-main text-sm font-medium">
              ⚠️ {(currentMutation.error as any)?.response?.data?.message || 'Có lỗi xảy ra!'}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput
              label="Họ và tên"
              {...register('fullName', {
                required: 'Họ và tên là bắt buộc'
              })}
              error={errors.fullName}
              disabled={currentMutation.isPending || isSubmitting}
            />
            
            <FormInput
              label="Email"
              type="email"
              {...register('email', {
                required: 'Email là bắt buộc',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email không hợp lệ'
                }
              })}
              error={errors.email}
              disabled={currentMutation.isPending || isSubmitting}
            />
            
            <FormInput
              label="Số điện thoại"
              type="tel"
              {...register('phone')}
              error={errors.phone}
              disabled={currentMutation.isPending || isSubmitting}
            />
            
            <FormInput
              label="Mật khẩu"
              type="password"
              {...register('password', {
                required: 'Mật khẩu là bắt buộc',
                minLength: {
                  value: 8,
                  message: 'Mật khẩu phải có ít nhất 8 ký tự'
                }
              })}
              error={errors.password}
              disabled={currentMutation.isPending || isSubmitting}
            />
            
            <FormInput
              label="Xác nhận mật khẩu"
              type="password"
              {...register('confirmPassword', {
                required: 'Xác nhận mật khẩu là bắt buộc',
                validate: value => value === password || 'Mật khẩu xác nhận không khớp'
              })}
              error={errors.confirmPassword}
              disabled={currentMutation.isPending || isSubmitting}
            />

            {/* Conditional Fields */}
            {role === 'student' && (
              <>
                <FormInput 
                  label="Mã sinh viên" 
                  {...register('studentCode', {
                    required: 'Mã sinh viên là bắt buộc'
                  })}
                  error={errors.studentCode}
                  disabled={currentMutation.isPending || isSubmitting}
                />
                <FormInput 
                  label="Ngành học" 
                  {...register('major')}
                  error={errors.major}
                  disabled={currentMutation.isPending || isSubmitting}
                />
                <FormInput 
                  label="Năm nhập học" 
                  type="number" 
                  {...register('enrollmentYear')}
                  error={errors.enrollmentYear}
                  disabled={currentMutation.isPending || isSubmitting}
                />
                <FormInput 
                  label="Lớp" 
                  {...register('className')}
                  error={errors.className}
                  disabled={currentMutation.isPending || isSubmitting}
                />
              </>
            )}

            {role === 'lecturer' && (
              <>
                <FormInput 
                  label="Mã giảng viên" 
                  {...register('lecturerCode', {
                    required: 'Mã giảng viên là bắt buộc'
                  })}
                  error={errors.lecturerCode}
                  disabled={currentMutation.isPending || isSubmitting}
                />
                <FormInput 
                  label="Khoa / Bộ môn" 
                  {...register('department')}
                  error={errors.department}
                  disabled={currentMutation.isPending || isSubmitting}
                />
                <div>
                  <label className="block text-sm font-medium text-main mb-2">
                    Chức danh
                  </label>
                  <select
                    {...register('title')}
                    disabled={currentMutation.isPending || isSubmitting}
                    className="w-full px-4 py-2.5 bg-background border border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-main transition-all disabled:opacity-50"
                  >
                    <option value="TA">Trợ giảng</option>
                    <option value="LECTURER">Giảng viên</option>
                    <option value="SENIOR_LECTURER">Giảng viên chính</option>
                    <option value="ASSOCIATE_PROFESSOR">Phó giáo sư</option>
                    <option value="PROFESSOR">Giáo sư</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-main mb-2">
                    Giới thiệu bản thân
                  </label>
                  <textarea
                    {...register('bio')}
                    disabled={currentMutation.isPending || isSubmitting}
                    rows={3}
                    placeholder="Chuyên gia về lập trình..."
                    className="w-full px-4 py-2.5 bg-background border border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-main placeholder:text-secondary transition-all resize-none disabled:opacity-50"
                  />
                </div>
              </>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={currentMutation.isPending || isSubmitting}
              className="w-full bg-primary text-primary font-semibold py-3 px-4 rounded-lg hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-2 relative overflow-hidden group"
            >
              <span className="relative z-10">
                {currentMutation.isPending || isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center pb-2">
            <p className="text-sm text-secondary">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="text-main hover:underline font-semibold"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** FormInput component with react-hook-form integration */
const FormInput = forwardRef<HTMLInputElement, {
  label: string;
  type?: string;
  error?: FieldError;
  disabled?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>>(
  ({ label, type = 'text', error, disabled = false, ...props }, ref) => {
    return (
      <div>
        <label className="block text-sm font-medium text-main mb-2">
          {label} {props.required && <span className="text-red-500">*</span>}
        </label>
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className="w-full px-4 py-2.5 bg-background border border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-main placeholder:text-secondary transition-all disabled:opacity-50"
          {...props}
        />
        {error && (
          <p className="text-red-500 text-xs mt-1">{error.message}</p>
        )}
      </div>
    );
  }
);