import { AdminDashboardStats } from '../types';

// This file simulates a call to a secure, admin-only backend API (e.g., a Supabase Edge Function).
// In a real application, this function would perform aggregation queries across multiple tables
// (users, user_subscriptions, payments, ai_responses).
// The 'admin' role's RLS policies would permit these cross-table queries, while
// student and teacher roles would be blocked.

const MOCK_DATA: AdminDashboardStats = {
    totalUsers: 1250,
    activeSubscriptions: 875,
    monthlyRevenue: 4375, // Assuming a $5/month plan for simplicity
    aiRequestsToday: 342,
    unvalidatedAiResponses: 15, // Responses where `is_validated_by_human` is false
    totalCourses: 6,
};

export const getAdminDashboardData = (): Promise<AdminDashboardStats> => {
    return new Promise((resolve) => {
        // Simulate network latency for a complex query
        setTimeout(() => {
            resolve(MOCK_DATA);
        }, 500);
    });
};
