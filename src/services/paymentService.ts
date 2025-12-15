import Stripe from 'stripe';
import { getDb } from '../config/firebase';

export interface PaymentIntentResponse {
  clientSecret?: string;
  status: string;
  id?: string;
}

export class PaymentService {
  private stripe: Stripe | null;
  private collection: FirebaseFirestore.CollectionReference | null;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    this.stripe = key ? new Stripe(key) : null;
    if (this.stripe) {
      try {
        this.collection = getDb().collection('payments');
      } catch {
        this.collection = null;
      }
    } else {
      this.collection = null;
    }
  }

  isEnabled() {
    return !!this.stripe;
  }

  async createIntent(amount: number, currency = 'eur'): Promise<PaymentIntentResponse> {
    if (!this.stripe) {
      return { status: 'not_configured' };
    }
    const intent = await this.stripe.paymentIntents.create({ amount, currency, automatic_payment_methods: { enabled: true } });
    if (this.collection) {
      await this.collection.add({ paymentIntentId: intent.id, amount, currency, status: intent.status, createdAt: new Date() });
    }
    return { clientSecret: intent.client_secret || undefined, status: intent.status, id: intent.id };
  }

  async confirmIntent(intentId: string): Promise<PaymentIntentResponse> {
    if (!this.stripe) {
      return { status: 'not_configured' };
    }
    const intent = await this.stripe.paymentIntents.confirm(intentId);
    if (this.collection) {
      await this.collection.add({ paymentIntentId: intent.id, status: intent.status, confirmedAt: new Date() });
    }
    return { clientSecret: intent.client_secret || undefined, status: intent.status, id: intent.id };
  }

  async handleWebhook(_payload: any) {
    // Minimal MVP: acknowledge reception; parsing signatures skipped for brevity
    return { received: true };
  }
}
