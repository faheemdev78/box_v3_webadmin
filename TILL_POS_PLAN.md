# POS-Style Till Verification System Plan

## Overview
A true Point-of-Sale (POS) style item-by-item verification system for picked orders. Till operators verify each physical item individually (manually or via barcode scanner), similar to how a retail POS system processes items during checkout.

## Core Concept

### The Problem with Current Implementation
The current till verification verifies the entire order with a single button press. This is incorrect for a POS workflow.

### The Correct POS Workflow
**Item-by-item verification** like a real Point-of-Sale system:
- Till operator scans/clicks each physical item as they process it
- Items marked as verified one-by-one
- Real-time progress tracking
- Can handle discrepancies (missing items, wrong quantities)
- **Current Phase**: Manual click verification
- **Future Phase**: Connect barcode scanner device for automatic scanning

## System Architecture

### Verification Flow
```
Orders Queue → Select Order → Start Session → Scan Items One-by-One → Complete/Hold
                                    ↓
                          Live Redux State Management
                                    ↓
                    Progress: 0/15 items verified ██░░░░░
```

### Item States During Verification
- ⏳ **Pending** - Not scanned/verified yet (gray)
- ✅ **Verified** - Scanned and confirmed (green)
- ❌ **Missing** - Not found in basket (red)
- ⚠️ **Quantity Mismatch** - Wrong quantity picked (yellow)
- 🔄 **Substitute** - Different product provided (blue)

## Key Features

### A. Session Management
- **Start Session** → Locks order to current till operator
- **Hold Session** → Save progress, start another order (multi-tasking)
- **Resume Session** → Continue verification where left off
- **Complete Session** → Batch update backend, move order to `READY_TO_DISPATCH`
- **Cancel Session** → Abort verification, release order lock

### B. Item-by-Item Verification
- Manual click to verify each item
- Future: Barcode scanner input integration
- Track verified quantities vs expected quantities
- Handle partial verification scenarios
- Add notes per item for issues
- Visual feedback for each item state
- Audio/visual confirmation (future: beep on scan)

### C. Basket Management
- View picker baskets assigned to order
- Assign delivery baskets during verification process
- Live basket availability check
- Transfer tracking: picker baskets → delivery baskets

### D. Progress Tracking
```
Order #BOX-001234
━━━━━━━━━━━━━━━━━━━━
✅ 5 verified
⏳ 10 pending
❌ 2 missing
━━━━━━━━━━━━━━━━━━━━
Progress: 33% ████░░░░░░░░
```

### E. Multi-Session Support
- Hold current verification
- Start new verification for urgent orders
- Resume any held session
- View all held sessions
- Automatic session timeout handling

## Implementation Structure

### Redux State (Client-Side)

```typescript
// Redux Slice: tillVerificationSlice

interface TillVerificationState {
  // Active session data
  activeSession: {
    _id_session: string | null
    _id_order: string | null
    started_at: Date | null
    order_data: Order | null
  }

  // Real-time verification progress (client-side only until completion)
  verificationProgress: {
    items: {
      [itemId: string]: {
        status: 'pending' | 'verified' | 'missing' | 'mismatch' | 'substitute'
        qty_expected: number
        qty_verified: number
        notes: string
        verified_at: Date | null
        substitute_product?: {
          _id: string
          title: string
          price: number
        }
      }
    }
    stats: {
      total_items: number
      verified_count: number
      pending_count: number
      missing_count: number
      mismatch_count: number
      completion_percentage: number
    }
  }

  // Basket assignments during verification
  pickerBaskets: BasketInfo[]  // Read-only from order
  deliveryBaskets: string[]    // Assigned during verification
  availableDeliveryBaskets: BasketInfo[]

  // Held sessions (multiple sessions can be on hold)
  heldSessions: HeldSession[]

  // UI state
  ui: {
    scanning_mode: 'manual' | 'scanner'  // Future: scanner mode
    current_item_focus: string | null
    is_loading: boolean
    show_held_sessions: boolean
  }
}

interface HeldSession {
  _id_session: string
  _id_order: string
  order_serial: string
  held_at: Date
  progress_snapshot: VerificationProgress
  items_verified: number
  total_items: number
}
```

### Backend GraphQL Schema

