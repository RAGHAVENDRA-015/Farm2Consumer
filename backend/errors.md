Farm2Consumer Backend Audit
Read-only audit of backend/ at commit df42674f (single "Initial commit"). No files were modified. All 90 tracked files were listed; every config, middleware, util, route, service, validation, and most controllers were read. Not inspected: cart.controller.ts, category.controller.ts, review.controller.ts (assumed to follow the identical controller pattern; marked as unverified where relevant).

1. Executive Summary
FarmLink is a well-organized Express + TypeScript + Prisma backend with a clean module layout, consistent response envelope, Zod validation on most routes, and correct ownership checks on nearly every resource. Order creation runs in a transaction and stock/pricing are computed server-side from the database, not from the client.
However, the backend is not safe to deploy as-is. There are three CRITICAL issues: a self-service privilege escalation via POST /auth/sync (client chooses role: ADMIN), a development auth bypass that is active whenever NODE_ENV is unset (the default), and a payment confirmation endpoint that trusts the client's claim that an order is PAID. Order state aggregation is also broken (parent Order.status never advances past CONFIRMED), which lets customers cancel delivered orders and restore stock. There are no tests, no migrations, no CI, no Docker, and Cloudinary is configured but never used.
Score: 5/10. Good bones, dangerous defaults.

2. Actual Technology Stack



Layer
Actual (verified in backend/package.json)
Notes



Runtime
Node.js, version unpinned (no engines field; @types/node ^22)
Pin with engines and .nvmrc


Framework
Express ^4.21.1



Language
TypeScript ^5.6.3, strict: true
Good


DB / ORM
PostgreSQL via Prisma ^5.22.0 + @prisma/client
No migrations/ folder


Auth
firebase-admin ^12.7.0
ID-token verification only


Storage
cloudinary ^2.5.1
Configured in config/cloudinary.ts but never imported anywhere else. Unused.


Validation
zod ^3.23.8



Security
helmet ^8, cors ^2.8.5, express-rate-limit ^7.4.1



Logging
winston ^3.17, morgan ^1.10
Mixed with console.log


Other
slugify, dotenv



Dev
ts-node-dev, tsx, prisma
tsx and ts-node-dev overlap (one TS runner would suffice)


Testing
None
No jest/vitest/supertest, no test script


Lint/format
None
No eslint/prettier


PRD items not present in code: Razorpay, Socket.IO, Nodemailer, Sentry, Axios, any upload endpoint.
tsconfig.json notes: experimentalDecorators/emitDecoratorMetadata are enabled but no decorators are used; paths: {"@/*"} is declared but unused (and tsc would not rewrite it at runtime anyway).

3. Repository Architecture



backend/
├── .env.example            placeholders only (verified, no real values)
├── backend.prd.md          1409-line PRD
├── package.json / package-lock.json
├── tsconfig.json
├── prisma/
│   ├── schema.prisma       12 models, 5 enums
│   └── seed.ts             categories, admin, 3 farmers, 1 customer, 5 products
└── src/
    ├── server.ts           bootstrap, graceful shutdown (SIGTERM/SIGINT, 10s force)
    ├── app.ts              helmet, cors, body parsers, morgan, rate limit, routes, 404, error handler
    ├── config/             env (Zod-validated), database (Prisma singleton), firebase, cloudinary
    ├── middleware/         authenticate, requireRole/requireApprovedFarmer, validate(Zod), rateLimit, errorHandler
    ├── modules/<name>/     controller + service + routes + validation (11 modules)
    ├── routes/index.ts     mounts modules under API_PREFIX
    ├── types/index.ts      Express Request augmentation (user, firebaseUser)
    └── utils/              ApiError, logger, pagination, response helpers

Quality by component:

Config: env.ts validates with Zod and fails fast. Good. But database.ts, error.middleware.ts, logger.ts read process.env.NODE_ENV directly instead of env.NODE_ENV (inconsistent, and bypasses the validated default).
Middleware: Well factored. validate mutates req.query (works on Express 4; will break on Express 5 where req.query is a getter).
Modules: Static-method service classes, thin controllers, Zod schemas per module. Consistent and readable. Services accept data: any in several places (ProductService.create/update, FarmerService.updateProfile, UserService.createAddress), losing type safety after validation.
Utils: Response envelope { success, data } / { success:false, error:{code,message,fields?} } is used everywhere. Good.
Missing: tests, migrations, Dockerfile, CI, README, ESLint.


