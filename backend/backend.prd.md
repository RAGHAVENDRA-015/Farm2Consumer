FarmLink — Backend Product Requirements Document

Project: Farm-to-Consumer Digital Marketplace
Team: Tech Harvest
Document: Backend PRD
Version: 1.0
Backend: Node.js + Express.js + TypeScript
Database: PostgreSQL + Prisma ORM
Authentication: Firebase Authentication + Firebase Admin SDK
Storage: Cloudinary
Frontend: React.js
API Style: REST API
Primary Goal: Connect farmers directly with consumers and reduce unnecessary intermediaries.

1. Project Overview

FarmLink is a farm-to-consumer marketplace that allows farmers to sell fresh agricultural products directly to customers.

The backend will provide the APIs and business logic required for:

User management
Farmer management
Product management
Product search and filtering
Cart management
Orders
Payments
Reviews and ratings
Farmer earnings
Admin management
Notifications
Image management
Authentication and authorization
Analytics

The backend will not handle passwords directly. Firebase Authentication will manage user authentication, while PostgreSQL will store FarmLink's application data and user roles.

2. System Architecture
                         ┌─────────────────────┐
                         │      React.js       │
                         │      Frontend       │
                         └──────────┬──────────┘
                                    │
                              HTTPS / REST
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Node.js + Express │
                         │      Backend        │
                         └──────────┬──────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               │                    │                    │
               ▼                    ▼                    ▼
       ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
       │   Firebase   │     │  PostgreSQL  │     │  Cloudinary  │
       │ Authentication│    │   + Prisma   │     │    Images    │
       └──────────────┘     └──────────────┘     └──────────────┘
                                    │
                                    ▼
                            ┌──────────────┐
                            │   Payments   │
                            │   Razorpay   │
                            └──────────────┘
3. Technology Stack
Layer	Technology
Runtime	Node.js
Framework	Express.js
Language	TypeScript
Database	PostgreSQL
ORM	Prisma
Authentication	Firebase Authentication
Backend Auth	Firebase Admin SDK
Image Storage	Cloudinary
API	REST
Validation	Zod
HTTP Client	Axios
Frontend	React.js
State/Data	TanStack Query
Payments	Razorpay
Real-time	Socket.IO
Email	Nodemailer
Logging	Winston
Error Monitoring	Sentry
API Testing	Postman
Deployment	Render/Railway/AWS
Database Hosting	Neon/Supabase/AWS RDS/Render PostgreSQL

Dependency versions should be checked against current stable releases and security advisories during implementation rather than hardcoded in this PRD.

4. Backend Responsibilities

The backend is responsible for:

Authentication
Verify Firebase users.
Validate Firebase ID tokens.
Identify users.
Manage application roles.
Authorization
Customer access
Farmer access
Admin access
Resource ownership checks
Business Logic
Product creation
Inventory management
Cart operations
Order processing
Payment verification
Farmer earnings
Reviews
Notifications
Data Management
PostgreSQL CRUD
Transactions
Pagination
Filtering
Sorting
Search
Data relationships
5. User Roles

FarmLink has three primary roles.

Customer

Can:

Browse products
Search products
View farmers
Add products to cart
Place orders
Make payments
View orders
Cancel eligible orders
Review products
Manage profile
Manage addresses
Farmer

Can:

Create farmer profile
Add products
Upload product images
Edit products
Delete/deactivate products
Manage stock
View orders
Update order status
View sales
View earnings

Farmers must be approved by an administrator before they can sell.

Admin

Can:

Manage customers
Manage farmers
Approve/reject farmers
Manage products
Manage orders
Manage categories
View analytics
Handle complaints
Disable accounts
Monitor marketplace activity
6. Authentication Architecture

Firebase will handle authentication.

Supported authentication methods:

Email + Password
React
 ↓
Firebase Auth
 ↓
Firebase ID Token
 ↓
Node.js
 ↓
Firebase Admin SDK
 ↓
Verify Token
 ↓
PostgreSQL
Phone OTP
Customer
 ↓
Firebase Phone Authentication
 ↓
OTP Verification
 ↓
Firebase ID Token
 ↓
Backend

The backend should never store:

Passwords
Firebase authentication secrets
Raw OTPs
7. Authorization

Authentication answers:

"Who is this user?"

Authorization answers:

"What is this user allowed to do?"

