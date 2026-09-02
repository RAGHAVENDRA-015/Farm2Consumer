import { OrderStatus, PaymentStatus, PaymentProvider, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';

export class OrderService {
  private static generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `FL-${timestamp}-${random}`;
  }

  static async createOrderFromCart(
    userId: string,
    data: {
      addressId?: string;
      deliveryAddress?: any;
      notes?: string;
      paymentProvider?: PaymentProvider;
    }
  ) {
    // 1. Resolve Delivery Address
    let finalAddress = data.deliveryAddress;
    if (data.addressId) {
      const dbAddress = await prisma.address.findFirst({
        where: { id: data.addressId, userId },
      });
      if (!dbAddress) {
        throw ApiError.badRequest('Selected delivery address not found', 'INVALID_ADDRESS');
      }
      finalAddress = {
        name: dbAddress.name,
        phone: dbAddress.phone,
        addressLine: dbAddress.addressLine,
        city: dbAddress.city,
        state: dbAddress.state,
        pincode: dbAddress.pincode,
      };
    }

    if (!finalAddress) {
      throw ApiError.badRequest('Delivery address is required', 'ADDRESS_REQUIRED');
    }

    // 2. Fetch User Cart
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

    // 3. Database Transaction
    return prisma.$transaction(async (tx) => {
      let grandTotal = 0;
      const farmerGroups: Record<string, typeof cart.items> = {};

      // Verify each item's stock, status, farmer approval
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

        if (!freshProduct.farmer.isApproved) {
          throw ApiError.badRequest(
            `Product "${freshProduct.name}" from unverified farmer cannot be purchased.`,
            'FARMER_NOT_APPROVED'
          );
        }

        if (freshProduct.stockQuantity < item.quantity) {
          throw ApiError.badRequest(
            `Insufficient stock for "${freshProduct.name}". Available: ${freshProduct.stockQuantity} ${freshProduct.unit}`,
            'INSUFFICIENT_STOCK'
          );
        }

        // Decrement product stock
        await tx.product.update({
          where: { id: freshProduct.id },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });

        const farmerId = freshProduct.farmerId;
        if (!farmerGroups[farmerId]) {
          farmerGroups[farmerId] = [];
        }
        farmerGroups[farmerId].push(item);
        grandTotal += item.quantity * freshProduct.price;
      }

      const orderNumber = this.generateOrderNumber();
      const provider = data.paymentProvider || PaymentProvider.CASH_ON_DELIVERY;

      // Create Parent Order
      const newOrder = await tx.order.create({
        data: {
          customerId: userId,
          orderNumber,
          totalAmount: grandTotal,
          paymentStatus: provider === PaymentProvider.CASH_ON_DELIVERY ? PaymentStatus.PENDING : PaymentStatus.PENDING,
          status: OrderStatus.CONFIRMED,
          deliveryAddress: finalAddress,
          notes: data.notes || null,
        },
      });

      // Create Seller Orders and Order Items
      for (const [farmerId, items] of Object.entries(farmerGroups)) {
        let sellerSubtotal = 0;
        const sellerOrderItemsData = items.map((item) => {
          const itemSubtotal = item.quantity * item.product.price;
          sellerSubtotal += itemSubtotal;
          return {
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            priceAtOrder: item.product.price,
            unit: item.product.unit,
            subtotal: itemSubtotal,
          };
        });

        const sellerOrder = await tx.sellerOrder.create({
          data: {
            orderId: newOrder.id,
            farmerId,
            subtotal: sellerSubtotal,
            status: OrderStatus.CONFIRMED,
            orderItems: {
              create: sellerOrderItemsData,
            },
          },
        });

        // Notify Farmer
        const farmerProfile = await tx.farmerProfile.findUnique({
          where: { id: farmerId },
        });
        if (farmerProfile) {
          await tx.notification.create({
            data: {
              userId: farmerProfile.userId,
              type: 'NEW_ORDER',
              title: 'New Order Received',
              message: `You have received a new order (${orderNumber}) for ₹${sellerSubtotal}.`,
              data: { orderId: newOrder.id, sellerOrderId: sellerOrder.id },
            },
          });
        }
      }

      // Create Payment Record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          provider,
          amount: grandTotal,
          currency: 'INR',
          status: PaymentStatus.PENDING,
          paymentMethod: provider,
        },
      });

      // Clear User Cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Notify Customer
      await tx.notification.create({
        data: {
          userId,
          type: 'ORDER_PLACED',
          title: 'Order Confirmed',
          message: `Your order #${orderNumber} for ₹${grandTotal} has been successfully placed!`,
          data: { orderId: newOrder.id },
        },
      });

      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          sellerOrders: {
            include: {
              farmer: { select: { id: true, farmName: true, user: { select: { name: true, phone: true } } } },
              orderItems: true,
            },
          },
          payments: true,
        },
      });
    });
  }

  static async getCustomerOrders(userId: string, queryParams: any) {
    const { page, limit, skip } = parsePagination(queryParams);
    const { status } = queryParams;

    const where: Prisma.OrderWhereInput = {
      customerId: userId,
      ...(status ? { status } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          sellerOrders: {
            include: {
              farmer: { select: { id: true, farmName: true, city: true, state: true } },
              orderItems: true,
            },
          },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  static async getOrderById(orderId: string, userId: string, isAdmin = false) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        sellerOrders: {
          include: {
            farmer: {
              select: {
                id: true,
                farmName: true,
                address: true,
                city: true,
                state: true,
                pincode: true,
                user: { select: { name: true, phone: true } },
              },
            },
            orderItems: {
              include: {
                product: { select: { id: true, name: true, images: { take: 1 } } },
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found', 'NOT_FOUND');
    }

    if (!isAdmin && order.customerId !== userId) {
      throw ApiError.forbidden('You can only view your own orders', 'FORBIDDEN');
    }

    return order;
  }

  static async cancelOrder(orderId: string, userId: string, isAdmin = false) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        sellerOrders: {
          include: { orderItems: true },
        },
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found', 'NOT_FOUND');
    }

    if (!isAdmin && order.customerId !== userId) {
      throw ApiError.forbidden('You can only cancel your own orders', 'FORBIDDEN');
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
      throw ApiError.badRequest(
        `Order is in ${order.status} state and cannot be cancelled`,
        'CANNOT_CANCEL'
      );
    }

    return prisma.$transaction(async (tx) => {
      // 1. Restore product inventory
      for (const sOrder of order.sellerOrders) {
        for (const item of sOrder.orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { increment: item.quantity },
            },
          });
        }

        // Update seller order status
        await tx.sellerOrder.update({
          where: { id: sOrder.id },
          data: { status: OrderStatus.CANCELLED },
        });
      }

      // 2. Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: order.paymentStatus === PaymentStatus.PAID ? PaymentStatus.REFUNDED : PaymentStatus.FAILED,
        },
      });

      // 3. Notify Customer
      await tx.notification.create({
        data: {
          userId: order.customerId,
          type: 'ORDER_CANCELLED',
          title: 'Order Cancelled',
          message: `Your order #${order.orderNumber} has been cancelled.`,
          data: { orderId: order.id },
        },
      });

      return updatedOrder;
    });
  }

  // Farmer specific methods
  static async getFarmerOrders(farmerId: string, queryParams: any) {
    const { page, limit, skip } = parsePagination(queryParams);
    const { status } = queryParams;

    const where: Prisma.SellerOrderWhereInput = {
      farmerId,
      ...(status ? { status } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.sellerOrder.count({ where }),
      prisma.sellerOrder.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              deliveryAddress: true,
              paymentStatus: true,
              createdAt: true,
              customer: { select: { id: true, name: true, phone: true } },
            },
          },
          orderItems: {
            include: {
              product: { select: { id: true, name: true, images: { take: 1 } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  static async updateFarmerOrderStatus(farmerId: string, sellerOrderId: string, newStatus: OrderStatus) {
    const sellerOrder = await prisma.sellerOrder.findFirst({
      where: { id: sellerOrderId, farmerId },
      include: { order: true },
    });

    if (!sellerOrder) {
      throw ApiError.notFound('Order not found for this farmer', 'NOT_FOUND');
    }

    // Valid transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      PREPARING: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
      OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
      DELIVERED: [],
      CANCELLED: [],
      REFUNDED: [],
    };

    const allowed = validTransitions[sellerOrder.status] || [];
    if (!allowed.includes(newStatus)) {
      throw ApiError.badRequest(
        `Invalid status transition from ${sellerOrder.status} to ${newStatus}`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const updated = await prisma.sellerOrder.update({
      where: { id: sellerOrderId },
      data: { status: newStatus },
    });

    // Notify Customer about status change
    await prisma.notification.create({
      data: {
        userId: sellerOrder.order.customerId,
        type: 'ORDER_STATUS_UPDATED',
        title: 'Order Status Updated',
        message: `Your items in order #${sellerOrder.order.orderNumber} are now ${newStatus}.`,
        data: { orderId: sellerOrder.orderId, sellerOrderId },
      },
    });

    return updated;
  }
}
