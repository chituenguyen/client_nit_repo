# Hướng Dẫn Tạo Course Cho Lecturer

Tài liệu này cô đọng lại toàn bộ kiến thức cần thiết để giảng viên tạo khóa học (Course) trên hệ thống: từ nền tảng dữ liệu, cách giao tiếp với API, tới cách các hooks React/React Query phối hợp vận hành – đặc biệt là `useMemo` và `useDebounce`. Mục tiêu là giúp bạn vừa hiểu lý thuyết, vừa nắm quy trình chi tiết để có thể debug và mở rộng dễ dàng.

---

## 1. Mục Tiêu

- Hiểu sự khác biệt giữa `userId` (tài khoản) và `lecturerId` (thực thể giảng viên).
- Nắm rõ các endpoint và payload liên quan tới việc tạo course.
- Theo dõi toàn bộ luồng hoạt động: đăng nhập → điền form → gọi API → đồng bộ danh sách.
- Hiểu vai trò của từng hook chính (`useForm`, `useFieldArray`, `useMutation`, `useQuery`, `useEffect`, `useMemo`, `useDebounce`).
- Có checklist thao tác và gợi ý debug khi gặp sự cố.

---

## 2. Kiến Thức Nền Tảng

### 2.1 Mô Hình Dữ Liệu

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    USER     │       │   LECTURER   │       │   COURSE    │
├─────────────┤       ├──────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)      │──┐    │ id (PK)     │
│ email       │  │    │ userId (FK)  │  │    │ lecturerId  │──┐
│ fullName    │  └───>│ lecturerCode │  │    │ courseCode  │  │
│ role        │       │ department   │  │    │ courseName  │  │
│ ...         │       │ title        │  │    │ ...         │  │
└─────────────┘       │ bio          │  │    └─────────────┘  │
                      └──────────────┘  │                      │
                                         └──────────────────────┘
