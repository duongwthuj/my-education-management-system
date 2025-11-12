import React, { useState, useEffect } from 'react';
import { Plus, Zap, RefreshCw, Check, X, Eye, Edit, Trash2, AlertCircle, CheckCircle, Info, BookMarked, TrendingUp } from 'lucide-react';
import { offsetClassesAPI, teachersAPI, subjectsAPI } from '../services/api';
import { format } from 'date-fns';

const OffsetClasses = () => {
  const [offsetClasses, setOffsetClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectLevels, setSubjectLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    subjectLevelId: '',
    className: '',
    scheduledDate: '',
    startTime: '',
    endTime: '',
    reason: '',
    meetingLink: '',
    notes: '',
    assignedTeacherId: '',
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showAll, setShowAll] = useState(true); // Mặc định hiển thị tất cả

  // Auto hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };

  const handleConfirm = () => {
    if (confirmDialog?.onConfirm) {
      confirmDialog.onConfirm();
    }
    setConfirmDialog(null);
  };

  useEffect(() => {
    loadData();
  }, [filterStatus, filterDateFrom, filterDateTo, showAll]);

  // Auto refresh mỗi 30 giây để cập nhật offset classes mới từ DB
  // DISABLED: Gây conflict với filter
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     loadData();
  //   }, 30000); // 30 seconds

  //   return () => clearInterval(interval);
  // }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      if (filterDateFrom) {
        params.startDate = filterDateFrom;
      }
      
      if (filterDateTo) {
        params.endDate = filterDateTo;
      }
      
      // Chỉ thêm limit nếu không hiển thị tất cả
      if (!showAll) {
        params.limit = 50; // Giới hạn 50 items khi phân trang
      }
      
      console.log('🔍 Loading offset classes with params:', params);
      
      const [offsetRes, teachersRes, subjectsRes, levelsRes] = await Promise.all([
        offsetClassesAPI.getAll(params),
        teachersAPI.getAll(),
        subjectsAPI.getAll(),
        subjectsAPI.getAllLevels(),
      ]);

      console.log('✅ Loaded offset classes:', offsetRes.data?.length, 'items');
      setOffsetClasses(offsetRes.data || []);
      setTeachers(teachersRes.data || []);
      setSubjects(subjectsRes.data || []);
      setSubjectLevels(levelsRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleSubmitWithAutoAssignment = async (e) => {
    e.preventDefault();
    try {
      setAutoAssigning(true);
      
      if (editingId) {
        // Update existing offset class
        const updateData = { ...formData };
        
        // Chuyển assignedTeacherId rỗng thành null (MongoDB yêu cầu)
        if (!updateData.assignedTeacherId || updateData.assignedTeacherId === '') {
          updateData.assignedTeacherId = null;
          updateData.status = 'pending';
        } else {
          updateData.status = 'assigned';
        }
        
        await offsetClassesAPI.update(editingId, updateData);
        showNotification('Lớp offset đã được cập nhật thành công!', 'success');
      } else {
        // Create new offset class
        const createData = { ...formData };
        
        // Chuyển assignedTeacherId rỗng thành null
        if (!createData.assignedTeacherId || createData.assignedTeacherId === '') {
          createData.assignedTeacherId = null;
          delete createData.assignedTeacherId; // Xóa luôn để backend tự xử lý
          
          // Không có giáo viên, gọi API tự động phân công
          const response = await offsetClassesAPI.createWithAssignment(createData);

          if (response.autoAssigned) {
            showNotification('Lớp offset đã được tạo và tự động phân công giáo viên thành công!', 'success');
          } else {
            showNotification('Lớp offset đã được tạo nhưng không tìm thấy giáo viên phù hợp. Vui lòng kiểm tra lại thời gian hoặc phân công thủ công.', 'warning');
          }
        } else {
          // Có chọn giáo viên, tạo trực tiếp
          createData.status = 'assigned';
          const response = await offsetClassesAPI.create(createData);
          showNotification('Lớp offset đã được tạo và phân công giáo viên thành công!', 'success');
        }
      }

      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Error saving offset class:', error);
      
      // Xử lý error message thân thiện hơn
      if (error.message.includes('No suitable teacher found')) {
        showNotification('Không tìm thấy giáo viên phù hợp! Vui lòng kiểm tra lại thời gian hoặc phân công thủ công.', 'error');
      } else {
        showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
      }
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleAutoAssign = async (id) => {
    showConfirm('Bạn có muốn tự động phân công giáo viên cho lớp này?', async () => {
      try {
        const response = await offsetClassesAPI.autoAssign(id);
        
        // Cập nhật ngay lập tức trong state thay vì chờ loadData()
        if (response.success && response.data) {
          setOffsetClasses(prev => 
            prev.map(oc => 
              oc._id === id 
                ? { ...oc, ...response.data, status: 'assigned' }
                : oc
            )
          );
        }
        
        showNotification('Đã phân công giáo viên thành công!', 'success');
        
        // Vẫn gọi loadData() để đảm bảo sync với server
        setTimeout(() => loadData(), 1000);
      } catch (error) {
        console.error('Error auto-assigning:', error);
        
        if (error.message.includes('No suitable teacher found')) {
          showNotification('Không tìm thấy giáo viên phù hợp! Vui lòng phân công thủ công.', 'warning');
        } else {
          showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
        }
      }
    });
  };

  const handleAutoAssignAll = async () => {
    const pendingClasses = offsetClasses.filter(
      oc => oc.status === 'pending' && !oc.assignedTeacherId
    );

    if (pendingClasses.length === 0) {
      showNotification('Không có lớp nào cần phân công!', 'info');
      return;
    }

    showConfirm(`Bạn có muốn tự động phân công ${pendingClasses.length} lớp đang chờ xử lý?`, async () => {
      setAutoAssigning(true);
      let successCount = 0;
      let failCount = 0;

      try {
        for (const offsetClass of pendingClasses) {
          try {
            await offsetClassesAPI.autoAssign(offsetClass._id);
            successCount++;
          } catch (error) {
            console.error(`Failed to assign class ${offsetClass._id}:`, error);
            failCount++;
          }
        }

        const message = `Hoàn tất! Thành công: ${successCount} lớp, Thất bại: ${failCount} lớp`;
        showNotification(message, failCount === 0 ? 'success' : 'warning');
        loadData();
      } catch (error) {
        console.error('Error in auto assign all:', error);
        showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
      } finally {
        setAutoAssigning(false);
      }
    });
  };

  const handleReallocate = async (id) => {
    showConfirm('Bạn có muốn tái phân bổ giáo viên khác?', async () => {
      try {
        await offsetClassesAPI.reallocate(id);
        showNotification('Đã tái phân bổ giáo viên thành công!', 'success');
        loadData();
      } catch (error) {
        console.error('Error reallocating:', error);
        showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
      }
    });
  };

  const handleMarkCompleted = async (id) => {
    try {
      await offsetClassesAPI.markCompleted(id);
      showNotification('Đã đánh dấu hoàn thành!', 'success');
      loadData();
    } catch (error) {
      console.error('Error marking completed:', error);
      showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
    }
  };

  const handleCancel = async (id) => {
    const reason = prompt('Lý do hủy lớp:');
    if (!reason) return;

    try {
      await offsetClassesAPI.cancel(id, reason);
      showNotification('Đã hủy lớp offset!', 'success');
      loadData();
    } catch (error) {
      console.error('Error cancelling:', error);
      showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
    }
  };

  const handleEdit = (offsetClass) => {
    setEditingId(offsetClass._id);
    setFormData({
      subjectLevelId: offsetClass.subjectLevelId?._id || '',
      className: offsetClass.className || '',
      scheduledDate: format(new Date(offsetClass.scheduledDate), 'yyyy-MM-dd'),
      startTime: offsetClass.startTime || '',
      endTime: offsetClass.endTime || '',
      reason: offsetClass.reason || '',
      meetingLink: offsetClass.meetingLink || '',
      notes: offsetClass.notes || '',
      assignedTeacherId: offsetClass.assignedTeacherId?._id || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    showConfirm('Bạn có chắc chắn muốn xóa lớp offset này?', async () => {
      try {
        await offsetClassesAPI.delete(id);
        showNotification('Đã xóa lớp offset thành công!', 'success');
        loadData();
      } catch (error) {
        console.error('Error deleting:', error);
        showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
      }
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      subjectLevelId: '',
      className: '',
      scheduledDate: '',
      startTime: '',
      endTime: '',
      reason: '',
      meetingLink: '',
      notes: '',
      assignedTeacherId: '',
    });
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: {
        className: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
        label: 'Chờ xử lý'
      },
      assigned: {
        className: 'bg-purple-50 text-purple-700 border border-purple-200',
        label: 'Đã phân công'
      },
      completed: {
        className: 'bg-green-50 text-green-700 border border-green-200',
        label: 'Hoàn thành'
      },
      cancelled: {
        className: 'bg-red-50 text-red-700 border border-red-200',
        label: 'Đã hủy'
      },
    };
    
    const config = configs[status] || configs.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`
            max-w-md rounded-lg shadow-lg p-4 flex items-start gap-3
            ${notification.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' : ''}
            ${notification.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' : ''}
            ${notification.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''}
            ${notification.type === 'info' ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
          `}>
            <div className="flex-shrink-0">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
              {notification.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
              {notification.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium
                ${notification.type === 'success' ? 'text-green-800' : ''}
                ${notification.type === 'error' ? 'text-red-800' : ''}
                ${notification.type === 'warning' ? 'text-yellow-800' : ''}
                ${notification.type === 'info' ? 'text-blue-800' : ''}
              `}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 animate-slide-in">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Xác nhận
                </h3>
                <p className="text-sm text-gray-600">
                  {confirmDialog.message}
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Tổng lớp offset</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{offsetClasses.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookMarked className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Chưa có giáo viên</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {offsetClasses.filter(oc => !oc.assignedTeacherId).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Đã phân công</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {offsetClasses.filter(oc => oc.status === 'assigned').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Hoàn thành</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {offsetClasses.filter(oc => oc.status === 'completed').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản lý Lớp Offset
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Quản lý và phân công lớp bù
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm lớp offset
              </button>

              <button
                onClick={handleAutoAssignAll}
                disabled={autoAssigning || !offsetClasses.some(oc => oc.status === 'pending' && !oc.assignedTeacherId)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                {autoAssigning ? 'Đang phân công...' : 'Tự động phân công tất cả'}
              </button>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2 p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700 mr-2">Tạo nhanh:</span>
            
            <button
              onClick={() => {
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                setFormData({
                  ...formData,
                  scheduledDate: tomorrow.toISOString().split('T')[0],
                  startTime: '19:30',
                  endTime: '21:00'
                });
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              ⚡ Lớp tối mai 19h30
            </button>
            
            <button
              onClick={() => {
                const today = new Date();
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                setFormData({
                  ...formData,
                  scheduledDate: nextWeek.toISOString().split('T')[0],
                  startTime: '13:30',
                  endTime: '15:00'
                });
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
            >
              📅 Tuần sau chiều
            </button>
            
            <div className="h-4 border-l border-gray-300 mx-1"></div>
            
            <button
              onClick={() => loadData()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          {/* Status Filters */}
          <div className="flex items-center gap-3 mb-4">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'pending', label: 'Chờ xử lý' },
              { key: 'assigned', label: 'Đã phân công' },
              { key: 'completed', label: 'Hoàn thành' },
              { key: 'cancelled', label: 'Đã hủy' }
            ].map((status) => (
              <button
                key={status.key}
                onClick={() => setFilterStatus(status.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filterStatus === status.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.label}
                {filterStatus === status.key && (
                  <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                    {status.key === 'all' ? offsetClasses.length : 
                     offsetClasses.filter(oc => oc.status === status.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          {/* Date Filters */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
            <label className="text-sm font-medium text-gray-700">Lọc theo thời gian:</label>
            
            {/* Show All Toggle */}
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm font-medium text-gray-700">Hiển thị:</label>
              <button
                onClick={() => setShowAll(!showAll)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  showAll
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                {showAll ? '🔓 Tất cả' : '📄 Giới hạn 50'}
              </button>
              <span className="text-xs text-gray-500">
                ({offsetClasses.length} lớp)
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-3">
            {/* Quick presets */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setFilterDateFrom(today);
                  setFilterDateTo(today);
                }}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
              >
                Hôm nay
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const nextWeek = new Date(today);
                  nextWeek.setDate(today.getDate() + 7);
                  setFilterDateFrom(today.toISOString().split('T')[0]);
                  setFilterDateTo(nextWeek.toISOString().split('T')[0]);
                }}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
              >
                7 ngày tới
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const nextMonth = new Date(today);
                  nextMonth.setMonth(today.getMonth() + 1);
                  setFilterDateFrom(today.toISOString().split('T')[0]);
                  setFilterDateTo(nextMonth.toISOString().split('T')[0]);
                }}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
              >
                30 ngày tới
              </button>
            </div>
            
            <div className="flex items-center gap-2 ml-3">
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Từ ngày"
              />
              <span className="text-gray-500">→</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Đến ngày"
              />
              {(filterDateFrom || filterDateTo) && (
                <button
                  onClick={() => {
                    setFilterDateFrom('');
                    setFilterDateTo('');
                  }}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  ✕ Xóa
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Table */}
            {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thông tin lớp học
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày & Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giáo viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ghi chú
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {offsetClasses.map((offsetClass) => (
              <tr key={offsetClass._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    {/* Subject Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-700">
                          {offsetClass.subjectLevelId?.subjectId?.code || '?'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Class Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {offsetClass.subjectLevelId?.subjectId?.name || 'Chưa có môn học'}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                          HP{offsetClass.subjectLevelId?.semester || '?'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-1">
                        {offsetClass.className}
                      </div>
                      
                      {offsetClass.reason && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {offsetClass.reason}
                        </div>
                      )}
                      
                      {offsetClass.meetingLink && (
                        <div className="mt-1">
                          <a 
                            href={offsetClass.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Link học online →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {format(new Date(offsetClass.scheduledDate), 'dd/MM/yyyy')}
                  </div>
                  <div className="text-xs font-medium px-2 py-1 rounded bg-blue-50 text-blue-700 inline-block mt-1">
                    {offsetClass.startTime} - {offsetClass.endTime}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {offsetClass.assignedTeacherId ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">
                          {offsetClass.assignedTeacherId.name?.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {offsetClass.assignedTeacherId.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {offsetClass.assignedTeacherId.email}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-md">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700">Chưa có giáo viên</span>
                    </div>
                  )}
                </td>

                {/* Notes Column */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 max-w-xs">
                    {offsetClass.notes ? (
                      <p className="line-clamp-2">{offsetClass.notes}</p>
                    ) : (
                      <span className="text-gray-400 italic">Không có ghi chú</span>
                    )}
                  </div>
                </td>

                {/* Status Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(offsetClass.status)}
                </td>

                {/* Actions Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    {/* Edit */}
                    {(offsetClass.status === 'pending' || offsetClass.status === 'assigned') && (
                      <button
                        onClick={() => handleEdit(offsetClass)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                    )}
                    
                    {/* Auto-assign */}
                    {offsetClass.status === 'pending' && !offsetClass.assignedTeacherId && (
                      <button
                        onClick={() => handleAutoAssign(offsetClass._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-white border border-green-300 rounded-md hover:bg-green-50 hover:border-green-400 transition-colors"
                        title="Tự động phân công"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Tự động</span>
                      </button>
                    )}
                    
                    {/* Reallocate & Complete */}
                    {offsetClass.status === 'assigned' && (
                      <>
                        <button
                          onClick={() => handleReallocate(offsetClass._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 hover:border-blue-400 transition-colors"
                          title="Tái phân bổ"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Tái phân bổ</span>
                        </button>
                        <button
                          onClick={() => handleMarkCompleted(offsetClass._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-white border border-green-300 rounded-md hover:bg-green-50 hover:border-green-400 transition-colors"
                          title="Hoàn thành"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Hoàn thành</span>
                        </button>
                      </>
                    )}
                    
                    {/* Cancel */}
                    {(offsetClass.status === 'pending' || offsetClass.status === 'assigned') && (
                      <button
                        onClick={() => handleCancel(offsetClass._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-orange-700 bg-white border border-orange-300 rounded-md hover:bg-orange-50 hover:border-orange-400 transition-colors"
                        title="Hủy lớp"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Hủy</span>
                      </button>
                    )}
                    
                    {/* Delete */}
                    {(offsetClass.status === 'cancelled' || offsetClass.status === 'completed') && (
                      <button
                        onClick={() => handleDelete(offsetClass._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 hover:border-red-400 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {offsetClasses.length === 0 && (
          <div className="text-center py-12 bg-gray-50">
            <p className="text-gray-500">Chưa có lớp offset nào</p>
          </div>
        )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Chỉnh sửa lớp offset' : 'Tạo lớp offset mới'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSubmitWithAutoAssignment} className="space-y-6">
                {/* Class Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên lớp
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: TE-C-PA-711-2020BLG-0094"
                  />
                </div>

                {/* Subject & Date Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Môn học & Học phần
                    </label>
                    <select
                      required
                      value={formData.subjectLevelId}
                      onChange={(e) => setFormData({ ...formData, subjectLevelId: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Chọn môn học</option>
                      {subjectLevels.map((level) => (
                        <option key={level._id} value={level._id}>
                          {level.subjectId?.name} - Level {level.level}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày học
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Time Section with Presets */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời gian
                  </label>
                  
                  {/* Quick Time Presets */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { label: '7h30-9h00', start: '07:30', end: '09:00' },
                      { label: '9h30-11h00', start: '09:30', end: '11:00' },
                      { label: '13h30-15h00', start: '13:30', end: '15:00' },
                      { label: '15h30-17h00', start: '15:30', end: '17:00' },
                      { label: '17h30-19h00', start: '17:30', end: '19:00' },
                      { label: '19h30-21h00', start: '19:30', end: '21:00' },
                      { label: '20h00-21h30', start: '20:00', end: '21:30' },
                      { label: 'Tùy chỉnh', start: '', end: '' }
                    ].map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (preset.start && preset.end) {
                            setFormData({
                              ...formData,
                              startTime: preset.start,
                              endTime: preset.end
                            });
                          }
                        }}
                        className={`px-2 py-2 text-xs font-medium rounded-md border transition-colors ${
                          formData.startTime === preset.start && formData.endTime === preset.end
                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Manual Time Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="time"
                        required
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Giờ bắt đầu"
                      />
                    </div>
                    <div>
                      <input
                        type="time"
                        required
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Giờ kết thúc"
                      />
                    </div>
                  </div>

                  {/* Time Validation */}
                  {formData.startTime && formData.endTime && formData.startTime >= formData.endTime && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Giờ kết thúc phải sau giờ bắt đầu
                    </p>
                  )}
                </div>

                {/* Teacher Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phân công giáo viên
                  </label>
                  <div className="space-y-2">
                    <select
                      value={formData.assignedTeacherId || ''}
                      onChange={(e) => setFormData({ ...formData, assignedTeacherId: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">🤖 Tự động phân công (khuyến nghị)</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          👨‍🏫 {teacher.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Hệ thống sẽ tự động chọn giáo viên phù hợp nhất
                    </p>
                  </div>
                </div>

                {/* Additional Info (Collapsible) */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const showAdvanced = !document.getElementById('advanced-section').hidden;
                      document.getElementById('advanced-section').hidden = showAdvanced;
                      document.getElementById('toggle-text').textContent = showAdvanced ? 'Hiện thêm tùy chọn' : 'Ẩn bớt tùy chọn';
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span id="toggle-text">Hiện thêm tùy chọn</span>
                    <span className="text-xs">▼</span>
                  </button>
                  
                  <div id="advanced-section" hidden className="mt-3 space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link meeting
                      </label>
                      <input
                        type="url"
                        value={formData.meetingLink}
                        onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://meet.google.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lý do cần lớp bù
                      </label>
                      <textarea
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        rows="2"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="VD: Giáo viên nghỉ ốm, lễ tết..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ghi chú thêm
                      </label>
                      <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows="2"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Thông tin bổ sung..."
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={autoAssigning || (formData.startTime && formData.endTime && formData.startTime >= formData.endTime)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {autoAssigning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang xử lý...
                      </>
                    ) : editingId ? (
                      <>
                        <Check className="w-4 h-4" />
                        Cập nhật
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Tạo & Tự động phân công
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default OffsetClasses;