After Firebase verifies the token:

Firebase UID
     ↓
users table
     ↓
role
     ↓
customer / farmer / admin

Example:

GET /api/v1/farmer/orders

The middleware should verify:

Authenticated?
     ↓
Firebase token valid?
     ↓
User exists?
     ↓
Role = farmer?
     ↓
Allow request
8. Database Design

Use:

PostgreSQL + Prisma

Main Tables
users
farmer_profiles
categories
products
product_images
addresses
carts
cart_items
orders
order_items
payments
reviews
notifications
9. User Model
users

id
firebase_uid
name
email
phone
role
is_active
created_at
updated_at
Rules
firebase_uid must be unique.
Email can be nullable if phone-only authentication is allowed.
Phone can be nullable if email-only authentication is allowed.
Role must be one of:
customer
farmer
admin
10. Farmer Profile
farmer_profiles

id
user_id
farm_name
bio
address
city
state
pincode
farm_latitude
farm_longitude
rating
is_approved
approved_at
created_at
updated_at
Farmer registration
Signup
 ↓
Create Firebase user
 ↓
Create PostgreSQL user
 ↓
role = farmer
 ↓
is_approved = false
 ↓
Admin reviews
 ↓
Approved
 ↓
Farmer can sell
11. Category
categories

id
name
slug
description
image_url
is_active
created_at
updated_at

Examples:

Vegetables
Fruits
Leafy Vegetables
Grains
Pulses
Organic
Seasonal
12. Product
products

id
farmer_id
category_id
name
slug
description
price
unit
stock_quantity
minimum_order_quantity
harvest_date
is_organic
is_active
is_deleted
created_at
updated_at

Example:

Tomatoes
₹40 / kg
Stock: 100 kg
Organic: Yes
Farmer: Green Valley Farm
13. Product Images

Do not store images directly in PostgreSQL.

Use Cloudinary.

product_images

id
product_id
cloudinary_public_id
image_url
display_order
created_at

Flow:

Farmer
 ↓
React
 ↓
Cloudinary
 ↓
Image URL
 ↓
Backend
 ↓
PostgreSQL
14. Cart
carts

id
user_id
created_at
updated_at
Cart Items
cart_items

id
cart_id
product_id
quantity
created_at
updated_at

Backend must verify:

Product exists.
Product is active.
Product isn't deleted.
Quantity is available.
Quantity meets minimum order quantity.
15. Address
addresses

id
user_id
name
phone
address_line
city
state
pincode
latitude
longitude
is_default
created_at
updated_at

Customers can have multiple addresses.

16. Order Architecture

One important design decision:

A customer may purchase products from multiple farmers in one checkout.

Example:

Customer
 │
 ├── Tomatoes → Farmer A
 ├── Rice     → Farmer B
 └── Carrots  → Farmer C

Therefore, don't make farmer_id the only seller relationship on a single order.

Use:

Order
 │
 ├── Seller Order → Farmer A
 │      └── Tomatoes
 │
 ├── Seller Order → Farmer B
 │      └── Rice
 │
 └── Seller Order → Farmer C
        └── Carrots

For the college MVP, however, you can simplify this by restricting one checkout to one farmer. If you want a scalable design, implement the parent-order/seller-order structure from the beginning.

17. Order

Recommended scalable structure:

orders

id
customer_id
order_number
total_amount
payment_status
status
delivery_address
created_at
updated_at
Seller Orders
seller_orders

id
order_id
farmer_id
subtotal
status
created_at
updated_at
Order Items
order_items

id
seller_order_id
product_id
product_name
quantity
price_at_order
subtotal

Store price_at_order.

This is important.

If tomatoes cost:

₹40/kg

today and the farmer changes the price to:

₹50/kg

tomorrow, an old order must still show:

₹40/kg
18. Order Status

Recommended:

PENDING
     ↓
CONFIRMED
     ↓
PREPARING
     ↓
OUT_FOR_DELIVERY
     ↓
DELIVERED

Alternative states:

CANCELLED
REFUNDED

Farmers should not be able to arbitrarily change orders to any status.

The backend should enforce valid transitions.

19. Payment

Use Razorpay or another supported payment provider.

Flow:

Customer
 ↓
Checkout
 ↓
Backend creates payment/order
 ↓
Payment Gateway
 ↓
Customer pays
 ↓
