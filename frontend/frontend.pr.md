🌱 FarmLink — Complete Frontend PRD

Project: Farm-to-Consumer Digital Marketplace
Brand: FarmLink
Team: Tech Harvest
Frontend: React.js + Vite + TypeScript + Tailwind CSS
Backend: Node.js + Express.js + TypeScript
Database: PostgreSQL + Prisma
Authentication: Firebase Authentication
Image Storage: Cloudinary
Payment: Razorpay

1. Product Vision

FarmLink is a modern farm-to-consumer marketplace that allows:

Farmers → FarmLink → Consumers

without unnecessary middlemen.

Farmers can:

Register/login
Create their farmer profile
Add agricultural products
Upload product images
Set prices
Manage stock
Manage orders
Track earnings

Consumers can:

Browse fresh agricultural products
Search and filter products
View farmer information
Add products to cart
Manage addresses
Place orders
Pay online
Track orders
Review purchased products

Administrators can:

Manage farmers
Approve/reject farmers
Manage customers
Manage products
Manage categories
Monitor orders
View marketplace analytics
2. Design Philosophy

The UI should communicate:

Fresh • Natural • Simple • Trustworthy • Modern

Avoid making it look like a generic e-commerce website.

The design should feel like a premium digital farmers' market.

Primary visual rule

Use only three main colors:

Purpose	Color
🌿 Fresh green	Primary
🤍 White	Background/surfaces
🖤 Dark text	Typography

Use different opacity/shades of the same green for states and components rather than introducing many unrelated colors.

3. FarmLink Color Palette

I recommend this palette:

🌿 Primary Green
#4CAF50

Fresh vegetable/natural green.

Use for:

Primary buttons
Logo
Links
Active navigation
Product actions
Farmer actions
Important highlights
🌱 Dark Green
#2E7D32

Use sparingly for:

Hover states
Strong headings
Important icons
Selected states
🤍 White
#FFFFFF

Use for:

Main background
Cards
Navigation
Forms
Modals
🖤 Primary Text
#1F2937
Gray Text
#6B7280

This technically introduces neutral shades, but they are typography/support colors, not additional brand colors.

Border
#E5E7EB
4. Visual Identity

The website should have:

Clean white backgrounds
Soft green accents
Large agricultural/product photography
Rounded cards
Subtle shadows
Generous whitespace
Simple line icons
Medium border radius
Minimal gradients
Minimal animations
Avoid

❌ Excessive gradients
❌ Neon green
❌ Dark green everywhere
❌ Too many colors
❌ Heavy glassmorphism
❌ Excessive shadows
❌ Overly complicated animations

5. Typography

Use:

Primary font

Inter

Alternative:

Poppins

Recommended hierarchy:

Hero Heading       48–64px
Page Heading       32–40px
Section Heading    24–28px
Card Heading       18–20px
Body               14–16px
Small Text         12–14px

Font should remain highly readable on mobile.

6. Frontend Architecture
React Application
│
├── Authentication
│   └── Firebase Auth
│
├── Public Pages
│
├── Customer Application
│
├── Farmer Dashboard
│
├── Admin Dashboard
│
├── Shared Components
│
├── API Layer
│   └── Axios
│
├── Server State
│   └── TanStack Query
│
├── Global State
│   └── Context / Zustand
│
└── UI System
    └── Tailwind CSS
7. Recommended Frontend Structure
src/
│
├── assets/
│
├── components/
│   ├── common/
│   ├── layout/
│   ├── navbar/
│   ├── footer/
│   ├── product/
│   ├── cart/
│   ├── order/
│   ├── farmer/
│   ├── admin/
│   └── forms/
│
├── pages/
│   ├── public/
│   ├── auth/
│   ├── customer/
│   ├── farmer/
│   └── admin/
│
├── layouts/
│   ├── PublicLayout.tsx
│   ├── CustomerLayout.tsx
│   ├── FarmerLayout.tsx
│   └── AdminLayout.tsx
│
├── hooks/
│
├── services/
│   ├── api.ts
│   ├── auth.service.ts
│   ├── product.service.ts
│   ├── cart.service.ts
│   ├── order.service.ts
│   ├── farmer.service.ts
│   └── admin.service.ts
│
├── contexts/
│
├── store/
│
├── routes/
│
├── types/
│
├── utils/
│
├── constants/
│
├── firebase/
│
├── App.tsx
└── main.tsx
8. Main Navigation
Desktop Navbar
┌──────────────────────────────────────────────────────────┐
│ 🌿 FarmLink   Home  Products  Farmers  About   🔍 🛒 👤 │
└──────────────────────────────────────────────────────────┘
Left

