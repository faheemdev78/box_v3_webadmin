# Till Verification - Basket Selection & Receipt Printing Frontend Implementation

## Overview
This document summarizes the frontend implementation for basket selection and thermal receipt printing in the till verification system.

## Components Created

### 1. BasketSelector Component
**File**: `src/modules/orders/tillVerification/BasketSelector.tsx`

A visual basket selection interface that allows till operators to select delivery baskets for orders.

**Features**:
- Grid layout displaying available baskets
- Color-coded basket cards (based on basket color property)
- Real-time selection state management
- Visual feedback for selected baskets
- Selection count display
- Minimum basket requirement validation
- Loading and error states

**Props**:
```typescript
interface BasketSelectorProps {
  storeId: string;
  onSelectionChange: (basketIds: string[]) => void;
  minRequired?: number;
}
```

**Usage**:
```tsx
<BasketSelector
  storeId={store_id}
  onSelectionChange={handleBasketSelectionChange}
  minRequired={1}
/>
```

## GraphQL Queries/Mutations Created

### 1. Get Available Baskets Query
**File**: `src/graphql/baskets/getAvailableBaskets.graphql`

```graphql
query GetAvailableBaskets($_id_store: ID!, $limit: Int) {
  getAvailableBaskets(_id_store: $_id_store, limit: $limit) {
    baskets {
      _id
      title
      barcode
      color
      status
    }
    total_available
    error { message }
  }
}
```

### 2. Print Till Receipt Mutation
**File**: `src/graphql/till_verification/printTillReceipt.graphql`

```graphql
mutation PrintTillReceipt($_id_order: ID!) {
  printTillReceipt(_id_order: $_id_order) {
    success { message }
    error { message }
    receiptText
    receiptData {
      orderNumber
      storeName
      storeAddress
      customerName
      customerPhone
      verifiedAt
      verifiedBy
      deliveryBaskets { title barcode color }
      items { title qty price total status }
      totals { subtotal grandTotal taxAmount shipping discountTotal }
      paymentMethod
      notes
    }
  }
}
```

## React Hooks Updated

### useTillVerification Hook
**File**: `src/hooks/useTillVerification.ts`

Added new hook for receipt printing:

```typescript
export const usePrintTillReceipt = () => {
  const [printReceiptMutation, { loading }] = useMutation(PRINT_TILL_RECEIPT);

  const printReceipt = async (_id_order: string) => {
    try {
      const result = await printReceiptMutation({ variables: { _id_order } });
      const response = result.data?.printTillReceipt;
      if (response?.error) throw new Error(response.error.message);
      return response;
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw error;
    }
  };

  return { printReceipt, loading };
};
```

## Main Component Updates

### TillVerificationPOS Component
**File**: `src/modules/orders/tillVerification/TillVerificationPOS.tsx`

**Major Changes**:

1. **Added State Management**:
```typescript
const [selectedBasketIds, setSelectedBasketIds] = useState<string[]>([]);
const [showReceiptModal, setShowReceiptModal] = useState(false);
const [receiptText, setReceiptText] = useState<string>('');
```

2. **Updated Complete Verification Logic**:
```typescript
const handleComplete = async () => {
  if (!orderData) return;

  // Validate basket selection
  if (selectedBasketIds.length === 0) {
    message.error('Please select at least one delivery basket');
    return;
  }

  try {
    await completeOrder(orderId, selectedBasketIds, completeNotes);
    message.success('Order verification completed successfully!');
    setShowCompleteModal(false);
    setSelectedBasketIds([]);
    setCompleteNotes('');
    dispatch(setCurrentOrder(null));
    router.push(`${adminRoot}/store/${store_id}/till-verification`);
  } catch (error: any) {
    message.error(error.message || 'Failed to complete verification');
  }
};
```

3. **Added Receipt Printing Handler**:
```typescript
const handlePrintReceipt = async () => {
  try {
    const result = await printReceipt(orderId);
    if (result?.receiptText) {
      setReceiptText(result.receiptText);
      setShowReceiptModal(true);
      message.success('Receipt generated successfully!');
    }
  } catch (error: any) {
    message.error(error.message || 'Failed to print receipt');
  }
};
```

4. **Enhanced Complete Verification Modal**:
- Wider modal (800px) to accommodate basket selector
- Integrated BasketSelector component
- Added validation - OK button disabled until baskets selected
- Clear instructions for basket selection
- Warning alert when not all items verified

```tsx
<Modal
  title="Complete Verification"
  open={showCompleteModal}
  onOk={handleComplete}
  onCancel={() => {
    setShowCompleteModal(false);
    setSelectedBasketIds([]);
  }}
  okText="Complete Verification"
  confirmLoading={completingOrder}
  width={800}
  okButtonProps={{ disabled: selectedBasketIds.length === 0 }}
>
  <Space direction="vertical" style={{ width: '100%' }} size="large">
    <div>
      <Text>
        Verification Progress: <Text strong>{verifiedItems} / {totalItems} items</Text>
      </Text>
      {verifiedItems < totalItems && (
        <Alert
          message="Not all items have been verified. Continue anyway?"
          type="warning"
          showIcon
          style={{ marginTop: 8 }}
        />
      )}
    </div>

    <div>
      <Title level={5} style={{ marginBottom: 12 }}>Select Delivery Baskets</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        Select the delivery baskets for this order. Items from pickup baskets will be transferred to these baskets.
      </Text>
      <BasketSelector
        storeId={store_id}
        onSelectionChange={handleBasketSelectionChange}
        minRequired={1}
      />
    </div>

    <TextArea
      placeholder="Optional: Add completion notes..."
      value={completeNotes}
      onChange={(e) => setCompleteNotes(e.target.value)}
      rows={3}
    />
  </Space>
</Modal>
```

