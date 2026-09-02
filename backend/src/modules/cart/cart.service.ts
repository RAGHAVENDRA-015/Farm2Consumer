import { prisma } from '../../config/database';
import { ApiError } from '../../utils/apiError';

export class CartService {
  static async getOrCreateCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                farmer: { select: { id: true, farmName: true, isApproved: true } },
                images: { orderBy: { displayOrder: 'asc' }, take: 1 },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  farmer: { select: { id: true, farmName: true, isApproved: true } },
                  images: { orderBy: { displayOrder: 'asc' }, take: 1 },
                },
              },
            },
          },
        },
      });
    }

    // Compute cart calculations and item validity flags
    let subtotal = 0;
    const items = cart.items.map((item) => {
      const isAvailable =
        item.product.isActive &&
        !item.product.isDeleted &&
        item.product.farmer.isApproved &&
        item.product.stockQuantity >= item.quantity;

      const itemTotal = item.quantity * item.product.price;
      if (isAvailable) {
        subtotal += itemTotal;
      }

      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
        itemTotal,
        isAvailable,
        product: item.product,
      };
    });

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      subtotal,
      totalAmount: subtotal,
      itemCount: items.length,
    };
  }

  static async addItem(userId: string, productId: string, quantity: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { farmer: true },
    });

    if (!product || product.isDeleted || !product.isActive) {
      throw ApiError.notFound('Product is unavailable or does not exist', 'PRODUCT_UNAVAILABLE');
    }

    if (!product.farmer.isApproved) {
      throw ApiError.badRequest('Products from this farmer are not currently available for sale', 'FARMER_NOT_APPROVED');
    }

    if (quantity < product.minimumOrderQuantity) {
      throw ApiError.badRequest(
        `Minimum order quantity for ${product.name} is ${product.minimumOrderQuantity} ${product.unit}`,
        'MINIMUM_QUANTITY_NOT_MET'
      );
    }

    if (quantity > product.stockQuantity) {
      throw ApiError.badRequest(
        `Insufficient stock available. Only ${product.stockQuantity} ${product.unit} left in stock.`,
        'INSUFFICIENT_STOCK'
      );
    }

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stockQuantity) {
        throw ApiError.badRequest(
          `Cannot add more. Only ${product.stockQuantity} ${product.unit} available in stock.`,
          'INSUFFICIENT_STOCK'
        );
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    return this.getOrCreateCart(userId);
  }

  static async updateItemQuantity(userId: string, cartItemId: string, quantity: number) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw ApiError.notFound('Cart not found', 'CART_NOT_FOUND');

    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, cartId: cart.id },
      include: { product: true },
    });

    if (!item) {
      throw ApiError.notFound('Cart item not found', 'ITEM_NOT_FOUND');
    }

    if (quantity < item.product.minimumOrderQuantity) {
      throw ApiError.badRequest(
        `Minimum order quantity is ${item.product.minimumOrderQuantity}`,
        'MINIMUM_QUANTITY_NOT_MET'
      );
    }

    if (quantity > item.product.stockQuantity) {
      throw ApiError.badRequest(
        `Insufficient stock. Only ${item.product.stockQuantity} available.`,
        'INSUFFICIENT_STOCK'
      );
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return this.getOrCreateCart(userId);
  }

  static async removeItem(userId: string, cartItemId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw ApiError.notFound('Cart not found', 'CART_NOT_FOUND');

    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, cartId: cart.id },
    });

    if (!item) {
      throw ApiError.notFound('Cart item not found', 'ITEM_NOT_FOUND');
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });

    return this.getOrCreateCart(userId);
  }

  static async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { cleared: true };
  }
}
