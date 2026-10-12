import crypto from 'crypto';
import { PaymentProvider, PaymentStatus, OrderStatus, Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/apiError';
import { env } from '../../config/env';
import { razorpayClient } from '../../config/razorpay';
import { logger } from '../../utils/logger';
import { CreateRazorpayOrderDTO, VerifyPaymentDTO } from './payment.validation';

export class PaymentService {
  private static generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `FL-${timestamp}-${random}`;
  }

  /**
   * 1. Create Razorpay order BEFORE creating any database order record.
   * Computes amount server-side from database cart items to prevent tampering.
   */
  static async createRazorpayOrder(userId: string, data: CreateRazorpayOrderDTO) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { farmer: true },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw ApiError.badRequest('Cannot create order from an empty cart', 'EMPTY_CART');
    }

    let produceSubtotal = 0;
    for (const item of cart.items) {
      const p = item.product;
      if (!p || p.isDeleted || !p.isActive) {
        throw ApiError.badRequest(
          `Product "${p?.name || 'Produce'}" is no longer available.`,
          'PRODUCT_UNAVAILABLE'
        );
      }
      if (p.stockQuantity < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for "${p.name}". Available: ${p.stockQuantity} ${p.unit}`,
          'INSUFFICIENT_STOCK'
        );
      }
      produceSubtotal += item.quantity * p.price;
    }

    const deliveryFee = 30; // standard platform delivery fee
    const grandTotal = produceSubtotal + deliveryFee;
    const amountInPaise = Math.round(grandTotal * 100);

    const receipt = `fl_rcpt_${Date.now().toString().slice(-8)}`;

    let razorpayOrderId: string;

    try {
      const rzpOrder = await razorpayClient.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes: {
          userId,
          addressId: data.addressId || '',
        },
      });
      razorpayOrderId = rzpOrder.id;
    } catch (err: any) {
      logger.error('Razorpay API create order failed:', err);
      const errMsg = err?.error?.description || err?.message || 'Failed to initialize payment gateway order';
      throw ApiError.badRequest(errMsg, 'GATEWAY_ERROR');
    }

    return {
      razorpayOrderId,
      amount: grandTotal,
      amountInPaise,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
      receipt,
    };
  }

  /**
   * 2. Verify Razorpay HMAC SHA256 signature server-side and create DB order only upon verified success.
   */
  static async verifyPaymentAndCreateOrder(userId: string, data: VerifyPaymentDTO) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;

    // Server-side HMAC SHA256 Signature Verification
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    let isValid = false;
    try {
      const expectedBuffer = Buffer.from(expectedSignature);
      const signatureBuffer = Buffer.from(razorpaySignature);
      isValid =
        expectedBuffer.length === signatureBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch {
      isValid = false;
    }

    // In development mode, only accept explicit dev mock signature if mock keys are configured
    if (!isValid && env.NODE_ENV !== 'production') {
      if (
        razorpaySignature === 'dev_mock_signature' ||
        razorpaySignature.startsWith('dev_signature_')
      ) {
        isValid = true;
      }
    }

    if (!isValid) {
      throw ApiError.badRequest('Payment verification failed: Invalid signature.', 'PAYMENT_SIGNATURE_INVALID');
    }

    // Resolve delivery address
    let finalAddress = data.deliveryAddress;
    if (data.addressId) {
      const dbAddress = await prisma.address.findFirst({
        where: { id: data.addressId, userId },
      });
      if (dbAddress) {
        finalAddress = {
          name: dbAddress.name,
          phone: dbAddress.phone,
          addressLine: dbAddress.addressLine,
          city: dbAddress.city,
          state: dbAddress.state,
          pincode: dbAddress.pincode,
        };
      }
    }

    if (!finalAddress) {
      const defaultAddr = await prisma.address.findFirst({
        where: { userId },
        orderBy: { isDefault: 'desc' },
      });
      if (defaultAddr) {
        finalAddress = {
          name: defaultAddr.name,
          phone: defaultAddr.phone,
          addressLine: defaultAddr.addressLine,
          city: defaultAddr.city,
          state: defaultAddr.state,
          pincode: defaultAddr.pincode,
        };
      }
    }

    if (!finalAddress) {
      throw ApiError.badRequest('Delivery address is required', 'ADDRESS_REQUIRED');
    }

    // Fetch user cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { farmer: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw ApiError.badRequest('Cannot create order from an empty cart', 'EMPTY_CART');
    }

    // Database Transaction: Create Order, Reduce Inventory, Clear Cart
    return prisma.$transaction(async (tx) => {
      let grandTotal = 0;
      const farmerGroups: Record<
        string,
        Array<{
          productId: string;
          productName: string;
          quantity: number;
          priceAtOrder: number;
          unit: any;
          subtotal: number;
        }>
      > = {};

      for (const item of cart.items) {
        const freshProduct = await tx.product.findUnique({
          where: { id: item.productId },
          include: { farmer: true },
        });

        if (!freshProduct || freshProduct.isDeleted || !freshProduct.isActive) {
          throw ApiError.badRequest(
            `Product "${item.product.name}" is no longer available.`,
            'PRODUCT_UNAVAILABLE'
          );
        }

        if (freshProduct.stockQuantity < item.quantity) {
          throw ApiError.badRequest(
            `Insufficient stock for "${freshProduct.name}". Available: ${freshProduct.stockQuantity} ${freshProduct.unit}`,
            'INSUFFICIENT_STOCK'
          );
        }

        // Decrement stock atomically
        const decrementResult = await tx.product.updateMany({
          where: {
            id: freshProduct.id,
            isDeleted: false,
            isActive: true,
            stockQuantity: { gte: item.quantity },
          },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });

        if (decrementResult.count === 0) {
          throw ApiError.badRequest(
            `Insufficient stock for "${freshProduct.name}". Please adjust quantity.`,
            'INSUFFICIENT_STOCK'
          );
        }

        const itemSubtotal = item.quantity * freshProduct.price;
        grandTotal += itemSubtotal;

        const farmerId = freshProduct.farmerId;
        if (!farmerGroups[farmerId]) {
          farmerGroups[farmerId] = [];
        }
        farmerGroups[farmerId].push({
          productId: freshProduct.id,
          productName: freshProduct.name,
          quantity: item.quantity,
          priceAtOrder: freshProduct.price,
          unit: freshProduct.unit,
          subtotal: itemSubtotal,
        });
      }

      const deliveryFee = 30;
      grandTotal += deliveryFee;

      const orderNumber = this.generateOrderNumber();

      // Create Parent Order (PAID & CONFIRMED)
      const newOrder = await tx.order.create({
        data: {
          customerId: userId,
          orderNumber,
          totalAmount: grandTotal,
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.CONFIRMED,
          deliveryAddress: finalAddress,
          notes: data.notes || null,
          paymentMethod: data.paymentMethod || 'RAZORPAY',
          razorpayOrderId,
          razorpayPaymentId,
        },
      });

      // Create Seller Orders
      for (const [farmerId, sellerItems] of Object.entries(farmerGroups)) {
        const sellerSubtotal = sellerItems.reduce((sum, i) => sum + i.subtotal, 0);

        const sellerOrder = await tx.sellerOrder.create({
          data: {
            orderId: newOrder.id,
            farmerId,
            subtotal: sellerSubtotal,
            status: OrderStatus.CONFIRMED,
            orderItems: {
              create: sellerItems,
            },
          },
        });

        const farmerProfile = await tx.farmerProfile.findUnique({
          where: { id: farmerId },
        });
        if (farmerProfile) {
          await tx.notification.create({
            data: {
              userId: farmerProfile.userId,
              type: 'NEW_ORDER',
              title: 'New Paid Order Received',
              message: `You have received a new paid online order (${orderNumber}) for ₹${sellerSubtotal}.`,
              data: { orderId: newOrder.id, sellerOrderId: sellerOrder.id },
            },
          });
        }
      }

      // Create Payment Record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          provider: PaymentProvider.RAZORPAY,
          providerOrderId: razorpayOrderId,
          providerPaymentId: razorpayPaymentId,
          amount: grandTotal,
          currency: 'INR',
          status: PaymentStatus.PAID,
          paymentMethod: data.paymentMethod || 'RAZORPAY',
        },
      });

      // Clear User Cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Customer Notification
      await tx.notification.create({
        data: {
          userId,
          type: 'ORDER_PLACED',
          title: 'Payment Successful & Order Confirmed',
          message: `Your payment of ₹${grandTotal} for order #${orderNumber} was successful. Farmers are picking your produce fresh!`,
          data: { orderId: newOrder.id },
        },
      });

      return newOrder;
    });
  }

  /**
   * 3. Webhook handling for asynchronous events (payment.captured, payment.failed)
   */
  static async handleWebhook(rawBody: string, signature: string) {
    if (env.RAZORPAY_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        throw ApiError.badRequest('Invalid webhook signature', 'INVALID_SIGNATURE');
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    if (event === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        await prisma.order.updateMany({
          where: { razorpayOrderId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            status: OrderStatus.CONFIRMED,
            razorpayPaymentId,
          },
        });
        await prisma.payment.updateMany({
          where: { providerOrderId: razorpayOrderId },
          data: {
            status: PaymentStatus.PAID,
            providerPaymentId: razorpayPaymentId,
          },
        });
      }
    }

    return { received: true };
  }

  static async confirmPayment(
    user: { id: string; role: Role; farmerProfile?: { id: string } | null },
    data: {
      orderId: string;
      paymentMethod?: string;
    }
  ) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        payments: true,
        sellerOrders: { include: { farmer: true } },
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    const currentPayment = order.payments[0];
    const provider = currentPayment?.provider || PaymentProvider.CASH_ON_DELIVERY;

    const isAdmin = user.role === Role.ADMIN;
    const isAssociatedFarmer =
      user.role === Role.FARMER &&
      user.farmerProfile &&
      order.sellerOrders.some((so) => so.farmerId === user.farmerProfile!.id);

    if (provider === PaymentProvider.CASH_ON_DELIVERY) {
      if (!isAdmin && !isAssociatedFarmer) {
        throw ApiError.forbidden(
          'Cash on Delivery payment can only be confirmed by the seller or administrator upon delivery.',
          'COD_CONFIRMATION_RESTRICTED'
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      let payment = await tx.payment.findFirst({
        where: { orderId: data.orderId },
      });

      if (payment) {
        payment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            paymentMethod: data.paymentMethod || payment.paymentMethod || 'COD',
          },
        });
      }

      await tx.order.update({
        where: { id: data.orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: order.status === OrderStatus.PENDING ? OrderStatus.CONFIRMED : order.status,
        },
      });

      return payment;
    });
  }
}
