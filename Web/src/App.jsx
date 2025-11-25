import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import TeacherDetails from './pages/TeacherDetails';
import Subjects from './pages/Subjects';
import Schedule from './pages/Schedule';
import OffsetClasses from './pages/OffsetClasses';

import { NotificationProvider } from './components/ui/NotificationProvider';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/teachers/:id" element={<TeacherDetails />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/offset-classes" element={<OffsetClasses />} />
          </Routes>
        </Layout>
      </Router>
    </NotificationProvider>
  );
}

export default App;
