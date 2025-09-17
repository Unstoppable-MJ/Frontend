import React, { useEffect, useState } from 'react';
import { useStudents } from '../context/StudentContext';
import { useAttendance } from '../context/AttendanceContext';
import { 
  Users, 
  ClipboardCheck, 
  UserCheck, 
  UserX,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { students, loading: studentsLoading } = useStudents();
  const { attendanceRecords, statistics, getAttendanceReport, loading: attendanceLoading } = useAttendance();
  const [recentAttendance, setRecentAttendance] = useState([]);

  useEffect(() => {
    // Fetch recent attendance data only once when component mounts
    const fetchRecentAttendance = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        await getAttendanceReport({ 
          startDate: today,
          endDate: today 
        });
      } catch (error) {
        console.error('Failed to fetch recent attendance:', error);
        // Don't rethrow the error to prevent infinite retries
      }
    };

    // Only fetch if we don't have attendance records yet and not currently loading
    if (attendanceRecords.length === 0 && !attendanceLoading) {
      fetchRecentAttendance();
    }
  }, []); // Empty dependency array to run only once

  // Calculate dashboard statistics
  const totalStudents = students.length;
  const presentToday = attendanceRecords.records ? 
    attendanceRecords.records.filter(record => record.status === 'PRESENT').length : 
    attendanceRecords.filter(record => record.status === 'PRESENT').length;
  const absentToday = attendanceRecords.records ? 
    attendanceRecords.records.filter(record => record.status === 'ABSENT').length : 
    attendanceRecords.filter(record => record.status === 'ABSENT').length;
  const attendanceRate = totalStudents > 0 ? ((presentToday / totalStudents) * 100).toFixed(1) : 0;

  // Class distribution data
  const classDistribution = students.reduce((acc, student) => {
    const className = student.className || 'Unknown';
    acc[className] = (acc[className] || 0) + 1;
    return acc;
  }, {});

  const classData = Object.entries(classDistribution).map(([name, value]) => ({
    name,
    value
  }));

  // Attendance status data for pie chart
  const attendanceData = [
    { name: 'Present', value: presentToday, color: '#10b981' },
    { name: 'Absent', value: absentToday, color: '#ef4444' }
  ];

  const stats = [
    {
      name: 'Total Students',
      value: totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Present Today',
      value: presentToday,
      icon: UserCheck,
      color: 'bg-green-500',
      change: `+${attendanceRate}%`,
      changeType: 'positive'
    },
    {
      name: 'Absent Today',
      value: absentToday,
      icon: UserX,
      color: 'bg-red-500',
      change: `${100 - attendanceRate}%`,
      changeType: 'negative'
    },
    {
      name: 'Attendance Rate',
      value: `${attendanceRate}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+5.2%',
      changeType: 'positive'
    }
  ];

  if (studentsLoading || attendanceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your student attendance system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
              <dt>
                <div className={`absolute rounded-md p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.name}</p>
              </dt>
              <dd className="ml-16 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </p>
              </dd>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Attendance Status Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Attendance Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center space-x-6">
            {attendanceData.map((item) => (
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

        {/* Class Distribution Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Students by Class</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Attendance Activity</h3>
          {(attendanceRecords.records || attendanceRecords).length > 0 ? (
            <div className="flow-root">
              <ul className="-mb-8">
                {(attendanceRecords.records || attendanceRecords).slice(0, 5).map((record, index) => (
                  <li key={record.id}>
                    <div className="relative pb-8">
                      {index !== (attendanceRecords.records || attendanceRecords).length - 1 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                            record.status === 'PRESENT' ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {record.status === 'PRESENT' ? (
                              <UserCheck className="h-4 w-4 text-white" />
                            ) : (
                              <UserX className="h-4 w-4 text-white" />
                            )}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              <span className="font-medium text-gray-900">
                                {record.student?.name} ({record.student?.rollNo})
                              </span>{' '}
                              was marked {record.status.toLowerCase()} in {record.subject}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {new Date(record.attendanceDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-6">
              <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start marking attendance to see recent activity here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