FarmLink logo.

Center
Home
Products
Farmers
About
Right
Search
Cart
Login/Profile

After login:

👤 Sai

with dropdown:

Profile
Orders
Addresses
Logout
9. Homepage

The homepage should be the strongest visual page.

Hero Section

Large agricultural image/video background or split layout.

Fresh from the Farm.
Straight to Your Home.

Buy fresh produce directly from farmers
and support local agriculture.

[ Shop Fresh Produce ]

             [Farm image]

Green CTA button.

Category Section
Explore Fresh Produce

[ 🥬 Vegetables ]
[ 🍎 Fruits ]
[ 🌾 Grains ]
[ 🌱 Organic ]
[ 🫘 Pulses ]
[ 🌿 Herbs ]

Cards should be clean and image-focused.

10. Featured Products
Fresh Picks

┌──────────────┐
│ Product Img  │
├──────────────┤
│ Fresh Tomato │
│ ₹40 / kg     │
│ 🌿 Local Farm│
│              │
│ [Add to Cart]│
└──────────────┘

Each card:

Image
Product name
Price
Unit
Farmer
Rating
Stock status
Add to Cart
11. Product Listing Page

Route:

/products

Layout:

Products

Search products...                 Sort: Popular

┌────────────┐  ┌──────────────────────────────────┐
│ Filters    │  │ Product Grid                     │
│            │  │                                  │
│ Category   │  │ [Card] [Card] [Card]             │
│ Price      │  │ [Card] [Card] [Card]             │
│ Organic    │  │ [Card] [Card] [Card]             │
│ Rating     │  │                                  │
└────────────┘  └──────────────────────────────────┘
Filters
Category
Price range
Organic
Availability
Rating
Sorting
Popular
Price low → high
Price high → low
Newest
Rating
12. Product Details

Route:

/products/:id

Layout:

┌──────────────────┐  ┌──────────────────────────────┐
│                  │  │ Fresh Tomatoes               │
│ Product Images   │  │                              │
│                  │  │ ₹40 / kg                     │
│                  │  │                              │
│                  │  │ 🌿 Farm Fresh                │
│                  │  │                              │
│                  │  │ Quantity [- 2 +]             │
│                  │  │                              │
│                  │  │ [ Add to Cart ]              │
│                  │  │ [ Buy Now ]                  │
└──────────────────┘  └──────────────────────────────┘

Below:

Product Information
Description
Harvest date
Organic status
Available quantity
Minimum order quantity
Farmer Information
🌿 Green Valley Farm

Farmer rating ⭐ 4.7

Location: Andhra Pradesh

[View Farmer]
Reviews

Display:

Average rating
Rating distribution
Customer reviews
13. Farmer Profile

Route:

/farmers/:id

Display:

Farm name
Farmer profile
Farm location
Rating
Products
About the farm
Available produce

Example:

Green Valley Farm
────────────────────

🌿 Verified Farmer
⭐ 4.8

Fresh vegetables grown locally.

Products from this farm

[Tomatoes] [Carrots] [Spinach]

This builds trust between farmers and consumers.

14. Authentication

Routes:

/login
/register
/forgot-password

Use Firebase Authentication.

Login
Welcome Back

Email
[________________]

Password
[________________]

[ Login ]

Forgot Password?

──────── OR ────────

[ Continue with Phone ]

Don't have an account?
Create Account
15. Registration

The user should select:

How would you like to use FarmLink?

┌───────────────┐
│ 🛒 Customer   │
│ Buy produce   │
└───────────────┘

┌───────────────┐
│ 🌱 Farmer     │
│ Sell produce  │
└───────────────┘

Important:

Admin must never be selectable during public registration.

Farmer registration can create a farmer profile with:

isApproved = false

until an administrator approves it.

16. Customer Dashboard

Route:

/dashboard

Dashboard:

Welcome back 👋

┌────────────┐ ┌────────────┐ ┌────────────┐
│ Orders     │ │ Delivered  │ │ Cart       │
│ 12         │ │ 8          │ │ 3 items    │
└────────────┘ └────────────┘ └────────────┘

Recent Orders

#FL10245
Tomatoes • Spinach
₹340
Preparing
17. Shopping Cart

Route:

/cart
Your Cart

