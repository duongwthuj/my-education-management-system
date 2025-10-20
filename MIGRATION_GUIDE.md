# Migration Guide: Mock Data → API

Hướng dẫn chuyển đổi các component từ sử dụng mock data sang sử dụng API thực.

## 📝 Tổng Quan

Hiện tại, các component đang sử dụng mock data từ thư mục `src/data/`. Sau khi kết nối Backend, chúng ta cần cập nhật để sử dụng API.

## 🔄 Các Bước Migration

### Bước 1: Import hook thay vì mock data

**Trước:**
```typescript
import { teachers } from '@/data';
```

**Sau:**
```typescript
import { useTeachers } from '@/hooks/use-teachers';
```

### Bước 2: Sử dụng hook trong component

**Trước:**
```typescript
export function TeachersList() {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    // JSX
  );
}
```

**Sau:**
```typescript
export function TeachersList() {
  const [searchQuery, setSearchQuery] = useState('');
  const { teachers, loading, error, refetch } = useTeachers();
  
  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    // JSX
  );
}
```

### Bước 3: Thêm loading và error states

**Ví dụ đầy đủ:**
```typescript
'use client';

import { useState } from 'react';
import { useTeachers } from '@/hooks/use-teachers';
import { CircularProgress, Alert, Box } from '@mui/material';

export function TeachersList() {
  const [searchQuery, setSearchQuery] = useState('');
  const { teachers, loading, error, refetch } = useTeachers();

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert 
        severity="error"
        action={
          <Button onClick={refetch}>Thử lại</Button>
        }
      >
        {error}
      </Alert>
    );
  }

  // Filter data
  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
}
```

## 📋 Checklist Migration

### Teachers Page
- [ ] `src/components/teachers/teachers-list.tsx` → Thêm `useTeachers()`
- [ ] `src/components/teachers/teachers-table.tsx` → Giữ nguyên (nhận props)
- [ ] `src/components/teachers/teacher-detail.tsx` → Thêm `useTeacher(id)`
- [ ] `src/app/dashboard/teachers/[id]/page.tsx` → Sử dụng `useTeacher()`

### Subjects Page
- [ ] `src/components/subjects/subjects-list.tsx` → Thêm `useSubjects()`
- [ ] `src/components/subjects/subject-card.tsx` → Giữ nguyên (nhận props)

### Classes Page
- [ ] `src/components/classes/classes-list.tsx` → Thêm `useClasses()`
- [ ] `src/components/classes/class-card.tsx` → Giữ nguyên (nhận props)

### Schedules Page
- [ ] `src/components/schedules/schedules-list.tsx` → Thêm `useSchedules()`
- [ ] `src/components/schedules/schedule-table.tsx` → Giữ nguyên (nhận props)
- [ ] `src/components/schedules/teacher-schedule-list.tsx` → Thêm `useTeacherSchedules()`

## 🔧 Xử Lý CRUD Operations

### Create (Tạo mới)

```typescript
import { teachersService } from '@/services';

async function handleCreate() {
  const response = await teachersService.create({
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    subjects: []
  });

  if (response.success) {
    // Refresh danh sách
    await refetch();
    // Hiển thị thông báo thành công
    toast.success('Tạo thành công!');
  } else {
    // Hiển thị lỗi
    toast.error(response.error);
  }
}
```

### Update (Cập nhật)

```typescript
import { teachersService } from '@/services';

async function handleUpdate(id: string) {
  const response = await teachersService.update(id, {
    name: 'New Name',
    phone: '0987654321'
  });

  if (response.success) {
    await refetch();
    toast.success('Cập nhật thành công!');
  } else {
    toast.error(response.error);
  }
}
```

### Delete (Xóa)

```typescript
import { teachersService } from '@/services';

async function handleDelete(id: string) {
  if (!confirm('Bạn có chắc muốn xóa?')) return;

  const response = await teachersService.delete(id);

  if (response.success) {
    await refetch();
    toast.success('Xóa thành công!');
  } else {
    toast.error(response.error);
  }
}
```

## 🎯 Best Practices

### 1. Luôn xử lý loading state
```typescript
if (loading) return <LoadingComponent />;
```

### 2. Luôn xử lý error state
```typescript
if (error) return <ErrorComponent error={error} onRetry={refetch} />;
```

### 3. Sử dụng refetch sau khi thay đổi data
```typescript
await teachersService.create(data);
await refetch(); // Cập nhật danh sách
```

### 4. Optimistic UI Updates (Optional)
```typescript
// Cập nhật UI trước, sau đó gọi API
setTeachers([...teachers, newTeacher]);
const response = await teachersService.create(newTeacher);
if (!response.success) {
  // Rollback nếu lỗi
  setTeachers(teachers);
}
```

### 5. Debounce cho search
```typescript
import { useDeferredValue } from 'react';

const deferredSearchQuery = useDeferredValue(searchQuery);
const filteredTeachers = teachers.filter(teacher =>
  teacher.name.toLowerCase().includes(deferredSearchQuery.toLowerCase())
);
```

## 📦 Component Example Files

Đã tạo file mẫu: `teachers-list-with-api.tsx`

Xem file này để tham khảo cách implement đầy đủ với:
- Loading states
- Error handling
- Search functionality
- Empty states

## 🚀 Deployment Checklist

Trước khi deploy production:

1. [ ] Thay đổi `NEXT_PUBLIC_API_URL` trong `.env.local` thành URL production
2. [ ] Kiểm tra tất cả API endpoints đang hoạt động
3. [ ] Test CRUD operations trên tất cả pages
4. [ ] Xử lý lỗi và edge cases
5. [ ] Thêm loading skeletons thay vì CircularProgress
6. [ ] Thêm toast notifications cho user feedback
7. [ ] Implement error boundaries
8. [ ] Test trên nhiều devices và browsers

## 📞 Support

Nếu gặp vấn đề trong quá trình migration:
1. Check console logs (F12)
2. Check Network tab để xem API responses
3. Verify Backend đang chạy
4. Check MongoDB connection
5. Review `INTEGRATION_GUIDE.md`
