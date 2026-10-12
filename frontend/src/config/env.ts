export const env = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1',
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyFakeKeyForLocalDev1234567890',
  FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'farmtoconsumer-ad62c.firebaseapp.com',
  FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'farmtoconsumer-ad62c',
  FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'farmtoconsumer-ad62c.appspot.com',
  FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
  RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TXa00JAKz8xXk4',
};
