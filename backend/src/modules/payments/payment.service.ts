import { PaymentProvider, PaymentStatus, OrderStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/apiError';

export class PaymentService {
  static async confirmPayment(
    userId: string,
    data: {
      orderId: string;
      provider?: PaymentProvider;
      paymentMethod?: string;
      transactionId?: string;
      status?: PaymentStatus;
    },
    isAdmin = false
  ) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { payments: true },
    });

    if (!order) {
      throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    if (!isAdmin && order.customerId !== userId) {
      throw ApiError.forbidden('Forbidden order payment confirmation', 'FORBIDDEN');
    }

    const provider = data.provider || PaymentProvider.CASH_ON_DELIVERY;
    const finalStatus = data.status || PaymentStatus.PAID;

    return prisma.$transaction(async (tx) => {
      // Create or update payment record
      let payment = await tx.payment.findFirst({
        where: { orderId: data.orderId },
      });

      if (payment) {
        payment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            provider,
            providerPaymentId: data.transactionId || payment.providerPaymentId,
            status: finalStatus,
            paymentMethod: data.paymentMethod || payment.paymentMethod,
          },
        });
      } else {
        payment = await tx.payment.create({
          data: {
            orderId: data.orderId,
            provider,
            amount: order.totalAmount,
            currency: 'INR',
            providerPaymentId: data.transactionId || null,
            status: finalStatus,
            paymentMethod: data.paymentMethod || 'COD',
          },
        });
      }

      // Update Order payment status
      await tx.order.update({
        where: { id: data.orderId },
        data: {
          paymentStatus: finalStatus,
          status: finalStatus === PaymentStatus.PAID ? OrderStatus.CONFIRMED : order.status,
        },
      });

      // Customer notification
      await tx.notification.create({
        data: {
          userId: order.customerId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Status Updated',
          message: `Payment of ₹${order.totalAmount} for order #${order.orderNumber} is marked as ${finalStatus}.`,
          data: { orderId: order.id, paymentId: payment.id },
        },
      });

      return payment;
    });
  }

  static async getPaymentById(paymentId: string, userId: string, isAdmin = false) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: { select: { id: true, customerId: true, orderNumber: true, totalAmount: true } },
      },
    });

    if (!payment) {
      throw ApiError.notFound('Payment record not found', 'PAYMENT_NOT_FOUND');
    }

    if (!isAdmin && payment.order.customerId !== userId) {
      throw ApiError.forbidden('Access denied', 'FORBIDDEN');
    }

    return payment;
  }
}