```graphql
# ===================================
# Input Types
# ===================================

input StartTillVerificationSessionInput {
  _id_order: String!
}

input HoldTillVerificationSessionInput {
  _id_session: String!
  current_progress: VerificationProgressInput!
  notes: String
}

input VerificationProgressInput {
  items: [VerificationItemInput!]!
  stats: VerificationStatsInput!
}

input VerificationItemInput {
  _id_item: String!
  status: VerificationItemStatus!
  qty_expected: Int!
  qty_verified: Int!
  notes: String
  substitute_product_id: String
}

enum VerificationItemStatus {
  PENDING
  VERIFIED
  MISSING
  MISMATCH
  SUBSTITUTE
}

input VerificationStatsInput {
  total_items: Int!
  verified_count: Int!
  pending_count: Int!
  missing_count: Int!
  mismatch_count: Int!
}

input CompleteTillVerificationSessionInput {
  _id_session: String!
  verification_data: VerificationProgressInput!
  delivery_baskets: [String!]!
  notes: String
}

# ===================================
# Response Types
# ===================================

type TillSessionResponse {
  success: Success
  error: Error
  session: TillVerificationSession
}

type TillVerificationSession {
  _id: ID!
  _id_order: String!
  _id_staff: String!
  order_data: Order!
  status: String!  # 'active', 'held', 'completed', 'cancelled'
  started_at: Date!
  held_at: Date
  completed_at: Date
  progress: VerificationProgress
}

type VerificationProgress {
  items: [VerificationItemData!]!
  stats: VerificationStats!
}

type VerificationItemData {
  _id_item: String!
  status: String!
  qty_expected: Int!
  qty_verified: Int!
  notes: String
  verified_at: Date
}

type VerificationStats {
  total_items: Int!
  verified_count: Int!
  pending_count: Int!
  missing_count: Int!
  mismatch_count: Int!
  completion_percentage: Float!
}

# ===================================
# Mutations
# ===================================

type Mutation {
  # Start new verification session
  startTillVerificationSession(
    input: StartTillVerificationSessionInput!
  ): TillSessionResponse

  # Hold current session (save progress, start another)
  holdTillVerificationSession(
    input: HoldTillVerificationSessionInput!
  ): Response

  # Resume held session
  resumeTillVerificationSession(
    _id_session: String!
  ): TillSessionResponse

  # Complete verification (batch update)
  completeTillVerificationSession(
    input: CompleteTillVerificationSessionInput!
  ): Response

  # Cancel session
  cancelTillVerificationSession(
    _id_session: String!
    reason: String!
  ): Response

  # Get available delivery baskets
  getAvailableDeliveryBaskets(
    _id_store: String!
  ): AvailableBasketsResponse
}

# ===================================
# Queries
# ===================================

type Query {
  # Get orders ready for till verification
  getTillVerificationQueue(
    _id_store: String!
  ): TillQueueResponse

  # Get held sessions for current user
  getHeldTillSessions(
    _id_store: String!
  ): HeldSessionsResponse

  # Get specific session details
  getTillSessionDetails(
    _id_session: String!
  ): TillSessionResponse
}
```

### Backend Database Schema

```javascript
// work_sessions collection enhancement
{
  _id: ObjectId,
  _id_staff: ObjectId,
  _id_store: ObjectId,
  session_type: 'till',  // New session type
  status: 'active' | 'held' | 'completed' | 'cancelled',

  // Session timing
  session_started_at: Date,
  session_held_at: Date,
  session_completed_at: Date,
  total_session_time: Number,

  // Till verification specific data
  till_verification_data: {
    _id_order: ObjectId,

    // Verification progress (saved on hold/complete)
    verification_progress: {
      items: [{
        _id_item: String,
        status: 'pending' | 'verified' | 'missing' | 'mismatch' | 'substitute',
        qty_expected: Number,
        qty_verified: Number,
        notes: String,
        verified_at: Date,
        substitute_product: {
          _id: ObjectId,
          title: String,
          price: Number
        }
      }],
      stats: {
        total_items: Number,
        verified_count: Number,
        pending_count: Number,
        missing_count: Number,
        mismatch_count: Number,
        completion_percentage: Number
      }
    },

    // Basket assignments
    delivery_baskets: [String],

    // Completion data
    completion_notes: String,
    issues_encountered: [{
      type: String,
      description: String,
      timestamp: Date
    }]
  },

  createdAt: Date,
  updatedAt: Date
}
```

### UI Components Structure

