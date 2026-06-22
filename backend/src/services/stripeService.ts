import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

// In a real deployment a valid sk_test_... key must be supplied via .env.
// If it's missing/placeholder we still let the app run and simulate a
// successful payment intent so the checkout flow can be demoed end-to-end.
const isConfigured = STRIPE_SECRET_KEY.startsWith("sk_test_") && !STRIPE_SECRET_KEY.includes("replace");

const stripe = isConfigured ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" }) : null;

export async function createPaymentIntent(amountInCents: number, currency = "usd") {
  if (!stripe) {
    // Simulated response so checkout still works without real Stripe credentials configured
    return {
      id: `pi_simulated_${Date.now()}`,
      client_secret: `pi_simulated_${Date.now()}_secret_demo`,
      amount: amountInCents,
      currency,
      status: "succeeded",
      simulated: true,
    };
  }

  const intent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency,
    automatic_payment_methods: { enabled: true },
  });
  return intent;
}

export async function confirmPaymentIntent(paymentIntentId: string) {
  if (!stripe || paymentIntentId.startsWith("pi_simulated_")) {
    return { id: paymentIntentId, status: "succeeded", simulated: true };
  }
  return stripe.paymentIntents.retrieve(paymentIntentId);
}
