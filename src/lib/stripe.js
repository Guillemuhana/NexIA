import { supabase } from './supabase'

export async function redirectToCheckout(plan, userId, email) {
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: {
      plan,
      userId,
      email,
      successUrl: `${window.location.origin}/plan-success`,
      cancelUrl:  `${window.location.origin}/precios`,
    },
  })
  if (error || !data?.url) {
    throw new Error(error?.message || 'No se pudo iniciar el pago. Intentá de nuevo.')
  }
  window.location.href = data.url
}