4. API Inventory
All prefixed with API_PREFIX (/api/v1) unless noted. Auth = authenticate middleware. Val = Zod validate.
System



Method
Endpoint
Auth
Role
Purpose
Val
Status



GET
/ (root)
No
-
Service info
-
OK


GET
/health
No
-
Health check (exposes env name)
-
OK


GET
/api/v1
No
-
Endpoint directory (advertises ?devUser= bypass URLs)
-
Remove dev URLs


Auth (/auth)



Method
Endpoint
Auth
Role
Purpose
Val
Status



POST
/sync
Token verified in controller
any
Create/update user from Firebase token
body
CRITICAL: role from client


GET
/me
Yes
any
Current user + cart + addresses
-
OK


POST
/logout
Yes
any
Revoke Firebase refresh tokens
-
OK


Users (/users, all Auth)



Method
Endpoint
Role
Purpose
Val
Status



GET
/me
any
Profile
-
OK


PATCH
/me
any
Update name/email/phone
body
OK


DELETE
/me
any
Soft-deactivate
-
OK


GET
/me/addresses
any
List
-
OK


POST
/me/addresses
any
Create (auto-default logic)
body
OK


PATCH
/me/addresses/:id
any
Update (ownership checked)
params+body
OK


DELETE
/me/addresses/:id
any
Delete (ownership checked)
params
OK


Categories (/categories)



Method
Endpoint
Auth
Role
Purpose
Val
Status



GET
/
No
-
List active
-
OK


GET
/:id
No
-
Detail
params
OK


POST
/
Yes
ADMIN
Create
body
OK


PATCH
/:id
Yes
ADMIN
Update
params+body
OK


DELETE
/:id
Yes
ADMIN
Delete or soft-deactivate if products exist
params
OK


Products (/products)



Method
Endpoint
Auth
Role
Purpose
Val
Status



GET
/
No
-
Search/filter/sort/paginate
query
OK


GET
/:id
No
-
Detail (exposes farmer phone + full address)
params
Privacy review


POST
/
Yes
Approved FARMER
Create with image URLs
body
OK


PATCH
/:id
Yes
owner or ADMIN
Update; replaces image set
params+body
Unapproved farmer allowed; categoryId FK not verified


PATCH
/:id/stock
Yes
owner or ADMIN
Set stock
params+body
OK


DELETE
/:id
Yes
owner or ADMIN
Soft delete
params
OK


Cart (/cart, all Auth)



Method
Endpoint
Purpose
Val
Status



GET
/
Cart with availability flags, server-computed totals
-
OK


POST
/items
Add (stock + min qty checked)
body
OK


PATCH
/items/:id
Update qty (ownership via cartId)
params+body
OK


DELETE
/items/:id
Remove
params
OK


DELETE
/
Clear
-
OK


Orders (/orders, all Auth)



Method
Endpoint
Purpose
Val
Status



POST
/
Create from cart (transaction, stock decrement, per-farmer split)
body
Race condition on stock


GET
/
My orders
query
OK


GET
/:id
Detail (owner or ADMIN)
params
OK


POST
/:id/cancel
Cancel + restore stock
params
Can cancel delivered orders


Farmer (/farmer, Auth + FARMER)



Method
Endpoint
Purpose
Val
Status



GET
/profile
Profile
-
OK


PATCH
/profile
Update (cannot set isApproved)
body
OK


GET
/dashboard
Counts + gross/commission/net
-
Loads all rows to sum


GET
/earnings
Earnings breakdown
-
Unpaginated


GET
/products
My products
none
Missing query validation


GET
/orders
My seller orders
none
Missing query validation


PATCH
/orders/:id/status
Transition seller-order status (:id = SellerOrder id)
params+body
Farmer CANCELLED does not restore stock or update parent


Payments (/payments, all Auth)



Method
Endpoint
Purpose
Val
Status



