# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vendeu Online** is a comprehensive multivendor marketplace built with Next.js 15, TypeScript, and Supabase. The platform allows multiple vendors to create stores, manage products, and sell to buyers with integrated payments via Asaas, analytics, commission management, and PWA capabilities.

## Essential Development Commands

```bash
# Development
npm run dev          # Start Next.js development server

# Code Quality
npm run lint         # Run ESLint with auto-fix
npm run lint:ci      # CI linting with no warnings allowed
npm run check        # TypeScript type checking without emit
npm run type-check   # TypeScript type checking
npm run format       # Fix imports and run linting
npm run fix-imports  # Fix import statements

# Testing & Build
npm test            # Run Jest tests
npm test:ci         # Run tests in CI with coverage
npm test:e2e        # Run Playwright e2e tests
npm run build       # Build for production
npm start           # Start production server

# Database
# All database operations handled via Supabase Dashboard
# Migrations located in /supabase/migrations/

# Security & Utilities
npm run analyze      # Bundle analysis
npm run audit        # Security audit (moderate level)
npm run security-check # Security audit (high/critical only)
```

## Architecture Overview

**IMPORTANT: The project has undergone significant consolidation to eliminate duplications:**

### Consolidated Systems (Single Source of Truth)

**Configuration & Infrastructure:**
- `src/lib/supabase.ts` - Single Supabase configuration (replaces utils/supabase)
- `src/lib/rateLimiting.ts` - Unified rate limiting with Redis fallback
- `src/lib/analytics-consolidated.ts` - Single analytics system (replaces multiple implementations)
- `src/lib/auth/` - Hierarchical authentication with guards, helpers, and middleware

**Data & Types:**
- `src/types/index.ts` - Centralized type definitions (all other type files are compatibility layers)
- `src/hooks/useApi.ts` - Comprehensive API hooks (GET, POST, PUT, DELETE, PATCH)
- `src/services/couponValidation.ts` - Enhanced coupon validation with database operations

**ESLint Rules:**
- Anti-duplication rules prevent imports from deprecated paths
- Enforces use of consolidated systems

### Database Schema (Supabase)

**Core Models:**
- `User` - Base user with roles (BUYER, SELLER, ADMIN)
- `Seller` - Vendor profile with store management
- `Buyer` - Customer profile with addresses/wishlist
- `Admin` - Administrative access with permissions
- `Store` - Individual vendor storefronts
- `Product` - Product catalog with images/specs
- `Order` - Purchase transactions with items
- `Plan` - Subscription plans for sellers
- `StockMovement` - Inventory tracking
- `Review` - Product/store ratings

**Key Enums:**
- `UserType`: BUYER, SELLER, ADMIN
- `OrderStatus`: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
- `PaymentMethod`: CREDIT_CARD, DEBIT_CARD, PIX, BOLETO, WHATSAPP
- `SellerPlan`: GRATUITO, MICRO_EMPRESA, PEQUENA_EMPRESA, EMPRESA_SIMPLES, EMPRESA_PLUS

### Frontend Architecture (Next.js App Router)

**Route Structure:**
- `/app/(auth)/` - Authentication flows
- `/app/admin/` - Admin dashboard and management
- `/app/seller/` - Seller dashboard and tools
- `/app/buyer/` - Buyer dashboard and orders
- `/app/api/` - Next.js API routes for backend logic

**State Management (Zustand):**
- `authStore` - User authentication and permissions
- `productStore` - Product catalog and search
- `cartStore` - Shopping cart functionality
- `orderStore` - Order management
- `searchStore` - Search filters and history
- `paymentStore` - Payment processing and status
- `notificationStore` - User notifications
- `bannerStore` - Banner management
- `commissionStore` - Commission tracking

**UI Components:**
- Built on Radix UI primitives
- Tailwind CSS for styling
- Custom components in `/src/components/ui/`
- Form handling with React Hook Form + Zod validation
- Consolidated PaymentStatus component in `/src/components/payment/`
- Custom virtualization components for large datasets

### API Architecture

**Authentication (Consolidated):**
- `src/lib/auth/` - Hierarchical structure with:
  - `guards.ts` - Role-based access guards (requireAdmin, requireSeller, etc.)
  - `helpers.ts` - Utility functions (extractToken, getDashboardPath, etc.)
  - `middleware.ts` - Next.js middleware integration
- JWT tokens with bcrypt password hashing  
- Role-based access control (RBAC)
- Supabase Auth integration
- Consolidated token validation and rate limiting

**API Routes Structure:**
```
/api/
├── auth/           # Login, register, user management
├── admin/          # Admin-only endpoints
├── products/       # Product CRUD
├── orders/         # Order management
├── payments/       # Asaas payment integration
├── stores/         # Store management
├── search/         # Search and filtering
├── analytics/      # Metrics and tracking
└── webhooks/       # External service callbacks
```

### Key Integrations

**Supabase:**
- PostgreSQL database with RLS policies
- File storage for product images
- Real-time subscriptions for live updates
- Row Level Security (RLS) for data protection

**Asaas Payments:**
- PIX, credit/debit card, boleto processing
- Webhook handling for payment status
- Commission splitting for marketplace

**PWA Features:**
- Workbox service worker
- Offline functionality
- Push notifications
- App manifest for installation

