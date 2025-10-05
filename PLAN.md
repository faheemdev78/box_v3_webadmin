# Admin Portal Complete Plan & Architecture
# ==========================================

## Overview
The Box v3 Web Admin Portal is a comprehensive Next.js-based administrative interface for managing a multi-store e-commerce ecosystem. Each store represents a different physical location with its own warehouse and inventory management. The system provides hierarchical administration from super admin level down to individual store operations, managing the complete order fulfillment workflow from customer order to delivery completion.

## Multi-Store Architecture & Workflow
======================================

### Store Hierarchy & Management
- **Super Admin Level**: Global system administration with product catalog management
- **Store Manager Level**: Individual store operations and local inventory control
- **Staff Level**: Role-based permissions for specific operational tasks
- **Multi-Location Support**: Each store operates as independent warehouse with isolated inventory

### Complete Order Fulfillment Workflow

#### 1. Order Submission (Client App)
- Customer places order through client application
- Order automatically assigned to nearest store based on delivery zone
- Real-time inventory checking across store locations
- Order enters pending status awaiting store processing

#### 2. Picking Phase (Picker App)
- **Order Assignment**: Available orders displayed in picker dashboard
- **Basket Selection**: Physical picker baskets assigned to orders
- **Item Collection**: Staff navigate warehouse collecting ordered items
- **Status Tracking**: Real-time updates as items are picked/substituted/unavailable
- **Session Management**: Picking sessions with performance tracking
- **Completion**: Orders marked as picked and moved to verification queue

#### 3. Till Verification (Admin Portal)
- **Quality Control**: Double-checking all picked items against order
- **Receipt Generation**: Printing customer receipts and internal documentation
- **Packaging**: Items transferred from picker baskets to delivery/dispatch baskets
- **Payment Processing**: Handling payment confirmation and COD preparation
- **Dispatch Ready**: Orders marked ready for driver collection

#### 4. Driver Delivery (Driver App)
- **Route Assignment**: Orders assigned to drivers based on delivery zones
- **Collection**: Driver collects dispatch baskets from store
- **Delivery Tracking**: Real-time GPS tracking and delivery confirmations
- **Payment Collection**: COD payment collection and digital receipt
- **Proof of Delivery**: Photo confirmation and customer signatures

#### 5. Return Process (Driver App + Admin Portal)
- **Basket Return**: Empty delivery baskets returned to store
- **Cash Reconciliation**: COD payments submitted and wallet cleared
- **Performance Recording**: Delivery metrics and customer feedback
- **Inventory Updates**: Returned items processed if applicable

### Multi-Store Inventory Management
- **Centralized Catalog**: Super admin manages global product database
- **Distributed Inventory**: Each store maintains independent stock levels
- **Cross-Store Transfers**: Inventory movement between locations
- **Automated Replenishment**: Stock level monitoring and reorder points
- **Store-Specific Pricing**: Location-based pricing strategies

### Complete Basket Lifecycle Management
#### Picker Basket Workflow
- **Assignment**: Picker baskets assigned to orders during session start
- **Picking Phase**: Baskets remain locked during item collection
- **Session Completion**: Baskets stay locked and transfer to till verification queue
- **Till Verification**: Items verified and transferred to delivery baskets
- **Release**: Picker baskets released only after till verification completion

#### Delivery Basket Workflow
- **Till Assignment**: Delivery baskets assigned during till verification
- **Item Transfer**: Verified items transferred from picker to delivery baskets
- **Driver Collection**: Delivery baskets locked to driver for delivery
- **Delivery Phase**: Baskets remain locked during entire delivery process
- **Return Process**: Driver returns empty baskets and submits COD payments
- **Release**: Delivery baskets released only after successful return and cash reconciliation

## Core Functionality
==================

### 1. Dashboard & Analytics
- Real-time business intelligence dashboard
- Sales performance metrics and charts
- Order status tracking and analytics
- Delivery performance monitoring
- Customer acquisition metrics
- Store performance comparisons
- Revenue and profit analysis

### 2. Product Management
- **Product Catalog**: Complete product inventory management
- **Product Attributes**: Define and manage product characteristics
- **Product Types**: Category and classification system
- **Categories**: Hierarchical product categorization
- **Manufacturers**: Vendor and supplier management
- **Brands**: Brand portfolio management
- **Product Fields**: Custom product metadata