```
/src/app/console/store/[_id]/till-verification/
├── page.tsx                          # Orders queue list page
├── [orderId]/
│   └── verify/
│       └── page.tsx                  # Main POS verification screen wrapper
│
/src/modules/orders/tillVerification/
├── TillOrdersQueue.tsx               # List of orders ready for till (PICKING_COMPLETE)
├── TillVerificationPOS.tsx           # Main POS verification screen
├── ItemScanList.tsx                  # Item-by-item scanning list component
├── VerificationProgress.tsx          # Progress bar & statistics display
├── BasketSelector.tsx                # Delivery basket selection component
├── HeldSessionsPanel.tsx             # Panel showing held sessions
├── SessionControls.tsx               # Hold/Resume/Complete/Cancel buttons
├── ItemVerificationRow.tsx           # Individual item row with verify actions
└── IssueDialog.tsx                   # Dialog for handling item issues
│
/src/rStore/slices/
└── tillVerificationSlice.ts          # Redux state management
```

## UI Design Concept

### Main POS Verification Screen

```
┌─────────────────────────────────────────────────────────────────────┐
│ Till Verification - Order #BOX-001234          [Hold] [Complete ✓] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Progress: 5/15 items verified (33%)                                │
│  ████████░░░░░░░░░░░░░                                              │
│  ✅ 5 Verified  ⏳ 10 Pending  ❌ 0 Missing                         │
│                                                                      │
├──────────────────────────┬──────────────────────────────────────────┤
│ Items to Verify          │  Order Information                       │
│ (Click to verify)        │                                          │
│                          │  Customer: John Doe                      │
│ ⏳ Milk 2L (Qty: 2)      │  Picker: Sarah Smith                     │
│    [✓ Verify] [Missing]  │  Picked At: 10:30 AM                    │
│                          │                                          │
│ ⏳ Bread Whole (Qty: 1)  │  Picker Baskets:                        │
│    [✓ Verify] [Missing]  │  🧺 #B001 (Blue)  🧺 #B002 (Green)     │
│                          │                                          │
│ ✅ Eggs 12pk (Qty: 1) ✓  │  Delivery Baskets:                      │
│    Verified 10:45 AM     │  Select baskets for delivery:           │
│                          │  ☐ #D001 (Red)    ☐ #D002 (Yellow)     │
│ ✅ Butter 500g (Qty: 1)✓ │  ☐ #D003 (Blue)   ☐ #D004 (Green)      │
│    Verified 10:45 AM     │                                          │
│                          │  Session Notes:                          │
│ ✅ Rice 5kg (Qty: 1) ✓   │  ┌──────────────────────────────┐      │
│    Verified 10:46 AM     │  │ All items in good condition  │      │
│                          │  │                               │      │
│ ❌ Sugar 1kg - MISSING   │  └──────────────────────────────┘      │
│    Marked missing 10:47  │                                          │
│    Note: Out of stock    │  Held Sessions: 2                       │
│                          │  [View Held Sessions]                    │
└──────────────────────────┴──────────────────────────────────────────┘
```

### Held Sessions Panel

```
┌─────────────────────────────────────────┐
│ Held Sessions (2)              [Close] │
├─────────────────────────────────────────┤
│                                         │
│ Order #BOX-001235                       │
│ Progress: 8/12 items (67%)              │
│ Held at: 10:30 AM                       │
│ [Resume Session]                        │
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│ Order #BOX-001240                       │
│ Progress: 3/20 items (15%)              │
│ Held at: 10:15 AM                       │
│ [Resume Session]                        │
│                                         │
└─────────────────────────────────────────┘
```

### Orders Queue Screen