┌─────────────────────────────────────────────┐
│ Tomato     ₹40/kg      [- 2 +]       ₹80   │
│ Spinach    ₹30/bunch   [- 1 +]       ₹30   │
└─────────────────────────────────────────────┘

Subtotal                         ₹110
Delivery                          ₹30
────────────────────────────────────
Total                            ₹140

[ Proceed to Checkout ]

Handle:

Quantity changes
Remove item
Empty cart
Stock changes
Product unavailable
18. Checkout

Route:

/checkout

Steps:

Address → Review → Payment → Confirmation
Address
Delivery Address

○ Home
○ Work

[ + Add New Address ]
Order Review

Show:

Products
Farmer
Quantity
Price
Delivery charge
Total
Payment

Razorpay integration.

After successful payment:

🎉 Order Confirmed!

Order #FL10245

Your fresh produce is on its way.

[ Track Order ]
19. Order Tracking

Route:

/orders/:id

Visual timeline:

✓ Order Placed
      │
      ▼
✓ Confirmed
      │
      ▼
● Preparing
      │
      ▼
○ Out for Delivery
      │
      ▼
○ Delivered

Use green for completed/current states.

20. Customer Orders

Route:

/orders

Tabs:

All | Processing | Delivered | Cancelled

Each order card:

Order #FL10245
3 items
₹540

Preparing

[View Details]
21. Farmer Dashboard

Route:

/farmer

Sidebar:

FarmLink

Dashboard
Products
Orders
Earnings
Farm Profile
Notifications
Settings

Logout

Dashboard:

Good morning, Green Valley Farm 🌱

┌──────────┐ ┌──────────┐ ┌──────────┐
│ Sales    │ │ Orders   │ │ Products │
│ ₹24,500  │ │ 48       │ │ 18       │
└──────────┘ └──────────┘ └──────────┘
22. Farmer Product Management

Route:

/farmer/products

Table:

Product       Price     Stock     Status     Actions

Tomato        ₹40       120kg     Active     Edit
Carrot        ₹50       60kg      Active     Edit
Spinach       ₹30       0         Out Stock  Edit

Actions:

Add product
Edit
Delete/deactivate
Update stock
23. Add Product

Route:

/farmer/products/new

Form:

Add New Product

Product Name
[________________]

Category
[ Vegetables ▼ ]

Description
[________________]

Price
[ ₹ __________ ]

Unit
[ kg ▼ ]

Stock Quantity
[ __________ ]

Minimum Order
[ __________ ]

Harvest Date
[ __________ ]

Organic
[ Toggle ]

Product Images
[ Upload Images ]

[ Publish Product ]

Images should use Cloudinary through your backend architecture.

24. Farmer Orders
Orders

┌───────────────────────────────────────────────┐
│ #FL10245                                     │
│ 3 Products                                   │
│ ₹540                                          │
│                                               │
│ Status: Preparing                             │
│                                               │
│ [Update Status ▼] [View Order]               │
└───────────────────────────────────────────────┘

Farmer can update:

CONFIRMED
↓
PREPARING
↓
OUT_FOR_DELIVERY
↓
DELIVERED
25. Farmer Earnings

Route:

/farmer/earnings

Display:

Total Earnings

₹1,24,500

This Month
₹28,400

Charts:

Daily sales
Monthly sales
Product performance
Completed orders

Keep charts simple and use the green palette.

26. Admin Dashboard

Route:

/admin

Admin sidebar:

Dashboard
Farmers
Customers
Products
Categories
Orders
Analytics
Settings

Dashboard cards:

Total Users
Total Farmers
Pending Farmers
Total Orders
Revenue
Products
27. Farmer Approval

Route:

/admin/farmers

Table:

Farmer             Location       Status       Action

Green Valley      Guntur         Pending      Review
Fresh Fields      Vijayawada     Approved     View

Admin actions:

[Approve]
[Reject]
[View Profile]

This is particularly important because farmer accounts shouldn't automatically become trusted sellers.

28. Admin Product Management

Admin can:

View products
Search
Filter
Activate/deactivate
Remove inappropriate products
Manage categories
29. Admin Orders

Admin should be able to see:

Order ID
Customer
Farmers
Amount
Payment
Status
Date

with filtering by:

Status
Date
Payment
Farmer
30. Search Experience

Global search:

🔍 Search vegetables, fruits, farmers...

Autocomplete:

Search results

Tomatoes
Tomato Seeds
Organic Tomatoes

