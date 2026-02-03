
export enum StudentLevel {
  Beginner = 'مبتدئ',
  Intermediate = 'متوسط',
  Advanced = 'متقدم',
}

export interface StructuredResponse {
  conceptual: string;
  visual: string;
  mathematical: string;
  problemSolving: string;
  experiment: string;
}

// =================================================================
// Types for Teacher & Admin Dashboards
// =================================================================

export interface StudentProgressSummary {
  studentId: string;
  studentName: string;
  courseName: string;
  lessonsCompleted: number;
  totalLessons: number;
  averageMastery: number; // Percentage (0-100)
}

export interface TeacherDashboardData {
  teacherName: string;
  // This would come from the teacher_courses table
  coursesTaught: { courseId: string; courseName: string; totalLessons: number }[];
  studentProgress: StudentProgressSummary[];
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  aiRequestsToday: number;
  unvalidatedAiResponses: number;
  totalCourses: number;
}

// =================================================================
// Types for Real-time Collaborative Whiteboard
// =================================================================
export interface DrawingData {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  tool: 'pen' | 'eraser';
}
