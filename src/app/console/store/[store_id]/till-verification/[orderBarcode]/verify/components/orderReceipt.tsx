// src/components/ReceiptTwo.jsx
import React from 'react';
import Barcode from 'react-barcode';
import { utcToDate } from '@/lib/utill';
import { Icon } from '@/components';


const OrderReceipt = React.forwardRef<HTMLDivElement, { orderData: any }>(
    ({ orderData }, ref) => {
        const { current_order, zone, shippingAddress, customer, delivery_slot, barcode } = orderData;

        const frozenItems = current_order.items.filter(o => o.temp_sensitivity === 'freezer')?.length;
        const coldItems = current_order.items.filter(o => o.temp_sensitivity === 'fridge')?.length;
        const unfitForboxItems = current_order.items.filter(o => o.unfit_for_dispatch)?.length;

        const orderTotal = current_order.totals.grandTotal;
        // const zone = zone.title;
        // address = line1: orderData.shippingAddress.full_address,
        // customer = { orderData.customer.name }
        // phone = { orderData.customer.phone }
        const deliverySlot = `${utcToDate(delivery_slot.start_date).format('hh:mm A')} to ${utcToDate(delivery_slot.end_date).format('hh:mm A')}`;
        const frozenBox = '3'
        const notFitInBox = '2'
        const totalBoxes = current_order?.baskets?.length || 0;
        const boxCodes = current_order?.baskets?.map((item: any) => (item.barcode)) || [];
        const pageInfo = '1 of 6';

        return (<div ref={ref}>
            <div style={styles.receipt}>
                {/* ── Top Row: Order Total | Zone | Page ── */}
                <div style={styles.topRow}>
                    {/* Order total */}
                    <div style={styles.totalBox}>
                        <span style={styles.rsLabel}>RS</span>
                        <span style={styles.totalValue}>{orderTotal}</span>
                    </div>

                    {/* Zone badge */}
                    <div style={styles.zoneBadge}>
                        {/* <span style={styles.zoneText}>ZONE</span> */}
                        <span style={styles.zoneNumber}>{zone.title}</span>
                    </div>

                    {/* Page indicator */}
                    <div style={styles.pageInfo}>1 of {totalBoxes}</div>
                </div>

                {/* ── Heavy top divider ── */}
                <div style={styles.solidDivider} />

                {/* ── Address ── */}
                <div style={styles.addressSection}>
                    <p style={styles.addressLine}>{shippingAddress.full_address}</p>
                </div>

                <div style={styles.dashedDivider} />

                {/* ── Customer details ── */}
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


                {/* ── Box summary (frozen | not‑fit) ── */}


                <div style={styles.dashedDivider} />
                <div style={styles.boxSummary}>
                    {frozenItems > 0 && <div style={styles.boxItem}>
                        <span className='relative'>
                            <Icon icon='box' color='#000000' fontSize={18} />
                            <Icon icon="snowflake" fontSize={10} color='#FFFFFF' className='absolute right-0 bottom-0' />
                        </span>
                        <span>Freezer: <span className='font-black'>{frozenItems}</span></span>
                    </div>}
                    {coldItems > 0 && <div style={styles.boxItem}>
                        <span className='relative'>
                            <Icon icon='box' color='#000000' fontSize={18} />
                            <Icon icon="temperature-low" fontSize={10} color='#FFFFFF' className='absolute right-0 bottom-0' />
                        </span>
                        <span>Fridge: <span className='font-black'>{coldItems}</span></span>
                    </div>}
                    {unfitForboxItems > 0 && <div style={styles.boxItem}>
                        <span className='relative'>
                            <Icon icon='box' color='#000000' fontSize={18} />
                            <div className='absolute bg-black h-1 w-full left-0 right-0 top-1.5 rounded-md border-1 border-white rotate-45' />
                        </span>
                        <span>Unfit for box: <span className='font-black'>{unfitForboxItems}</span></span>
                    </div>}
                </div>
                <div style={styles.dashedDivider} />


                {/* <div style={styles.boxSummary}>
                <div style={styles.boxItem}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5">
                        <path d="M3 7l9-4 9 4-9 4-9-4z" />
                        <path d="M3 7v10l9 4 9-4V7" />
                        <path d="M12 11v10" />
                        <text x="17" y="20" fontSize="12" stroke="none" fill="#000">❄</text>
                    </svg>
                    <span style={styles.boxText}>
                        Frozen Box: <strong>{frozenBox}</strong>
                    </span>
                </div>

                <div style={styles.verticalDivider} />

                <div style={styles.boxItem}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5">
                        <path d="M3 7l9-4 9 4-9 4-9-4z" />
                        <path d="M3 7v10l9 4 9-4V7" />
                        <path d="M12 11v10" />
                        <circle cx="18" cy="18" r="4" fill="#000" />
                        <text x="16.5" y="20.5" fontSize="6" stroke="none" fill="#fff">!</text>
                    </svg>
                    <span style={styles.boxText}>
                        Not Fit in Box: <strong>{notFitInBox}</strong>
                    </span>
                </div>
            </div> */}







                {/* ── Bottom Row: Barcode | Boxes list ── */}
                <div style={styles.bottomRow}>
                    {/* Barcode */}
                    <div style={styles.barcodeBox}>
                        <Barcode
                            value={barcode}
                            format="CODE128"
                            width={1.0}
                            height={55}
                            fontSize={12}
                            margin={0}
                            displayValue
                        />
                    </div>

                    {/* Vertical divider */}
                    <div style={styles.verticalDashedDivider} />

                    {/* Boxes column */}
                    <div style={styles.boxesColumn}>
                        <div style={styles.boxesLabel}>BOXES: {totalBoxes}</div>
                        <div style={styles.boxCodes}>
                            {boxCodes.map((code, i) => (
                                <div key={i} style={styles.boxCode}>{code}</div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={styles.dashedDivider} />
            </div>
        </div>);
    }
);
OrderReceipt.displayName = 'OrderReceipt';



/* ─────────────────────────  STYLES  ───────────────────────── */
const styles = {
    receipt: {
        width: '80mm',
        minHeight: '50mm',
        padding: '4mm 5mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '13px',
        lineHeight: 1.3,
        background: '#fff',
        color: '#000',
        boxSizing: 'border-box',
        border: '1px solid #000',
        margin: '0 auto',
    },

    /* Top row (total | zone | page) */
    topRow: {
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: '2mm',
    },
    totalBox: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '1mm',
    },
    rsLabel: { fontSize: '14px', fontWeight: 700 },
    totalValue: { fontSize: '22px', fontWeight: 800 },

    zoneBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4mm',
        border: '1.5px solid #000',
        borderRadius: '3mm',
        padding: '1.5mm 4mm',
    },
    // zoneText: { fontSize: '14px', fontWeight: 700 },
    zoneNumber: { fontSize: '24px', fontWeight: 800 },

    pageInfo: {
        fontSize: '14px',
        fontWeight: 700,
        textAlign: 'right',
    },

    /* Dividers */
    solidDivider: { borderTop: '1.2px solid #000', margin: '1mm 0' },
    dashedDivider: { borderTop: '1px dashed #000', margin: '1mm 0' },

    /* Address */
    addressSection: {},
    addressLine: { margin: '0.5mm 0', fontSize: '13px' },

    /* Customer */
    detailsSection: { display: 'flex', flexDirection: 'column', gap: '1mm' },
    detailRow: {
        display: 'grid',
        gridTemplateColumns: '24mm 5mm 1fr',
        alignItems: 'baseline',
    },
    detailLabel: { fontSize: '13px' },
    detailColon: { textAlign: 'center', fontWeight: 700 },
    detailValueBold: { fontSize: '14px', fontWeight: 700 },

    /* Box summary (frozen / not‑fit) */
    boxSummary: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '1mm 0',
    },
    boxItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '2mm',
    },
    boxText: { fontSize: '13px' },
    verticalDivider: {
        width: '0.5px',
        height: '12mm',
        background: '#000',
    },

    /* Bottom row (barcode | boxes) */
    bottomRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 4px 1fr',
        alignItems: 'center',
        gap: '2mm',
        minHeight: '20mm',
    },
    barcodeBox: { display: 'flex', justifyContent: 'center' },
    verticalDashedDivider: {
        width: 0,
        height: '20mm',
        borderLeft: '1px dashed #000',
    },
    boxesColumn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1mm',
    },
    boxesLabel: {
        fontSize: '13px',
        fontWeight: 700,
        letterSpacing: '0.5px',
    },
    boxCodes: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5mm',
    },
    boxCode: { fontSize: '13px' },
};

export default OrderReceipt;
