import slugify from 'slugify';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/apiError';

export class CategoryService {
  static async getAll(includeInactive = false) {
    return prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: {
          select: { products: { where: { isDeleted: false, isActive: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: { where: { isDeleted: false, isActive: true } } },
        },
      },
    });

    if (!category) {
      throw ApiError.notFound('Category not found', 'NOT_FOUND');
    }

    return category;
  }

  static async create(data: { name: string; description?: string; imageUrl?: string | null }) {
    const slug = slugify(data.name, { lower: true, strict: true });

    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: data.name }, { slug }] },
    });

    if (existing) {
      throw ApiError.conflict('A category with this name already exists', 'CATEGORY_EXISTS');
    }

    return prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        imageUrl: data.imageUrl,
      },
    });
  }

  static async update(id: string, data: { name?: string; description?: string; imageUrl?: string | null; isActive?: boolean }) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw ApiError.notFound('Category not found', 'NOT_FOUND');
    }

    let slug = category.slug;
    if (data.name && data.name !== category.name) {
      slug = slugify(data.name, { lower: true, strict: true });
      const duplicate = await prisma.category.findFirst({
        where: { slug, id: { not: id } },
      });
      if (duplicate) {
        throw ApiError.conflict('A category with this name already exists', 'CATEGORY_EXISTS');
      }
    }

    return prisma.category.update({
      where: { id },
      data: {
        ...data,
        slug,
      },
    });
  }

  static async delete(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      throw ApiError.notFound('Category not found', 'NOT_FOUND');
    }

    if (category._count.products > 0) {
      // Soft-deactivate if products are linked
      return prisma.category.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return prisma.category.delete({ where: { id } });
  }
}
