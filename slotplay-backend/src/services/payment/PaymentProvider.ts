/**
 * services/payment/PaymentProvider.ts
 *
 * Abstract payment provider interface.
 *
 * v1 uses ManualUPIProvider (screenshot + UTR verification by owner).
 * v2 can plug in RazorpayProvider or StripeProvider without touching
 * any booking logic — only the provider implementation changes.
 *
 * The interface is intentionally minimal for v1. Additional methods
 * (refund, webhook verification) should be added here before implementing v2.
 */

import { CreateOrderInput, OrderResult } from '@/types';

export abstract class PaymentProvider {
  /** Human-readable name for logging */
  abstract readonly name: string;

  /**
   * Initiate a payment order.
   *
   * For ManualUPI: returns a synthetic order referencing the venue's UPI QR.
   * For Razorpay:  creates an order via the Razorpay API and returns the order ID.
   */
  abstract createOrder(input: CreateOrderInput): Promise<OrderResult>;

  /**
   * Verify that a payment was completed successfully.
   *
   * For ManualUPI: verification is manual (owner reviews screenshot).
   *               This method always returns false — the owner's approval
   *               is the authoritative confirmation.
   * For Razorpay:  verifies the HMAC signature of the payment callback.
   */
  abstract verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
  ): Promise<boolean>;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * services/payment/ManualUpiProvider.ts
 *
 * v1 payment provider.
 * No gateway call is made — we generate a local order reference and
 * delegate verification to the owner dashboard.
 */

import { v4 as uuidv4 } from 'uuid';

export class ManualUpiProvider extends PaymentProvider {
  readonly name = 'manual_upi';

  async createOrder(input: CreateOrderInput): Promise<OrderResult> {
    // Generate a local order ID — no external API call required
    const orderId = `UPI-${uuidv4().toUpperCase().slice(0, 12)}`;

    return {
      orderId,
      amount: input.amountInPaise,
      currency: input.currency ?? 'INR',
      metadata: {
        provider: this.name,
        bookingId: input.bookingId,
        note: 'Manual UPI payment — awaiting screenshot verification by owner',
      },
    };
  }

  async verifyPayment(
    _orderId: string,
    _paymentId: string,
    _signature: string,
  ): Promise<boolean> {
    // Manual UPI has no automated verification.
    // Verification is performed by the owner in the Payment Verification Center.
    return false;
  }
}
