import React, { useState } from 'react';
import Header from './components/Header';
import Introduction from './components/Introduction';
import Whiteboard from './components/Whiteboard';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import Footer from './components/Footer';

// In a real application, the user's role would be determined by their authenticated session.
// Here, we simulate it with local state for demonstration purposes.
export type UserRole = 'student' | 'teacher' | 'admin';

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>('student');

  const renderContent = () => {
    switch (currentRole) {
      case 'teacher':
        return <TeacherDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'student':
      default:
        return (
          <>
            <Introduction />
            <Whiteboard />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 flex flex-col">
      <Header currentRole={currentRole} onRoleChange={setCurrentRole} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;