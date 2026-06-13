// src/components/ReceiptTwo.jsx
import React from 'react';
import Barcode from 'react-barcode';
import { utcToDate } from '@/lib/utill';
import { Icon } from '@/components';
import { Styles } from '@/types/styles';

const OrderReceipt = React.forwardRef<HTMLDivElement, { orderData: any }>(
    ({ orderData }, ref) => {
        const { current_order, zone, shippingAddress, customer, delivery_slot, barcode } = orderData;

        const frozenItems = current_order.items.filter((o: any) => o.temp_sensitivity === 'freezer')?.length;
        const coldItems = current_order.items.filter((o: any) => o.temp_sensitivity === 'fridge')?.length;
        const unfitForboxItems = current_order.items.filter((o: any) => o.unfit_for_dispatch)?.length;

        const orderTotal = current_order.totals.grandTotal;
        const deliverySlot = `${utcToDate(delivery_slot.start_date).format('hh:mm A')} to ${utcToDate(delivery_slot.end_date).format('hh:mm A')}`;
        const totalBoxes = current_order?.baskets?.length || 0;
        const boxCodes = current_order?.baskets?.map((item: any) => (item.barcode)) || [];



        return (<div className='scrollbar-thin overflow-auto h-full max-h-100'>
            <div ref={ref}>
                {Array.from({ length: totalBoxes }).map((_, i) => (
                    <div style={styles.receipt} key={i}>
                        {/* ── Top Row: Order Total | Zone | Page ── */}
                        <div style={styles.topRow}>
                            <div style={styles.totalBox}>
                                <span style={styles.rsLabel}>RS</span>
                                <span style={styles.totalValue}>{orderTotal}</span>
                            </div>

                            <div style={styles.zoneBadge}>
                                <span style={styles.zoneNumber}>{zone.title}</span>
                            </div>

                            <div style={styles.pageInfo}>{i + 1} of {totalBoxes}</div>
                        </div>

                        <div style={styles.solidDivider} />

                        <div style={styles.addressSection}>
                            <p style={styles.addressLine}>{shippingAddress.full_address}</p>
                        </div>

                        <div style={styles.dashedDivider} />

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

                        <div style={styles.bottomRow}>
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

                            <div style={styles.verticalDashedDivider} />

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
                    </div>)
                )}
            </div>
        </div>);
    }
);
OrderReceipt.displayName = 'OrderReceipt';


/* ─────────────────────────  STYLES  ───────────────────────── */
const styles: Styles = {
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
    zoneNumber: { fontSize: '24px', fontWeight: 800 },

    pageInfo: {
        fontSize: '14px',
        fontWeight: 700,
        textAlign: 'right',
    },

    solidDivider: { borderTop: '1.2px solid #000', margin: '1mm 0' },
    dashedDivider: { borderTop: '1px dashed #000', margin: '1mm 0' },

    addressSection: {},
    addressLine: { margin: '0.5mm 0', fontSize: '13px' },

    detailsSection: { display: 'flex', flexDirection: 'column', gap: '1mm' },
    detailRow: {
        display: 'grid',
        gridTemplateColumns: '24mm 5mm 1fr',
        alignItems: 'baseline',
    },
    detailLabel: { fontSize: '13px' },
    detailColon: { textAlign: 'center', fontWeight: 700 },
    detailValueBold: { fontSize: '14px', fontWeight: 700 },

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
