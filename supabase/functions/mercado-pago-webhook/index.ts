import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Mercado Pago Webhook called', { 
    method: req.method, 
    url: req.url 
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoAccessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN not configured');
    }

    if (req.method === 'POST') {
      const notification = await req.json();
      console.log('Received webhook notification:', notification);

      // Only process payment notifications
      if (notification.type !== 'payment') {
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      const paymentId = notification.data.id;
      
      // Get payment details from Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        }
      });

      if (!mpResponse.ok) {
        console.error('Error fetching payment from Mercado Pago:', await mpResponse.text());
        return new Response('Error', { status: 500, headers: corsHeaders });
      }

      const payment = await mpResponse.json();
      console.log('Payment details from Mercado Pago:', payment);

      const externalReference = payment.external_reference;
      const status = payment.status;

      if (!externalReference) {
        console.error('No external reference found in payment');
        return new Response('Error', { status: 400, headers: corsHeaders });
      }

      // Update payment status in our database
      const { error: updateError } = await supabaseClient
        .from('payments')
        .update({ 
          status: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending',
          mercado_pago_payment_id: paymentId,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', externalReference);

      if (updateError) {
        console.error('Error updating payment:', updateError);
        return new Response('Error', { status: 500, headers: corsHeaders });
      }

      // If approved, create photo_purchases records
      if (status === 'approved') {
        const { data: paymentData, error: paymentError } = await supabaseClient
          .from('payments')
          .select('user_id, photo_ids')
          .eq('id', externalReference)
          .single();

        if (paymentError) {
          console.error('Error fetching payment data:', paymentError);
          return new Response('Error', { status: 500, headers: corsHeaders });
        }

        // Create individual photo purchases
        const photoPurchases = paymentData.photo_ids.map((photoId: string) => ({
          payment_id: externalReference,
          photo_id: photoId,
          user_id: paymentData.user_id
        }));

        const { error: purchaseError } = await supabaseClient
          .from('photo_purchases')
          .upsert(photoPurchases, { onConflict: 'user_id,photo_id' });

        if (purchaseError) {
          console.error('Error creating photo purchases:', purchaseError);
          return new Response('Error', { status: 500, headers: corsHeaders });
        }

        console.log('Photo purchases created successfully for payment:', externalReference);
      }

      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500, headers: corsHeaders });
  }
})