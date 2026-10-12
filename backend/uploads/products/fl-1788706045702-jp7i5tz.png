import { describe, it, expect, vi } from 'vitest';
import { OrderStatus, Role } from '@prisma/client';
import { OrderService } from '../src/modules/orders/order.service';

describe('Order Service Business Logic', () => {
  it('should calculate DELIVERED when all seller orders are delivered', async () => {
    const mockTx: any = {
      sellerOrder: {
        findMany: vi.fn().mockResolvedValue([
          { status: OrderStatus.DELIVERED },
          { status: OrderStatus.DELIVERED },
        ]),
      },
      order: {
        update: vi.fn().mockResolvedValue({}),
      },
    };

    const status = await OrderService.recomputeParentOrderStatus(mockTx, 'order-123');
    expect(status).toBe(OrderStatus.DELIVERED);
    expect(mockTx.order.update).toHaveBeenCalledWith({
      where: { id: 'order-123' },
      data: { status: OrderStatus.DELIVERED },
    });
  });

  it('should calculate CANCELLED when all seller orders are cancelled', async () => {
    const mockTx: any = {
      sellerOrder: {
        findMany: vi.fn().mockResolvedValue([
          { status: OrderStatus.CANCELLED },
          { status: OrderStatus.CANCELLED },
        ]),
      },
      order: {
        update: vi.fn().mockResolvedValue({}),
      },
    };

    const status = await OrderService.recomputeParentOrderStatus(mockTx, 'order-123');
    expect(status).toBe(OrderStatus.CANCELLED);
  });

  it('should calculate OUT_FOR_DELIVERY when any seller order is out for delivery', async () => {
    const mockTx: any = {
      sellerOrder: {
        findMany: vi.fn().mockResolvedValue([
          { status: OrderStatus.PREPARING },
          { status: OrderStatus.OUT_FOR_DELIVERY },
        ]),
      },
      order: {
        update: vi.fn().mockResolvedValue({}),
      },
    };

    const status = await OrderService.recomputeParentOrderStatus(mockTx, 'order-123');
    expect(status).toBe(OrderStatus.OUT_FOR_DELIVERY);
  });
});
