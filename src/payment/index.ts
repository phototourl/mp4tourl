import { WaffoProvider } from './provider/waffo';
import type {
  CheckoutResult,
  CreateCheckoutParams,
  CreateCreditCheckoutParams,
  CreatePortalParams,
  PaymentProvider,
  PortalResult,
} from './types';

/**
 * Global payment provider instance (Waffo — main-Waffo branch)
 */
let paymentProvider: PaymentProvider | null = null;

/**
 * Get the payment provider
 */
export const getPaymentProvider = (): PaymentProvider => {
  if (!paymentProvider) {
    paymentProvider = new WaffoProvider();
  }
  return paymentProvider;
};

/**
 * Create a checkout session for a plan
 */
export const createCheckout = async (
  params: CreateCheckoutParams
): Promise<CheckoutResult> => {
  return getPaymentProvider().createCheckout(params);
};

/**
 * Create a checkout session for a credit package
 */
export const createCreditCheckout = async (
  params: CreateCreditCheckoutParams
): Promise<CheckoutResult> => {
  return getPaymentProvider().createCreditCheckout(params);
};

/**
 * Create a customer portal session
 */
export const createCustomerPortal = async (
  params: CreatePortalParams
): Promise<PortalResult> => {
  return getPaymentProvider().createCustomerPortal(params);
};

/**
 * Handle webhook event
 */
export const handleWebhookEvent = async (
  payload: string,
  signature: string
): Promise<void> => {
  await getPaymentProvider().handleWebhookEvent(payload, signature);
};

// Re-export types
export * from './types';
