# All Views Drawer - Implementation Plan

## Overview
The "All Views" drawer provides comprehensive view management capabilities for users to manage, organize, and discover saved views beyond the pinned tabs.

## Current State
- **Location**: `DynamicViewFilter.tsx` lines 343-346
- **Status**: Empty placeholder with "View management UI coming soon..."
- **Access**: Triggered by "All Views" button in the header

---

## Phase 1: Basic View Listing & Display

### 1.1 View List Component
**File**: Create `AllViewsList.tsx`

**Features**:
- Display all saved views (not just pinned)
- Show view metadata card for each view:
  - Name & Description
  - Owner/Creator name
  - Visibility badge (Private, Team, Everyone)
  - Last modified date (relative: "2 days ago")
  - Pin status indicator
  - Default view indicator
- Grid or list layout toggle
- Empty state when no views exist

**Data Structure**:
```typescript
interface ViewCard {
  _id: string;
  name: string;
  description?: string;
  owner: { name: string; _id: string };
  visibility: 'private' | 'team' | 'everyone';
  isPinned: boolean;
  isDefault: boolean;
  updatedAt: Date;
  usageCount?: number;
}
```

### 1.2 Filter & Search
**Features**:
- Search views by name/description
- Filter by visibility type
- Filter by ownership (My Views, Team Views, All)
- Filter by pinned status
- Sort by: Name, Date, Usage count

---

## Phase 2: View Management Actions

### 2.1 Individual View Actions
**Actions per view**:

1. **Switch to View** (Primary action)
   - Click on view card to activate it
   - Close drawer and load the selected view

2. **Pin/Unpin**
   - Toggle pin status
   - Updates tab bar immediately
   - Mutation: `PIN_SAVED_VIEW`

3. **Duplicate**
   - Clone view with "(Copy)" suffix
   - Opens in current tab
   - Mutation: `CREATE_SAVED_VIEW` (with source data)

4. **Rename**
   - Inline edit or modal
   - Update name & description
   - Mutation: `UPDATE_SAVED_VIEW`

5. **Delete**
   - Confirmation modal
   - Remove from database
   - If active view is deleted → switch to first available view
   - Mutation: `DELETE_SAVED_VIEW`

6. **Share Settings**
   - Change visibility (Private ↔ Team ↔ Everyone)
   - Permission check (only owner/admin can change)
   - Mutation: `UPDATE_SAVED_VIEW`

7. **Set as Default** (Admin only)
   - Mark view as default for new users
   - Only one default per entity type
   - Mutation: `UPDATE_SAVED_VIEW`

### 2.2 Action Menu Component
```tsx
<Dropdown menu={{
  items: [
    { label: 'Switch to View', icon: <EyeOutlined /> },
    { label: 'Pin/Unpin', icon: <PushpinOutlined /> },
    { label: 'Duplicate', icon: <CopyOutlined /> },
    { label: 'Rename', icon: <EditOutlined /> },
    { label: 'Change Visibility', icon: <ShareAltOutlined /> },
    { label: 'Set as Default', icon: <StarOutlined />, disabled: !isAdmin },
    { type: 'divider' },
    { label: 'Delete', icon: <DeleteOutlined />, danger: true }
  ]
}}>
  <Button icon={<MoreOutlined />} />
</Dropdown>
```

---

## Phase 3: View Details Panel

### 3.1 View Preview
**Expandable panel for each view showing**:

- **Active Filters**:
  ```
  Current Stage = "pending" AND
  Created Date >= "Last 7 days"
  ```

- **Visible Columns**:
  ```
  Serial, Customer, Picker, Order, Status, Created At
  ```

- **Sort Configuration**:
  ```
  Sort by: Created At (Descending)
  ```

- **Metadata**:
  - Created by: John Doe
  - Created on: Jan 15, 2025
  - Last modified: 2 hours ago
  - Times used: 47

### 3.2 View Statistics (Future)
- Usage frequency chart
- Most common filters
- Users who access this view

---

## Phase 4: Bulk Operations

### 4.1 Selection Mode
**Features**:
- Checkbox selection on view cards
- "Select All" / "Deselect All"
- Selected count indicator: "3 views selected"

### 4.2 Bulk Actions
**Available actions**:
1. **Bulk Pin/Unpin**
   - Pin/unpin multiple views at once
   - Limit check (max 10 pinned views)

2. **Bulk Delete**
   - Delete multiple views with confirmation
   - Show list of views to be deleted
   - Cannot delete default view

3. **Bulk Visibility Change**
   - Change multiple views to same visibility
   - Permission check per view

4. **Bulk Export** (Future)
   - Export selected views as JSON
   - For backup or sharing

---

## Phase 5: View Organization

### 5.1 Grouping & Categories
**Group views by**:
- My Views
- Team Views
- Public Views
- Recently Used (last 7 days)
- Most Popular (by usage count)

### 5.2 Tabs or Sections
```tsx
<Tabs items={[
  { key: 'all', label: 'All Views', children: <AllViewsList /> },
  { key: 'mine', label: 'My Views', children: <MyViewsList /> },
  { key: 'team', label: 'Team Views', children: <TeamViewsList /> },
  { key: 'public', label: 'Public', children: <PublicViewsList /> },
  { key: 'recent', label: 'Recent', children: <RecentViewsList /> }
]} />
```

---

## Phase 6: Advanced Features (Future)

### 6.1 View Templates Integration
- Browse available templates
- Create view from template
- Save current view as template

### 6.2 View Sharing
- Share view URL
- Export/Import views
- Copy view configuration

### 6.3 View History
- Track changes to views
- Restore previous versions
- Compare view versions

---

## Implementation Checklist

