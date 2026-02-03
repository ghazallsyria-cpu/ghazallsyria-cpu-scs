import React, { useState, useEffect } from 'react';
import { getTeacherDashboardData } from '../services/dashboardService';
import { TeacherDashboardData, StudentProgressSummary } from '../types';

const ChartBarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
    <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${value}%` }}></div>
    </div>
);

const TeacherDashboard: React.FC = () => {
    const [data, setData] = useState<TeacherDashboardData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // This simulates a call to a secure backend endpoint that would
                // leverage the teacher's RLS policies in Supabase.
                const result = await getTeacherDashboardData();
                setData(result);
            } catch (err: any) {
                setError("فشل تحميل بيانات الطلاب. الرجاء المحاولة مرة أخرى.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="text-center p-10">...جاري تحميل لوحة التحكم</div>;
    }

    if (error) {
        return <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-md text-center">{error}</div>;
    }

    if (!data) {
        return <div className="text-center p-10">لا توجد بيانات لعرضها.</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">لوحة تحكم المعلم</h1>
                <p className="text-slate-400">مرحباً بك، {data.teacherName}. هنا يمكنك متابعة تقدم طلابك.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center">
                    <ChartBarIcon />
                    <span className="mr-3">تقدم الطلاب في المقررات</span>
                </h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">اسم الطالب</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">المقرر الدراسي</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">تقدم الدروس</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">متوسط إتقان المفاهيم</th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-900 divide-y divide-slate-800">
                            {data.studentProgress.map(student => (
                                <tr key={student.studentId}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{student.studentName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{student.courseName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        <div className="flex items-center">
                                            <div className="w-3/4">
                                                <ProgressBar value={(student.lessonsCompleted / student.totalLessons) * 100} />
                                            </div>
                                            <div className="w-1/4 text-left pr-2">{student.lessonsCompleted}/{student.totalLessons}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                       <div className="flex items-center">
                                            <div className="w-3/4">
                                                <ProgressBar value={student.averageMastery} />
                                            </div>
                                            <div className="w-1/4 text-left pr-2">{student.averageMastery.toFixed(1)}%</div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
