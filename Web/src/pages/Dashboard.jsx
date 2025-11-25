import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
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
import { 
  Users, 
  BookMarked, 
  Calendar, 
  TrendingUp, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { dashboardAPI, teachersAPI } from '../services/api';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

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

const StatsCard = ({ title, value, icon: Icon, color, trend }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-secondary-500">{title}</p>
          <h3 className="text-2xl font-bold text-secondary-900 mt-2">{value}</h3>
          {trend && (
            <p className={`text-xs font-medium mt-1 ${trend > 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% so với tháng trước
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorStyles[color] || colorStyles.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};

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
      const teachersData = teachersRes.data || teachersRes || [];
      setTeachers(Array.isArray(teachersData) ? teachersData : []);

      // Load teaching hours statistics
      const teachingHoursRes = await dashboardAPI.getTeachingHours({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        teacherId: selectedTeacher !== 'all' ? selectedTeacher : undefined
      });

      const teacherStats = teachingHoursRes.data || [];
      const summary = teachingHoursRes.summary || {};

      // Load offset classes statistics
      const offsetStatsRes = await dashboardAPI.getOffsetClassStatistics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        teacherId: selectedTeacher !== 'all' ? selectedTeacher : undefined
      });

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
      setLoading(false);
    }
  };

  // Chart Configuration
  const chartTheme = {
    primary: '#6366f1', // Indigo 500
    secondary: '#a5b4fc', // Indigo 300
    success: '#22c55e', // Green 500
    warning: '#eab308', // Yellow 500
    danger: '#ef4444', // Red 500
    grid: '#e2e8f0', // Slate 200
    text: '#64748b', // Slate 500
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          font: { family: 'Inter', size: 12 },
          color: chartTheme.text,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: chartTheme.text, font: { family: 'Inter' } },
      },
      y: {
        grid: { color: chartTheme.grid, borderDash: [4, 4] },
        ticks: { color: chartTheme.text, font: { family: 'Inter' } },
        beginAtZero: true,
      },
    },
  };

  const offsetClassesChartData = {
    labels: offsetData.map(([name]) => name),
    datasets: [
      {
        label: 'Số lớp offset',
        data: offsetData.map(([, count]) => count),
        backgroundColor: chartTheme.primary,
        borderRadius: 6,
        barThickness: 20,
      },
    ],
  };

  const teachingHoursChartData = {
    labels: teacherHoursData.map(([name]) => name),
    datasets: [
      {
        label: 'Số giờ dạy',
        data: teacherHoursData.map(([, hours]) => hours.toFixed(1)),
        backgroundColor: chartTheme.success,
        borderRadius: 6,
        barThickness: 20,
      },
    ],
  };

  const statusChartData = {
    labels: ['Chưa có GV', 'Đã phân công', 'Hoàn thành'],
    datasets: [
      {
        data: [stats.pendingClasses, stats.assignedClasses, stats.completedClasses],
        backgroundColor: [chartTheme.danger, chartTheme.primary, chartTheme.success],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-500 mt-1">Tổng quan hoạt động hệ thống</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="hidden md:flex">
            <Clock className="w-4 h-4 mr-2" />
            Cập nhật: {format(new Date(), 'HH:mm')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-secondary-700 min-w-max">
            <Filter className="w-5 h-5" />
            <span className="font-medium">Bộ lọc:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-4 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
              <option value="all">Tất cả giáo viên</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-4 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />

            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-4 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Tổng giáo viên"
          value={stats.totalTeachers}
          icon={Users}
          color="indigo"
        />
        <StatsCard
          title="Lớp Offset"
          value={stats.totalOffsetClasses}
          icon={BookMarked}
          color="blue"
        />
        <StatsCard
          title="Chưa phân công"
          value={stats.pendingClasses}
          icon={AlertCircle}
          color="red"
        />
        <StatsCard
          title="Đã hoàn thành"
          value={stats.completedClasses}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-secondary-900">Thống kê giờ dạy</h3>
            <select className="text-xs bg-secondary-50 border-none rounded-lg px-2 py-1 text-secondary-600 focus:ring-0">
              <option>Tháng này</option>
              <option>Tháng trước</option>
            </select>
          </div>
          <div className="h-80">
            <Bar data={teachingHoursChartData} options={commonOptions} />
          </div>
        </Card>

        {/* Status Chart */}
        <Card>
          <h3 className="text-lg font-bold text-secondary-900 mb-6">Trạng thái lớp</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut 
              data={statusChartData} 
              options={{
                ...commonOptions,
                cutout: '70%',
                plugins: {
                  ...commonOptions.plugins,
                  legend: { position: 'bottom' }
                },
                scales: { display: false }
              }} 
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-secondary-500">Chờ</p>
              <p className="font-bold text-danger-600">{stats.pendingClasses}</p>
            </div>
            <div>
              <p className="text-xs text-secondary-500">Đã gán</p>
              <p className="font-bold text-primary-600">{stats.assignedClasses}</p>
            </div>
            <div>
              <p className="text-xs text-secondary-500">Xong</p>
              <p className="font-bold text-success-600">{stats.completedClasses}</p>
            </div>
          </div>
        </Card>

        {/* Secondary Chart */}
        <Card className="lg:col-span-3">
          <h3 className="text-lg font-bold text-secondary-900 mb-6">Phân bố lớp Offset</h3>
          <div className="h-80">
            <Bar data={offsetClassesChartData} options={commonOptions} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