Payment callback/webhook
 ↓
Backend verifies payment
 ↓
Update payment status
 ↓
Confirm order

Never trust payment success information sent only by the frontend.

The backend must verify the payment through the payment provider's server-side mechanism/webhook.

20. Payment Model
payments

id
order_id
provider
provider_order_id
provider_payment_id
amount
currency
status
payment_method
created_at
updated_at

Statuses:

PENDING
PAID
FAILED
REFUNDED
21. Farmer Earnings

The farmer dashboard should calculate:

Gross Sales
- Platform Commission
- Refunds
= Net Earnings

Example:

Sales:             ₹10,000
Commission:           ₹500
Refunds:              ₹200
----------------------------
Net Earnings:        ₹9,300

For the college MVP, you can use a configurable commission percentage.

Example:

PLATFORM_COMMISSION = 5%

Don't hardcode it throughout the application.

22. Reviews
reviews

id
product_id
customer_id
rating
comment
created_at
updated_at

Rating:

1–5

Rules:

Customer must have purchased the product.
One review per customer per product/order policy.
Deleted products should not automatically delete historical reviews.
Admin can moderate reviews.
23. Notifications
notifications

id
user_id
type
title
message
is_read
created_at

Examples:

Order Confirmed
Order Shipped
Order Delivered
New Order
Product Approved
Farmer Approved
Payment Successful
24. API Architecture

Base URL:

/api/v1

Response format:

Success
{
  "success": true,
  "data": {}
}
Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid product data",
    "fields": {}
  }
}
25. Authentication APIs
GET /api/v1/auth/me
POST /api/v1/auth/sync
POST /api/v1/auth/logout

Firebase performs actual authentication.

The backend's responsibility is primarily token verification and application-user synchronization.

26. User APIs
GET    /api/v1/users/me
PATCH  /api/v1/users/me
DELETE /api/v1/users/me
GET    /api/v1/users/me/addresses
POST   /api/v1/users/me/addresses
PATCH  /api/v1/users/me/addresses/:id
DELETE /api/v1/users/me/addresses/:id
27. Product APIs
Public
GET /api/v1/products
GET /api/v1/products/:id
Farmer
POST   /api/v1/products
PATCH  /api/v1/products/:id
DELETE /api/v1/products/:id
PATCH  /api/v1/products/:id/stock
Search
GET /api/v1/products?search=tomato
GET /api/v1/products?category=vegetables
GET /api/v1/products?minPrice=20&maxPrice=100
GET /api/v1/products?farmerId=123
28. Cart APIs
GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:id
DELETE /api/v1/cart/items/:id
DELETE /api/v1/cart
29. Order APIs
POST  /api/v1/orders
GET   /api/v1/orders
GET   /api/v1/orders/:id
POST  /api/v1/orders/:id/cancel
Farmer
GET   /api/v1/farmer/orders
PATCH /api/v1/farmer/orders/:id/status
30. Payment APIs
POST /api/v1/payments/create
POST /api/v1/payments/verify
POST /api/v1/payments/webhook
GET  /api/v1/payments/:id

The webhook endpoint is particularly important.

31. Farmer APIs
GET /api/v1/farmer/dashboard
GET /api/v1/farmer/profile
PATCH /api/v1/farmer/profile

GET /api/v1/farmer/products
GET /api/v1/farmer/orders
GET /api/v1/farmer/earnings

Dashboard response could include:

totalProducts
activeProducts
totalOrders
pendingOrders
totalSales
totalEarnings
32. Admin APIs
GET /api/v1/admin/dashboard

GET /api/v1/admin/farmers
GET /api/v1/admin/farmers/:id
PATCH /api/v1/admin/farmers/:id/approve
PATCH /api/v1/admin/farmers/:id/reject

GET /api/v1/admin/customers

GET /api/v1/admin/products
PATCH /api/v1/admin/products/:id/approve
DELETE /api/v1/admin/products/:id

GET /api/v1/admin/orders

GET /api/v1/admin/analytics
33. Review APIs
POST /api/v1/products/:id/reviews
GET  /api/v1/products/:id/reviews
PATCH /api/v1/reviews/:id
DELETE /api/v1/reviews/:id
34. Cloudinary Integration

Backend should generate/manage Cloudinary resources securely.

Product image requirements:

JPEG
PNG
WebP
Maximum file size
Maximum number of images per product

