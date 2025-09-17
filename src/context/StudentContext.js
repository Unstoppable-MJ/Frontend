import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { studentAPI } from '../services/api';
import toast from 'react-hot-toast';

const StudentContext = createContext();

const initialState = {
  students: [],
  loading: false,
  error: null,
};

const studentReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_STUDENTS':
      return { ...state, students: action.payload, loading: false, error: null };
    case 'ADD_STUDENT':
      return { ...state, students: [...state.students, action.payload] };
    case 'UPDATE_STUDENT':
      return {
        ...state,
        students: state.students.map(student =>
          student.id === action.payload.id ? action.payload : student
        )
      };
    case 'DELETE_STUDENT':
      return {
        ...state,
        students: state.students.filter(student => student.id !== action.payload)
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

export const StudentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(studentReducer, initialState);

  const fetchStudents = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await studentAPI.getAll();
      dispatch({ type: 'SET_STUDENTS', payload: response.data.data });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch students';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const addStudent = async (studentData) => {
    try {
      const response = await studentAPI.create(studentData);
      dispatch({ type: 'ADD_STUDENT', payload: response.data.data });
      toast.success('Student added successfully');
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add student';
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateStudent = async (id, studentData) => {
    try {
      const response = await studentAPI.update(id, studentData);
      dispatch({ type: 'UPDATE_STUDENT', payload: response.data.data });
      toast.success('Student updated successfully');
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update student';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteStudent = async (id) => {
    try {
      await studentAPI.delete(id);
      dispatch({ type: 'DELETE_STUDENT', payload: id });
      toast.success('Student deleted successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete student';
      toast.error(errorMessage);
      throw error;
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const value = {
    ...state,
    fetchStudents,
    addStudent,
    updateStudent,
    deleteStudent,
  };

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudents = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudents must be used within a StudentProvider');
  }
  return context;
};