### 3. Order Management
- **Order Processing**: Complete order lifecycle from submission to delivery
- **Multi-Stage Workflow**: Order → Picking → Till Verification → Dispatch → Delivery
- **Till Operations**: Quality control verification and receipt generation
- **Basket Lifecycle Management**:
  * **Picker Baskets**: Locked from assignment → picking → till verification → release
  * **Delivery Baskets**: Locked from till assignment → delivery → return → release
- **Dispatch Queue**: Orders ready for driver collection
- **Delivery Tracking**: Real-time order status through delivery completion
- **COD Management**: Cash-on-delivery payment processing and reconciliation
- **Cart Management**: Abandoned cart recovery and customer re-engagement

### 4. Store Operations
- **Multi-Store Management**: Centralized administration across multiple warehouse locations
- **Individual Store Inventory**: Location-specific stock management and control
- **Complex Basket Management**:
  * **Picker Baskets**: Assignment → Picking → Till Verification → Release
  * **Delivery Baskets**: Till Assignment → Delivery → Return → Release
  * **Resource Tracking**: Real-time basket availability and allocation
- **Staff Hierarchy**: Multi-level permissions (Super Admin → Store Manager → Staff)
- **Role-Based Access Control**: Granular permissions for different operational functions
- **Delivery Zone Management**: Geographic service area configuration per store
- **Warehouse Operations**: Pick location management and optimization
- **Performance Monitoring**: Store-specific analytics and staff productivity metrics
- **Cross-Store Coordination**: Inventory transfers and resource sharing

### 5. Customer Management
- **Customer Database**: Complete customer profiles
- **Order History**: Customer purchase tracking
- **Communication Tools**: Customer service interface
- **Loyalty Programs**: Reward system management
- **Support Tickets**: Customer issue resolution

### 6. User & Permission Management
- **Hierarchical Staff Management**: Super Admin → Store Manager → Operational Staff
- **Store-Specific Permissions**: Access control based on store assignment
- **Role-Based Access Control**: Granular permission system for different functions
- **Multi-Level Authorization**: Operations require appropriate permission levels
- **Staff Performance Tracking**: Individual productivity and performance metrics
- **Security Management**: Authentication and authorization across store hierarchy
- **Audit Trails**: User activity tracking and operational logging

### 7. Till Operations & Verification
- **Order Verification**: Quality control for picked orders
- **Item Cross-Check**: Verification against original order requirements
- **Receipt Generation**: Customer receipts and internal documentation
- **Packaging Management**: Transfer from picker baskets to delivery baskets
- **Payment Processing**: COD preparation and payment confirmation
- **Dispatch Authorization**: Final approval for driver collection
- **Inventory Reconciliation**: Real-time stock adjustments
- **Exception Handling**: Missing items, damages, and substitutions
- **Order Reset Control**: Complete order cancellation and resource release at any stage

### 8. Order Reset & Cancellation Management
- **Stage-Agnostic Reset**: Cancel orders at any workflow stage (Pending → Picking → Till → Dispatch → Delivery)
- **Resource Liberation**: Automatic release of all assigned resources:
  * **Picker Basket Release**: Return baskets to available pool using centralized helper
  * **Delivery Basket Release**: Free up dispatch containers across all stages
  * **Staff Assignment Clearing**: Remove picker/driver assignments
  * **Till Queue Removal**: Clear verification queue entries
- **Session Management**: Complete work session cancellation:
  * **Active Session Cancellation**: Set status to `CANCELLED` with reason
  * **Multi-Stage Session Detection**: Find sessions in current_order and processing_stages
  * **Session Completion Timestamps**: Proper session closure with audit trail
  * **Staff Notes**: Record cancellation reason and admin user details
- **Data Cleanup**: Complete removal of operational data:
  * **Processing Stages Wipe**: Clear all picking, till verification, and delivery history
  * **Current Order Reset**: Restore to initial state like createOrder function
  * **Session References**: Clear all _id_session references
  * **Lock Clearing**: Remove all order and basket locks
- **Inventory Restoration**: Return all allocated inventory to available stock
- **Complete State Reset**: Return order to zero state (not just cancelled)
- **Audit Trail Maintenance**: Preserve cancellation records for reporting and analysis
- **Customer Notification**: Automated customer communication for order cancellation
- **Refund Processing**: Handle payment reversals and refund workflows