Example:

Maximum images/product = 5

Backend should validate uploaded files.

When a product is deleted:

Product deleted
     ↓
Cloudinary image cleanup
     ↓
Database image records removed/soft deleted
35. Middleware Architecture

Recommended middleware:

Request
   ↓
CORS
   ↓
Helmet
   ↓
Rate Limiting
   ↓
Request Logger
   ↓
Firebase Auth
   ↓
Role Authorization
   ↓
Zod Validation
   ↓
Controller
   ↓
Service
   ↓
Prisma
   ↓
PostgreSQL
36. Project Structure

I recommend a modular backend structure:

server/
│
├── src/
│   │
│   ├── config/
│   │   ├── env.ts
│   │   ├── firebase.ts
│   │   ├── cloudinary.ts
│   │   └── database.ts
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   ├── users/
│   │   ├── farmers/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── reviews/
│   │   ├── notifications/
│   │   └── admin/
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── rateLimit.middleware.ts
│   │
│   ├── routes/
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── apiError.ts
│   │   ├── pagination.ts
│   │   └── response.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── tests/
│
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
37. Controller → Service → Database

Don't put all business logic inside controllers.

Use:

Route
 ↓
Middleware
 ↓
Controller
 ↓
Service
 ↓
Prisma
 ↓
PostgreSQL

Example:

POST /products
      ↓
product.routes
      ↓
auth middleware
      ↓
farmer middleware
      ↓
product validation
      ↓
product controller
      ↓
product service
      ↓
Prisma
      ↓
PostgreSQL

This keeps the project maintainable.

38. Validation

Use Zod.

Example product validation:

name → required
description → required
price → positive number
stock → >= 0
unit → allowed values
category → valid ID

Validate both:

Request body
Query parameters
Route parameters

Never trust frontend validation alone.

39. Pagination

Every large list endpoint should support:

?page=1&limit=20

Response:

{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}

Use pagination for:

Products
Orders
Farmers
Customers
Reviews
Notifications
40. Search and Filtering

Product API should eventually support:

search
category
farmer
minPrice
maxPrice
unit
organic
location
sort
page
limit

Example:

GET /api/v1/products
?search=tomato
&category=vegetables
&minPrice=20
&maxPrice=60
&sort=price_asc
&page=1
&limit=20
41. Security Requirements

Implement:

Authentication
Firebase token verification
Protected routes
Role-based authorization
API Security
Helmet
CORS with explicit frontend origin
Rate limiting
Request validation
Input sanitization
Secure HTTP
Environment variables
Database
Prisma parameterized queries
Database constraints
Transactions for critical operations
Logging

Never log:

Firebase tokens
Payment secrets
Passwords
Private API keys
Sensitive user information
42. Environment Variables

Example:

NODE_ENV=

PORT=

DATABASE_URL=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

CLIENT_URL=

SENTRY_DSN=

Never commit .env.

Provide:

.env.example

instead.

43. Error Handling

Centralized error middleware:

Route
 ↓
Controller
 ↓
throws error
 ↓
Error Middleware
 ↓
Standard JSON response

Error codes:

VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
INVALID_TOKEN
INSUFFICIENT_STOCK
PAYMENT_FAILED
INVALID_PAYMENT
RATE_LIMIT_EXCEEDED
INTERNAL_SERVER_ERROR
44. Important Business Rules
Product

Farmer can modify only their own products.

Order

Customer can view only their own orders.

Farmer

Farmer can view only orders containing their products.

Admin

Admin can access management APIs.

Stock

Order creation must verify stock inside a database transaction to prevent overselling.

Price

Order items must store price_at_order.

Reviews

Only customers who purchased a product can review it.

Farmer

Only approved farmers can list products for sale.

45. Real-Time Order Updates

Use Socket.IO if you want real-time updates.

Example:

Farmer
 ↓
Changes order:
PREPARING → OUT_FOR_DELIVERY
 ↓
Node.js
 ↓
Socket.IO
 ↓
Customer React App
 ↓
Order status updates instantly

For a college MVP, Socket.IO is optional. Polling/TanStack Query refetching is simpler.

46. Email Notifications

Use Nodemailer for:

Welcome email
Order confirmation
Payment confirmation
Order delivered
Farmer approval
Password/account-related Firebase notifications

