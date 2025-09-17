import React, { useState, useEffect } from 'react';
import { useStudents } from '../context/StudentContext';
import { useAttendance } from '../context/AttendanceContext';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  User,
  BookOpen,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Reports = () => {
  const { students } = useStudents();
  const { 
    attendanceRecords, 
    statistics, 
    loading, 
    getAttendanceReport, 
    getStudentAttendance 
  } = useAttendance();

  const [filters, setFilters] = useState({
    studentId: '',
    className: '',
    subject: '',
    startDate: '',
    endDate: '',
    status: ''
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportType, setReportType] = useState('overview'); // overview, student, class

  // Get unique values for filters
  const classes = [...new Set(students.map(student => student.className))].sort();
  const subjects = [...new Set(attendanceRecords.map(record => record.subject))].sort();
  const statuses = ['PRESENT', 'ABSENT'];

  useEffect(() => {
    fetchReport();
  }, [filters, reportType]);

  const fetchReport = async () => {
    try {
      if (reportType === 'student' && selectedStudent) {
        await getStudentAttendance(selectedStudent.id, {
          startDate: filters.startDate,
          endDate: filters.endDate,
          subject: filters.subject
        });
      } else {
        await getAttendanceReport(filters);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setReportType('student');
  };

  const clearFilters = () => {
    setFilters({
      studentId: '',
      className: '',
      subject: '',
      startDate: '',
      endDate: '',
      status: ''
    });
    setSelectedStudent(null);
    setReportType('overview');
  };

  // Calculate chart data
  const getChartData = () => {
    if (reportType === 'student' && selectedStudent) {
      // Student-specific data
      const studentRecords = attendanceRecords.filter(record => 
        record.studentId === selectedStudent.id
      );
      
      // Group by date
      const dateGroups = studentRecords.reduce((acc, record) => {
        const date = new Date(record.attendanceDate).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { present: 0, absent: 0 };
        }
        acc[date][record.status.toLowerCase()]++;
        return acc;
      }, {});

      return Object.entries(dateGroups).map(([date, counts]) => ({
        date,
        present: counts.present,
        absent: counts.absent
      }));
    } else {
      // Overview data - group by class
      const classGroups = students.reduce((acc, student) => {
        if (!acc[student.className]) {
          acc[student.className] = { total: 0, present: 0, absent: 0 };
        }
        acc[student.className].total++;
        return acc;
      }, {});

      // Add attendance data
      attendanceRecords.forEach(record => {
        const student = students.find(s => s.id === record.studentId);
        if (student && classGroups[student.className]) {
          classGroups[student.className][record.status.toLowerCase()]++;
        }
      });

      return Object.entries(classGroups).map(([className, data]) => ({
        className,
        total: data.total,
        present: data.present,
        absent: data.absent,
        attendanceRate: data.total > 0 ? ((data.present / data.total) * 100).toFixed(1) : 0
      }));
    }
  };

  const chartData = getChartData();

  // Pie chart data for attendance status
  const pieData = [
    { name: 'Present', value: statistics.present, color: '#10b981' },
    { name: 'Absent', value: statistics.absent, color: '#ef4444' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and analyze attendance data
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="overview">Overview</option>
              <option value="student">Student Specific</option>
              <option value="class">Class Specific</option>
            </select>
          </div>

          {/* Student Selection (for student report) */}
          {reportType === 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Select Student
              </label>
              <select
                value={selectedStudent?.id || ''}
                onChange={(e) => {
                  const student = students.find(s => s.id === parseInt(e.target.value));
                  setSelectedStudent(student);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a student</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.rollNo})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Class Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <BookOpen className="h-4 w-4 inline mr-1" />
              Class
            </label>
            <select
              value={filters.className}
              onChange={(e) => handleFilterChange('className', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map(className => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Records</dt>
                  <dd className="text-lg font-medium text-gray-900">{statistics.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 text-green-400">✓</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Present</dt>
                  <dd className="text-lg font-medium text-gray-900">{statistics.present}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 text-red-400">✗</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Absent</dt>
                  <dd className="text-lg font-medium text-gray-900">{statistics.absent}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Attendance Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">{statistics.attendanceRate}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {reportType === 'student' ? 'Student Attendance Over Time' : 'Attendance by Class'}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={reportType === 'student' ? 'date' : 'className'} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="present" fill="#10b981" name="Present" />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center space-x-6">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Attendance Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.student?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {record.student?.rollNo || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.attendanceDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'PRESENT'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.remarks || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
