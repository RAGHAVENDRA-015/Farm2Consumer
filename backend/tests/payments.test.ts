import { describe, it, expect, vi } from 'vitest';
import { PaymentProvider, Role } from '@prisma/client';
import { PaymentService } from '../src/modules/payments/payment.service';
import { prisma } from '../src/config/database';

describe('Payment Service Security & Authorization', () => {
  it('should block regular customer from confirming COD payment as paid', async () => {
    vi.spyOn(prisma.order, 'findUnique').mockResolvedValue({
      id: 'order-123',
      customerId: 'customer-user-1',
      totalAmount: 500,
      payments: [{ provider: PaymentProvider.CASH_ON_DELIVERY }],
      sellerOrders: [{ farmerId: 'farmer-1' }],
    } as any);

    const customerUser = {
      id: 'customer-user-1',
      role: Role.CUSTOMER,
      farmerProfile: null,
    };

    await expect(
      PaymentService.confirmPayment(customerUser, { orderId: 'order-123' })
    ).rejects.toThrowError('Cash on Delivery payment can only be confirmed by the seller or administrator upon delivery.');
  });
});