### 9. Till Verification System (POS-Style)

The till verification system is a Point-of-Sale (POS) style interface for verifying picked orders before delivery. It supports session-based verification with hold/resume functionality and real-time basket management.

#### Architecture Overview:
```
Order List -> Start Session -> Client Redux -> Print Receipt -> Complete Session
   (picking_complete)  (Lock Order)    (Live Verification)    (Optional)    (Batch Update)
```

#### Key Features:
- **Session-Based Verification**: Create verification sessions with order locking
- **POS-Style Interface**: Item-by-item verification with status tracking
- **Hold/Resume Sessions**: Put verification on hold and start new sessions
- **Real-time Basket Management**: Live basket selection and locking during verification
- **Receipt Printing**: Generate verification receipts on completion
- **Batch Updates**: Client-side state management with backend batch updates
- **Crash Recovery**: Sessions survive app crashes and disconnections
- **Performance Tracking**: Detailed till operator performance metrics
- **Multi-Session Support**: Handle multiple held sessions simultaneously

#### Session Workflow:

**1. Start Verification Session:**
- Input: Order at `PICKING_COMPLETE` stage
- Process: Create session in DB, lock order, initialize client state
- Output: Session ID and order data for Redux

**2. Verification Process (Client-side):**
- Real-time Verification: All item verifications stored in Redux
- Basket Management: Live basket selection with immediate locking
- Multiple Sessions: Can hold current session and start new one
- Progress Tracking: Track verification progress per item

**3. Session Management:**
- Hold Session: Save progress to backend, keep order lock
- Resume Session: Restore client state from held session
- Multiple Active: Support multiple held sessions per operator

**4. Complete Session:**
- Batch Update: Send entire verification data to backend
- Stage Progression: Move order to `READY_TO_DISPATCH`
- Basket Transfer: Transfer basket assignments to delivery
- Receipt Generation: Optional receipt printing

#### Redux State Management:
```typescript
TillVerificationState {
  activeSession: SessionInfo
  currentOrder: OrderData
  verificationData: ItemVerifications (client-side)
  baskets: LiveBasketManagement
  heldSessions: HeldSession[]
  ui: UIState
}
```

#### Database Integration:
- **Work Sessions**: Add till verification progress state for hold/resume
- **Basket Locks**: Real-time basket assignment during verification
- **Session Types**: Support 'till' session type with enhanced functionality
- **Minimal Backend Changes**: Leverages existing infrastructure

#### POS-Style Components:
- **Order Selection**: Choose order for verification from queue
- **Verification Interface**: Item-by-item verification screen with status indicators
- **Basket Selector**: Live basket selection panel with availability status
- **Session Controls**: Hold, resume, complete, and cancel controls
- **Receipt Preview**: Verification receipt preview before printing
- **Held Sessions Panel**: List and manage sessions on hold
- **Progress Indicators**: Real-time verification progress tracking

#### GraphQL Operations:
```graphql
# Session Management
startTillVerificationSession(input: StartTillSessionInput!): TillSessionResponse
holdTillVerificationSession(_id_session: ID!, notes: String): Response
resumeTillVerificationSession(_id_session: ID!): TillSessionResponse
completeTillVerificationSession(input: CompleteTillSessionInput!): TillSessionResponse

# Basket Management (Live)
addBasketToVerification(input: AddBasketToVerificationInput!): Response
removeBasketFromVerification(input: RemoveBasketInput!): Response
getAvailableBaskets($_id_store: ID!): AvailableBasketsResponse

# Legacy Support
verifyOrderAtTill(input: VerifyOrderAtTillInput!): VerifyOrderResponse
rejectOrderAtTill(input: RejectOrderAtTillInput!): RejectOrderResponse
```

#### Implementation Benefits:
- **Efficiency**: Multiple orders can be processed simultaneously
- **Flexibility**: Hold orders for complex verification scenarios
- **Reliability**: Session-based approach with crash recovery
- **Performance**: Client-side state reduces backend load
- **Scalability**: Supports high-volume till operations
- **Audit Trail**: Complete verification history with timestamps
- **User Experience**: Familiar POS-style interface for till operators

