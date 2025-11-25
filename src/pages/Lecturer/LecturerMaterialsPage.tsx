// src/pages/Lecturer/LecturerMaterialsPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useCourses } from '../../hooks/useCourseQuery';
import {
  useMaterialsByCourse,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
} from '../../hooks/useLectureMaterialQuery';
import type { LectureMaterial, CreateLectureMaterialData, Course } from '../../types';

export default function LecturerMaterialsPage() {
  const user = useAuthStore((state) => state.user);
  const lecturerId = user?.lecturerId || '';

  // State
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<number | undefined>(undefined);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<LectureMaterial | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState<LectureMaterial | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileType: 'PDF',
    weekNumber: 1,
    isPublic: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // API Hooks
  const { data: coursesData } = useCourses({ lecturerId });
  const courses: Course[] = Array.isArray(coursesData)
    ? coursesData
    : Array.isArray((coursesData as any)?.data)
    ? (coursesData as any).data
    : (coursesData as any)?.data?.items || [];

  const { data: materialsData, isLoading: loadingMaterials } = useMaterialsByCourse(
    selectedCourseId,
    { search: searchTerm, week: selectedWeek }
  );
  const materials = materialsData || [];

  const filteredMaterials = useMemo(() => {
    if (!materials.length) return [];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return materials.filter((material) => {
      const matchesWeek =
        typeof selectedWeek === 'number' ? material.weekNumber === selectedWeek : true;

      if (!normalizedSearch) {
        return matchesWeek;
      }

      const haystack = `${material.title} ${material.description ?? ''}`.toLowerCase();
      return matchesWeek && haystack.includes(normalizedSearch);
    });
  }, [materials, searchTerm, selectedWeek]);

  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const deleteMutation = useDeleteMaterial();

  // Auto-select first course
  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      
      // Auto-detect file type
      const file = e.target.files[0];
      const extension = file.name.split('.').pop()?.toUpperCase() || 'OTHER';
      setFormData((prev) => ({ ...prev, fileType: extension }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedCourseId) return;

    const uploadData: CreateLectureMaterialData = {
      ...formData,
      courseId: selectedCourseId,
      file: selectedFile,
    };

    try {
      await createMutation.mutateAsync(uploadData);
      setShowUploadModal(false);
      resetForm();
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    try {
      await updateMutation.mutateAsync({
        id: editingMaterial.id,
        data: {
          ...formData,
          file: selectedFile || undefined,
        },
      });
      setShowEditModal(false);
      setEditingMaterial(null);
      resetForm();
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleDelete = async () => {
    if (!deletingMaterial) return;

    try {
      await deleteMutation.mutateAsync({
        id: deletingMaterial.id,
        courseId: deletingMaterial.courseId,
      });
      setShowDeleteConfirm(false);
      setDeletingMaterial(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const openEditModal = (material: LectureMaterial) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      description: material.description || '',
      fileType: material.fileType,
      weekNumber: material.weekNumber || 1,
      isPublic: material.isPublic,
    });
    setSelectedFile(null);
    setShowEditModal(true);
  };

  const openDeleteConfirm = (material: LectureMaterial) => {
    setDeletingMaterial(material);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      fileType: 'PDF',
      weekNumber: 1,
      isPublic: true,
    });
    setSelectedFile(null);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toUpperCase()) {
      case 'PDF':
        return (
          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M15.5,18C15.5,18.8 14.3,19.5 13,19.5C11.7,19.5 10.5,18.8 10.5,18V15H13C14.3,15 15.5,15.7 15.5,16.5C15.5,17.3 14.3,18 13,18M13,16H12V17H13C13.6,17 14,16.8 14,16.5C14,16.2 13.6,16 13,16M11,13H9V18H10V16H11C11.8,16 12.5,15.3 12.5,14.5C12.5,13.7 11.8,13 11,13M10,14H11C11.3,14 11.5,14.2 11.5,14.5C11.5,14.8 11.3,15 11,15H10V14M8,13H6V18H7V16.5H8C8.8,16.5 9.5,15.8 9.5,15C9.5,14.2 8.8,13.5 8,13.5M7,14H8C8.3,14 8.5,14.2 8.5,14.5C8.5,14.8 8.3,15 8,15H7V14M13,3.5L18.5,9H13V3.5Z"/>
          </svg>
        );
      case 'DOC':
      case 'DOCX':
        return (
          <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9H13.5V3.5L18.5,9M7,13H9V18H7V13M10,13H13A1,1 0 0,1 14,14V17A1,1 0 0,1 13,18H10V13M12,16H11V14H12V16M15,13H17A1,1 0 0,1 18,14V17A1,1 0 0,1 17,18H15V13M17,16H16V14H17V16Z"/>
          </svg>
        );
      case 'PPT':
      case 'PPTX':
        return (
          <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M15.5,18C15.5,18.8 14.3,19.5 13,19.5C11.7,19.5 10.5,18.8 10.5,18V15H13C14.3,15 15.5,15.7 15.5,16.5C15.5,17.3 14.3,18 13,18M13,16H12V17H13C13.6,17 14,16.8 14,16.5C14,16.2 13.6,16 13,16Z"/>
          </svg>
        );
      case 'MP4':
      case 'AVI':
      case 'MOV':
        return (
          <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-main mb-2">Quản lý Tài liệu</h1>
        <p className="text-secondary">Upload và quản lý tài liệu học tập cho các khóa học của bạn</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-surface rounded-xl shadow-md p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Course Select */}
          <div>
            <label className="block text-sm font-medium text-main mb-2">Khóa học</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-main"
            >
              <option value="">-- Chọn khóa học --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.courseCode} - {course.courseName}
                </option>
              ))}
            </select>
          </div>

          {/* Week Filter */}
          <div>
            <label className="block text-sm font-medium text-main mb-2">Tuần học</label>
            <select
              value={selectedWeek || ''}
              onChange={(e) => setSelectedWeek(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-4 py-2 bg-background border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-main"
            >
              <option value="">Tất cả</option>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((week) => (
                <option key={week} value={week}>
                  Tuần {week}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-main mb-2">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tìm theo tên tài liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-main"
            />
          </div>

          {/* Upload Button */}
          <div className="flex items-end">
            <button
              onClick={() => setShowUploadModal(true)}
              disabled={!selectedCourseId}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload
            </button>
          </div>
        </div>
      </div>

      {/* Materials List */}
      {!selectedCourseId ? (
        <div className="bg-surface rounded-xl shadow-md p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-secondary text-lg">Vui lòng chọn một khóa học để xem tài liệu</p>
        </div>
      ) : loadingMaterials ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-surface rounded-xl shadow-md p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-secondary text-lg mb-2">Chưa có tài liệu nào</p>
          <p className="text-secondary text-sm">Hãy upload tài liệu đầu tiên cho khóa học này</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-surface rounded-xl shadow-md p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-secondary text-lg mb-2">Không tìm thấy tài liệu phù hợp</p>
          <p className="text-secondary text-sm">Thử lại với từ khóa khác hoặc bỏ lọc tuần</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material: LectureMaterial) => (
            <div
              key={material.id}
              className="bg-surface rounded-xl shadow-md hover:shadow-lg transition-shadow p-4"
            >
              {/* File Icon and Type */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0">
                  {getFileIcon(material.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-main truncate mb-1">{material.title}</h3>
                  <p className="text-xs text-secondary">
                    {material.fileType} • Tuần {material.weekNumber || 'N/A'}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    material.isPublic
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {material.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {material.description && (
                <p className="text-sm text-secondary mb-3 line-clamp-2">{material.description}</p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <a
                  href={material.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Tải xuống
                </a>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(material)}
                    className="p-1.5 rounded-lg hover:bg-component transition-colors"
                    title="Chỉnh sửa"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-main" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(material)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Xóa"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowUploadModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-main mb-4">Upload Tài liệu</h2>
                
                <form onSubmit={handleUpload} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-main mb-2">
                      Tên tài liệu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-main"
                      placeholder="Nhập tên tài liệu..."
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-main mb-2">Mô tả</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-background border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-main resize-none"
                      placeholder="Nhập mô tả (tùy chọn)..."
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-main mb-2">
                      File <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      required
                      onChange={handleFileChange}
                      className="w-full px-4 py-2 bg-background border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-main file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                    />
                    {selectedFile && (
                      <p className="text-xs text-secondary mt-1">
                        {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* File Type */}
                    <div>
                      <label className="block text-sm font-medium text-main mb-2">
                        Loại file <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.fileType}
                        onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                        className="w-full px-4 py-2 bg-background border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-main"
                      >
                        <option value="PDF">PDF</option>
                        <option value="DOC">DOC</option>
                        <option value="DOCX">DOCX</option>
                        <option value="PPT">PPT</option>
                        <option value="PPTX">PPTX</option>
                        <option value="XLS">XLS</option>
                        <option value="XLSX">XLSX</option>
                        <option value="MP4">MP4</option>
                        <option value="AVI">AVI</option>
                        <option value="ZIP">ZIP</option>
                        <option value="RAR">RAR</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>

                    {/* Week Number */}
                    <div>
                      <label className="block text-sm font-medium text-main mb-2">Tuần</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.weekNumber}
                        onChange={(e) => setFormData({ ...formData, weekNumber: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-background border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-main"
                      />
                    </div>
                  </div>

                  {/* Is Public */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-background border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isPublic" className="text-sm text-main">
                      Công khai (tất cả sinh viên có thể xem)
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadModal(false);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-main rounded-lg hover:bg-component transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      {createMutation.isPending ? 'Đang upload...' : 'Upload'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && editingMaterial && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => {
              setShowEditModal(false);
              setEditingMaterial(null);
              resetForm();
            }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-main mb-4">Chỉnh sửa Tài liệu</h2>
                
                <form onSubmit={handleEdit} className="space-y-4">
                  {/* Same form fields as upload modal */}
                  <div>
                    <label className="block text-sm font-medium text-main mb-2">
                      Tên tài liệu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-main"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-main mb-2">Mô tả</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-background border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-main resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-main mb-2">
                      File mới (tùy chọn)
                    </label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="w-full px-4 py-2 bg-background border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-main file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {selectedFile && (
                      <p className="text-xs text-secondary mt-1">
                        {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-main mb-2">Loại file</label>
                      <select
                        value={formData.fileType}
                        onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                        className="w-full px-4 py-2 bg-background border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-main"
                      >
                        <option value="PDF">PDF</option>
                        <option value="DOC">DOC</option>
                        <option value="DOCX">DOCX</option>
                        <option value="PPT">PPT</option>
                        <option value="PPTX">PPTX</option>
                        <option value="XLS">XLS</option>
                        <option value="XLSX">XLSX</option>
                        <option value="MP4">MP4</option>
                        <option value="AVI">AVI</option>
                        <option value="ZIP">ZIP</option>
                        <option value="RAR">RAR</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-main mb-2">Tuần</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.weekNumber}
                        onChange={(e) => setFormData({ ...formData, weekNumber: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-background border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-main"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublicEdit"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-background border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isPublicEdit" className="text-sm text-main">
                      Công khai (tất cả sinh viên có thể xem)
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingMaterial(null);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-main rounded-lg hover:bg-component transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      {updateMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingMaterial && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeletingMaterial(null);
            }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-main mb-4">Xác nhận xóa</h2>
              <p className="text-secondary mb-6">
                Bạn có chắc chắn muốn xóa tài liệu "<strong>{deletingMaterial.title}</strong>"?
                <br />
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingMaterial(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-main rounded-lg hover:bg-component transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

