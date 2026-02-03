import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { AdminDashboardStats } from '../types';

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-5.197M15 21a6 6 0 006-5.197" /></svg>
);
const CreditCardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
);
const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
);
const ClipboardCheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
);

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-lg p-6 flex items-center space-x-4 space-x-reverse`}>
        <div className={`p-3 rounded-full bg-${color}-500/10 text-${color}-400`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // This is the correct, secure pattern for fetching aggregate data.
                // The Edge Function uses the SERVICE_ROLE_KEY to bypass RLS for these counts.
                const { data, error } = await supabase.functions.invoke('admin-stats');
                if (error) throw error;
                setStats(data);
            } catch (err: any) {
                setError("فشل تحميل بيانات لوحة التحكم. تأكد من أنك في دور المدير وأن لديك صلاحيات الوصول.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="text-center p-10">...جاري تحميل لوحة تحكم المدير</div>;
    }

    if (error) {
        return <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-md text-center">{error}</div>;
    }

    if (!stats) {
        return <div className="text-center p-10">لا توجد بيانات لعرضها.</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">لوحة تحكم المدير</h1>
                <p className="text-slate-400">نظرة شاملة على أداء وسلامة المنصة.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="إجمالي المستخدمين" value={stats.totalUsers} icon={<UsersIcon />} color="sky" />
                <StatCard title="الاشتراكات الفعالة" value={stats.activeSubscriptions} icon={<CreditCardIcon />} color="violet" />
                <StatCard title="الإيرادات الشهرية (تقريبي)" value={`$${stats.monthlyRevenue.toLocaleString()}`} icon={<CreditCardIcon />} color="lime" />
                <StatCard title="طلبات الذكاء الاصطناعي (اليوم)" value={stats.aiRequestsToday} icon={<SparklesIcon />} color="amber" />
                <StatCard title="إجابات تحتاج مراجعة" value={stats.unvalidatedAiResponses} icon={<ClipboardCheckIcon />} color="red" />
                <StatCard title="إجمالي المقررات" value={stats.totalCourses} icon={<UsersIcon />} color="teal" />
            </div>
            
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center text-slate-500">
                <p>مخططات ورسوم بيانية تفصيلية ستكون متاحة هنا قريباً.</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