Firebase handles authentication emails where applicable; FarmLink-specific transactional emails can be handled by the backend.

47. Analytics

Admin dashboard should provide:

Total Customers
Total Farmers
Approved Farmers
Total Products
Total Orders
Completed Orders
Cancelled Orders
Total Revenue
Platform Commission

Charts:

Daily Orders
Monthly Revenue
Top Products
Top Farmers
Orders by Category
48. API Documentation

Document APIs using OpenAPI/Swagger or Postman.

Every endpoint should specify:

Method
URL
Authentication
Role
Headers
Request Body
Query Parameters
Success Response
Error Responses
Business Rules
Example Request
Example Response

Example:

POST /api/v1/products

Authentication:
Firebase Bearer Token

Role:
Farmer

Body:
{
  name,
  description,
  categoryId,
  price,
  unit,
  stockQuantity
}
49. Testing Strategy
Unit Testing

Test:

Services
Validation
Business logic
Utility functions
Integration Testing

Test:

Auth
Products
Cart
Orders
Payments
API Testing

Use Postman.

Important scenarios

Test:

Customer cannot access farmer API
Farmer cannot modify another farmer's product
Customer cannot modify another customer's order
Unapproved farmer cannot create products
Cannot order more than available stock
Cannot review a product that wasn't purchased
Invalid payment cannot confirm an order
50. Backend Development Milestones
Phase 1 — Project Setup
Node.js
Express
TypeScript
Prisma
PostgreSQL
Environment configuration
Basic error handling
Phase 2 — Firebase Authentication
Firebase setup
Firebase Admin SDK
Token middleware
User synchronization
Role middleware
Phase 3 — Farmer
Farmer profile
Farmer approval
Farmer dashboard
Phase 4 — Products
Categories
Product CRUD
Cloudinary
Search
Filtering
Pagination
Phase 5 — Customer
Profile
Addresses
Cart
Phase 6 — Orders
Checkout
Order creation
Stock validation
Order status
Farmer orders
Customer orders
Phase 7 — Payments
Razorpay
Payment creation
Payment verification
Webhooks
Refund handling
Phase 8 — Reviews & Notifications
Reviews
Ratings
Notifications
Email
Phase 9 — Admin
Farmer management
Customer management
Product management
Order management
Analytics
Phase 10 — Security & Deployment
Security middleware
Rate limiting
Logging
Sentry
Testing
API documentation
Production environment
Database migrations
51. MVP Scope

For your college project, I strongly recommend making this your MVP:

Must Have
Firebase Authentication
        ↓
Customer / Farmer / Admin

Products
        ↓
Search + Filter

Cart
        ↓
Checkout

Orders
        ↓
Order Status

Payments
        ↓
Razorpay

Farmer Dashboard
        ↓
Products + Orders + Earnings

Admin Dashboard
        ↓
Farmers + Customers + Products + Orders
Can be Future Scope
AI price prediction
Weather
Crop disease detection
Voice assistant
GPS-based farmer discovery
Advanced delivery tracking
Multilingual voice interaction
Demand forecasting
Government scheme integration

This keeps the project realistic.

52. Final Backend Architecture

Your final FarmLink backend should look like:

                         FARMLINK
                            │
                            ▼
                    React.js Frontend
                            │
                         HTTPS
                            │
                            ▼
                  Node.js + Express
                      TypeScript
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
           Firebase      Cloudinary   Razorpay
           Auth          Images       Payments
                │
                ▼
          Firebase Admin
                │
                ▼
          Authentication
                │
                ▼
              Prisma
                │
                ▼
           PostgreSQL
                │
     ┌──────────┼──────────┐
     │          │          │
     ▼          ▼          ▼
   Users     Products    Orders
     │          │          │
     ▼          ▼          ▼
 Farmers      Cart      Payments
 Customers   Reviews   Notifications
     │
     ▼
   Admin
Recommended final stack

Frontend: React.js + Vite + Tailwind CSS
Backend: Node.js + Express.js + TypeScript
Authentication: Firebase Authentication + Firebase Admin SDK
Database: PostgreSQL
ORM: Prisma
Storage: Cloudinary
Payments: Razorpay
Validation: Zod
Data fetching: TanStack Query + Axios
Real-time: Socket.IO (optional for MVP)
Email: Nodemailer
Logging: Winston
Monitoring: Sentry
API testing: Postman