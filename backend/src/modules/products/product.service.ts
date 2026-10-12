import slugify from 'slugify';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';

import { CreateProductDTO, UpdateProductDTO } from './product.validation';

export class ProductService {
  static async getAll(queryParams: any) {
    const { page, limit, skip } = parsePagination(queryParams);
    const { search, category, farmerId, minPrice, maxPrice, unit, isOrganic, sort, includeInactive } = queryParams;

    const where: Prisma.ProductWhereInput = {
      isDeleted: false,
      ...(includeInactive ? {} : { isActive: true, farmer: { isApproved: true } }),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = {
        OR: [{ id: category }, { slug: category }],
      };
    }

    if (farmerId) {
      where.farmerId = farmerId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (unit) {
      where.unit = unit;
    }

    if (isOrganic !== undefined) {
      where.isOrganic = isOrganic;
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'rating') {
      orderBy = { farmer: { rating: 'desc' } };
    }

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          farmer: {
            select: {
              id: true,
              farmName: true,
              city: true,
              state: true,
              rating: true,
              user: { select: { name: true } },
            },
          },
          images: {
            orderBy: { displayOrder: 'asc' },
          },
          _count: {
            select: { reviews: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  static async getById(id: string) {
    const product = await prisma.product.findFirst({
      where: { id, isDeleted: false },
      include: {
        category: true,
        farmer: {
          select: {
            id: true,
            farmName: true,
            bio: true,
            city: true,
            state: true,
            rating: true,
            user: { select: { name: true } },
          },
        },
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        reviews: {
          include: {
            customer: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      throw ApiError.notFound('Product not found', 'NOT_FOUND');
    }

    return product;
  }

  static async create(farmerId: string, data: CreateProductDTO) {
    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      throw ApiError.badRequest('Invalid category ID provided', 'INVALID_CATEGORY');
    }

    const slug = slugify(`${data.name}-${Date.now()}`, { lower: true, strict: true });
    const { images = [], minOrderQuantity, ...productData } = data as any;
    const finalMinOrderQty = productData.minimumOrderQuantity || minOrderQuantity || 1.0;

    return prisma.product.create({
      data: {
        ...productData,
        minimumOrderQuantity: finalMinOrderQty,
        slug,
        farmerId,
        images: {
          create: images.map((img: any, index: number) => ({
            imageUrl: img.imageUrl,
            cloudinaryPublicId: img.cloudinaryPublicId || null,
            displayOrder: img.displayOrder !== undefined ? img.displayOrder : index,
          })),
        },
      },
      include: {
        category: true,
        images: true,
      },
    });
  }

  static async update(productId: string, farmerId: string, data: UpdateProductDTO, isAdmin = false) {
    const product = await prisma.product.findFirst({
      where: { id: productId, isDeleted: false },
    });

    if (!product) {
      throw ApiError.notFound('Product not found', 'NOT_FOUND');
    }

    if (!isAdmin && product.farmerId !== farmerId) {
      throw ApiError.forbidden('You can only modify your own products', 'FORBIDDEN');
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw ApiError.badRequest('Invalid category ID provided', 'INVALID_CATEGORY');
      }
    }

    const { images, minOrderQuantity, ...updateData } = data as any;
    if (minOrderQuantity !== undefined && updateData.minimumOrderQuantity === undefined) {
      updateData.minimumOrderQuantity = minOrderQuantity;
    }

    return prisma.$transaction(async (tx) => {
      if (images) {
        // Replace image set
        await tx.productImage.deleteMany({ where: { productId } });
        await tx.productImage.createMany({
          data: images.map((img: any, index: number) => ({
            productId,
            imageUrl: img.imageUrl,
            cloudinaryPublicId: img.cloudinaryPublicId || null,
            displayOrder: img.displayOrder !== undefined ? img.displayOrder : index,
          })),
        });
      }

      return tx.product.update({
        where: { id: productId },
        data: updateData,
        include: {
          category: true,
          images: { orderBy: { displayOrder: 'asc' } },
        },
      });
    });
  }

  static async updateStock(productId: string, farmerId: string, stockQuantity: number, isAdmin = false) {
    const product = await prisma.product.findFirst({
      where: { id: productId, isDeleted: false },
    });

    if (!product) {
      throw ApiError.notFound('Product not found', 'NOT_FOUND');
    }

    if (!isAdmin && product.farmerId !== farmerId) {
      throw ApiError.forbidden('You can only modify stock for your own products', 'FORBIDDEN');
    }

    return prisma.product.update({
      where: { id: productId },
      data: { stockQuantity },
    });
  }

  static async delete(productId: string, farmerId: string, isAdmin = false) {
    const product = await prisma.product.findFirst({
      where: { id: productId, isDeleted: false },
    });

    if (!product) {
      throw ApiError.notFound('Product not found', 'NOT_FOUND');
    }

    if (!isAdmin && product.farmerId !== farmerId) {
      throw ApiError.forbidden('You can only delete your own products', 'FORBIDDEN');
    }

    // Soft delete
    await prisma.product.update({
      where: { id: productId },
      data: { isDeleted: true, isActive: false },
    });

    return { deleted: true };
  }
}
