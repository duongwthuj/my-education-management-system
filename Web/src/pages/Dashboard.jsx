import React, { useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Users, BookMarked, Calendar, TrendingUp, Filter } from 'lucide-react';
import { dashboardAPI, teachersAPI } from '../services/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalOffsetClasses: 0,
    pendingClasses: 0,
    assignedClasses: 0,
    completedClasses: 0,
  });
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [offsetData, setOffsetData] = useState([]);
  const [teacherHoursData, setTeacherHoursData] = useState([]);

  useEffect(() => {
    loadData();
  }, [selectedTeacher, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load teachers
      const teachersRes = await teachersAPI.getAll();
      console.log('Teachers response:', teachersRes);
      // API interceptor already unwraps response.data
      const teachersData = teachersRes.data || teachersRes || [];
      setTeachers(Array.isArray(teachersData) ? teachersData : []);

      // Load teaching hours statistics from new API
      const teachingHoursRes = await dashboardAPI.getTeachingHours({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        teacherId: selectedTeacher !== 'all' ? selectedTeacher : undefined
      });
      console.log('Teaching hours response:', teachingHoursRes);

      // API interceptor returns { success: true, data: ..., summary: ... }
      const teacherStats = teachingHoursRes.data || [];
      const summary = teachingHoursRes.summary || {};

      // Load offset classes statistics
      const offsetStatsRes = await dashboardAPI.getOffsetClassStatistics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        teacherId: selectedTeacher !== 'all' ? selectedTeacher : undefined
      });
      console.log('Offset stats response:', offsetStatsRes);

      // API returns { success: true, data: { total, pending, assigned, completed, ... } }
      const offsetStats = offsetStatsRes.data || {};

      // Update stats
      setStats({
        totalTeachers: summary.totalTeachers || 0,
        totalOffsetClasses: offsetStats.total || 0,
        pendingClasses: offsetStats.pending || 0,
        assignedClasses: offsetStats.assigned || 0,
        completedClasses: offsetStats.completed || 0,
      });

      // Prepare data for charts
      const sortedStats = [...teacherStats].sort((a, b) => b.totalHours - a.totalHours).slice(0, 10);

      setOffsetData(
        sortedStats.map(t => [t.teacherName, t.offsetClassCount || 0])
      );

      setTeacherHoursData(
        sortedStats.map(t => [t.teacherName, t.totalHours || 0])
      );

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      console.error('Error details:', error.response || error.message);
      
      // Set default values on error
      setStats({
        totalTeachers: 0,
        totalOffsetClasses: 0,
        pendingClasses: 0,
        assignedClasses: 0,
        completedClasses: 0,
      });
      setOffsetData([]);
      setTeacherHoursData([]);
      
      setLoading(false);
    }
  };

  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Chart data for offset classes by teacher
  const offsetClassesChartData = {
    labels: offsetData.map(([name]) => name),
    datasets: [
      {
        label: 'Số lớp offset',
        data: offsetData.map(([, count]) => count),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Chart data for teaching hours by teacher
  const teachingHoursChartData = {
    labels: teacherHoursData.map(([name]) => name),
    datasets: [
      {
        label: 'Số giờ dạy',
        data: teacherHoursData.map(([, hours]) => hours.toFixed(1)),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Status distribution chart
  const statusChartData = {
    labels: ['Chưa có GV', 'Đã phân công', 'Hoàn thành'],
    datasets: [
      {
        data: [stats.pendingClasses, stats.assignedClasses, stats.completedClasses],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',  // Red for pending
          'rgba(59, 130, 246, 0.8)',  // Blue for assigned
          'rgba(34, 197, 94, 0.8)'    // Green for completed
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Tổng quan hệ thống quản lý giảng dạy</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Bộ lọc:</span>
          </div>

          <div>
            <label className="text-sm text-gray-600 mr-2">Giáo viên:</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
            >
              <option value="all">Tất cả giáo viên</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mr-2">Từ ngày:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mr-2">Đến ngày:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Tổng giáo viên</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalTeachers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Tổng lớp offset</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalOffsetClasses}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookMarked className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Chưa có GV</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.pendingClasses}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Đã phân công</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.assignedClasses || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Đã hoàn thành</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.completedClasses}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Offset Classes Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Số lượng lớp offset theo giáo viên
          </h3>
          <div className="h-80">
            <Bar data={offsetClassesChartData} options={chartOptions} />
          </div>
        </div>

        {/* Status Distribution Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Trạng thái lớp offset</h3>
          <div className="h-80">
            <Doughnut data={statusChartData} options={doughnutOptions} />
          </div>
        </div>

        {/* Teaching Hours Chart */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Số giờ dạy của giáo viên
          </h3>
          <div className="h-80">
            <Bar data={teachingHoursChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