POST
/confirm
Mark payment PAID/FAILED/REFUNDED
body
CRITICAL: client-trusted status


GET
/:id
Detail (owner or ADMIN)
params
OK


Reviews (mounted at /reviews, giving doubled paths)



Method
Endpoint
Auth
Purpose
Val
Status



GET
/reviews/products/:id/reviews
No
List for product
none
Path duplication; no validation


POST
/reviews/products/:id/reviews
Yes
Create (verified purchase, 1 per user)
params+body
Purchase check ignores order status


PATCH
/reviews/reviews/:id
Yes
Update own
params+body
OK


DELETE
/reviews/reviews/:id
Yes
Delete own (or ADMIN, controller unverified)
params
OK


Notifications (/notifications, all Auth)



Method
Endpoint
Purpose
Val
Status



GET
/
List + unread count
none
OK


PATCH
/read-all
Mark all read
-
OK


PATCH
/:id/read
Mark one read (scoped via updateMany)
none
Returns 200 even if not found


Admin (/admin, Auth + ADMIN)



Method
Endpoint
Purpose
Val
Status



GET
/dashboard
Platform stats
-
Loads all orders to sum


GET
/analytics
Category sales + recent orders
-
Unbounded nested load


GET
/farmers
List (filter isApproved)
none
OK


GET
/farmers/:id
Detail
params
OK


PATCH
/farmers/:id/approve
Approve
params
OK


PATCH
/farmers/:id/reject
Un-approve
params
OK


GET
/customers
List
none
OK


PATCH
/users/:id/status
Activate/deactivate any user
params+body
Can deactivate self/other admins


GET
/products
All products
none
Bug: includeInactive is ignored by service


DELETE
/products/:id
Soft delete
params
OK


GET
/orders
All orders
none
OK


Total: 60 endpoints. No upload, no refund, no role-management, no webhook endpoints exist.

5. Database Analysis
Schema: backend/prisma/schema.prisma. PostgreSQL. All PKs are uuid() strings. All queries go through the Prisma client; no $queryRaw/$executeRaw anywhere, so no SQL injection surface was found.
Tables and relationships



Table
Key columns
Relations / constraints



users
firebase_uid unique, email unique nullable, phone unique nullable, role, is_active
1:1 farmer_profiles, 1:1 carts, 1:n addresses/orders/reviews/notifications


farmer_profiles
user_id unique, is_approved, rating (denormalized)
FK users (cascade)


categories
name unique, slug unique



products
farmer_id, category_id, slug (not unique), price Float, stock_quantity Float, is_deleted
FK farmer (cascade), FK category (no action); idx farmerId, categoryId, name


product_images
product_id, cloudinary_public_id?
FK product (cascade)


addresses
user_id, is_default
FK user (cascade); idx userId


carts / cart_items
user_id unique; @@unique(cartId, productId)
cascade


orders
order_number unique, total_amount Float, status, payment_status, delivery_address Json
FK customer (no cascade, correct); idx customerId


seller_orders
order_id, farmer_id, subtotal Float, status
idx orderId, farmerId


order_items
price_at_order snapshot, product_name snapshot
FK product (no cascade)


payments
provider, provider_order_id?, provider_payment_id?, amount Float
FK order (cascade)


reviews
rating Int, @@unique(productId, customerId)
cascade both sides


notifications
user_id, is_read, data Json?
idx userId


Findings

Money stored as Float (Product.price, Order.totalAmount, SellerOrder.subtotal, OrderItem.priceAtOrder/subtotal, Payment.amount). Floating-point rounding will produce inconsistent totals. Use Decimal @db.Decimal(10,2).
No migrations directory. package.json offers prisma migrate dev but nothing is committed; the seed instructions imply db push. No schema history, no reproducible deployments.
Missing indexes: orders(status), orders(created_at), seller_orders(status), notifications(user_id, is_read), products(is_active, is_deleted), products(price) for sorting, and products(slug) should be @unique.
No DB-level check constraints (rating 1..5, price > 0, stock >= 0). Prisma does not express these; add via migration SQL.
Denormalization drift: Order.status is never recomputed from SellerOrder.status (see Business Logic). FarmerProfile.rating is recalculated in app code outside a transaction.
Transactions: order create and cancel use interactive $transaction (good); farmer status update + notification and review create + rating recalc are not transactional.
Connection pooling: Prisma defaults; no connection_limit in URL. Fine for one instance; needs PgBouncer/connection_limit for serverless or multi-instance.
Orphans: ProductImage.deleteMany on product update never deletes the Cloudinary asset (orphaned remote assets, not DB rows).


