/**
 * services/payment/index.ts
 *
 * Factory that resolves the active PaymentProvider from PAYMENT_PROVIDER env var.
 *
 * Usage:
 *   import { paymentProvider } from '@/services/payment';
 *   const order = await paymentProvider.createOrder({ ... });
 */

import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { PaymentProvider } from './PaymentProvider';
import { ManualUpiProvider } from './PaymentProvider';

function createPaymentProvider(): PaymentProvider {
  switch (env.PAYMENT_PROVIDER) {
    case 'manual_upi':
      logger.info('💳  Payment provider: Manual UPI (screenshot verification)');
      return new ManualUpiProvider();

    case 'razorpay':
      // v2: import and return RazorpayProvider
      // import { RazorpayProvider } from './RazorpayProvider';
      // return new RazorpayProvider();
      throw new Error(
        'Razorpay payment provider is not implemented yet. Set PAYMENT_PROVIDER=manual_upi for v1.',
      );

    case 'stripe':
      // v2: import and return StripeProvider
      throw new Error(
        'Stripe payment provider is not implemented yet. Set PAYMENT_PROVIDER=manual_upi for v1.',
      );

    default:
      throw new Error(`Unknown PAYMENT_PROVIDER: ${env.PAYMENT_PROVIDER}`);
  }
}

// Singleton — created once at startup
export const paymentProvider = createPaymentProvider();

// Re-export abstract class for type usage
export { PaymentProvider } from './PaymentProvider';