Farmers

Green Valley Farm

Search should connect to your backend API rather than filtering only the currently loaded frontend products.

31. Responsive Design

The website must be:

Desktop
Navbar
Hero
Product grid
Dashboard sidebar
Tablet

Collapse:

Navbar → simplified navigation
Mobile

Use:

┌─────────────────────────┐
│ 🌿 FarmLink       🛒 ☰ │
├─────────────────────────┤
│                         │
│ Fresh from the Farm     │
│                         │
│ [Shop Now]              │
│                         │
├─────────────────────────┤
│ Product                 │
│ ┌─────────┐ ┌─────────┐ │
│ │         │ │         │ │
│ └─────────┘ └─────────┘ │
└─────────────────────────┘

Farmer/admin dashboards should also work on mobile, with collapsible sidebars.

32. Loading States

Never leave a blank screen while API requests are running.

Use:

Skeleton cards
Skeleton tables
Loading buttons
Spinner for small operations

Example:

┌──────────────┐
│ ░░░░░░░░░░░░ │
│ ░░░░░░░░     │
│ ░░░░░░       │
└──────────────┘
33. Error Handling

Friendly messages:

Something went wrong.

We couldn't load the products.

[ Try Again ]

For network failures:

Unable to connect to FarmLink.
Please check your internet connection.

Never expose raw backend errors to users.

34. Empty States

Examples:

Empty Cart
🛒

Your cart is empty.

Fresh produce is waiting for you.

[ Explore Products ]
No Orders
You haven't placed any orders yet.

[ Start Shopping ]
No Products
No products found.

Try changing your filters.
35. Toast Notifications

Use green/neutral toast notifications for:

✓ Product added to cart
✓ Profile updated
✓ Order placed successfully
✓ Stock updated

Error:

Unable to update product.
36. Protected Routes

Implement route guards.

Public
   │
   ├── Customer
   │
   ├── Farmer
   │
   └── Admin

Example:

/customer → CUSTOMER only
/farmer   → FARMER only
/admin    → ADMIN only

If unauthorized:

403
Access Denied

If unauthenticated:

/login
37. API Integration

Create one Axios instance:

services/api.ts

Responsibilities:

Base URL
Firebase ID token
Request handling
Error handling
Authentication headers

Conceptually:

React
 ↓
Axios
 ↓
Authorization: Bearer <Firebase ID Token>
 ↓
Express
 ↓
Firebase Admin
 ↓
Prisma
 ↓
PostgreSQL
38. TanStack Query

Use TanStack Query for server data.

Examples:

useProducts()
useProduct(id)
useCart()
useOrders()
useFarmerProducts()
useFarmerOrders()
useAdminFarmers()

Benefits:

Caching
Refetching
Loading states
Error states
Mutations
Reduced unnecessary API calls
39. State Management

Don't put everything into global state.

Server state

Use:

TanStack Query

Small global UI state

Use:

Context or Zustand

Examples:

Mobile menu
Modal
Theme if needed
Temporary UI preferences

Firebase authentication state can be exposed through an AuthContext.

40. Frontend Security

The frontend should:

Never expose Firebase Admin credentials
Never expose Cloudinary API secret
Never expose Razorpay secret
Never trust frontend role information alone
Never calculate final payment amount as authoritative
Never store sensitive credentials in localStorage
Handle expired Firebase tokens
Protect private routes

Remember:

Frontend authorization improves UX; backend authorization provides the actual security.

41. Important UX Rules
Product cards

Make the Add to Cart button immediately visible.

Forms

Show validation beside fields:

Price
[ ₹ ____ ]

Price must be greater than 0.
Buttons

Primary:

[ Add to Cart ]

Secondary:

[ View Details ]

Danger:

Delete

Use red only when absolutely necessary for destructive actions, rather than making it part of the visual brand.

42. Important Components

Create reusable components:

Navbar
Footer
Button
Input
Select
Modal
Toast
Loader
Skeleton
ProductCard
ProductGrid
SearchBar
CategoryCard
FarmerCard
Rating
Pagination
CartItem
OrderCard
OrderTimeline
AddressCard
PriceSummary
StatusBadge
ConfirmDialog
DataTable
Sidebar

This will prevent duplicated UI code.