### GraphQL Requirements
- [ ] `GET_SAVED_VIEWS` query (already exists in `view_filter/graphql/queries.ts`)
- [x] `PIN_SAVED_VIEW` mutation (already exists)
- [x] `UPDATE_SAVED_VIEW` mutation (already exists)
- [x] `DELETE_SAVED_VIEW` mutation (already exists)
- [ ] Add `usageCount` field to SavedView schema
- [ ] Add `lastUsedAt` field to SavedView schema

### Component Structure
```
view_filter/components/
├── DynamicViewFilter.tsx (main component)
├── AllViewsDrawer/
│   ├── index.tsx (main drawer component)
│   ├── AllViewsList.tsx (list of all views)
│   ├── ViewCard.tsx (individual view card)
│   ├── ViewDetailsPanel.tsx (expandable details)
│   ├── ViewActionsMenu.tsx (dropdown actions)
│   ├── BulkActionsBar.tsx (bulk operation controls)
│   └── ViewFilters.tsx (search & filter controls)
```

### UI Components Needed
- [ ] `AllViewsDrawer` - Main drawer component
- [ ] `ViewCard` - Individual view card with actions
- [ ] `ViewDetailsPanel` - Expandable preview panel
- [ ] `ViewActionsMenu` - Dropdown menu for actions
- [ ] `BulkActionsBar` - Bulk selection controls
- [ ] `ViewFilters` - Search and filter UI
- [ ] `ViewStats` - Usage statistics display

### User Flows

#### Flow 1: Switch to Different View
1. User clicks "All Views" button
2. Drawer opens showing all available views
3. User searches/filters to find desired view
4. User clicks on view card
5. Drawer closes, selected view loads

#### Flow 2: Manage Pinned Views
1. User opens All Views drawer
2. Filters by "Pinned" views
3. Unpins rarely used views
4. Pins frequently needed views
5. Tab bar updates immediately

#### Flow 3: Duplicate and Customize View
1. User finds useful team view
2. Clicks "Duplicate" from actions menu
3. System creates copy with "(Copy)" suffix
4. User modifies filters/columns
5. Saves as personal view

#### Flow 4: Bulk Delete Old Views
1. User enables selection mode
2. Selects multiple old/unused views
3. Clicks "Delete Selected"
4. Confirms deletion in modal
5. Views are removed

---

## Design Considerations

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  All Views                                          [X] │
├─────────────────────────────────────────────────────────┤
│  [Search views...]              [Filter ▼] [Sort ▼]    │
│  ○ All  ○ My Views  ○ Team  ○ Public  ○ Recent        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📌 Active Orders - Today          [Switch] [⋮] │   │
│  │ by John Doe • Team • 2 hours ago               │   │
│  │ Filters: Current Stage, Created Date           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Pickup Ready Orders               [Switch] [⋮] │   │
│  │ by Admin • Everyone • 5 days ago               │   │
│  │ Filters: Pickup Allow, Stage                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ... more views ...                                    │
│                                                         │
│  [Showing 8 of 15 views]                               │
└─────────────────────────────────────────────────────────┘
```

### View Card States
- **Normal**: White background, border
- **Active**: Blue border, "Currently Active" badge
- **Pinned**: Pin icon in top-right
- **Default**: Star icon badge
- **Hover**: Shadow effect, action buttons visible

### Permissions
- **Owner**: Full access (edit, delete, share)
- **Team Member**: View, duplicate (if team/public view)
- **Admin**: Full access to all views + set default

---

## Testing Scenarios

1. **Empty State**: No views exist
2. **Single View**: Only one view available
3. **Many Views**: 50+ views with pagination
4. **Active View**: Currently selected view is highlighted
5. **Permission Checks**: Non-owner cannot delete others' views
6. **Pinned Limit**: Cannot pin more than 10 views
7. **Default View**: Only one default view per entity
8. **Concurrent Edits**: Two users editing same view
9. **Deleted Active View**: Handle gracefully
10. **Search Performance**: Fast search with many views

---

## Performance Considerations

- Lazy load view list (pagination)
- Cache view metadata
- Debounce search input
- Virtualized list for 100+ views
- Optimistic UI updates for pin/unpin

---

## Accessibility

- Keyboard navigation (Tab, Arrow keys)
- Screen reader labels
- Focus management (drawer open/close)
- ARIA labels for actions
- High contrast support

---

## Future Enhancements

1. **View Collections**: Group related views
2. **View Recommendations**: Suggest views based on usage
3. **View Analytics**: Track most used filters/columns
4. **View Scheduling**: Auto-switch views by time/context
5. **View Notifications**: Alert when shared view is updated
6. **View Comments**: Discuss view configurations
7. **View Versioning**: Track and restore changes

---

## Priority Levels

### P0 (Critical - Week 1)
- Basic view list display
- Switch to view action
- Pin/Unpin action
- Search functionality

### P1 (High - Week 2)
- Filter by visibility/ownership
- Delete view action
- Duplicate view action
- View details panel

### P2 (Medium - Week 3)
- Bulk operations
- Rename view
- Change visibility
- Set as default

### P3 (Low - Future)
- View statistics
- View templates integration
- Export/Import
- Advanced analytics

---

## Related Files

- **Main Component**: `/src/app/console/view_filter/components/DynamicViewFilter.tsx`
- **GraphQL Queries**: `/src/app/console/view_filter/graphql/queries.ts`
- **GraphQL Mutations**: `/src/app/console/view_filter/graphql/mutations.ts`
- **Types**: `/src/app/console/view_filter/types.ts`

---

## Notes

- Keep drawer performance fast (< 300ms load time)
- Maintain consistency with existing view management patterns
- Consider mobile/tablet responsiveness
- Plan for future integration with View Templates
- Ensure proper error handling for all operations
