// src/components/ReceiptOne.jsx
import React from 'react';
import Barcode from 'react-barcode';
import { utcToDate } from '@/lib/utill';
import { Styles } from '@/types/styles';


const ProductReceipt = React.forwardRef<HTMLDivElement, { orderData: any }>(
    ({ orderData }, ref) => {
        const { shippingAddress, customer, zone, delivery_slot, barcode } = orderData;
        const deliverySlot = `${utcToDate(delivery_slot.start_date).format('hh:mm A')} to ${utcToDate(delivery_slot.end_date).format('hh:mm A')}`;

        return (<div ref={ref}>
            <div style={styles.receipt}>
                {/* ── Zone Badge (top‑right) ── */}
                <div style={styles.zoneWrapper}>
                    <div style={styles.zoneBadge}>
                        <span style={styles.zoneNumber}>{zone.title}</span>
                    </div>
                </div>

                {/* ── Delivery Address ── */}
                <div style={styles.addressSection}>
                    <h2 style={styles.heading}>DELIVERY ADDRESS</h2>
                    <div style={styles.addressLine}>{shippingAddress.full_address}</div>
                </div>

                <div style={styles.dashedDivider} />

                {/* ── Customer Details ── */}
                <div style={styles.detailsSection}>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Customer</span>
                        <span style={styles.detailColon}>:</span>
                        <span style={styles.detailValueBold}>{customer.name}</span>
                    </div>

                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Phone</span>
                        <span style={styles.detailColon}>:</span>
                        <span style={styles.detailValueBold}>{customer.phone}</span>
                    </div>

                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Delivery Slot</span>
                        <span style={styles.detailColon}>:</span>
                        <span style={styles.detailValueBold}>{deliverySlot}</span>
                    </div>
                </div>

                <div style={styles.dashedDivider} />

                {/* ── Barcode ── */}
                <div style={styles.barcodeContainer}>
                    <Barcode
                        value={barcode}
                        format="CODE128"
                        width={1.6}
                        height={60}
                        fontSize={14}
                        margin={0}
                        displayValue
                    />
                </div>
            </div>
        </div>);
    }
);
ProductReceipt.displayName = 'ProductReceipt';


/* ─────────────────────────  STYLES  ───────────────────────── */
const styles: Styles = {
    receipt: {
        width: '80mm',
        minHeight: '50mm',
        padding: '4mm 5mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '13px',
        lineHeight: 1.35,
        background: '#fff',
        color: '#000',
        boxSizing: 'border-box',
        border: '1px solid #000',
        margin: '0 auto',
    },

    zoneWrapper: { display: 'flex', justifyContent: 'flex-end' },
    zoneBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6mm',
        border: '1.5px solid #000',
        borderRadius: '3mm',
        padding: '2mm 5mm',
    },
    zoneText: { fontSize: '15px', fontWeight: 700, letterSpacing: '0.5px' },
    zoneNumber: { fontSize: '28px', fontWeight: 800, lineHeight: 1 },

    addressSection: { marginTop: '0' },
    heading: { fontSize: '16px', fontWeight: 800, margin: '0 0 0 0' },
    addressLine: { fontSize: '14px' },

    dashedDivider: {
        borderTop: '1px dashed #000',
        margin: '1mm 0',
    },

    detailsSection: { display: 'flex', flexDirection: 'column', gap: '0.0mm' },
    detailRow: {
        display: 'grid',
        gridTemplateColumns: '24mm 5mm 1fr',
        alignItems: 'baseline',
    },
    detailLabel: { fontSize: '14px' },
    detailColon: { textAlign: 'center', fontWeight: 700 },
    detailValueBold: { fontSize: '15px', fontWeight: 700 },

    barcodeContainer: {
        marginTop: '2mm',
        display: 'flex',
        justifyContent: 'center',
    },
};

export default ProductReceipt;