6. Firebase Authentication & Authorization
Flow: authenticate extracts Bearer token, calls firebaseAuth().verifyIdToken(token), loads users by firebase_uid with farmerProfile, rejects if missing or !isActive, attaches req.user. Roles come from PostgreSQL, not from the token. requireRole, requireAdmin, requireFarmer, requireApprovedFarmer are correct.
What is correct

Roles are read from the DB, never from the client token or headers, on every request.
Ownership (IDOR) checks verified in services for: orders (customerId), payments (via order.customerId), products (farmerId), addresses (userId), cart items (via cartId), reviews (customerId), notifications (updateMany scoped by userId), seller orders (farmerId). No IDOR found on these.
Zod z.object() strips unknown keys, so mass assignment of isApproved, role, isActive via profile endpoints is blocked.
Firebase credential formatting (\\n replace) is correct and the key is never logged.

What is broken

Self-service admin (CRITICAL): auth.validation.ts has role: z.nativeEnum(Role) and auth.controller.ts passes req.body.role to syncUser, which writes it on first creation. Any Firebase-authenticated user can POST /auth/sync { role: "ADMIN" } and become admin. There is no allow-list, no invite, no admin-only role assignment.
Dev bypass on by default (CRITICAL): auth.middleware.ts honors ?devUser=admin or Authorization: Bearer dev-admin-token when env.NODE_ENV === 'development'. env.ts defaults NODE_ENV to development when unset. A deployment that forgets to set NODE_ENV=production grants anonymous admin via the seeded admin-seed-uid-001 user. routes/index.ts publicly documents these URLs.
/auth/sync bypasses isActive and lets an existing user overwrite email/phone from the body (preferred over token claims), so an unverified email can be stored.
Firebase fallback: if FIREBASE_* are missing, admin.initializeApp() runs with ADC; on most hosts this means every verifyIdToken fails at request time rather than at boot. Not a bypass, but a silent outage. Make these required in production.
verifyIdToken(token) without checkRevoked: true; logout revokes refresh tokens but existing ID tokens stay valid up to 1 hour. Acceptable, document it.
Product PATCH/DELETE do not require requireApprovedFarmer; an unapproved or rejected farmer can still edit/delete their listings (listings are hidden from the public anyway). Low impact.
PATCH /admin/users/:id/status has no guard against deactivating yourself or the last admin.


7. Cloudinary / File Handling

config/cloudinary.ts configures the SDK from env. Nothing imports it. There is no upload endpoint, no signed-upload endpoint, no deletion call.
Product images are accepted as client-provided URLs (imageUrl: z.string().url(), optional cloudinaryPublicId). Consequences:
No file-type, size, or content validation exists server-side.
z.string().url() accepts any scheme (javascript:, data:), enabling stored XSS if a frontend renders <img src> or <a href> without sanitizing. Restrict to https: and, ideally, to your Cloudinary host.
Hotlinking arbitrary third-party images; no ownership of the asset.
ProductService.update replaces image rows but never calls cloudinary.uploader.destroy, so old assets accumulate.


No SSRF risk today because the server never fetches the URL.
Secrets: read from env only; CLOUDINARY_* are all optional in env.ts.

Status: Cloudinary integration is missing, not partial.

8. Security Findings



Severity
Issue
File/Location
Risk
Recommendation



CRITICAL
Client chooses role on registration
modules/auth/auth.validation.ts, auth.controller.ts
Any user becomes ADMIN
Remove role from body; default CUSTOMER; allow FARMER via explicit registerAsFarmer flag; admins created only by seed/CLI or admin endpoint


CRITICAL
Dev auth bypass active when NODE_ENV unset
middleware/auth.middleware.ts, config/env.ts
Anonymous admin in misconfigured deploy
Gate on an explicit ENABLE_DEV_AUTH=true and NODE_ENV !== 'production'; throw at boot if enabled in production; remove URLs from routes/index.ts


