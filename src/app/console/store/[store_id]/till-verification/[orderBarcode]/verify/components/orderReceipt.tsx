// src/components/ReceiptTwo.jsx
import React from 'react';
import Barcode from 'react-barcode';
import { utcToDate } from '@/lib/utill';
import { Icon } from '@/components';
import { Styles } from '@/types/styles';
import { useAppSelector } from '@/rStore/hooks';
import { getSettings } from '@/rStore/slices/systemSlice';

type ReceiptCalculations = {
    scannedItemTotal: number;
    bagPrice: number;
    totalBagQuantity: number;
    fbrFee: number;
    deliveryFee: number;
    customerPayable: number;
};

const asAmount = (value: unknown) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
};

const OrderReceipt = React.forwardRef<HTMLDivElement, {
    orderData: any;
    orderCalculations?: ReceiptCalculations;
}>(
    ({ orderData, orderCalculations }, ref) => {
        const settings = useAppSelector(getSettings);

        const { current_order, zone, shippingAddress, customer, delivery_slot, barcode } = orderData;

        const frozenItems = current_order.items.filter((o: any) => o.temp_sensitivity === 'freezer')?.length;
        const coldItems = current_order.items.filter((o: any) => o.temp_sensitivity === 'fridge')?.length;
        const unfitForboxItems = current_order.items.filter((o: any) => o.unfit_for_dispatch)?.length;

        const currentTotals = current_order?.totals || {};
        const scannedItemTotal = asAmount(orderCalculations?.scannedItemTotal ?? currentTotals.subtotal);
        const bagPrice = asAmount(orderCalculations?.bagPrice ?? currentTotals.bagTotal);
        const totalBagQuantity = orderCalculations?.totalBagQuantity ?? (current_order?.bags || []).reduce(
            (sum: number, bag: any) => sum + Math.max(0, Math.trunc(asAmount(bag.qty))),
            0
        );
        const fbrFee = asAmount(orderCalculations?.fbrFee ?? currentTotals.fbrFee);
        const deliveryFee = asAmount(orderCalculations?.deliveryFee ?? currentTotals.deliveryFee);
        const customerPayable = asAmount(orderCalculations?.customerPayable ?? currentTotals.grandTotal);
        const deliverySlot = `${utcToDate(delivery_slot.start_date).format('hh:mm A')} to ${utcToDate(delivery_slot.end_date).format('hh:mm A')}`;
        const totalBoxes = current_order?.baskets?.length || 0;
        const boxCodes = current_order?.baskets?.map((item: any) => (item.barcode)) || [];
        const barcodeModuleWidth = Math.max(
            0.55,
            Math.min(0.9, 16 / Math.max(String(barcode || '').length, 1))
        );


        return (<div className='scrollbar-thin overflow-auto h-full max-h-100'>
            <div ref={ref}>
                {Array.from({ length: totalBoxes }).map((_:any, i:number) => (
                    <div style={styles.receipt} key={i}>
                        {/* ── Top Row: Order Total | Zone | Page ── */}
                        <div style={styles.topRow}>
                            <div style={styles.totalBox}>
                                <span style={styles.rsLabel}>{settings.currency}</span>
                                <span style={styles.totalValue}>{customerPayable.toFixed(2)}</span>
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

                        <div style={styles.solidDivider} />
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

                        <div style={styles.solidDivider} />
                        <div style={styles.totalsSection}>
                            <div style={styles.totalLine}>
                                <span>Confirmed items</span>
                                <span>{settings.currency} {scannedItemTotal.toFixed(2)}</span>
                            </div>
                            <div style={styles.totalLine}>
                                <span>FBR fee</span>
                                <span>{settings.currency} {fbrFee.toFixed(2)}</span>
                            </div>
                            <div style={styles.totalLine}>
                                <span>Bags ({totalBagQuantity})</span>
                                <span>{settings.currency} {bagPrice.toFixed(2)}</span>
                            </div>
                            <div style={styles.totalLine}>
                                <span>Delivery fee</span>
                                <span>{settings.currency} {deliveryFee.toFixed(2)}</span>
                            </div>
                            <div style={styles.totalLineStrong}>
                                <span>Customer payable</span>
                                <span>{settings.currency} {customerPayable.toFixed(2)}</span>
                            </div>
                        </div>

                        <div style={styles.solidDivider} />
                        <div style={styles.boxSummary}>
                            {frozenItems > 0 && <div style={styles.boxItem}>
                                <span style={styles.conditionIcon}>
                                    <Icon icon='box' color='#000000' style={styles.conditionBaseIcon} />
                                    <span style={styles.conditionOverlay}>
                                        <Icon icon="snowflake" color='#FFFFFF' style={styles.conditionOverlayIcon} />
                                    </span>
                                </span>
                                <span>Freezer: <span style={styles.conditionCount}>{frozenItems}</span></span>
                            </div>}
                            {coldItems > 0 && <div style={styles.boxItem}>
                                <span style={styles.conditionIcon}>
                                    <Icon icon='box' color='#000000' style={styles.conditionBaseIcon} />
                                    <span style={styles.conditionOverlay}>
                                        <Icon icon="temperature-low" color='#FFFFFF' style={styles.conditionOverlayIcon} />
                                    </span>
                                </span>
                                <span>Fridge: <span style={styles.conditionCount}>{coldItems}</span></span>
                            </div>}
                            {unfitForboxItems > 0 && <div style={styles.boxItem}>
                                <span style={styles.conditionIcon}>
                                    <Icon icon='box' color='#000000' style={styles.conditionBaseIcon} />
                                    <span style={styles.conditionSlash} />
                                </span>
                                <span>Unfit for box: <span style={styles.conditionCount}>{unfitForboxItems}</span></span>
                            </div>}
                        </div>
                        <div style={styles.solidDivider} />

                        <div style={styles.bottomRow}>
                            <div style={styles.barcodeBox}>
                                <Barcode
                                    value={barcode}
                                    format="CODE128"
                                    width={barcodeModuleWidth}
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
                                    {boxCodes.map((code:string, i:number) => (
                                        <span key={i} style={styles.boxCode}>{code}{i < boxCodes.length-1 && ","} </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={styles.solidDivider} />

                        {totalBoxes - 1 > i && <div style={styles.cutDivider} />}
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
        width: '72mm',
        minHeight: '50mm',
        // Keep content inside the TM-T88IV printable area on an 80 mm roll.
        // The printer cannot image the outer few millimetres on either edge.
        padding: '2mm 2mm 1mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '13px',
        lineHeight: 1.3,
        background: '#fff',
        color: '#000',
        boxSizing: 'border-box',
        // border: '1px solid #000',
        // borderBottom: '1px dashed #000',
        margin: '0 auto',
        // marginBottom: 20,
        // paddingBottom: 20,
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

    solidDivider: { borderTop: '1px solid #000', margin: '1mm 0' },
    dashedDivider: { borderTop: '1px dashed #000', margin: '1mm 0' },
    cutDivider: { borderTop: '1px dashed #000', margin: '5mm 0' },

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

    totalsSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5mm',
        padding: '1mm 0',
    },
    totalLine: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '3mm',
        fontSize: '12px',
    },
    totalLineStrong: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '3mm',
        paddingTop: '0.5mm',
        borderTop: '1px dashed #000',
        fontSize: '13px',
        fontWeight: 800,
    },
    boxSummary: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        gap: '1.5mm 3mm',
        padding: '1mm 0',
    },
    boxItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '2mm',
        maxWidth: '100%',
        whiteSpace: 'nowrap',
    },
    conditionIcon: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '18px',
        height: '18px',
        flex: '0 0 18px',
        color: '#000',
    },
    conditionBaseIcon: {
        display: 'block',
        width: '18px',
        height: '18px',
    },
    conditionOverlay: {
        position: 'absolute',
        right: '-1px',
        bottom: '-1px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: '#000',
    },
    conditionOverlayIcon: {
        display: 'block',
        width: '7px',
        height: '7px',
    },
    conditionSlash: {
        position: 'absolute',
        left: '-1px',
        top: '8px',
        width: '20px',
        height: '2px',
        borderRadius: '2px',
        background: '#000',
        transform: 'rotate(45deg)',
    },
    conditionCount: { fontWeight: 900 },
    boxText: { fontSize: '13px' },
    verticalDivider: {
        width: '0.5px',
        height: '12mm',
        background: '#000',
    },

    bottomRow: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '1mm',
        minHeight: '20mm',
    },
    barcodeBox: {
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '100%',
    },
    verticalDashedDivider: {
        width: '100%',
        height: 0,
        borderTop: '1px dashed #000',
    },
    boxesColumn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1mm',
        width: '100%',
        maxWidth: '100%',
    },
    boxesLabel: {
        fontSize: '13px',
        fontWeight: 700,
        letterSpacing: '0.5px',
    },
    boxCodes: {
        // display: 'flex',
        // flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5mm',
        // border: '1px solid black'
        textAlign: "center",
        width: '100%',
        overflowWrap: 'anywhere',
    },
    boxCode: { fontSize: '12px' },
};

export default OrderReceipt;
