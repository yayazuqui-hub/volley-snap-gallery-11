import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  photo_ids: string[]
  user_id: string
}

interface MercadoPagoPreference {
  items: Array<{
    title: string
    quantity: number
    unit_price: number
    currency_id: string
  }>
  back_urls: {
    success: string
    failure: string
    pending: string
  }
  auto_return: string
  external_reference: string
  notification_url: string
}

serve(async (req) => {
  console.log('Mercado Pago Payment function called', { 
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
      const { photo_ids, user_id }: PaymentRequest = await req.json();

      if (!photo_ids || photo_ids.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No photos selected' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch photos with prices
      const { data: photos, error: photosError } = await supabaseClient
        .from('photos')
        .select('id, original_name, price')
        .in('id', photo_ids);

      if (photosError) {
        console.error('Error fetching photos:', photosError);
        return new Response(
          JSON.stringify({ error: 'Error fetching photos' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const totalAmount = photos.reduce((sum, photo) => sum + photo.price, 0);

      if (totalAmount === 0) {
        return new Response(
          JSON.stringify({ error: 'Photos have no price set' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create payment record
      const { data: payment, error: paymentError } = await supabaseClient
        .from('payments')
        .insert({
          user_id,
          photo_ids,
          total_amount: totalAmount,
          status: 'pending'
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment:', paymentError);
        return new Response(
          JSON.stringify({ error: 'Error creating payment record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create Mercado Pago preference
      const baseUrl = req.headers.get('origin') || 'https://your-domain.com';
      const preference: MercadoPagoPreference = {
        items: [{
          title: `Fotos (${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'})`,
          quantity: 1,
          unit_price: totalAmount,
          currency_id: 'BRL'
        }],
        back_urls: {
          success: `${baseUrl}/gallery?payment=success`,
          failure: `${baseUrl}/gallery?payment=failure`,
          pending: `${baseUrl}/gallery?payment=pending`
        },
        auto_return: 'approved',
        external_reference: payment.id,
        notification_url: `${baseUrl}/supabase/functions/v1/mercado-pago-webhook`
      };

      console.log('Creating Mercado Pago preference:', preference);

      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mercadoPagoAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preference)
      });

      if (!mpResponse.ok) {
        const error = await mpResponse.text();
        console.error('Mercado Pago API error:', error);
        return new Response(
          JSON.stringify({ error: 'Error creating payment preference' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const mpPreference = await mpResponse.json();
      console.log('Mercado Pago preference created:', mpPreference.id);

      // Update payment with preference ID
      await supabaseClient
        .from('payments')
        .update({ mercado_pago_preference_id: mpPreference.id })
        .eq('id', payment.id);

      return new Response(
        JSON.stringify({
          preference_id: mpPreference.id,
          init_point: mpPreference.init_point,
          payment_id: payment.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})