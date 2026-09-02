import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/user.routes';
import categoryRoutes from '../modules/categories/category.routes';
import productRoutes from '../modules/products/product.routes';
import cartRoutes from '../modules/cart/cart.routes';
import orderRoutes from '../modules/orders/order.routes';
import farmerRoutes from '../modules/farmers/farmer.routes';
import paymentRoutes from '../modules/payments/payment.routes';
import reviewRoutes from '../modules/reviews/review.routes';
import notificationRoutes from '../modules/notifications/notification.routes';
import adminRoutes from '../modules/admin/admin.routes';

const router = Router();

// API Index & Endpoint Directory
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to FarmLink Backend REST API (v1)',
    version: '1.0.0',
    documentation: {
      health: '/health',
      categories: '/api/v1/categories',
      products: '/api/v1/products',
      productsSearch: '/api/v1/products?search=tomato',
      farmerDashboardBrowserTest: '/api/v1/farmer/dashboard?devUser=farmer',
      adminDashboardBrowserTest: '/api/v1/admin/dashboard?devUser=admin',
      farmerEarningsBrowserTest: '/api/v1/farmer/earnings?devUser=farmer',
      adminAnalyticsBrowserTest: '/api/v1/admin/analytics?devUser=admin',
      cartBrowserTest: '/api/v1/cart?devUser=customer',
      myOrdersBrowserTest: '/api/v1/orders?devUser=customer',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/farmer', farmerRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
