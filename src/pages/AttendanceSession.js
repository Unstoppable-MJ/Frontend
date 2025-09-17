import React, { useState, useEffect } from 'react';
import { useStudents } from '../context/StudentContext';
import { useAttendance } from '../context/AttendanceContext';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Save, 
  Users, 
  Clock,
  BookOpen,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const AttendanceSession = () => {
  const { students, loading: studentsLoading } = useStudents();
  const { 
    currentSession, 
    loading: attendanceLoading, 
    startAttendanceSession, 
    markBulkAttendance,
    clearSession 
  } = useAttendance();

  const [sessionData, setSessionData] = useState({
    subject: '',
    className: ''
  });
  const [attendanceData, setAttendanceData] = useState({});
  const [filterClass, setFilterClass] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get unique classes for filter
  const classes = [...new Set(students.map(student => student.className))].sort();

  // Filter students based on selected class
  const filteredStudents = students.filter(student => 
    !filterClass || student.className === filterClass
  );

  const handleStartSession = async () => {
    if (!sessionData.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    try {
      const session = await startAttendanceSession(sessionData);
      setIsSessionActive(true);
      
      // Initialize attendance data for all students
      const initialAttendance = {};
      filteredStudents.forEach(student => {
        initialAttendance[student.id] = 'PRESENT'; // Default to present
      });
      setAttendanceData(initialAttendance);
    } catch (error) {
      // Error is handled in context
    }
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    setAttendanceData({});
    clearSession();
    setSessionData({ subject: '', className: '' });
    setFilterClass('');
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (Object.keys(attendanceData).length === 0) {
      toast.error('No attendance data to save');
      return;
    }

    setIsSaving(true);
    try {
      const bulkData = {
        attendanceData: Object.entries(attendanceData).map(([studentId, status]) => ({
          studentId: parseInt(studentId),
          status,
          remarks: ''
        })),
        subject: sessionData.subject,
        sessionId: currentSession?.sessionId
      };

      await markBulkAttendance(bulkData);
      handleEndSession();
      toast.success('Attendance saved successfully!');
    } catch (error) {
      // Error is handled in context
    } finally {
      setIsSaving(false);
    }
  };

  const getAttendanceStats = () => {
    const total = Object.keys(attendanceData).length;
    const present = Object.values(attendanceData).filter(status => status === 'PRESENT').length;
    const absent = total - present;
    return { total, present, absent };
  };

  const stats = getAttendanceStats();

  if (studentsLoading) {
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
        <h1 className="text-2xl font-bold text-gray-900">Attendance Session</h1>
        <p className="mt-1 text-sm text-gray-500">
          Mark attendance for your students
        </p>
      </div>

      {/* Session Controls */}
      {!isSessionActive ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Start New Session</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <BookOpen className="h-4 w-4 inline mr-1" />
                Subject
              </label>
              <input
                type="text"
                value={sessionData.subject}
                onChange={(e) => setSessionData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter subject (e.g., Mathematics)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Filter className="h-4 w-4 inline mr-1" />
                Filter by Class (Optional)
              </label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
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
          </div>
          <div className="mt-6">
            <button
              onClick={handleStartSession}
              disabled={!sessionData.subject.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Session
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Session: {sessionData.subject}
              </h3>
              <p className="text-sm text-gray-500">
                {filterClass ? `Class: ${filterClass}` : 'All Classes'} • 
                Started at {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSaveAttendance}
                disabled={isSaving || Object.keys(attendanceData).length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? 'Saving...' : 'Save Attendance'}
              </button>
              <button
                onClick={handleEndSession}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                End Session
              </button>
            </div>
          </div>

          {/* Session Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-500">Present</p>
                  <p className="text-lg font-semibold text-green-900">{stats.present}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-red-500">Absent</p>
                  <p className="text-lg font-semibold text-red-900">{stats.absent}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Students List */}
      {isSessionActive && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Mark Attendance</h3>
            <p className="text-sm text-gray-500">
              Click the buttons to mark students as present or absent
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <div key={student.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">
                        Roll No: {student.rollNo} • {student.className}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAttendanceChange(student.id, 'PRESENT')}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        attendanceData[student.id] === 'PRESENT'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Present
                    </button>
                    <button
                      onClick={() => handleAttendanceChange(student.id, 'ABSENT')}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        attendanceData[student.id] === 'ABSENT'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700'
                      }`}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Absent
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filterClass ? 'No students in the selected class.' : 'No students available.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isSessionActive && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How to use Attendance Session</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Enter the subject name for the attendance session</li>
                  <li>Optionally filter by class to show only specific students</li>
                  <li>Click "Start Session" to begin marking attendance</li>
                  <li>Click "Present" or "Absent" for each student</li>
                  <li>Click "Save Attendance" when done to save all records</li>
                  <li>Absent students will automatically receive email notifications</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSession;