CRITICAL
Payment status trusted from client
modules/payments/payment.service.ts, payment.validation.ts
Free orders; fake refunds
Remove status/transactionId from client input; verify Razorpay signature/webhook server-side; COD confirmed only by farmer/admin on delivery


HIGH
Parent Order.status never updated; customers can cancel DELIVERED orders and restore stock
order.service.ts cancelOrder, updateFarmerOrderStatus
Inventory corruption, fraudulent "refunds"
Recompute parent status from seller orders on every transition; block cancel when any seller order is OUT_FOR_DELIVERY/DELIVERED


HIGH
Stock check-then-decrement race
order.service.ts createOrderFromCart
Oversell under concurrency
Use tx.product.updateMany({ where:{ id, stockQuantity:{ gte: qty } }, data:{ decrement } }) and throw if count === 0, or isolationLevel: 'Serializable'


HIGH
Farmer cancel does not restore stock or touch parent/payment
order.service.ts updateFarmerOrderStatus
Stock leak, inconsistent state
Reuse cancel logic per seller order inside a transaction


MEDIUM
CORS reflects any origin with credentials: true
app.ts
Cross-site credentialed requests if cookies ever used
Allow-list env.CLIENT_URL (+ localhost in dev); reject others


MEDIUM
Rate limiter keyed by IP without trust proxy
app.ts, rateLimit.middleware.ts
Behind a proxy all users share one bucket (self-DoS) or limits are trivially bypassed
app.set('trust proxy', 1) when behind a proxy; consider Redis store for multi-instance


MEDIUM
Image URL accepts any scheme
product.validation.ts, category.validation.ts
Stored XSS via javascript:/data: URLs
.url().refine(u => u.startsWith('https://')); restrict host


MEDIUM
Money as Float
schema.prisma
Rounding, mismatched totals
Decimal @db.Decimal(10,2)


MEDIUM
Order total vs seller subtotals computed from different price sources
order.service.ts (freshProduct.price vs item.product.price)
totalAmount != Σ subtotal
Use freshProduct.price for both


MEDIUM
Farmer phone and full street address public
product.service.ts getById
PII exposure, scraping
Return city/state only publicly; phone only on active orders


MEDIUM
Unhandled errors logged without details
utils/logger.ts + error.middleware.ts
logger.error('msg', err) drops err (no splat, printf ignores meta)
Add winston.format.splat() or log err as first arg / structured JSON


MEDIUM
/auth/sync skips isActive and accepts unverified email/phone
auth.controller.ts
Deactivated users interact; identity spoof in DB
Check isActive; prefer token claims; require email_verified


LOW
Unapproved farmers can edit/delete products
product.routes.ts
Minor
Add requireApprovedFarmer or explicit farmer check


LOW
Admin can deactivate self / all admins
admin.service.ts updateUserStatus
Lockout
Guard


LOW
categoryId on product update not verified
product.service.ts update
Prisma P2003 → 500
Verify or handle P2003 in error middleware


LOW
express.json({ limit: '10mb' })
app.ts
Large-body DoS vector for a JSON API
100kb to 1mb


LOW
Order number collision possible
order.service.ts generateOrderNumber
Sporadic 409 on checkout
Use DB sequence or ULID


LOW
Dev-mode 500s return err.message; Firebase error messages returned verbatim
error.middleware.ts
Minor info leak in non-prod
Acceptable; ensure prod flag


INFO
/health exposes environment
app.ts
Recon
Optional


INFO
No checkRevoked on token verify
auth.middleware.ts
1h window after logout
Document or enable for sensitive routes


INFO
No secrets tracked in Git; .env.example holds placeholders only; .gitignore covers .env*, node_modules, dist
repo root
None found
Add *.log, logs/, coverage/


No SQL injection, command injection, path traversal, or SSRF vectors were found. Helmet default headers are applied.

9. Performance & Scalability

