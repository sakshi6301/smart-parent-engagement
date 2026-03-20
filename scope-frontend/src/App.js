import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './utils/i18n';
import './assets/global.css';

import ProtectedRoute from './components/ProtectedRoute';

// Auth
import Login from './pages/Login';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageTeachers from './pages/admin/ManageTeachers';
import ManageParents from './pages/admin/ManageParents';
import UserManagement from './pages/admin/UserManagement';
import BulkImport from './pages/admin/BulkImport';
import LinkManagement from './pages/admin/LinkManagement';
import AdminNotifications from './pages/admin/Notifications';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import AIModelManager from './pages/admin/AIModelManager';

// Teacher
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import Attendance from './pages/teacher/Attendance';
import GradeManager from './pages/teacher/GradeManager';
import HomeworkManager from './pages/teacher/HomeworkManager';
import Chat from './pages/teacher/Chat';
import AIRiskMonitor from './pages/teacher/RiskMonitor';
import Meetings from './pages/teacher/Meetings';
import TeacherNotifications from './pages/teacher/Notifications';

// Parent
import ParentDashboard from './pages/parent/ParentDashboard';
import HomeworkTracker from './pages/parent/HomeworkTracker';
import ParentChat from './pages/parent/ParentChat';
import ParentGrades from './pages/parent/ParentGrades';
import ParentMeetings from './pages/parent/ParentMeetings';
import Notifications from './pages/parent/Notifications';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import StudentGrades from './pages/student/StudentGrades';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentHomework from './pages/student/StudentHomework';
import StudentChat from './pages/student/StudentChat';
import StudentNotifications from './pages/student/StudentNotifications';

// Shared
import FeedbackPage from './pages/FeedbackPage';

const PR = ({ children, roles }) => <ProtectedRoute roles={roles}>{children}</ProtectedRoute>;

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route path="/admin" element={<PR roles={['admin']}><AdminDashboard /></PR>} />
        <Route path="/admin/students" element={<PR roles={['admin']}><ManageStudents /></PR>} />
        <Route path="/admin/teachers" element={<PR roles={['admin']}><ManageTeachers /></PR>} />
        <Route path="/admin/parents" element={<PR roles={['admin']}><ManageParents /></PR>} />
        <Route path="/admin/users" element={<PR roles={['admin']}><UserManagement /></PR>} />
        <Route path="/admin/analytics" element={<PR roles={['admin']}><AnalyticsDashboard /></PR>} />
        <Route path="/admin/notifications" element={<PR roles={['admin']}><AdminNotifications /></PR>} />
        <Route path="/admin/bulk-import" element={<PR roles={['admin']}><BulkImport /></PR>} />
        <Route path="/admin/link-management" element={<PR roles={['admin']}><LinkManagement /></PR>} />
        <Route path="/admin/ai-model" element={<PR roles={['admin']}><AIModelManager /></PR>} />

        {/* Teacher */}
        <Route path="/teacher" element={<PR roles={['teacher']}><TeacherDashboard /></PR>} />
        <Route path="/teacher/attendance" element={<PR roles={['teacher']}><Attendance /></PR>} />
        <Route path="/teacher/grades" element={<PR roles={['teacher']}><GradeManager /></PR>} />
        <Route path="/teacher/homework" element={<PR roles={['teacher']}><HomeworkManager /></PR>} />
        <Route path="/teacher/chat" element={<PR roles={['teacher']}><Chat /></PR>} />
        <Route path="/teacher/risk" element={<PR roles={['teacher']}><AIRiskMonitor /></PR>} />
        <Route path="/teacher/meetings" element={<PR roles={['teacher']}><Meetings /></PR>} />
        <Route path="/teacher/notifications" element={<PR roles={['teacher']}><TeacherNotifications /></PR>} />

        {/* Parent */}
        <Route path="/parent" element={<PR roles={['parent']}><ParentDashboard /></PR>} />
        <Route path="/parent/attendance" element={<PR roles={['parent']}><HomeworkTracker /></PR>} />
        <Route path="/parent/grades" element={<PR roles={['parent']}><ParentGrades /></PR>} />
        <Route path="/parent/homework" element={<PR roles={['parent']}><HomeworkTracker /></PR>} />
        <Route path="/parent/chat" element={<PR roles={['parent']}><ParentChat /></PR>} />
        <Route path="/parent/meetings" element={<PR roles={['parent']}><ParentMeetings /></PR>} />
        <Route path="/parent/notifications" element={<PR roles={['parent']}><Notifications /></PR>} />

        {/* Student */}
        <Route path="/student" element={<PR roles={['student']}><StudentDashboard /></PR>} />
        <Route path="/student/grades" element={<PR roles={['student']}><StudentGrades /></PR>} />
        <Route path="/student/homework" element={<PR roles={['student']}><StudentHomework /></PR>} />
        <Route path="/student/attendance" element={<PR roles={['student']}><StudentAttendance /></PR>} />
        <Route path="/student/chat" element={<PR roles={['student']}><StudentChat /></PR>} />
        <Route path="/student/notifications" element={<PR roles={['student']}><StudentNotifications /></PR>} />
        <Route path="/student/recommendations" element={<PR roles={['student']}><StudentDashboard /></PR>} />

        {/* Shared */}
        <Route path="/feedback" element={<PR roles={['admin','teacher','parent','student']}><FeedbackPage /></PR>} />

        <Route path="/unauthorized" element={<div style={{ textAlign: 'center', padding: '80px' }}><h2>403 — Not Authorized</h2><a href="/login">← Back to Login</a></div>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
