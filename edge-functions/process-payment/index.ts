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
// It would receive a webhook from the provider or a token from the client.

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

    // 1. Process payment with a payment provider (e.g., Stripe) using the paymentToken.
    //    This is a mocked success response.
    const paymentProviderResponse = { success: true, transactionId: `txn_${new Date().getTime()}` };

    if (!paymentProviderResponse.success) {
      // Log failed payment attempt
      await supabaseAdmin.from('payments').insert({
        user_id: userId,
        amount: 0, // Should get from planId
        currency: 'USD',
        status: 'failed',
        payment_provider_txn_id: paymentProviderResponse.transactionId,
      });
      return new Response(JSON.stringify({ error: 'Payment failed.' }), { status: 402, headers });
    }
    
    // 2. On successful payment, create the subscription and payment records in the database.
    const { data: planData, error: planError } = await supabaseAdmin
        .from('subscription_plans')
        .select('price, duration_days')
        .eq('id', planId)
        .single();
    
    if (planError || !planData) throw new Error('Subscription plan not found.');
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + planData.duration_days);

    // Use a transaction to ensure both tables are updated or neither is.
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

/*
  NOTE: This function assumes you have created a corresponding RPC (database function) in Supabase
  to handle the transaction atomically. Example SQL for the function:

  CREATE OR REPLACE FUNCTION create_subscription_and_payment(
      p_user_id uuid,
      p_plan_id uuid,
      p_start_date timestamptz,
      p_end_date timestamptz,
      p_amount numeric,
      p_txn_id text
  ) RETURNS uuid AS $$
  DECLARE
      new_subscription_id uuid;
  BEGIN
      INSERT INTO public.user_subscriptions (user_id, plan_id, start_date, end_date, status)
      VALUES (p_user_id, p_plan_id, p_start_date, p_end_date, 'active')
      RETURNING id INTO new_subscription_id;

      INSERT INTO public.payments (user_id, subscription_id, amount, currency, payment_provider_txn_id, status)
      VALUES (p_user_id, new_subscription_id, p_amount, 'USD', p_txn_id, 'succeeded');

      RETURN new_subscription_id;
  END;
  $$ LANGUAGE plpgsql;
*/