Aggregation by loading rows: AdminService.getDashboard, FarmerService.getDashboard/getEarnings fetch every order/seller-order row and reduce in JS. Use prisma.*.aggregate({ _sum }).
AdminService.getAnalytics loads all categories → all products → all order items with no bounds. Replace with groupBy on order_items joined to category.
ReviewService.recalculateFarmerRating loads all reviews for a farmer; use aggregate({ _avg }).
N+1 in order creation: per cart item findUnique + update, per farmer findUnique + notification create, all sequential inside the transaction. Acceptable for small carts; batch with findMany({ where:{ id:{ in } } }) and createMany for notifications.
Unpaginated: GET /farmer/earnings transactions, GET /categories, product getById embeds 10 reviews (fine).
Search: contains/insensitive on name and description is a sequential scan; add a tsvector GIN index or pg_trgm when the catalog grows.
Rate limiter and Prisma singleton are in-process: fine for one instance; use a shared store for horizontal scaling.
No filesystem dependencies: stateless, good for containers.
Concurrency: stock race (see Security), default-address toggling race (two isDefault:true under concurrent requests), seller order status transitions not guarded with a conditional update.


10. Code Quality
Strengths: consistent module skeleton, single response envelope, centralized ApiError with stable error codes, Zod schemas colocated, strict TypeScript, soft deletes, price snapshots on order items, graceful shutdown.
Issues

any used for service inputs (data: any, queryParams: any, deliveryAddress?: any). Export z.infer<> types from validation files and use them.
Mixed console.* (config files, seed) and winston. Route everything through logger.
process.env.NODE_ENV read directly in 3 files instead of env.
paymentStatus: provider === COD ? PENDING : PENDING in order.service.ts is a no-op conditional (leftover).
Duplicate updateOrderStatusSchema in order.validation.ts and farmer.validation.ts.
Admin getProducts passes includeInactive that the service does not read.
Review router mounted at /reviews produces /reviews/products/:id/reviews. Mount its product-scoped routes under /products or flatten to /reviews?productId=.
deliveryAddress is stored as untyped Json; define a Zod schema and reuse it for both the inline body and the DB-address projection.
No ESLint/Prettier; add to enforce the patterns that are already mostly followed.


11. Testing
No tests exist. No test runner, no test script, no fixtures beyond seed.ts.
Critical missing tests (priority order):

Auth: sync cannot set ADMIN; dev bypass rejected when NODE_ENV=production; deactivated user gets 403; invalid/expired token gets 401.
Authorization: customer cannot read/cancel another customer's order; farmer cannot edit another farmer's product or seller order; unapproved farmer cannot create products.
Orders: total equals Σ item subtotals; stock decremented once under 10 concurrent checkouts; empty cart rejected; unavailable product rejected; cancel restores stock exactly once; cannot cancel delivered.
Payments: customer cannot mark PAID; COD flow; (future) Razorpay signature verification.
Cart: min quantity, stock ceiling, ownership of cart item id.
Reviews: verified-purchase gate; one per user; rating recalculation.
Error middleware: P2002 → 409, P2025 → 404, Zod → 400 with fields, unknown → 500 without message in production.

Suggested stack: Vitest or Jest + Supertest, a test PostgreSQL via docker-compose, Firebase Admin mocked at config/firebase.ts.

12. Deployment Readiness

No Dockerfile, docker-compose, .gitlab-ci.yml, Procfile, or README.
build runs tsc only; prisma generate is not part of build/postinstall, so a fresh install + build fails at runtime. Add "postinstall": "prisma generate".
No engines field; runtime version drifts between environments.
Graceful shutdown is implemented correctly (server close → prisma.$disconnect → exit, 10 s hard timeout).
/health exists but does not check DB connectivity; add SELECT 1.
NODE_ENV default development is unsafe for deploy (see CRITICAL).
PLATFORM_COMMISSION_PERCENTAGE is read in env.ts but absent from .env.example.
FIREBASE_* should be required when NODE_ENV=production (Zod superRefine).

Verdict: not deployable to production without P0 fixes and packaging.

13. Missing / Incomplete Functionality



Area
Status



Razorpay (or any gateway) integration, webhooks, signature verification
Missing (enum value exists only)


Refund processing
Missing (status flips only)


Cloudinary upload/signed upload/deletion
Missing (SDK configured, unused)