```

- `USER.id` là ID của tài khoản đăng nhập.
- `LECTURER.id` là ID nghiệp vụ của giảng viên, liên kết với `USER` qua `userId`.
- `COURSE.lecturerId` luôn trỏ tới `LECTURER.id`. Đây là giá trị backend yêu cầu khi tạo course.

### 2.2 Khái Niệm Cần Nắm

- **userId ≠ lecturerId**: dù cùng một con người, backend tách hai bảng để dễ mở rộng đa vai trò. Tạo course phải dùng `lecturerId`.
- **JWT Access Token**: mọi request cần gửi token; axios interceptor đã tự thêm.
- **Schedule**: backend có thể trả lịch học trong payload course hoặc cần gọi thêm `/schedules?courseId=...`. Frontend đã chuẩn bị cả hai trường hợp.
- **Thumbnail**: trường `thumbnailUrl` tùy chọn (URL string) để tăng khả năng nhận diện khóa học; render trong card với fallback tự động khi ảnh lỗi hoặc không tồn tại.

### 2.3 Endpoint Chính

| Endpoint | Method | Chức năng |
|----------|--------|-----------|
| `/api/v1/auth/login` | POST | Đăng nhập, trả về user + lecturer/student + token |
| `/api/v1/courses` | POST | Tạo course (bắt buộc `lecturerId`) |
| `/api/v1/courses/my-courses` | GET | Lấy danh sách course của lecturer hiện tại |
| `/api/v1/schedules` | POST/PATCH/DELETE | Quản lý lịch học |
| `/api/v1/schedules?courseId=` | GET | Lấy lịch học của một course cụ thể |

---

## 3. Thành Phần Frontend Liên Quan

- `src/hooks/useAuthQuery.ts`: đăng nhập, chuẩn hóa user, lưu `lecturerId` vào Zustand.
- `src/stores/authStore.ts`: lưu user hiện tại và thông tin quyền hạn.
- `src/pages/api.ts`: axios instance + `courseApi` (create course, fetch courses, fetch schedules...).
- `src/pages/CreateCoursePage.tsx`: form tạo course, quản lý schedules, gọi mutation.
- `src/pages/LecturerCoursesPage.tsx`: danh sách khóa học, tìm kiếm, lọc, sort, đồng bộ lịch học.
- `src/hooks/useDebounce.ts`: hook debounce dùng cho ô tìm kiếm.

---

## 4. Luồng Hoạt Động Chi Tiết

### Bước 1 – Đăng Nhập & Lấy `lecturerId`

1. Người dùng submit form đăng nhập → `useLogin` (React Query `useMutation`).
2. Backend trả về user + nested lecturer + token.
3. `useLogin` chuẩn hóa dữ liệu, trích `user.lecturer?.id` và lưu vào Zustand store (`user.lecturerId`).
4. Lưu `accessToken`, `refreshToken` vào localStorage để interceptor sử dụng.

### Bước 2 – Mở Form Tạo Course

1. `CreateCoursePage` gọi `useAuthStore` để lấy `user` hiện tại.
2. `useForm` khởi tạo state form; `useFieldArray` quản lý danh sách lịch học động.
3. Nếu ở chế độ chỉnh sửa, `useEffect` sẽ prefill dữ liệu từ API (logic đã chuẩn bị sẵn).

### Bước 3 – Submit Form

1. Người dùng điền form (tên, mã, mô tả, tín chỉ, số học viên, **thumbnail** – tùy chọn) và nhấn submit.
   - **Thumbnail**: Chọn file ảnh từ máy tính (JPG/PNG/WebP, tối đa 5MB). Preview tự động hiển thị ngay khi chọn ảnh.
2. `onSubmit` kiểm tra `user?.lecturerId`. Nếu thiếu → cảnh báo đăng nhập lại.
3. Chuẩn hóa payload `CreateCourseData`: ép kiểu số (`credits`, `maxStudents`), gán `lecturerId`.
4. **Xử lý ảnh**: Nếu có file, gửi `FormData` với key `thumbnail`; backend upload lên Cloudflare R2 và trả về URL.
5. Gọi `createCourseMutation.mutateAsync({ data: payload, file: thumbnailFile })` (POST `/courses`).
6. Thành công → hiện thông báo → `invalidateQueries({ queryKey: ['lecturer-courses'] })` → điều hướng `/lecturer/courses`.
7. Thất bại → hiển thị thông báo lỗi dựa trên `error.response?.data?.message`.

### Bước 4 – Tạo/Cập Nhật Lịch Học (Tuỳ Chọn)

1. Khi đã có `courseId`, component có thể gọi các mutation schedule (`POST/PATCH/DELETE /schedules`).
2. Payload cần chuẩn hóa ngày (`ISO`), giờ bắt đầu/kết thúc, `totalWeeks`.
3. Nếu một lịch lỗi, khóa học vẫn giữ nguyên nhưng phải cảnh báo người dùng.

### Bước 5 – Đồng Bộ Danh Sách Courses

1. `LecturerCoursesPage` dùng `useInfiniteQuery` (queryKey gồm `lecturerId`, `debouncedSearchTerm`) để gọi `/courses` với tham số `page`, `limit` (mặc định 9 mục/trang).
2. Mỗi lần fetch trả về `{ items, meta }`; `useMemo` gộp `data.pages.flatMap` thành một mảng `courses` thống nhất.
3. `IntersectionObserver` quan sát sentinel cuối danh sách, khi người dùng cuộn chạm đáy và `hasNextPage` → tự động `fetchNextPage()` để tải trang tiếp theo.
4. Song song, `useEffect` tiếp tục bổ sung lịch học qua `courseApi.getCourseSchedules`, còn `useMemo` sinh `filteredCourses` dựa trên bộ lọc giao diện.

---

## 5. Hooks Chính & Cách Hoạt Động

### 5.1 `useDebounce`

- **Vị trí**: `LecturerCoursesPage`.
- **Vai trò**: Chờ người dùng ngừng nhập 500ms rồi mới kích hoạt refetch, tránh spam API.
- **Mẫu sử dụng**:
```typescript
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['lecturer-courses', lecturerId ?? 'unknown', debouncedSearchTerm],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => courseApi.getLecturerCourses({
      search: debouncedSearchTerm || undefined,
      page: pageParam,
      limit: 9,
      lecturerId,
    }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.meta?.hasNextPage ? allPages.length + 1 : undefined,
  });
