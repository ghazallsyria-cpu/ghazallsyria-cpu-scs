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

// This is a placeholder function. A real implementation would involve a payment provider like Stripe.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const { userId, planId, paymentToken } = await req.json();
    if (!userId || !planId || !paymentToken) {
        return new Response(JSON.stringify({ error: 'User ID, Plan ID, and payment token are required.' }), { status: 400, headers });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Process payment with a payment provider (e.g., Stripe) - MOCKED
    const paymentProviderResponse = { success: true, transactionId: `txn_${new Date().getTime()}` };

    if (!paymentProviderResponse.success) {
      return new Response(JSON.stringify({ error: 'Payment failed.' }), { status: 402, headers });
    }
    
    // 2. On successful payment, create the subscription and payment records.
    const { data: planData, error: planError } = await supabaseAdmin
        .from('subscription_plans')
        .select('price, duration_days')
        .eq('id', planId)
        .single();
    
    if (planError || !planData) throw new Error('Subscription plan not found.');
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + planData.duration_days);

    // Use a transaction (via RPC) to ensure data integrity
    const { data: subscription, error } = await supabaseAdmin.rpc('create_subscription_and_payment', {
        p_user_id: userId,
        p_plan_id: planId,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
        p_amount: planData.price,
        p_txn_id: paymentProviderResponse.transactionId,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, subscription: subscription }), { status: 200, headers });

  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
});
