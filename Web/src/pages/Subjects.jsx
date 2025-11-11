import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { subjectsAPI } from '../services/api';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [editingLevel, setEditingLevel] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    code: '', 
    description: '',
    levels: []
  });
  const [levelForm, setLevelForm] = useState({
    levelNumber: 1,
    name: '',
    description: ''
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const response = await subjectsAPI.getAll();
      // Load chi tiết từng subject với levels
      const subjectsWithLevels = await Promise.all(
        (response.data || []).map(async (subject) => {
          try {
            const detailResponse = await subjectsAPI.getWithLevels(subject._id);
            return detailResponse.data;
          } catch (error) {
            return subject;
          }
        })
      );
      setSubjects(subjectsWithLevels);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  const handleAddLevel = () => {
    if (!levelForm.name || !levelForm.levelNumber) {
      alert('Vui lòng nhập tên và số học phần');
      return;
    }
    setFormData(prev => ({
      ...prev,
      levels: [...prev.levels, { 
        semester: levelForm.levelNumber, // Backend vẫn dùng field 'semester'
        name: levelForm.name,
        description: levelForm.description
      }]
    }));
    setLevelForm({ levelNumber: 1, name: '', description: '' });
  };

  const handleRemoveLevel = (index) => {
    setFormData(prev => ({
      ...prev,
      levels: prev.levels.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Tạo môn học
      const subjectData = {
        name: formData.name,
        code: formData.code,
        description: formData.description
      };
      
      if (editingSubject) {
        await subjectsAPI.update(editingSubject._id, subjectData);
      } else {
        const response = await subjectsAPI.create(subjectData);
        
        // Tự động tạo 12 học phần
        if (response.data) {
          const subjectCode = formData.code.toUpperCase();
          for (let i = 1; i <= 12; i++) {
            const levelData = {
              semester: i,
              name: `${subjectCode}_HP${i}`,
              description: `Học phần ${i} của môn ${formData.name}`
            };
            await subjectsAPI.addLevel(response.data._id, levelData);
          }
        }
      }
      
      setShowModal(false);
      setFormData({ name: '', code: '', description: '', levels: [] });
      setEditingSubject(null);
      loadSubjects();
    } catch (error) {
      alert('Có lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddLevelToExisting = async (e) => {
    e.preventDefault();
    try {
      if (editingLevel) {
        // Cập nhật level
        await subjectsAPI.updateLevel(selectedSubject._id, editingLevel._id, {
          semester: levelForm.levelNumber,
          name: levelForm.name,
          description: levelForm.description
        });
      } else {
        // Thêm level mới
        await subjectsAPI.addLevel(selectedSubject._id, {
          semester: levelForm.levelNumber,
          name: levelForm.name,
          description: levelForm.description
        });
      }
      setShowLevelModal(false);
      setLevelForm({ levelNumber: 1, name: '', description: '' });
      setSelectedSubject(null);
      setEditingLevel(null);
      loadSubjects();
    } catch (error) {
      alert('Có lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const openEditLevelModal = (subject, level) => {
    setSelectedSubject(subject);
    setEditingLevel(level);
    setLevelForm({
      levelNumber: level.semester,
      name: level.name,
      description: level.description || ''
    });
    setShowLevelModal(true);
  };

  const handleDeleteLevel = async (subjectId, levelId) => {
    if (!confirm('Bạn có chắc muốn xóa level này?')) return;
    try {
      await subjectsAPI.deleteLevel(subjectId, levelId);
      loadSubjects();
    } catch (error) {
      alert('Có lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!confirm('Bạn có chắc muốn xóa môn học này? Tất cả levels sẽ bị xóa.')) return;
    try {
      await subjectsAPI.delete(subjectId);
      loadSubjects();
    } catch (error) {
      alert('Có lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      levels: []
    });
    setShowModal(true);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Môn học</h1>
        <button
          onClick={() => {
            setEditingSubject(null);
            setFormData({ name: '', code: '', description: '', levels: [] });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          Thêm môn học
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          {subjects.map((subject) => (
            <div key={subject._id} className="border rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-800">{subject.name}</h3>
                    <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      {subject.code}
                    </span>
                    {subject.levels && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {subject.levels.length} levels
                      </span>
                    )}
                  </div>
                  {subject.description && (
                    <p className="text-sm text-gray-600 mt-1">{subject.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedSubject(subject);
                      setEditingLevel(null);
                      setLevelForm({ levelNumber: 1, name: '', description: '' });
                      setShowLevelModal(true);
                    }}
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="Thêm học phần"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(subject)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(subject._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleSubject(subject._id)}
                    className="p-2 hover:bg-gray-200 rounded"
                  >
                    {expandedSubjects[subject._id] ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {expandedSubjects[subject._id] && subject.levels && (
                <div className="p-4 bg-white border-t">
                  <h4 className="font-semibold text-gray-700 mb-3">Các Học phần (Levels):</h4>
                  {subject.levels.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">Chưa có học phần nào</p>
                  ) : (
                    <div className="space-y-2">
                      {subject.levels
                        .sort((a, b) => a.semester - b.semester)
                        .map((level) => (
                          <div
                            key={level._id}
                            className="flex justify-between items-start p-3 bg-gray-50 rounded border"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">{level.name}</span>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  Học phần {level.semester}
                                </span>
                              </div>
                              {level.description && (
                                <p className="text-sm text-gray-600 mt-1">{level.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => openEditLevelModal(subject, level)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Chỉnh sửa học phần"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteLevel(subject._id, level._id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Xóa học phần"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal thêm/sửa môn học */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editingSubject ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên môn học *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Toán học"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã môn học *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: MATH101"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    placeholder="Mô tả chi tiết về môn học"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows="3"
                  />
                </div>

                {!editingSubject && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h5 className="font-semibold text-blue-900 mb-1">Tự động tạo học phần</h5>
                        <p className="text-sm text-blue-800">
                          Khi tạo môn học mới, hệ thống sẽ tự động tạo <strong>12 học phần</strong> với mã:<br/>
                          <span className="font-mono text-xs bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                            {formData.code || 'MAMONHOC'}_HP1, {formData.code || 'MAMONHOC'}_HP2, ..., {formData.code || 'MAMONHOC'}_HP12
                          </span>
                        </p>
                        <p className="text-xs text-blue-700 mt-2">
                          💡 Bạn có thể thêm hoặc xóa học phần sau khi tạo môn học.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ name: '', code: '', description: '', levels: [] });
                    setEditingSubject(null);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingSubject ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal thêm/sửa học phần cho môn học có sẵn */}
      {showLevelModal && selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {editingLevel ? 'Chỉnh sửa Học phần' : 'Thêm Học phần cho'}: {selectedSubject.name}
            </h3>
            <form onSubmit={handleAddLevelToExisting}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số học phần *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={levelForm.levelNumber}
                    onChange={(e) => setLevelForm({ ...levelForm, levelNumber: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên học phần *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Lập trình cơ bản"
                    required
                    value={levelForm.name}
                    onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    placeholder="Mô tả nội dung học phần"
                    value={levelForm.description}
                    onChange={(e) => setLevelForm({ ...levelForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowLevelModal(false);
                    setSelectedSubject(null);
                    setEditingLevel(null);
                    setLevelForm({ levelNumber: 1, name: '', description: '' });
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingLevel ? 'Cập nhật' : 'Thêm Học phần'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
