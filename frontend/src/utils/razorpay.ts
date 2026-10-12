export interface RazorpayPrefill {
  name?: string;
  email?: string;
  contact?: string;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  keyId: string;
  orderId: string;
  amountInPaise: number;
  currency?: string;
  name?: string;
  description?: string;
  preferredMethod?: 'upi' | 'card' | 'all';
  prefill?: RazorpayPrefill;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onDismiss?: () => void;
  onError?: (error: any) => void;
}

/**
 * Dynamically loads Razorpay checkout.js script if not present
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay checkout SDK');
      resolve(false);
    };

    document.body.appendChild(script);
  });
};

/**
 * Opens Razorpay standard checkout popup
 */
export const openRazorpayModal = async (options: RazorpayCheckoutOptions): Promise<void> => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !(window as any).Razorpay) {
    throw new Error('Could not load Razorpay payment gateway. Please check your internet connection.');
  }

  const isUpiPreferred = options.preferredMethod === 'upi';

  const rzpOptions: any = {
    key: options.keyId,
    amount: options.amountInPaise,
    currency: options.currency || 'INR',
    name: options.name || 'FarmLink Marketplace',
    description: options.description || (isUpiPreferred ? 'UPI Instant Harvest Payment' : 'Direct Farm Harvest Order'),
    order_id: options.orderId,
    prefill: {
      ...options.prefill,
      ...(isUpiPreferred ? { method: 'upi' } : {}),
    },
    theme: {
      color: '#16A34A', // FarmLink Emerald Green
    },
    modal: {
      confirm_close: true,
      ondismiss: () => {
        if (options.onDismiss) {
          options.onDismiss();
        }
      },
    },
    handler: (response: RazorpaySuccessResponse) => {
      options.onSuccess(response);
    },
  };

  // Configure Razorpay display sequence to prioritize UPI / QR code payment instruments
  if (isUpiPreferred) {
    rzpOptions.config = {
      display: {
        blocks: {
          upi_block: {
            name: 'Pay using UPI / QR (Instant & Zero Fees)',
            instruments: [
              {
                method: 'upi',
                flows: ['qr', 'intent'],
              },
              {
                method: 'upi',
              },
            ],
          },
          other_block: {
            name: 'Cards, NetBanking & Wallets',
            instruments: [
              {
                method: 'card',
              },
              {
                method: 'netbanking',
              },
              {
                method: 'wallet',
              },
            ],
          },
        },
        sequence: ['block.upi_block', 'block.other_block'],
        preferences: {
          show_default_blocks: true,
        },
      },
    };
  }

  const rzp = new (window as any).Razorpay(rzpOptions);

  if (options.onError) {
    rzp.on('payment.failed', (response: any) => {
      options.onError?.(response.error);
    });
  }

  rzp.open();
};
