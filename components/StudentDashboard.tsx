import React from 'react';
import Introduction from './Introduction';
import LessonShowcase from './LessonShowcase';
import Whiteboard from './Whiteboard';

const StudentDashboard: React.FC = () => {
    // In a real application, this component would fetch the student's
    // specific learning path, courses, and progress from Supabase.
    // For now, it serves as a container for the main student-facing tools.

    return (
        <div className="space-y-12">
            <Introduction />
            
            {/* AI-Powered Concept Explainer */}
            <LessonShowcase />

            {/* Collaborative Whiteboard */}
            <div className="mt-16">
                 <h2 className="text-3xl font-bold text-white text-center mb-4">السبورة التشاركية</h2>
                 <p className="max-w-3xl mx-auto text-lg text-slate-400 text-center mb-8">
                    استخدم هذه السبورة لحل المسائل، رسم المخططات، أو التعاون مع زملائك في الوقت الفعلي.
                 </p>
                <Whiteboard />
            </div>
        </div>
    );
};

export default StudentDashboard;
