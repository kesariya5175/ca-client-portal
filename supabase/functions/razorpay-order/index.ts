// Supabase Edge Function — razorpay-order
// Creates a Razorpay order server-side (requires secret key)
// Called by the client before opening Razorpay checkout

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RAZORPAY_KEY_ID     = Deno.env.get('RAZORPAY_KEY_ID')!
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, invoiceId, description } = await req.json()

    if (!amount || !invoiceId) {
      return json({ error: 'amount and invoiceId are required' }, 400)
    }

    // Razorpay expects amount in paise (₹1 = 100 paise)
    const amountInPaise = Math.round(Number(amount) * 100)

    const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `inv_${invoiceId}`,
        notes: { description, invoiceId },
      }),
    })

    const order = await res.json()

    if (!res.ok) {
      return json({ error: order.error?.description ?? 'Failed to create order' }, res.status)
    }

    return json({ orderId: order.id, amount: order.amount, currency: order.currency })

  } catch (err) {
    return json({ error: err.message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