5. **Added Receipt Printing Modal**:
```tsx
<Modal
  title="Till Receipt"
  open={showReceiptModal}
  onCancel={() => setShowReceiptModal(false)}
  footer={[
    <Button key="close" onClick={() => setShowReceiptModal(false)}>
      Close
    </Button>,
    <Button
      key="print"
      type="primary"
      icon={<PrinterOutlined />}
      onClick={() => {
        // In a real implementation, this would send to thermal printer
        window.print();
      }}
    >
      Print
    </Button>,
  ]}
  width={600}
>
  <div style={{
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 4,
    fontSize: 12,
    lineHeight: 1.4
  }}>
    {receiptText}
  </div>
</Modal>
```

## User Flow

### Till Verification Process:

1. **Start Verification**:
   - Till operator clicks "Start" or "Resume" on an order
   - Order is locked to the operator
   - Verification screen loads with item list

2. **Verify Items**:
   - Operator verifies each item using verify/missing/damaged/mismatch buttons
   - Progress is tracked in real-time
   - Tips panel shows helpful information

3. **Complete Verification**:
   - Operator clicks "Complete Verification" button
   - Modal opens showing:
     - Verification progress
     - Warning if not all items verified (optional continue)
     - **Basket selector** - operator selects delivery baskets
     - Notes field for additional comments
   - OK button disabled until at least 1 basket selected

4. **Backend Processing** (when Complete clicked):
   - Validates basket selection
   - **Releases PICKUP baskets** (makes them available again)
   - **Locks DELIVERY baskets** to till operator
   - Updates order stage to READY_TO_DISPATCH
   - Saves baskets to `processing_stages.till_verification.baskets`
   - Updates session performance metrics

5. **Receipt Printing** (future enhancement):
   - After verification, print receipt button available
   - Receipt shows:
     - Order details
     - Customer information
     - Verified items with quantities
     - **Delivery basket barcodes** (for driver verification)
     - Order totals
   - Can be reprinted anytime

## Basket Flow Summary

```
PICKING STAGE:
- Picker selects PICKUP baskets (category: 'pickup')
- Baskets locked to picker
- Items placed in PICKUP baskets
- Baskets saved to processing_stages.picking.baskets

TILL VERIFICATION STAGE:
- Till operator verifies items in PICKUP baskets
- On completion, operator selects DELIVERY baskets (category: 'dispatch')
- PICKUP baskets RELEASED (unlocked, status = 'available')
- DELIVERY baskets LOCKED to till operator (status = 'dispatched')
- Baskets saved to processing_stages.till_verification.baskets

DELIVERY STAGE:
- Driver collects order with DELIVERY baskets
- Scans basket barcodes to verify correct baskets
- Baskets lock transferred from till operator to driver
- Driver delivers order
- On completion, DELIVERY baskets RELEASED
```

## Testing Checklist

- [ ] Basket selector loads available baskets from store
- [ ] Basket selection state updates correctly
- [ ] Selected baskets display with visual feedback
- [ ] Complete button disabled without basket selection
- [ ] Complete button enabled when baskets selected
- [ ] Validation error shown if trying to complete without baskets
- [ ] Backend receives correct basket IDs
- [ ] PICKUP baskets released successfully
- [ ] DELIVERY baskets locked successfully
- [ ] Order stage updates to READY_TO_DISPATCH
- [ ] Receipt printing generates correct data
- [ ] Receipt modal displays formatted receipt
- [ ] Receipt includes delivery basket barcodes
- [ ] Print button triggers thermal printer (or window.print)
- [ ] Can reprint receipt after verification

## Future Enhancements

1. **Thermal Printer Integration**:
   - Replace `window.print()` with actual thermal printer API
   - Support ESC/POS commands
   - USB/Network/Cloud printer support

2. **Barcode Scanning**:
   - Scan basket barcodes instead of manual selection
   - Automatic basket verification
   - Beep/visual feedback on scan

3. **Receipt Customization**:
   - Store logo/branding
   - Custom footer messages
   - QR codes for order tracking

4. **Print Receipt from Queue**:
   - Add print button to completed orders in queue
   - Re-print receipts anytime
   - Print history tracking

## Related Documentation

- [BASKET_FLOW_DOCUMENTATION.md](/Volumes/server_apps/box_v3/box_v3_happi_backend/BASKET_FLOW_DOCUMENTATION.md) - Complete basket flow technical docs
- [BASKET_FLOW_IMPLEMENTATION_SUMMARY.md](/Volumes/server_apps/box_v3/box_v3_happi_backend/BASKET_FLOW_IMPLEMENTATION_SUMMARY.md) - Backend implementation summary
- [FRONTEND_INTEGRATION_GUIDE.md](/Volumes/server_apps/box_v3/box_v3_happi_backend/FRONTEND_INTEGRATION_GUIDE.md) - Frontend integration guide