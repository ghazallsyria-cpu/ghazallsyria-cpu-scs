// Fix: Remove invalid Deno types reference and add a minimal Deno type definition
// to resolve "Cannot find name 'Deno'" errors.
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

serve(async (_req) => {
  // Handle CORS preflight request
  if (_req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    // Perform aggregate queries in parallel
    const [
      { count: totalUsers },
      { count: activeSubscriptions },
      { count: totalCourses },
      { count: unvalidatedAiResponses }
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('courses').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('ai_responses').select('*', { count: 'exact', head: true }).eq('is_validated_by_human', false)
    ]);
    
    // Simplified revenue and AI requests calculation for demonstration
    const monthlyRevenue = (activeSubscriptions || 0) * 5; 
    const aiRequestsToday = Math.floor(Math.random() * 500); // Mocked for now

    const stats = {
      totalUsers: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      monthlyRevenue: monthlyRevenue,
      aiRequestsToday: aiRequestsToday,
      unvalidatedAiResponses: unvalidatedAiResponses || 0,
      totalCourses: totalCourses || 0,
    };

    return new Response(JSON.stringify(stats), { status: 200, headers });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
});