Parent order status aggregation
Missing


Admin role management / admin invite
Missing (only via seed or the sync exploit)


Email (Nodemailer), real-time (Socket.IO), Sentry
Missing (PRD only)


Product-level rating
Missing (farmer-level only)


Farmer payouts / settlement records
Missing (computed on the fly)


Prisma migrations
Missing


Tests, CI, Docker, README, ESLint
Missing


Admin includeInactive product filter
Partially implemented (flag ignored)


Query validation on admin/farmer/notification list endpoints
Partially implemented



14. Critical Issues (Prioritized)
P0 (block any deployment)

Client-selectable role in /auth/sync → admin takeover.
Dev auth bypass enabled by default NODE_ENV.
Client-trusted /payments/confirm.

P1 (block production launch)
4. Parent order status never aggregated; delivered orders cancellable.
5. Stock oversell race in checkout.
6. Farmer-side cancellation leaves stock/parent/payment inconsistent.
7. CORS allow-all with credentials; missing trust proxy for rate limiting.
8. Money as Float; no migrations.
P2 (fix soon)
9. Image URL scheme/host restriction; Cloudinary upload flow.
10. Logger drops error objects; mixed console logging.
11. PII exposure on public product detail.
12. Aggregations via full-table loads.
13. /auth/sync isActive and claim handling.
P3 (hygiene)
14. Tests, CI, Docker, README, ESLint, engines, postinstall prisma generate, health DB check, review route paths, duplicate schemas, any types, admin self-deactivation guard, order-number generation.

15. Recommended Architecture
Keep the existing layered module structure; it is sound. Add, without restructuring:

Auth: authenticate → verifyIdToken(token, true) on sensitive routes; dev bypass behind explicit ENABLE_DEV_AUTH and hard-disabled in production; role assignment only via seed/admin endpoint; sync derives identity strictly from token claims.
Payments: PaymentService gains provider adapters (CodProvider, RazorpayProvider) with createOrder, verifySignature, handleWebhook. POST /payments/razorpay/webhook (raw body, HMAC verify, idempotent on providerPaymentId). COD marked PAID by farmer/admin on delivery only.
Orders: an OrderStateService that owns all transitions, recomputes Order.status from seller orders, and performs stock restore idempotently. Conditional updateMany for stock.
Uploads: POST /uploads/sign returning a short-lived Cloudinary signature scoped to a folder; product image validation restricted to your Cloudinary host; asset cleanup on replace/delete.
Data: Decimal money, committed migrations, added indexes, aggregate/groupBy for stats.
Ops: Dockerfile (multi-stage, non-root), .gitlab-ci.yml (lint → typecheck → test with Postgres service → build), health with DB ping, structured JSON logging, trust proxy, Redis-backed rate limit when scaling out.


16. Implementation Roadmap
Fix 1: Remove client role selection (P0)

Problem: role accepted from body.
Location: backend/src/modules/auth/auth.validation.ts, auth.controller.ts, auth.service.ts.
Why: Full privilege escalation.
Solution: Replace role with registerAsFarmer: z.boolean().default(false); service sets FARMER or CUSTOMER only; never ADMIN. Add an admin-only PATCH /admin/users/:id/role if needed.
Risk: Low; existing frontends sending role will be ignored (Zod strips).
Tests: sync with role: ADMIN yields CUSTOMER; registerAsFarmer creates unapproved profile.

Fix 2: Harden dev bypass (P0)

Problem: Active whenever NODE_ENV unset.
Location: backend/src/middleware/auth.middleware.ts, config/env.ts, routes/index.ts.
Why: Anonymous admin in misconfigured deploy.
Solution: Add ENABLE_DEV_AUTH (default false); bypass only if ENABLE_DEV_AUTH && NODE_ENV !== 'production'; in env.ts superRefine to reject ENABLE_DEV_AUTH=true with production; make NODE_ENV required (no default) or default to production; delete the *BrowserTest entries.
Risk: Local dev must set the flag; document in .env.example.
Tests: bypass rejected in production; accepted only with flag in development.

Fix 3: Server-verified payments (P0)