```
┌─────────────────────────────────────────────────────────────┐
│ Till Verification Queue                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Orders Ready for Verification (5)    [Refresh]             │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ #BOX-001234                              [Start ▶]    │ │
│ │ Customer: John Doe                                     │ │
│ │ Picker: Sarah Smith                                    │ │
│ │ Items: 15  |  Total: £125.50  |  Picked: 10:30 AM    │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ #BOX-001235                              [Start ▶]    │ │
│ │ Customer: Jane Smith                                   │ │
│ │ Picker: Mike Johnson                                   │ │
│ │ Items: 12  |  Total: £89.99   |  Picked: 10:15 AM    │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Workflow Examples

### Example 1: Normal Verification Flow

1. **Start Session**
   - Till operator views verification queue
   - Clicks "Start" on Order #BOX-001234
   - Backend creates session, locks order
   - Frontend loads order into Redux with all items as "pending"
   - UI shows verification screen with item list

2. **Verify Items One-by-One**
   - Operator picks physical item from basket (e.g., Milk 2L)
   - Clicks "✓ Verify" button
   - Item turns green ✅, timestamp recorded
   - Progress updates: 1/15 → 2/15 → 3/15...
   - Audio feedback (future: beep sound)

3. **Handle Missing Item**
   - Operator can't find Sugar 1kg in basket
   - Clicks "Missing" button
   - Dialog opens: "Why is this item missing?"
   - Selects reason or types note
   - Item marked as ❌ Missing with note
   - Stats update: Missing count: 1

4. **Assign Delivery Baskets**
   - While verifying, operator selects delivery baskets
   - Checks boxes: #D001, #D002
   - Baskets locked for this order

5. **Complete Verification**
   - All items processed (verified, missing, or noted)
   - Operator adds session notes if needed
   - Clicks "Complete ✓"
   - Batch update sent to backend:
     - All item statuses
     - Delivery basket assignments
     - Session notes
   - Order moves to `READY_TO_DISPATCH` stage
   - Session closed, locks released
   - Redirect to queue

### Example 2: Hold and Resume Flow

1. **Active Verification in Progress**
   - Operator verifying Order #BOX-001234
   - Progress: 8/15 items verified

2. **Urgent Order Arrives**
   - New urgent order needs immediate verification
   - Operator clicks "Hold" button
   - Confirmation: "Save progress and hold session?"
   - Clicks "Yes"
   - Current progress saved to backend
   - Session status: 'held'
   - Order lock: KEPT (order still locked)
   - Redux state saved to heldSessions array

3. **Start New Verification**
   - Operator goes back to queue
   - Starts verification for urgent Order #BOX-001240
   - New session created
   - Verifies urgent order completely
   - Completes urgent order

4. **Resume Held Session**
   - Operator clicks "View Held Sessions"
   - Panel shows: Order #BOX-001234 (8/15 items)
   - Clicks "Resume Session"
   - Backend loads session data
   - Frontend restores Redux state
   - UI shows exact progress: 8 items verified, 7 pending
   - Operator continues verification from item #9

## Implementation Phases

### Phase 1: Foundation ✅ **COMPLETED**
**Goal**: Basic infrastructure and session management
**Status**: 100% Complete
**Completed Date**: 2025-10-02

#### Backend Tasks ✅
- [x] Create GraphQL schema types and inputs - `till_verification_schema.graphql`
- [x] Implement `startTillVerificationSession` mutation
  - Validate order is in `PICKING_COMPLETE` stage
  - Create work_session with type 'till'
  - Lock order to current till operator
  - Return session data with order details
- [x] Implement `cancelTillVerificationSession` mutation
  - Cancel session
  - Release order lock
  - Update session status to 'cancelled'
- [x] Implement additional mutations: hold, resume, complete
- [x] Implement queries: queue, held sessions, active session
- [x] Update mongoose schema with till_verification_data
- [x] Add 'held' status to session constants

#### Frontend Tasks ✅
- [x] Create Redux slice: `tillVerificationSlice.ts`
  - Define state structure
  - Create reducers for session management
  - Create actions for item verification
- [x] Create basic route structure
  - `/console/store/[store_id]/till-verification` - Queue page
  - `/console/store/[store_id]/till-verification/[orderId]/verify` - POS page
- [x] Create GraphQL query/mutation files (8 files)
  - getTillVerificationQueue.graphql
  - startTillVerificationSession.graphql
  - holdTillVerificationSession.graphql
  - resumeTillVerificationSession.graphql
  - completeTillVerificationSession.graphql
  - cancelTillVerificationSession.graphql
  - getHeldTillSessions.graphql
  - getActiveTillSession.graphql
- [x] Create custom hooks: `useTillVerification.ts`
  - useStartTillSession
  - useHoldTillSession
  - useResumeTillSession
  - useCompleteTillSession
  - useCancelTillSession
  - useTillVerificationQueue
  - useHeldTillSessions
  - useItemVerification
- [x] Create UI Components
  - TillOrdersQueue.tsx
  - TillVerificationPOS.tsx
  - ItemVerificationRow.tsx
  - VerificationProgress.tsx
  - HeldSessionsPanel.tsx

#### Deliverable ✅
- ✅ Can start a till verification session
- ✅ Order gets locked
- ✅ Session data loaded into Redux
- ✅ Can cancel session
- ✅ Can hold/resume sessions
- ✅ Item-by-item verification UI
- ✅ Progress tracking
- ✅ Complete verification workflow

---

### Phase 2: Core Verification ✅ **COMPLETED**
**Goal**: Item-by-item verification functionality
**Status**: 100% Complete (Completed alongside Phase 1)
**Completed Date**: 2025-10-02

#### Backend Tasks
- [ ] Implement `completeTillVerificationSession` mutation
  - Validate all items processed
  - Update order.processing_stages.till_verification
  - Move order to `READY_TO_DISPATCH` stage
  - Assign delivery baskets
  - Close session
  - Release locks

#### Frontend Tasks
- [ ] Build `TillOrdersQueue.tsx`
  - Display orders in PICKING_COMPLETE stage
  - Show order summary cards
  - "Start Verification" button
- [ ] Build `TillVerificationPOS.tsx`
  - Main verification screen layout
  - Left panel: Items list
  - Right panel: Order info
- [ ] Build `ItemVerificationRow.tsx`
  - Display item details
  - "Verify" and "Missing" buttons
  - Visual status indicators
  - Notes input
- [ ] Build `VerificationProgress.tsx`
  - Progress bar
  - Stats display (verified, pending, missing)
  - Percentage completion
- [ ] Implement item verification logic in Redux
  - Click verify → update item status
  - Recalculate stats
  - Visual feedback

#### Deliverable
- Full item-by-item verification workflow
- Progress tracking
- Complete verification and move order to next stage

---

### Phase 3: Advanced Features ✅
**Goal**: Hold/Resume and basket management

#### Backend Tasks
- [ ] Implement `holdTillVerificationSession` mutation
  - Save current progress to session
  - Set session status to 'held'
  - Keep order lock (important!)
  - Return success
- [ ] Implement `resumeTillVerificationSession` mutation
  - Load session data
  - Return session with saved progress
  - Keep order locked
- [ ] Implement `getHeldTillSessions` query
  - Get all held sessions for current user/store
  - Return session list with progress
- [ ] Implement `getAvailableDeliveryBaskets` query
  - Get available baskets in store
  - Filter by category: 'dispatch'
  - Return basket list

#### Frontend Tasks
- [ ] Build `HeldSessionsPanel.tsx`
  - Display held sessions
  - Show progress for each
  - "Resume" button
- [ ] Build `SessionControls.tsx`
  - Hold button with confirmation
  - Resume button
  - Complete button with validation
  - Cancel button
- [ ] Build `BasketSelector.tsx`
  - Display available delivery baskets
  - Multi-select checkboxes
  - Live availability status
- [ ] Implement hold/resume logic in Redux
  - Save state to heldSessions array
  - Clear active session
  - Restore state on resume
- [ ] Add held sessions indicator in queue page
  - Show count of held sessions
  - Quick access to held sessions panel

#### Deliverable
- Can hold verification mid-process
- Can resume held sessions
- Can assign delivery baskets
- Multi-session support

---

### Phase 4: Issue Handling ✅
**Goal**: Handle verification issues and discrepancies

#### Frontend Tasks
- [ ] Build `IssueDialog.tsx`
  - Missing item dialog
  - Quantity mismatch dialog
  - Substitute product selector
  - Notes input
- [ ] Implement issue handling in Redux
  - Mark item as missing with reason
  - Handle quantity mismatch
  - Record substitute products
  - Update totals accordingly
- [ ] Add issue indicators in item list
  - Warning icons for issues
  - Issue summary display
  - Issue resolution tracking

#### Deliverable
- Can handle missing items
- Can record quantity mismatches
- Can note substitute products
- Issues tracked and reported

---

### Phase 5: Polish & UX ✅
**Goal**: Improve user experience

#### Frontend Tasks
- [ ] Add keyboard shortcuts
  - Enter: Verify current item
  - M: Mark as missing
  - Arrow keys: Navigate items
  - H: Hold session
  - C: Complete session
- [ ] Add audio feedback
  - Beep on verify
  - Different sound for missing
  - Completion sound
- [ ] Add confirmation dialogs
  - Complete verification confirmation
  - Hold session confirmation
  - Cancel session confirmation
- [ ] Add loading states
  - Session loading
  - Completion loading
  - Hold/Resume loading
- [ ] Add error handling
  - Network errors
  - Validation errors
  - Session conflicts
- [ ] Improve visual feedback
  - Animations on verify
  - Highlight current item
  - Color coding for statuses
- [ ] Add session timer
  - Show elapsed time
  - Performance tracking
- [ ] Add auto-save
  - Periodic progress save
  - Prevent data loss on crash

#### Deliverable
- Polished user experience
- Fast and efficient verification
- Error prevention and recovery

---

### Phase 6: Future Enhancements 🔮
**Goal**: Advanced features and integrations

#### Future Features
- [ ] **Barcode Scanner Integration**
  - USB barcode scanner support
  - Scan item → auto-verify
  - Audio/visual feedback
  - Error handling for wrong scans

- [ ] **Receipt Printing**
  - Verification receipt generation
  - Thermal printer support
  - Customer receipt option
  - Internal documentation

- [ ] **Advanced Analytics**
  - Till operator performance metrics
  - Verification time tracking
  - Issue rate analysis
  - Accuracy scoring

- [ ] **Multi-Till Support**
  - Multiple till stations
  - Load balancing
  - Session handoff between tills

- [ ] **Mobile Till App**
  - Tablet-based verification
  - Mobile scanner support
  - Offline capability

- [ ] **AI Assistance**
  - Computer vision for item verification
  - Automatic quantity detection
  - Fraud detection
  - Smart substitution suggestions

---

## Technical Considerations

### Performance Optimization
- **Client-side state management**: All verification data stays in Redux until completion
- **Batch updates**: Single API call on completion instead of per-item updates
- **Debounced auto-save**: Periodic progress saves without overwhelming backend
- **Optimistic UI updates**: Instant feedback without waiting for server

### Error Handling
- **Network failures**: Auto-retry with exponential backoff
- **Session conflicts**: Detect and resolve lock conflicts
- **Data loss prevention**: Auto-save to localStorage as backup
- **Crash recovery**: Restore session from localStorage on reload

### Security
- **Session validation**: Verify user permissions for till operations
- **Lock enforcement**: Prevent concurrent verification of same order
- **Audit trail**: Log all verification actions with timestamps
- **Role-based access**: Only till operators can access verification

### Scalability
- **Multiple stores**: Isolated verification queues per store
- **Multiple operators**: Concurrent sessions on different orders
- **Peak load handling**: Queue prioritization and load balancing
- **Database indexing**: Optimize queries for verification queue

---

## Testing Strategy

### Unit Tests
- Redux reducers for state management
- Item verification logic
- Progress calculation
- Stats computation

### Integration Tests
- GraphQL mutations and queries
- Session lifecycle (start → hold → resume → complete)
- Lock management
- Basket assignment

### E2E Tests
- Complete verification workflow
- Hold and resume flow
- Multiple sessions handling
- Error scenarios

### Performance Tests
- Load testing with multiple concurrent sessions
- Large order verification (100+ items)
- Network latency simulation
- Database query performance

---

## Success Metrics

### Operational Metrics
- **Verification Time**: Average time per order
- **Items per Minute**: Verification speed
- **Error Rate**: Missing/mismatch percentage
- **Session Hold Rate**: How often sessions are held
- **Completion Rate**: Successfully completed vs cancelled

### User Experience Metrics
- **Time to First Verify**: How quickly operator starts verifying
- **Operator Efficiency**: Items verified per hour per operator
- **Issue Resolution Time**: Time to handle missing/mismatch items
- **Session Recovery**: Success rate of resume operations

### System Health Metrics
- **API Response Time**: Session operations latency
- **Error Rate**: Failed operations percentage
- **Lock Contention**: Concurrent lock conflicts
- **Data Consistency**: State sync accuracy

---

## Glossary

### Terms
- **POS**: Point of Sale system
- **Till Station**: Physical workstation where verification happens
- **Session**: Active verification instance with state
- **Held Session**: Paused verification saved for later
- **Picker Basket**: Physical container used during order picking
- **Delivery Basket**: Container for verified items ready for delivery
- **Verification Progress**: Current state of item-by-item verification

### Order Stages
- **PICKING_COMPLETE**: Orders ready for till verification
- **READY_TO_DISPATCH**: Verified orders ready for delivery assignment
- **DELIVERING**: Orders out for delivery
- **DELIVERED**: Successfully delivered orders
- **COMPLETED**: Final stage after all processes complete

---

## References

### Related Documents
- [Admin Portal Plan](./PLAN.md) - Overall admin portal architecture
- [Stage Transition Logic](../box_v3_happi_backend/STAGE_TRANSITION_LOGIC.md) - Order stage flow
- [Backend Workflow Plan](../box_v3_happi_backend/BACKEND_ORDER_WORKFLOW_PLAN.md) - Backend implementation

### External Resources
- Redux Toolkit Documentation
- Apollo Client Documentation
- Ant Design Component Library
- GraphQL Best Practices

---

**Document Version**: 1.0
**Last Updated**: 2025-10-02
**Status**: Planning Phase
**Next Review**: After Phase 1 completion
