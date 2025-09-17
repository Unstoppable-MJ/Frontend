import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import toast from 'react-hot-toast';

const AttendanceContext = createContext();

const initialState = {
  attendanceRecords: [],
  currentSession: null,
  loading: false,
  error: null,
  statistics: {
    total: 0,
    present: 0,
    absent: 0,
    attendanceRate: 0
  }
};

const attendanceReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ATTENDANCE_RECORDS':
      return { 
        ...state, 
        attendanceRecords: action.payload.records || action.payload,
        statistics: action.payload.statistics || state.statistics,
        loading: false, 
        error: null 
      };
    case 'ADD_ATTENDANCE_RECORD':
      return { 
        ...state, 
        attendanceRecords: [...state.attendanceRecords, action.payload] 
      };
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };
    case 'CLEAR_SESSION':
      return { ...state, currentSession: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

export const AttendanceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(attendanceReducer, initialState);

  const startAttendanceSession = async (sessionData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await attendanceAPI.startSession(sessionData);
      dispatch({ type: 'SET_CURRENT_SESSION', payload: response.data.data });
      toast.success('Attendance session started');
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to start attendance session';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const markAttendance = async (attendanceData) => {
    try {
      const response = await attendanceAPI.markAttendance(attendanceData);
      dispatch({ type: 'ADD_ATTENDANCE_RECORD', payload: response.data.data });
      toast.success('Attendance marked successfully');
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark attendance';
      toast.error(errorMessage);
      throw error;
    }
  };

  const markBulkAttendance = async (bulkData) => {
    try {
      const response = await attendanceAPI.markBulkAttendance(bulkData);
      toast.success(`Attendance marked for ${response.data.data.successful} students`);
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark bulk attendance';
      toast.error(errorMessage);
      throw error;
    }
  };

  const getAttendanceReport = async (params = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await attendanceAPI.getReport(params);
      
      if (response.data.success && response.data.data) {
        dispatch({ type: 'SET_ATTENDANCE_RECORDS', payload: response.data.data });
        return response.data.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch attendance report';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const getStudentAttendance = async (studentId, params = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await attendanceAPI.getStudentAttendance(studentId, params);
      dispatch({ type: 'SET_ATTENDANCE_RECORDS', payload: response.data.data });
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch student attendance';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const clearSession = () => {
    dispatch({ type: 'CLEAR_SESSION' });
  };

  const value = {
    ...state,
    startAttendanceSession,
    markAttendance,
    markBulkAttendance,
    getAttendanceReport,
    getStudentAttendance,
    clearSession,
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