Problem: Client sets status, transactionId, provider.
Location: backend/src/modules/payments/*.
Why: Orders marked paid for free.
Solution: Remove status/transactionId from confirmPaymentSchema. For COD: only ADMIN or the owning FARMER (on DELIVERED) may mark PAID. For RAZORPAY: add POST /payments/razorpay/order (creates gateway order, stores providerOrderId) and POST /payments/razorpay/webhook with HMAC verification and idempotency; customers never post a status.
Risk: Medium; requires gateway credentials and frontend changes.
Tests: customer confirm → 403; forged webhook signature → 400; replayed webhook → no double update.

Fix 4: Order status aggregation and cancel rules (P1)

Problem: Parent status frozen at CONFIRMED; delivered orders cancellable; farmer cancel leaves stock.
Location: backend/src/modules/orders/order.service.ts.
Why: Inventory and financial integrity.
Solution: After any seller-order transition, recompute parent: all CANCELLED → CANCELLED; all DELIVERED/CANCELLED → DELIVERED; any OUT_FOR_DELIVERY → OUT_FOR_DELIVERY; etc. Block customer cancel if any seller order is OUT_FOR_DELIVERY or DELIVERED. Farmer CANCELLED restores stock for that seller order inside a transaction. Do not set REFUNDED without a payment refund record.
Risk: Medium; touches core flow.
Tests: transition matrix; cancel after delivery → 400; stock restored exactly once.

Fix 5: Atomic stock decrement (P1)

Problem: Read-then-write race.
Location: order.service.ts createOrderFromCart.
Solution: const r = await tx.product.updateMany({ where:{ id, isDeleted:false, isActive:true, stockQuantity:{ gte: qty } }, data:{ stockQuantity:{ decrement: qty } } }); if (r.count === 0) throw INSUFFICIENT_STOCK; and compute all totals from freshProduct.price.
Risk: Low.
Tests: concurrent checkouts never drive stock negative.

Fix 6: CORS and proxy (P1)

Location: backend/src/app.ts.
Solution: origin allow-list from CLIENT_URL (comma-separated) plus localhost in dev; app.set('trust proxy', 1) behind a proxy; reduce JSON limit to 1mb.
Risk: Low; misconfigured CLIENT_URL blocks the frontend (fails safe).
Tests: disallowed origin gets no CORS headers.

Fix 7: Decimal money and migrations (P1)

Location: backend/prisma/schema.prisma, new prisma/migrations/.
Solution: Decimal @db.Decimal(10,2) for all money fields; prisma migrate dev --name init; update arithmetic to Prisma.Decimal; add indexes listed in Section 5; @@unique([slug]) on products.
Risk: Medium; type changes ripple through services and JSON serialization (Decimal → string).
Tests: totals round-trip; migration applies on empty DB.

Fix 8: Image URL restriction and Cloudinary flow (P2)

Location: product.validation.ts, category.validation.ts, new modules/uploads/.
Solution: https:// only and host allow-list; add signed-upload endpoint using cloudinary.utils.api_sign_request (auth + approved farmer); destroy assets on replace/delete.
Risk: Low.
Tests: javascript: URL rejected; signature endpoint requires auth.

Fix 9: Logging (P2)

Location: utils/logger.ts, all console.* sites.
Solution: Add winston.format.splat() and winston.format.json() in production; pass err as the logged object; replace console.*.
Risk: None.
Tests: error middleware logs stack.

Fix 10: PII and aggregation (P2)

Location: product.service.ts getById, admin.service.ts, farmer.service.ts, review.service.ts.
Solution: Drop user.phone, address, pincode from public product farmer select; replace findMany + reduce with aggregate/groupBy.
Risk: Low; frontend field changes.
Tests: public product has no phone; dashboard totals equal SQL sums.

Fix 11: Tooling and packaging (P3)

Add engines, postinstall: prisma generate, ESLint/Prettier, Vitest + Supertest, multi-stage Dockerfile (non-root, node dist/server.js), .gitlab-ci.yml (lint, typecheck, test with postgres service, build), README, *.log in .gitignore, DB ping in /health, PLATFORM_COMMISSION_PERCENTAGE and ENABLE_DEV_AUTH in .env.example.

