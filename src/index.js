import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { StudentProvider } from './context/StudentContext';
import { AttendanceProvider } from './context/AttendanceContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <StudentProvider>
      <AttendanceProvider>
        <App />
      </AttendanceProvider>
    </StudentProvider>
  </React.StrictMode>
);