### 10. Content Management (Composer)
- **Page Builder**: Dynamic page creation tools
- **Component Library**: Reusable UI components
- **Content Publishing**: Web content management
- **Banner Management**: Promotional content
- **Marketing Tools**: Campaign management

## Technical Architecture
========================

### Frontend Stack
- **Next.js 15.3.1** with App Router architecture
- **React 19.0.0** with TypeScript support
- **Ant Design v5** for comprehensive UI components
- **Redux Toolkit** with Redux Persist for state management
- **Apollo Client** for GraphQL API communication
- **React Final Form** for advanced form handling

### Key Dependencies
- **@apollo/client** - GraphQL client with Next.js integration
- **antd** - Enterprise-class UI design language
- **@reduxjs/toolkit** - Modern Redux state management
- **@dnd-kit** - Drag and drop functionality
- **react-final-form** - High performance subscription-based form state management
- **@react-google-maps/api** - Google Maps integration
- **jsonwebtoken** - JWT authentication
- **kafkajs** - Event streaming integration

### Backend Integration
- GraphQL API with MongoDB backend
- JWT-based authentication system
- Redis caching for performance
- Kafka integration for event streaming
- Real-time data synchronization
- Multi-store data isolation

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── console/           # Main admin interface
│   │   ├── dashboard/     # Analytics dashboard
│   │   ├── products/      # Product management
│   │   ├── orders/        # Order processing
│   │   ├── stores/        # Store operations
│   │   ├── customers/     # Customer management
│   │   ├── users/         # Staff management
│   │   └── composer/      # Content management
│   ├── login/             # Authentication
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── form/             # Form components
│   ├── dropdowns/        # Dropdown selectors
│   └── table/            # Data grid components
├── template/             # Layout components
├── lib/                  # Utility functions
├── rStore/               # Redux store configuration
└── aClient/              # Apollo Client setup
```

## Core Features & Components
=============================

### 1. Authentication & Security
- JWT-based session management
- Role-based access control (RBAC)
- Multi-factor authentication support
- Session validation and refresh
- Secure cookie handling
- Password encryption with bcrypt

### 2. Dashboard Analytics
- **Sales Metrics**: Revenue tracking and trends
- **Order Analytics**: Processing times and volumes
- **Delivery Performance**: Driver and zone metrics
- **Customer Insights**: Acquisition and retention
- **Inventory Reports**: Stock levels and turnover
- **Performance KPIs**: Store and staff metrics

### 3. Product Management System

#### Product Catalog
- Comprehensive product database
- Image and media management
- Pricing and inventory tracking
- Product variants and options
- Bulk import/export functionality
- Product search and filtering

#### Product Properties
- **Attributes**: Size, color, material specifications
- **Categories**: Hierarchical categorization system
- **Types**: Product classification framework
- **Brands**: Brand portfolio management
- **Manufacturers**: Supplier relationship management
- **Fields**: Custom metadata and specifications

### 4. Order Processing Workflow

#### Order Management
- Real-time order tracking
- Status management system
- Customer communication tools
- Payment processing integration
- Refund and return handling
- Order modification capabilities

#### Fulfillment Operations
- Pick list generation
- Packing slip creation
- Shipping label integration
- Inventory allocation
- Quality control checks
- Delivery scheduling

### 5. Store Operations Management

#### Multi-Store Framework
- Centralized store configuration
- Store-specific settings
- Localized inventory management
- Regional pricing controls
- Store performance tracking
- Cross-store analytics

#### Operational Tools
- **Basket Management**: Physical container tracking
- **Staff Scheduling**: Employee work management
- **Zone Management**: Delivery area configuration
- **Vehicle Tracking**: Fleet management
- **Vendor Relations**: Supplier coordination

### 6. User Interface Components

#### Form Management
- Advanced form builders with React Final Form
- Validation and error handling
- Auto-save functionality
- File upload components
- Date and time pickers
- Multi-select dropdowns

#### Data Visualization
- Interactive charts and graphs
- Real-time data updates
- Export capabilities
- Custom report generation
- Dashboard customization
- Mobile-responsive design

#### Navigation & Layout
- Responsive navigation system
- Breadcrumb navigation
- Menu permission filtering
- Quick access shortcuts
- Search functionality
- User preference storage

## Data Models & Types
=====================

### Core Entities

#### User Management
- **Admin Users**: System administrators
- **Store Managers**: Store-level management
- **Staff Members**: Operational employees
- **Permissions**: Granular access control
- **Roles**: Predefined permission sets
- **Sessions**: Authentication tracking

#### Product Catalog
- **Products**: Core product entities
- **Variants**: Product variations
- **Categories**: Hierarchical organization
- **Attributes**: Product characteristics
- **Inventory**: Stock tracking
- **Pricing**: Price management

#### Order System
- **Orders**: Customer orders
- **Order Items**: Individual products
- **Payments**: Transaction records
- **Shipping**: Delivery information
- **Status History**: Order lifecycle
- **Returns**: Return processing

#### Store Operations
- **Stores**: Physical warehouse locations with independent inventory
- **Picker Baskets**: Physical containers locked from assignment through till verification
- **Delivery Baskets**: Containers locked from till verification through driver return
- **Basket Lifecycle**: Complex state management (available → assigned → locked → released)
- **Delivery Zones**: Geographic service areas per store
- **Staff Assignments**: Role-based work allocation
- **Till Stations**: Verification and processing workstations with basket transfer
- **Driver Routes**: Delivery path optimization with basket tracking
- **COD Wallets**: Driver cash collection tracking
- **Performance Metrics**: Store and staff operational data

## GraphQL Operations
====================

### Queries
- `getProducts`: Product catalog retrieval
- `getOrders`: Order data fetching
- `getCustomers`: Customer information
- `getStoreData`: Store-specific data
- `getDashboardMetrics`: Analytics data
- `getUserPermissions`: Access control

### Mutations
- `createProduct`: New product creation (Super Admin only)
- `updateOrder`: Order modifications and status updates
- `assignPickingBasket`: Basket assignment to orders
- `verifyOrderAtTill`: Legacy till verification (maintained for compatibility)
- `startTillVerificationSession`: Start POS-style verification session
- `completeTillVerificationSession`: Complete verification with batch update
- `holdTillVerificationSession`: Hold session and start new one
- `resumeTillVerificationSession`: Resume held session
- `transferToDeliveryBasket`: Packaging for dispatch
- `assignDriverRoute`: Driver assignment and route optimization
- `processCODPayment`: Cash-on-delivery payment handling
- `returnBaskets`: Driver basket return and cash reconciliation
- `updateStoreInventory`: Store-specific stock adjustments
- `transferInventoryBetweenStores`: Cross-store inventory movement
- `assignStaffToStore`: Store-specific staff assignment
- **`resetOrderToZero`**: Complete order reset with comprehensive resource cleanup:
  * **Basket Release**: Uses centralized helper to release all baskets across stages
  * **Session Cancellation**: Cancels all related work sessions with audit trail
  * **Processing Wipe**: Clears all processing_stages and current_order data
  * **State Reset**: Returns order to initial createOrder state
  * **Resource Tracking**: Detailed reporting of released resources

## State Management
==================

### Redux Store Structure
```
store/
├── session/           # User authentication
├── products/          # Product catalog
├── orders/            # Order management
├── customers/         # Customer data
├── stores/            # Store information
├── ui/               # Interface state
└── system/           # Application settings
```

### Key State Slices
- **Session Management**: User authentication and permissions
- **Product Data**: Catalog and inventory information
- **Order Processing**: Order status and workflow
- **Customer Information**: User profiles and history
- **Store Operations**: Multi-store data management
- **UI State**: Interface preferences and loading states

## Security & Authentication
============================

### Authentication Flow
- JWT token-based authentication
- Role-based access control (RBAC)
- Session validation and refresh
- Multi-factor authentication support
- Secure password policies
- Account lockout protection

### Data Security
- GraphQL field-level authorization
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF token validation
- Encrypted data storage

### Permission System
- Module-based permissions (e.g., 104 for Products)
- Role-specific access (e.g., 104.1 for Attributes)
- Hierarchical permission inheritance
- Dynamic permission checking
- Audit trail logging
- User activity monitoring

## Performance Optimization
===========================

### Frontend Optimization
- Next.js App Router for optimal performance
- Ant Design component optimization
- Redux state normalization
- Lazy loading for large datasets
- Image optimization and caching
- Bundle splitting and code optimization

### Backend Integration
- GraphQL query optimization
- Apollo Client caching strategies
- Real-time data synchronization
- Efficient data fetching patterns
- Connection pooling
- Response compression

### Caching Strategy
- Apollo Client cache management
- Redux state persistence
- Browser storage optimization
- API response caching
- Static asset optimization
- CDN integration

## Development Workflow
======================

### Build System
- Next.js build optimization
- TypeScript compilation
- SCSS and CSS processing
- Asset optimization
- Environment configuration
- Docker containerization

### Development Tools
- Hot module reloading
- Development server
- Error boundary implementation
- Debugging tools
- Performance monitoring
- Code quality enforcement

### Testing Strategy
- Unit testing for components
- Integration testing for workflows
- E2E testing for critical paths
- Performance testing
- Security testing
- Accessibility testing

## Deployment & Infrastructure
==============================

### Containerization
- Docker support for development
- Production Docker configuration
- Multi-stage build optimization
- Environment variable management
- Health check implementation
- Container orchestration ready

### Environment Management
- Development environment setup
- Staging environment configuration
- Production deployment pipeline
- Environment variable security
- Configuration management
- Monitoring and logging

## Current Implementation Status
===============================

### ✅ Completed Features
- **Authentication System**: JWT-based login with role validation
- **Next.js Foundation**: App Router architecture with TypeScript
- **UI Framework**: Ant Design v5 integration with responsive design
- **State Management**: Redux Toolkit with persistence
- **GraphQL Integration**: Apollo Client setup with Next.js
- **Form System**: React Final Form integration
- **Navigation Structure**: Menu system with permission-based filtering
- **Component Library**: Reusable UI components and dropdowns
- **Dashboard Foundation**: Basic analytics dashboard structure
- **Security Framework**: Permission-based access control

### ⚠️ In Progress / Recently Updated
- **Product Management**: Catalog and property management modules
- **Order Processing**: Order workflow and status management
- **Store Operations**: Multi-store management framework
- **Analytics Dashboard**: Charts and metrics implementation
- **User Management**: Staff and permission administration
- **Content Management**: Composer module for dynamic content

### 🔧 Potential Future Work
- **Order Reset & Cancellation System**:
  * **Stage-Agnostic Reset**: Cancel orders at any workflow stage with complete resource cleanup
  * **Automated Resource Liberation**: Release baskets, clear assignments, restore inventory
  * **Data Cleanup Engine**: Remove all operational data while preserving audit trails
  * **Customer Communication**: Automated notifications and refund processing
- **Advanced Analytics**:
  * Real-time business intelligence dashboard
  * Predictive analytics for inventory and sales
  * Custom report builder with export capabilities
  * Advanced data visualization components
- **Enhanced Operations**:
  * Automated inventory management
  * Advanced order routing and optimization
  * Real-time collaboration tools
  * Mobile administration interface
- **Integration Enhancements**:
  * Third-party service integrations
  * API marketplace connectivity
  * Webhook management system
  * Advanced notification system
- **Performance & Scalability**:
  * Advanced caching strategies
  * Real-time data streaming
  * Multi-tenant architecture
  * Microservices integration

## Development Environment Setup
===============================

### Prerequisites
- Node.js 18+ and npm
- Next.js development environment
- GraphQL endpoint access
- Redis for caching
- MongoDB database access

### Getting Started
```bash
# Install dependencies
npm install

# Development server
npm run dev          # Standard development
npm run dev_turbo    # Turbopack development

# Build and deployment
npm run build        # Production build
npm start           # Production server
npm run lint        # Code linting

# Docker development
docker build -f dev.Dockerfile -t webadmin-dev .
docker build -f prod.Dockerfile -t webadmin-prod .
```

### Environment Configuration
- GraphQL endpoint: http://192.168.18.10:3002/graphql
- Authentication required for all admin operations
- Role-based permission validation
- Multi-store data isolation
- Session management with Redis

### Key Features
- **Hot Reloading**: Development server with instant updates
- **TypeScript Support**: Full type safety across the application
- **SCSS Processing**: Advanced styling capabilities
- **GraphQL Code Generation**: Automatic type generation
- **Docker Support**: Containerized development and deployment

===========================================
This document serves as the complete blueprint for the admin portal development and maintenance.