```
- `debouncedSearchTerm` đổi → query tự refetch, vẫn đảm bảo không spam API.
- Kết hợp với `IntersectionObserver`, khi sentinel xuất hiện thì gọi `fetchNextPage()` nếu `hasNextPage`.

### 5.2 `useMemo`

- **Vị trí**: `LecturerCoursesPage` (chuẩn hóa dữ liệu, tạo filter) và các phép tính khác.
- **Tác dụng**:
  - Chuyển đổi response của API thành `Course[]` dù backend trả `{ data: [...] }` hay `[...]`.
  - Sinh `semesterOptions`, `dayOptions` từ dữ liệu đã đồng bộ.
  - Tính `filteredCourses` (tìm kiếm, lọc, sắp xếp) chỉ khi input thay đổi.
- **Lợi ích**: Tránh tính toán lại trên mỗi render, giúp UI mượt mà dù dữ liệu lớn.

### 5.3 `useInfiniteQuery` & IntersectionObserver

- `useInfiniteQuery` cung cấp `data.pages`, `fetchNextPage`, `hasNextPage`, `isFetchingNextPage` để điều phối phân trang vô hạn.
- `getNextPageParam` đọc `meta` linh hoạt (ưu tiên `nextPage`, `hasNextPage`, `currentPage/totalPages`; fallback vào độ dài trang hiện tại so với `limit`).
- Một `useEffect` khởi tạo `IntersectionObserver` theo dõi `<div ref={loadMoreRef}>`; khi phần tử đi vào viewport và vẫn còn trang kế → gọi `fetchNextPage()`.
- Dùng `rootMargin` lớn (ví dụ `240px`) để nạp trước khi người dùng chạm đáy, giúp trải nghiệm mượt hơn.

### 5.4 Các Hook Khác

- `useForm` + `useFieldArray`: quản lý form và danh sách lịch động, cung cấp validation và error từng phần tử.
- `useMutation`: xử lý login, create course/schedule, cung cấp trạng thái pending/success/error.
- `useInfiniteQuery`: fetch danh sách courses theo trang, hỗ trợ cache & tự động tải thêm khi cần.
- `useEffect`: đồng bộ schedules khi danh sách courses đổi; prefill dữ liệu trong chế độ edit.
- `useRef`: `fetchedScheduleIds` (Set) bảo đảm mỗi course chỉ fetch lịch một lần.

---

## 6. Thao Tác Thực Tế

1. **Đăng nhập** bằng tài khoản Lecturer.
2. **Kiểm tra console**: phải thấy log `lecturerId` (ví dụ `c672474c-...`).
3. **Truy cập** `/lecturer/courses/create`.
4. **Điền form**:
   - `courseCode`: chữ IN HOA + số, ví dụ `CS101`.
   - `courseName`: tối thiểu 5 ký tự.
   - `description`: tối thiểu 20 ký tự.
   - **`thumbnail`**: (tùy chọn) chọn file ảnh từ máy tính (JPG/PNG/WebP, tối đa 5MB). Ảnh sẽ được upload lên Cloudflare R2.
   - `credits`: số 1-10.
   - `maxStudents`: số 1-200.
   - (Tuỳ chọn) thêm lịch học trong phần Schedule.
5. **Submit** → kiểm tra console đảm bảo payload có `lecturerId`.
6. **Thông báo thành công** xuất hiện, trang điều hướng về `/lecturer/courses`.
7. **Xem lại danh sách**: course mới hiển thị; nếu lịch chưa hiện ngay, chờ `useEffect` fetch (sẽ thấy trạng thái `Đang tải lịch học...`).

---

## 7. Đồng Bộ Trong `LecturerCoursesPage`

1. **Scroll vô hạn**: `IntersectionObserver` quan sát sentinel `<div ref={loadMoreRef}>`, khi `hasNextPage` bật → `fetchNextPage()` và hiển thị spinner `isFetchingNextPage` / thông báo “Đã hiển thị tất cả khóa học”.
2. **Chuẩn hóa dữ liệu** bằng `useMemo` để xử lý mọi dạng trả về của API.
3. **Tạo filter options** (`semesterOptions`, `dayOptions`) dựa trên dữ liệu kết hợp giữa API và `scheduleMap`.
4. **Lọc & sắp xếp**: search (đã debounce), filter theo học kỳ/ngày, sort theo thời gian tạo/cập nhật hoặc tên (locale `vi`).
5. **Hiển thị thumbnail**: mỗi card course hiển thị `thumbnailUrl` (URL từ Cloudflare R2) ở đầu (nếu có), kèm `onError` ẩn ảnh lỗi, gradient mờ phía dưới. Nếu không có thumbnail, hiển thị gradient đẹp mắt với icon mặc định.
6. **Hiển thị lịch**:
   - Ưu tiên `scheduleMap[course.id]`.
   - Nếu đang fetch: show loading text.
   - Nếu trống: nhắc người dùng bổ sung lịch.
7. **Hành động**: nút "Chỉnh sửa" dẫn tới `/lecturer/courses/:id/edit`; nút xóa bị disable (chỉ admin).

---

## 8. Gợi Ý Debug

- **Thiếu lecturerId**: kiểm tra `useLogin`, đảm bảo tài khoản có role Lecturer và `user.lecturer?.id` không null.
- **401 Unauthorized**: token chưa lưu hoặc đã hết hạn → xem interceptor, localStorage.
- **courses.reduce is not a function**: đảm bảo đã chuẩn hóa dữ liệu trước khi thao tác.
- **Lịch không xuất hiện**: mở network panel xem request `/schedules`; kiểm tra `fetchedScheduleIds` tránh fetch trùng.
- **Search không hoạt động**: giảm `delay` trong `useDebounce` để thử, đảm bảo `debouncedSearchTerm` thay đổi.
- **Không tải thêm trang**: kiểm tra `meta` backend (trả `hasNextPage`/`nextPage`), chắc chắn sentinel vẫn render và `IntersectionObserver` không bị cleanup sớm.

---

## 9. Checklist Trước Khi Release

- [ ] Đăng nhập Lecturer lấy được `lecturerId`.
- [ ] Submit form tạo course thành công, payload đúng chuẩn.
- [ ] Upload ảnh lên Cloudflare R2 thành công (nếu có file), backend trả về public URL.
- [ ] Course mới xuất hiện trong danh sách sau invalidate.
- [ ] Thumbnail (nếu có) hiển thị đúng trong card course với hiệu ứng hover đẹp mắt.
- [ ] Lịch học (nếu có) hiển thị sau khi fetch bổ sung.
- [ ] Ô tìm kiếm + debounce hoạt động (test với ký tự khác nhau).
- [ ] Bộ lọc học kỳ/ngày và sort theo tên/thời gian hoạt động.
- [ ] Cuộn đến cuối danh sách sẽ tự động tải thêm và hiển thị thông báo khi hết dữ liệu.
- [ ] Tài khoản không phải Lecturer không truy cập được trang này.

---

## 10. Tóm Tắt Kiến Thức Cốt Lõi

- **userId và lecturerId là hai giá trị khác nhau** – gửi sai ID là nguyên nhân chính gây lỗi “Lecturer not found”.
- **Hooks phối hợp**:
  - `useDebounce` + `useInfiniteQuery` → tìm kiếm mượt mà, tự động phân trang vô hạn.
  - `useMemo` → tránh tính toán lại, đặc biệt với danh sách và filter phức tạp.
  - `useMutation` → điều phối request POST/PATCH/DELETE, kết hợp invalidate để đồng bộ UI.
  - `useForm` + `useFieldArray` → tạo form linh hoạt mà vẫn type-safe.
- **Interceptor** đảm bảo mọi request có token và tự xử lý 401.
- **Invalidation** sau mutation là chìa khóa để giữ dữ liệu nhất quán trên toàn ứng dụng.
- **Thumbnail**: trường tùy chọn để tăng tính hấp dẫn, dễ nhận diện khóa học; hỗ trợ upload file trực tiếp từ máy tính (JPG/PNG/WebP, tối đa 5MB) với key `thumbnail` trong FormData; backend lưu ảnh lên Cloudflare R2 và trả về URL trong `thumbnailUrl`; hiển thị trong card với fallback ẩn khi lỗi và gradient/icon mặc định nếu thiếu ảnh.