import { TeacherDashboardData } from '../types';

// This file simulates a call to a secure backend API (e.g., a Supabase Edge Function).
// In a real application, this function would make a `fetch` request.
// The backend function would use the authenticated user's ID (auth.uid()) to query
// the database, and the RLS policies for the 'teacher' role would automatically
// filter the data to only include students in their assigned courses.

const MOCK_DATA: TeacherDashboardData = {
    teacherName: "الأستاذ علي",
    coursesTaught: [
        { courseId: 'c1', courseName: 'فيزياء الصف العاشر', totalLessons: 25 },
        { courseId: 'c2', courseName: 'فيزياء الصف الحادي عشر', totalLessons: 30 },
    ],
    studentProgress: [
        {
            studentId: 's1',
            studentName: 'أحمد المصري',
            courseName: 'فيزياء الصف العاشر',
            lessonsCompleted: 18,
            totalLessons: 25,
            averageMastery: 82.5,
        },
        {
            studentId: 's2',
            studentName: 'فاطمة الشامي',
            courseName: 'فيزياء الصف العاشر',
            lessonsCompleted: 24,
            totalLessons: 25,
            averageMastery: 95.1,
        },
        {
            studentId: 's3',
            studentName: 'خالد الحمصي',
            courseName: 'فيزياء الصف الحادي عشر',
            lessonsCompleted: 12,
            totalLessons: 30,
            averageMastery: 75.0,
        },
        {
            studentId: 's4',
            studentName: 'سارة الإدلبي',
            courseName: 'فيزياء الصف الحادي عشر',
            lessonsCompleted: 5,
            totalLessons: 30,
            averageMastery: 60.3,
        },
        {
            studentId: 's5',
            studentName: 'يزن الحلبي',
            courseName: 'فيزياء الصف العاشر',
            lessonsCompleted: 10,
            totalLessons: 25,
            averageMastery: 68.7,
        },
    ],
};

export const getTeacherDashboardData = (): Promise<TeacherDashboardData> => {
    return new Promise((resolve) => {
        // Simulate network latency
        setTimeout(() => {
            resolve(MOCK_DATA);
        }, 800);
    });
};
