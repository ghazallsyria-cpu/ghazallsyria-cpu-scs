// Deno type definition for environment variables
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Get the authenticated user (teacher) from the JWT
    const authHeader = req.headers.get('Authorization')!;
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication failed.' }), { status: 401, headers });
    }

    // 2. Verify the user has the 'teacher' role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Forbidden: User is not a teacher.' }), { status: 403, headers });
    }

    // 3. Fetch all data required for the teacher's dashboard
    // This uses an RPC call to a database function for efficiency and atomicity.
    // The database function `get_teacher_dashboard_data` would be defined in your schema.
    const { data, error } = await supabaseAdmin.rpc('get_teacher_dashboard_data', {
      teacher_id_param: user.id
    });

    if (error) throw error;

    return new Response(JSON.stringify(data), { status: 200, headers });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
});

/*
  NOTE: This Edge Function relies on a PostgreSQL function in your database for performance.
  Add this function to your schema.sql file.

  CREATE OR REPLACE FUNCTION get_teacher_dashboard_data(teacher_id_param uuid)
  RETURNS json AS $$
  DECLARE
    result json;
  BEGIN
    SELECT json_build_object(
      'teacherName', (SELECT full_name FROM public.users WHERE id = teacher_id_param),
      'studentProgress', (
        SELECT COALESCE(json_agg(student_data), '[]'::json)
        FROM (
          SELECT
            s.id AS "studentId",
            s.full_name AS "studentName",
            c.title AS "courseName",
            (SELECT COUNT(*) FROM public.lesson_progress lp WHERE lp.student_id = s.id AND lp.status = 'completed') AS "lessonsCompleted",
            (SELECT COUNT(*) FROM public.lessons l JOIN public.modules m ON l.module_id = m.id WHERE m.course_id = c.id) AS "totalLessons",
            75.5 AS "averageMastery" -- Placeholder for concept mastery calculation
          FROM public.users s
          JOIN public.course_enrollments ce ON s.id = ce.student_id
          JOIN public.courses c ON ce.course_id = c.id
          WHERE ce.course_id IN (
            SELECT tc.course_id FROM public.teacher_courses tc WHERE tc.teacher_id = teacher_id_param
          )
        ) student_data
      )
    ) INTO result;
    RETURN result;
  END;
  $$ LANGUAGE plpgsql;
*/
