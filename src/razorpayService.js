// Razorpay payment service
// Handles loading the Razorpay script and opening checkout

import { supabase } from './supabaseClient'

const RAZORPAY_KEY_ID  = import.meta.env.VITE_RAZORPAY_KEY_ID
const ORDER_FUNCTION   = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-order`

// Load Razorpay JS script once
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * Open Razorpay checkout for an invoice.
 * @param {object} invoice   - invoice row from Supabase (id, amount, description)
 * @param {object} client    - client row (name, email)
 * @param {function} onSuccess - called with paymentId after successful payment
 */
export async function payInvoice(invoice, client, onSuccess) {
  if (!RAZORPAY_KEY_ID) {
    alert('Payment gateway not configured yet. Please contact your CA firm.')
    return
  }

  const loaded = await loadRazorpayScript()
  if (!loaded) {
    alert('Could not load payment gateway. Please check your internet connection.')
    return
  }

  // Create order on server
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(ORDER_FUNCTION, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      amount: invoice.amount,
      invoiceId: invoice.id,
      description: invoice.description,
    }),
  })

  const order = await res.json()
  if (order.error) {
    alert('Could not initiate payment: ' + order.error)
    return
  }

  // Open Razorpay checkout
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
    order_id: order.orderId,
    name: 'CA Client Portal',
    description: invoice.description,
    prefill: {
      name:  client.name  ?? '',
      email: client.email ?? '',
    },
    theme: { color: '#1a56db' },
    handler: async function (response) {
      // Payment successful — mark invoice paid in Supabase
      await supabase
        .from('invoices')
        .update({
          paid: true,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id:   response.razorpay_order_id,
        })
        .eq('id', invoice.id)

      onSuccess(response.razorpay_payment_id)
    },
  }

  const rzp = new window.Razorpay(options)
  rzp.open()
}
