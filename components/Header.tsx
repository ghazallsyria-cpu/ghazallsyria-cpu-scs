import React from 'react';
import { UserRole } from '../App';

const AtomIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        <ellipse cx="12" cy="12" rx="3" ry="9" transform="rotate(45 12 12)" stroke="currentColor" />
        <ellipse cx="12" cy="12" rx="3" ry="9" transform="rotate(-45 12 12)" stroke="currentColor" />
    </svg>
);

interface HeaderProps {
    currentRole: UserRole;
    onRoleChange: (role: UserRole) => void;
}

const Header: React.FC<HeaderProps> = ({ currentRole, onRoleChange }) => {
  const baseButtonClass = "px-4 py-2 rounded-md text-sm font-medium transition-colors";
  const activeButtonClass = "bg-cyan-600 text-white";
  const inactiveButtonClass = "bg-slate-800 text-slate-300 hover:bg-slate-700";

  return (
    <header className="bg-slate-900/70 backdrop-blur-md sticky top-0 z-50 border-b border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <AtomIcon />
            <div className='flex flex-col items-start'>
                <h1 className="text-xl font-bold text-white tracking-wide">Syrian Center for Science</h1>
                <h2 className="text-lg font-medium text-cyan-400">المركز السوري للعلوم</h2>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700 p-1 rounded-lg">
            <button
                onClick={() => onRoleChange('student')}
                className={`${baseButtonClass} ${currentRole === 'student' ? activeButtonClass : inactiveButtonClass}`}
                aria-pressed={currentRole === 'student'}
            >
                عرض الطالب
            </button>
            <button
                onClick={() => onRoleChange('teacher')}
                className={`${baseButtonClass} ${currentRole === 'teacher' ? activeButtonClass : inactiveButtonClass}`}
                aria-pressed={currentRole === 'teacher'}
            >
                عرض المعلم
            </button>
            <button
                onClick={() => onRoleChange('admin')}
                className={`${baseButtonClass} ${currentRole === 'admin' ? activeButtonClass : inactiveButtonClass}`}
                aria-pressed={currentRole === 'admin'}
            >
                عرض المدير
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
