// @ts-nocheck
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Mapeo price_id → nombre del plan
function planFromPriceId(priceId: string): string | null {
  if (priceId === Deno.env.get('STRIPE_PRICE_PRO'))    return 'pro'
  if (priceId === Deno.env.get('STRIPE_PRICE_EXPERT')) return 'expert'
  return null
}

async function setPlan(userId: string, plan: string, subscriptionId: string | null) {
  await supabase
    .from('users')
    .update({ plan, stripe_subscription_id: subscriptionId })
    .eq('id', userId)
}

Deno.serve(async (req) => {
  const sig  = req.headers.get('stripe-signature') ?? ''
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    )
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {

      // Pago completado → activar plan
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId  = session.metadata?.supabase_user_id
        const plan    = session.metadata?.plan
        if (userId && plan) {
          await setPlan(userId, plan, session.subscription as string)
        }
        break
      }

      // Suscripción cancelada → bajar a gratis
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_subscription_id', sub.id)
          .maybeSingle()
        if (user) {
          await supabase
            .from('users')
            .update({ plan: 'gratis', stripe_subscription_id: null })
            .eq('id', user.id)
        }
        break
      }

      // Suscripción actualizada (cambio de plan)
      case 'customer.subscription.updated': {
        const sub     = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price?.id ?? ''
        const newPlan = planFromPriceId(priceId)
        const userId  = sub.metadata?.supabase_user_id
        if (userId && newPlan) {
          await setPlan(userId, newPlan, sub.id)
        }
        break
      }

      // Pago fallido → registrar en log (sin bajar plan aún — Stripe reintenta)
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.warn('Payment failed for customer:', invoice.customer)
        break
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Webhook handler error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