## Development Guidelines

### Authentication Flow (Updated)
- Use `@/lib/auth` for all authentication needs (consolidated)
- JWT tokens stored in localStorage
- Server-side token validation via `authMiddleware`
- Role-based guards: `requireAdmin()`, `requireSeller()`, `requireBuyer()`
- User roles enforced at both client and server level
- Use `getUserFromToken()` from `@/lib/auth` for API route auth
- Use `useAuthStore` for client-side auth state

### Database Operations (Updated)
- Use `@/lib/supabase` for all Supabase operations (consolidated)
- Public client: `supabase` - for client-side operations
- Server client: `supabaseServer` - for server-side operations with elevated permissions
- Implement proper error handling for DB operations
- Use Supabase transactions for related operations (orders, stock)
- Follow naming conventions: camelCase for fields
- Leverage RLS policies for secure data access

### API Development
- Use Next.js API routes in `/app/api/`
- Implement proper HTTP status codes
- Use Zod schemas for request validation
- Handle errors with consistent response format
- Add logging for debugging and monitoring
- Use `getUserFromToken` from `@/lib/auth` for authentication

### File Uploads
- Use Supabase Storage for images
- Implement proper file validation and size limits
- Optimize images before upload
- Use CDN URLs for performance

### Data Export
- Use XLSX library for Excel exports
- Custom export functions in `/src/utils/exportUtils.ts`
- Support for CSV exports
- Automated report generation with filters

### State Management (Updated)
- Use Zustand stores for global state
- Use `@/hooks/useApi` for API operations (consolidated GET, POST, PUT, DELETE, PATCH hooks)
- Import types from `@/types` (single source of truth)
- Implement proper loading and error states
- Use consolidated hooks: `useGet`, `usePost`, `usePut`, `useDelete`, `usePatch`
- Keep client state minimal and focused

## Common Tasks

### Adding New API Endpoint
1. Create route file in `/app/api/[endpoint]/route.ts`
2. Implement proper HTTP methods (GET, POST, PUT, DELETE)
3. Use `getUserFromToken` from `@/lib/auth` for authentication
4. Use Zod for request validation
5. Use Supabase client for database operations
6. Update TypeScript types in `/src/types/`

### Adding New Product Feature
1. Create Supabase migration if database changes needed
2. Create/update API endpoints
3. Update product store and components
4. Add proper validation and error handling
5. Update product interfaces in types

### Implementing New User Role
1. Add role to `UserType` enum in types
2. Update authentication logic in `auth.ts`
3. Create role-specific routes and components
4. Update middleware for route protection
5. Add role checks in API endpoints

## Environment Variables Required

```bash
# Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
APP_NAME=Marketplace Multivendedor
APP_URL=https://your-domain.vercel.app
APP_ENV=production

# Authentication & JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@marketplace.com

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp

# Payments (Asaas)
ASAAS_API_KEY=your-asaas-api-key
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3  # or https://api.asaas.com/v3 for production
ASAAS_WEBHOOK_SECRET=your-webhook-secret

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...

# Social Login
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# WhatsApp Integration
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_VERIFY_TOKEN=your-verify-token
WHATSAPP_WEBHOOK_SECRET=your-webhook-secret
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
WHATSAPP_APP_ID=your-app-id
WHATSAPP_APP_SECRET=your-app-secret

# Geolocation
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Redis (Cache & Sessions)
REDIS_URL=redis://localhost:6379

# File Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000  # 15 minutes
```

## Testing Approach

- Unit tests with Jest for utilities and stores
- Integration tests for API endpoints
- E2E tests with Playwright for critical user flows
- Use `npm test` for development testing
- Use `npm test:ci` for CI/CD pipelines

## Performance Considerations

- Images optimized with Next.js Image component
- Lazy loading for product lists
- Virtual scrolling for large datasets
- React.memo for expensive components
- Bundle analysis with `npm run analyze`

## Security Notes

- All API routes require proper authentication
- Input validation with Zod schemas
- SQL injection prevention with Supabase RLS
- XSS protection with proper sanitization
- Rate limiting on sensitive endpoints
- Secure file upload validation

## Database Migrations

All database changes are managed through Supabase migrations located in `/supabase/migrations/`. To create a new migration:

1. Create new migration file with timestamp
2. Write SQL DDL statements  
3. Apply migration through Supabase Dashboard or CLI
4. Update TypeScript types in `/src/types/`

**Seed Data:**
- Test data files are located in `/supabase/seeds/`
- Database scripts are organized in `/scripts/database/`

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Authentication pages
│   ├── admin/          # Admin dashboard
│   ├── seller/         # Seller dashboard  
│   ├── buyer/          # Buyer dashboard
│   └── api/            # API routes
├── components/         # React components
│   ├── ui/             # UI primitives
│   ├── payment/        # Consolidated payment components
│   ├── virtualized/    # Custom virtualization components
│   └── [feature]/      # Feature-specific components
├── lib/                # Utilities and configurations
├── store/              # Zustand stores
├── types/              # TypeScript definitions
└── utils/              # Helper functions
supabase/
├── migrations/         # Database migrations
└── seeds/              # Test data and seed files
scripts/
├── database/           # Database-related scripts
├── maintenance/        # Maintenance scripts
└── setup/              # Setup and configuration scripts
```

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.