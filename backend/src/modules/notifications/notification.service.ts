import { prisma } from '../../config/database';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';

export class NotificationService {
  static async getUserNotifications(userId: string, queryParams: any) {
    const { page, limit, skip } = parsePagination(queryParams);

    const [total, unreadCount, items] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      unreadCount,
      items,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  static async markAsRead(userId: string, notificationId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
