declare module 'razorpay' {
  interface Orders {
    create(
      params: {
        amount: number;
        currency: string;
        receipt?: string;
        notes?: Record<string, any>;
        partial_payment?: boolean;
      },
      callback?: (err: any, order: any) => void
    ): Promise<any>;
    fetch(orderId: string): Promise<any>;
  }

  interface Payments {
    fetch(paymentId: string): Promise<any>;
    capture(paymentId: string, amount: number, currency: string): Promise<any>;
  }

  interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  export default class Razorpay {
    constructor(options: RazorpayOptions);
    orders: Orders;
    payments: Payments;
  }
}