43. Pages — Final Sitemap
/
├── Home
├── Products
│   └── Product Details
├── Farmers
│   └── Farmer Details
├── About
│
├── Login
├── Register
├── Forgot Password
│
├── Customer
│   ├── Dashboard
│   ├── Profile
│   ├── Addresses
│   ├── Cart
│   ├── Checkout
│   ├── Orders
│   │   └── Order Details
│   └── Notifications
│
├── Farmer
│   ├── Dashboard
│   ├── Profile
│   ├── Products
│   │   ├── Add Product
│   │   └── Edit Product
│   ├── Orders
│   ├── Earnings
│   └── Notifications
│
└── Admin
    ├── Dashboard
    ├── Farmers
    ├── Customers
    ├── Products
    ├── Categories
    ├── Orders
    ├── Analytics
    └── Settings
44. Frontend Development Phases
Phase 1 — Foundation
Vite
React
TypeScript
Tailwind
Routing
Design system
API client
Firebase

↓

Phase 2 — Public Website
Navbar
Homepage
Products
Product Details
Farmers
Farmer Details
About
Footer

↓

Phase 3 — Authentication
Firebase login
Registration
Phone authentication
Protected routes
Role handling

↓

Phase 4 — Customer
Dashboard
Cart
Addresses
Checkout
Razorpay
Orders
Order tracking
Reviews

↓

Phase 5 — Farmer
Dashboard
Profile
Products
Cloudinary uploads
Orders
Earnings

↓

Phase 6 — Admin
Dashboard
Farmer approval
Users
Products
Categories
Orders
Analytics

↓

Phase 7 — Polish
Responsive design
Loading states
Empty states
Error handling
Animations
Accessibility
Performance
SEO
45. Animation Guidelines

Keep animations subtle.

Use:

Card hover → slight elevation
Button hover → slight darkening
Page → subtle fade
Modal → scale/fade
Product image → slight zoom

Don't use:

❌ Excessive bouncing
❌ Large parallax effects
❌ Constant moving elements
❌ Heavy page transitions

FarmLink should feel professional and trustworthy, not like a gaming website.

46. Accessibility

Implement:

Semantic HTML
Keyboard navigation
Proper labels
Alt text
Visible focus states
Accessible modals
Accessible buttons
Sufficient text contrast
Screen-reader-friendly status messages
47. Performance

Optimize:

Lazy-loaded routes
Product images
Cloudinary transformations
Pagination
API caching
Debounced search
Code splitting
React Query caching

Don't load hundreds of products at once.

48. Final Design Direction

The visual identity should look approximately like:

                 🌿 FarmLink

       Fresh from the Farm.
          Straight to You.

      [ Shop Fresh Produce ]

──────────────────────────────────────

             Fresh Categories

   🥬       🍎       🌾       🌱
Vegetables  Fruits  Grains   Organic


             Fresh Picks

 ┌────────┐ ┌────────┐ ┌────────┐
 │ IMAGE  │ │ IMAGE  │ │ IMAGE  │
 │        │ │        │ │        │
 ├────────┤ ├────────┤ ├────────┤
 │Tomato  │ │Carrot  │ │Spinach │
 │₹40/kg  │ │₹50/kg  │ │₹30     │
 │[ Cart ]│ │[ Cart ]│ │[ Cart ]│
 └────────┘ └────────┘ └────────┘

Overall feeling:
🌿 Fresh + 🤍 Clean + 🖤 Professional

The green should be an accent and interaction color, not the entire background. White should dominate the interface, while dark text provides readability.

49. Final Frontend Stack
React.js
   +
TypeScript
   +
Vite
   +
Tailwind CSS
   +
React Router
   +
TanStack Query
   +
Axios
   +
Firebase Authentication
   +
Razorpay
   +
Cloudinary
Architecture
                   FARMlink FRONTEND
                         │
        ┌────────────────┼────────────────┐
        │                │                │
     Customer          Farmer           Admin
        │                │                │
        └────────────────┼────────────────┘
                         │
                    React Router
                         │
                  TanStack Query
                         │
                       Axios
                         │
              Firebase ID Token
                         │
                         ▼
                 FarmLink Backend
                         │
             ┌───────────┼───────────┐
             │           │           │
          Firebase    Cloudinary   Razorpay
             │           │           │
             └───────────┼───────────┘
                         │
                      Prisma
                         │
                    PostgreSQL
🎯 MVP priority

If you want to finish the frontend efficiently, build in this order:

Homepage → Authentication → Products → Product Details → Cart → Checkout → Orders → Farmer Dashboard → Product Management → Farmer Orders → Admin Dashboard → Farmer Approval → Polish/Responsive Design.